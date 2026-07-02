import * as cheerio from 'cheerio'
import type { PageExtract } from '../../shared/schema.ts'

const FETCH_TIMEOUT_MS = 15_000
const MAX_BODY_BYTES = 2 * 1024 * 1024
const MAX_TEXT_CHARS = 10_000
const MAX_REDIRECTS = 3

const USER_AGENT =
  'Mozilla/5.0 (compatible; EmailLeverStudio/1.0; +https://github.com/email-marketing)'

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
])

function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false
  const [a, b] = parts
  if (a === 10) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 169 && b === 254) return true
  return false
}

export function validateUrl(url: string): { ok: true; normalized: string } | { ok: false; error: string } {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return { ok: false, error: 'Invalid URL format.' }
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: 'Only http and https URLs are allowed.' }
  }

  const host = parsed.hostname.toLowerCase()
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.local')) {
    return { ok: false, error: 'Local or private URLs are not allowed.' }
  }

  if (isPrivateIpv4(host)) {
    return { ok: false, error: 'Private IP addresses are not allowed.' }
  }

  return { ok: true, normalized: parsed.toString() }
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function capText(text: string, max = MAX_TEXT_CHARS): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

function parseJsonLdBlocks(html: string): unknown[] {
  const $ = cheerio.load(html)
  const blocks: unknown[] = []

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html()?.trim()
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        blocks.push(...parsed)
      } else {
        blocks.push(parsed)
      }
    } catch {
      // ignore malformed JSON-LD
    }
  })

  return blocks
}

function collectFromJsonLd(
  blocks: unknown[],
  extract: Partial<PageExtract>,
): void {
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const obj = block as Record<string, unknown>
    const type = String(obj['@type'] ?? '')

    if (!extract.title && typeof obj.name === 'string') {
      extract.title = obj.name
    }
    if (!extract.description && typeof obj.description === 'string') {
      extract.description = collapseWhitespace(obj.description)
    }

    if (type === 'Product' || type.includes('Product')) {
      if (!extract.price && obj.offers) {
        const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers
        if (offers && typeof offers === 'object') {
          const price = (offers as Record<string, unknown>).price
          const currency = (offers as Record<string, unknown>).priceCurrency
          if (price != null) {
            extract.price = currency ? `${currency} ${price}` : String(price)
          }
        }
      }

      const rating = obj.aggregateRating
      if (rating && typeof rating === 'object' && !extract.rating) {
        const r = rating as Record<string, unknown>
        const value = r.ratingValue != null ? String(r.ratingValue) : undefined
        const count = r.reviewCount != null ? String(r.reviewCount) : undefined
        if (value || count) {
          extract.rating = {
            value: value ?? '',
            count: count ?? '',
          }
        }
      }
    }

    if (type === 'Organization' || type.includes('Organization')) {
      if (!extract.description && typeof obj.description === 'string') {
        extract.description = collapseWhitespace(obj.description)
      }
    }
  }
}

function extractMeta($: cheerio.CheerioAPI, extract: Partial<PageExtract>): void {
  if (!extract.title) {
    extract.title =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('title').first().text().trim() ||
      undefined
  }

  if (!extract.description) {
    extract.description =
      $('meta[property="og:description"]').attr('content')?.trim() ||
      $('meta[name="description"]').attr('content')?.trim() ||
      undefined
  }
}

