import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PageExtract } from '../../shared/schema.ts'
import { fetchPageContent } from './fetch-page.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = resolve(__dirname, '../../output/.cache')
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

type CacheEntry = {
  fetchedAt: string
  extract: PageExtract
}

function cacheKey(url: string): string {
  return createHash('sha256').update(url).digest('hex')
}

function cachePath(url: string): string {
  return resolve(CACHE_DIR, `${cacheKey(url)}.json`)
}

async function readCache(url: string): Promise<PageExtract | undefined> {
  try {
    const raw = await readFile(cachePath(url), 'utf8')
    const entry = JSON.parse(raw) as CacheEntry
    const age = Date.now() - new Date(entry.fetchedAt).getTime()
    if (age > CACHE_TTL_MS) return undefined
    return entry.extract
  } catch {
    return undefined
  }
}

async function writeCache(url: string, extract: PageExtract): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true })
  const entry: CacheEntry = {
    fetchedAt: new Date().toISOString(),
    extract,
  }
  await writeFile(cachePath(url), JSON.stringify(entry, null, 2), 'utf8')
}

export async function fetchPageContentCached(url: string): Promise<PageExtract> {
  const cached = await readCache(url)
  if (cached) return cached

  const extract = await fetchPageContent(url)
  if (!extract.error) {
    await writeCache(url, extract)
  }
  return extract
}
