// Browser client for the Email Lever Bandit.
// Flow: context -> /api/bandit/pick -> /api/generate-draft -> feedback -> /api/bandit/learn

const $ = (id) => document.getElementById(id)

let current = null // { decisionId, recipe, levers, context }

const SENIORITY_LABELS = {
  ic: 'IC',
  manager: 'Manager',
  director: 'Director',
  exec: 'VP/C-level',
}

// The lever groups we show, mapped to the flat recipe keys from the bandit.
const LEVER_GROUPS = {
  'Copy strategy': ['framework', 'persuasion', 'emotion', 'specificity', 'personalization'],
  'Subject line': ['sl_type', 'sl_length', 'sl_casing', 'sl_urgency', 'sl_number', 'sl_emoji'],
  Body: ['body_length', 'body_format', 'body_links', 'body_reading', 'body_scannable'],
  'Social proof': ['sp_type', 'sp_placement', 'sp_specificity'],
  CTA: ['cta_type', 'cta_style', 'cta_placement', 'cta_count'],
  Other: ['ph_present', 'ph_length', 'ph_relationship', 'sender_name', 'sender_reply_to', 'offer_has', 'offer_type', 'offer_scarcity'],
}

function banditContext() {
  return {
    segment: $('segment').value,
    intent: $('intent').value,
    industry: $('industry').value,
    seniority: $('seniority').value,
  }
}

function coldContext() {
  return {
    recipientName: $('recipientName').value || 'there',
    recipientEmail: $('recipientEmail').value || 'prospect@example.com',
    companyName: $('company').value,
    industry: $('industry').value,
    seniority: SENIORITY_LABELS[$('seniority').value] || $('seniority').value,
    notes: `Campaign: ${$('campaign').value}\n\n${$('product').value}`,
    segmentAtSend: $('segment').value,
    sequenceNumber: 1,
    socialProofAssets: {},
  }
}

function setStatus(el, msg, kind) {
  el.textContent = msg
  el.className = 'status' + (kind ? ' ' + kind : '')
}

function renderLevers(recipe) {
  const grid = $('leversGrid')
  grid.innerHTML = ''
  for (const [group, keys] of Object.entries(LEVER_GROUPS)) {
    const div = document.createElement('div')
    div.className = 'lever-group'
    const pills = keys
      .filter((k) => k in recipe)
      .map((k) => `<span class="pill">${k.replace(/^[a-z]+_/, '')} <b>${recipe[k]}</b></span>`)
      .join('')
    div.innerHTML = `<h3>${group}</h3>${pills}`
    grid.appendChild(div)
  }
}

async function pick() {
  setStatus($('pickStatus'), 'Picking levers...', '')
  $('pickBtn').disabled = true
  try {
    const res = await fetch('/api/bandit/pick', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ context: banditContext() }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'pick failed')

    current = {
      decisionId: data.decisionId,
      recipe: data.recipe,
      levers: data.levers,
      context: coldContext(),
    }
    renderLevers(data.recipe)
    $('pickMeta').innerHTML =
      `decision <code>${data.decisionId.slice(0, 8)}</code> · propensity ` +
      `<b>${data.propensity.toFixed(3)}</b> · chosen from ${data.candidateCount} candidates`
    $('leversPanel').classList.remove('hidden')
    $('emailPanel').classList.add('hidden')
    setStatus($('pickStatus'), 'Levers picked. Render the email or pick again.', 'ok')
  } catch (err) {
    setStatus($('pickStatus'), String(err.message || err), 'err')
  } finally {
    $('pickBtn').disabled = false
  }
}

async function render() {
  if (!current) return
  setStatus($('renderStatus'), 'Rendering with Claude...', '')
  $('renderBtn').disabled = true
  try {
    const res = await fetch('/api/generate-draft', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ context: current.context, levers: current.levers }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'render failed')

    const parts = []
    parts.push(`<div class="subject">${escapeHtml(data.subject || '(no subject)')}</div>`)
    if (data.preheader) parts.push(`<div class="preheader">${escapeHtml(data.preheader)}</div>`)
    parts.push(escapeHtml(data.body || ''))
    $('email').innerHTML = parts.join('')
    $('emailPanel').classList.remove('hidden')
    setStatus($('renderStatus'), '', '')
  } catch (err) {
    setStatus($('renderStatus'), String(err.message || err), 'err')
  } finally {
    $('renderBtn').disabled = false
  }
}