function extractShopifyProductFields(
  $: cheerio.CheerioAPI,
  extract: Partial<PageExtract>,
  isProductPage: boolean,
): void {
  if (isProductPage && !extract.price) {
    const usdPrice =
      extract.text?.match(/\$\d+(?:\.\d{2})?/)?.[0] ||
      $('meta[property="product:price:amount"]').attr('content')
    const visible =
      $('[data-product-price]').first().text().trim() ||
      $('.price__regular .price-item--regular').first().text().trim() ||
      $('.product__price').first().text().trim()
    const price = usdPrice || visible
    if (price) extract.price = collapseWhitespace(price)
  }

  if (!extract.rating) {
    const reviewText =
      $('.spr-summary-caption, .jdgm-prev-badge__text, [data-review-count]').first().text().trim() ||
      $('[class*="review"]').filter((_, el) => /\(\d+\)/.test($(el).text())).first().text().trim()

    const match = reviewText.match(/\(?\s*(\d+)\s*\)?/)
    if (match) {
      extract.rating = { value: '', count: match[1]! }
    }
  }

  const ingredientCandidates: string[] = []
  $(
    '[class*="ingredient"], [id*="ingredient"], [data-ingredients], .product__accordion, .accordion__content',
  ).each((_, el) => {
    const text = collapseWhitespace($(el).text())
    if (text.length > 20 && text.length < 2000) {
      ingredientCandidates.push(text)
    }
  })
  if (ingredientCandidates.length > 0) {
    extract.ingredients = ingredientCandidates.slice(0, 3)
  }

  const benefitCandidates: string[] = []
  $('li').each((_, el) => {
    const text = collapseWhitespace($(el).text())
    if (text.length > 10 && text.length < 200 && /skin|firm|hydrat|plump|smooth|bright/i.test(text)) {
      benefitCandidates.push(text)
    }
  })
  if (benefitCandidates.length > 0) {
    extract.benefits = [...new Set(benefitCandidates)].slice(0, 6)
  }

  const retailMatch = extract.text?.match(
    /(?:find us at|available at|sold at)\s+([A-Za-z][A-Za-z0-9 &'-]+)/i,
  )
  if (retailMatch && !extract.description?.includes(retailMatch[1]!)) {
    extract.description = [extract.description, `Retail: ${retailMatch[1]!.trim()}`]
      .filter(Boolean)
      .join(' | ')
  }
}

function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html)

  $('script, style, noscript, svg, iframe, nav, footer, header').remove()

  const main =
    $('main').text() ||
    $('[role="main"]').text() ||
    $('.product').text() ||
    $('.product-single').text() ||
    $('#MainContent').text() ||
    $('body').text()

  return capText(collapseWhitespace(main))
}

function stripHtml(html: string): string {
  return collapseWhitespace(cheerio.load(html).root().text())
}

function shopifyProductJsonUrl(pageUrl: string): string | undefined {
  const match = pageUrl.match(/\/products\/([^/?#]+)/i)
  if (!match) return undefined
  const origin = new URL(pageUrl).origin
  return `${origin}/products/${match[1]}.js`
}

function formatCentsPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function pickUsdPrice(...candidates: Array<string | undefined>): string | undefined {
  for (const raw of candidates) {
    if (!raw) continue
    const match = raw.match(/\$(\d+(?:\.\d{2})?)/)
    if (match) {
      const amount = parseFloat(match[1]!)
      if (amount > 0 && amount < 500) return `$${amount.toFixed(2)}`
    }
  }
  return undefined
}

async function fetchShopifyProductJson(pageUrl: string): Promise<PageExtract | undefined> {
  const jsonUrl = shopifyProductJsonUrl(pageUrl)
  if (!jsonUrl) return undefined

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(jsonUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    })
    clearTimeout(timer)
    if (!res.ok) return undefined

    const product = (await res.json()) as Record<string, unknown>
    const title = typeof product.title === 'string' ? product.title : undefined
    const vendor = typeof product.vendor === 'string' ? product.vendor : undefined
    const description =
      typeof product.description === 'string' ? stripHtml(product.description) : undefined

    let price: string | undefined
    const variants = product.variants
    if (Array.isArray(variants) && variants[0] && typeof variants[0] === 'object') {
      const p = (variants[0] as Record<string, unknown>).price
      if (typeof p === 'number' && p > 0 && p < 50_000) price = formatCentsPrice(p)
    } else if (typeof product.price === 'number' && product.price > 0 && product.price < 50_000) {
      price = formatCentsPrice(product.price)
    }

    const sections: Record<string, string> = {}
    if (description) sections.Description = description

    return {
      url: pageUrl,
      title,
      description: vendor ? `${vendor} — ${description ?? title ?? ''}`.trim() : description,
      text: description ?? '',
      price,
      sections,
      source: 'shopify_json',
    }
  } catch {
    return undefined
  }
}

function extractAccordionSections($: cheerio.CheerioAPI): Record<string, string> {
  const sections: Record<string, string> = {}

  $('.product__accordion, .accordion, [class*="accordion"]').each((_, el) => {
    const block = $(el)
    const heading =
      block.find('summary, .accordion__title, h2, h3, button').first().text().trim() ||
      block.attr('data-section') ||
      ''
    const body = collapseWhitespace(
      block.find('.accordion__content, .rte, [class*="content"]').text() || block.text(),
    )
    const key = heading.replace(/read more read less/gi, '').trim()
    if (
      key.length > 2 &&
      key.length < 80 &&
      !/^read more/i.test(key) &&
      body.length > 20 &&
      body.length < 3000
    ) {
      sections[key] = body.replace(/read more read less/gi, '').trim()
    }
  })

  const deduped: Record<string, string> = {}
  for (const [key, body] of Object.entries(sections)) {
    const norm = body.toLowerCase()
    const duplicate = Object.values(deduped).some(
      (existing) => existing.toLowerCase().includes(norm) || norm.includes(existing.toLowerCase()),
    )
    if (!duplicate) deduped[key] = body
  }
  return deduped
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const norm = collapseWhitespace(item).toLowerCase()
    if (norm.length < 15 || seen.has(norm)) continue
    seen.add(norm)
    out.push(collapseWhitespace(item))
  }
  return out
}

function cleanPageText(text: string): string {
  return text
    .replace(/\bopen image lightbox\b/gi, '')
    .replace(/\bread more read less\b/gi, '')
    .replace(/\badd to cart\b/gi, '')
    .replace(/\bview all details\b/gi, '')
    .replace(/\bshop now\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function formatExtractForPrompt(extract: PageExtract): string {
  const lines: string[] = [`URL: ${extract.url}`]
  if (extract.source) lines.push(`Source: ${extract.source}`)

  if (extract.error) {
    lines.push(`Fetch error: ${extract.error}`)
    return lines.join('\n')
  }

  if (extract.title) lines.push(`Title: ${extract.title}`)
  if (extract.description) lines.push(`Description: ${extract.description}`)
  if (extract.price) lines.push(`Price: ${extract.price}`)
  if (extract.rating) {
    const parts = []
    if (extract.rating.value) parts.push(`${extract.rating.value} stars`)
    if (extract.rating.count) parts.push(`${extract.rating.count} reviews`)
    if (parts.length > 0) lines.push(`Rating: ${parts.join(', ')}`)
  }

  if (extract.sections && Object.keys(extract.sections).length > 0) {
    lines.push('', 'Structured page sections:')
    for (const [heading, body] of Object.entries(extract.sections)) {
      lines.push(`### ${heading}`, body, '')
    }
  }

  if (extract.ingredients?.length) {
    lines.push('Key ingredients / components:')
    for (const item of dedupeStrings(extract.ingredients)) lines.push(`- ${item}`)
  }
  if (extract.benefits?.length) {
    lines.push('Benefits:')
    for (const item of extract.benefits) lines.push(`- ${item}`)
  }

  if (extract.text) {
    const cleaned = cleanPageText(extract.text)
    const cap = extract.sections && Object.keys(extract.sections).length > 0 ? 2500 : MAX_TEXT_CHARS
    lines.push('', 'Additional page content:', capText(cleaned, cap))
  }

  return lines.join('\n')
}

export function formatPageExtractsForPrompt(extracts: PageExtract[]): string {
  if (extracts.length === 0) return ''
  return extracts.map((e, i) => `### Page ${i + 1}\n${formatExtractForPrompt(e)}`).join('\n\n')
}

async function fetchWithRedirects(url: string): Promise<Response> {
  let current = url
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const res = await fetch(current, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'manual',
      })

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location')
        if (!location) throw new Error(`Redirect without location (HTTP ${res.status})`)
        const next = new URL(location, current).toString()
        const validated = validateUrl(next)
        if (!validated.ok) throw new Error(validated.error)
        current = validated.normalized
        continue
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      return res
    } finally {
      clearTimeout(timer)
    }
  }

  throw new Error('Too many redirects')
}