async function learn(body, msg) {
  if (!current) return
  setStatus($('learnStatus'), 'Sending feedback...', '')
  try {
    const res = await fetch('/api/bandit/learn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decisionId: current.decisionId, ...body }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'learn failed')
    setStatus($('learnStatus'), `${msg} (reward ${data.reward}). The policy updated. Pick again to see it adapt.`, 'ok')
  } catch (err) {
    setStatus($('learnStatus'), String(err.message || err), 'err')
  }
}

async function recovery() {
  setStatus($('pickStatus'), 'Sampling the trained policy...', '')
  try {
    const res = await fetch('/api/bandit/recovery?trials=1500')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'recovery failed')

    const body = $('recoveryBody')
    body.innerHTML = ''
    for (const [lever, top] of Object.entries(data.top)) {
      const line = top.map(([v, c]) => `${v} (${c})`).join(', ')
      const row = document.createElement('div')
      row.className = 'recovery-row'
      row.innerHTML = `<span class="muted">${lever}</span><span class="top">${line}</span>`
      body.appendChild(row)
    }
    $('recoveryPanel').classList.remove('hidden')
    setStatus($('pickStatus'), '', '')
  } catch (err) {
    setStatus($('pickStatus'), String(err.message || err), 'err')
  }
}

async function train() {
  setStatus($('pickStatus'), 'Training on logged sends... (this takes a few seconds)', '')
  $('trainBtn').disabled = true
  try {
    const res = await fetch('/api/bandit/train', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'training failed')

    const pv = data.policyValue || {}
    const learned = pv.learned
    $('trainingMeta').innerHTML =
      `Trained on <b>${data.loaded}</b> logged sends over <b>${data.epochs}</b> epochs ` +
      `· ${pv.distinctRecipes ?? '?'} distinct recipes`

    const row = (label, val, extra = '') =>
      `<div class="recovery-row"><span class="muted">${label}</span>` +
      `<span class="top">${val}${extra}</span></div>`
    const f = (x) => (x ?? 0).toFixed(3)
    $('trainingValue').innerHTML =
      row('logged baseline reward', f(pv.baseline)) +
      row('random pick from candidates', f(pv.random)) +
      row('greedy policy pick', f(pv.greedy)) +
      row(
        'lift over random',
        `${pv.lift >= 0 ? '+' : ''}${f(pv.lift)}`,
        learned
          ? ' <b style="color:var(--good)">LEARNED</b>'
          : ' <span class="muted">no clear gain</span>',
      )

    const curve = (data.curve || []).map((p) => `${p.step}: ${p.avgReward.toFixed(3)}`).join('  ·  ')
    $('trainingCurve').innerHTML = curve ? `reward curve &mdash; ${curve}` : ''

    $('trainingPanel').classList.remove('hidden')
    setStatus($('pickStatus'), 'Training complete. The trained policy is now live for Pick levers.', 'ok')
  } catch (err) {
    setStatus($('pickStatus'), String(err.message || err), 'err')
  } finally {
    $('trainBtn').disabled = false
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

$('pickBtn').addEventListener('click', pick)
$('renderBtn').addEventListener('click', render)
$('trainBtn').addEventListener('click', train)
$('recoveryBtn').addEventListener('click', recovery)
$('thumbUp').addEventListener('click', () => learn({ reward: 1 }, 'Marked good'))
$('thumbDown').addEventListener('click', () => learn({ reward: 0 }, 'Marked bad'))
$('recordBtn').addEventListener('click', () =>
  learn(
    {
      events: {
        opened: $('ev_opened').checked,
        clicked: $('ev_clicked').checked,
        ordered: $('ev_ordered').checked,
        complained: $('ev_complained').checked,
      },
    },
    'Outcome recorded',
  ),
)