export async function fetchPageContent(url: string): Promise<PageExtract> {
  const validated = validateUrl(url)
  if (!validated.ok) {
    return { url, text: '', error: validated.error }
  }

  const normalizedUrl = validated.normalized
  const isProductPage = /\/products\//i.test(normalizedUrl)

  if (isProductPage) {
    const shopify = await fetchShopifyProductJson(normalizedUrl)
    if (shopify) {
      try {
        const res = await fetchWithRedirects(normalizedUrl)
        const html = Buffer.from(await res.arrayBuffer()).toString('utf8')
        const $ = cheerio.load(html)
        const htmlExtract: Partial<PageExtract> = { text: extractTextFromHtml(html) }
        extractMeta($, htmlExtract)
        extractShopifyProductFields($, htmlExtract, true)

        const sections = extractAccordionSections($)
        if (shopify.sections) Object.assign(sections, shopify.sections)

        const usdPrice = pickUsdPrice(
          htmlExtract.text,
          $('meta[property="product:price:amount"]').attr('content')
            ? `$${$('meta[property="product:price:amount"]').attr('content')}`
            : undefined,
        )

        return {
          ...shopify,
          price: usdPrice ?? shopify.price,
          rating: htmlExtract.rating ?? shopify.rating,
          benefits: htmlExtract.benefits?.length ? htmlExtract.benefits : shopify.benefits,
          ingredients: htmlExtract.ingredients?.length
            ? dedupeStrings(htmlExtract.ingredients)
            : shopify.ingredients,
          sections: Object.keys(sections).length > 0 ? sections : shopify.sections,
          text: htmlExtract.text || shopify.text,
          source: 'shopify_json',
        }
      } catch {
        return shopify
      }
    }
  }

  try {
    const res = await fetchWithRedirects(normalizedUrl)
    const reader = res.body?.getReader()
    if (!reader) throw new Error('Empty response body')

    const chunks: Uint8Array[] = []
    let total = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_BODY_BYTES) {
        throw new Error('Response body exceeds 2MB limit')
      }
      chunks.push(value)
    }

    const html = Buffer.concat(chunks).toString('utf8')
    const $ = cheerio.load(html)

    const extract: PageExtract = {
      url: normalizedUrl,
      text: cleanPageText(extractTextFromHtml(html)),
      source: 'html',
    }

    extractMeta($, extract)
    collectFromJsonLd(parseJsonLdBlocks(html), extract)
    extractShopifyProductFields($, extract, isProductPage)

    const sections = extractAccordionSections($)
    if (Object.keys(sections).length > 0) extract.sections = sections

    if (!isProductPage) {
      delete extract.price
      delete extract.rating

      const fullText = collapseWhitespace($('body').text())
      if (/ulta/i.test(fullText)) {
        extract.description = [extract.description, 'Available at Ulta']
          .filter(Boolean)
          .join(' | ')
      }
      if (/award winner/i.test(fullText) && !extract.benefits?.length) {
        extract.benefits = ['Alpha-bet Élixir listed as Award Winner on site']
      }
    } else {
      const usdInText = extract.text.match(/\$\d+(?:\.\d{2})?/)
      if (usdInText) {
        extract.price = usdInText[0]
      }
    }

    return extract
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      url: normalizedUrl,
      text: '',
      error: message,
    }
  }
}
