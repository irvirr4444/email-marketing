# AI Email Marketing — Tagging & Learning Architecture

Six planes, separated by the role each tag plays. The separation is what lets the system learn interactions ("social proof wins for cold SaaS on email 2, loses with repeat buyers") instead of flat averages. Every tag should be auto-derivable at send time.

| Plane | Role |
|-------|------|
| **1. Features** | Levers the AI chooses (optimize these) |
| **2. Context** | Observed, not controllable (adapt to these) |
| **3. Deliverability** | The gate in front of everything |
| **4. Outcomes** | What winning is measured against |
| **5. Experimentation** | Keeps learning causal, not biased |
| **6. Guardrails** | Constraints (never learned from) |

---

## Plane 1 — Features (levers the AI controls)

### 1.1 Campaign Type

- cold outreach
- newsletter
- lifecycle
- promotional
- transactional
- nurture-drip
- website-triggered (cart, browse)
- list-building

### 1.2 Intent

The **one** thing this email tries to cause. Conversion in Plane 4 is judged against this.

- book meeting
- drive purchase
- get reply
- click-to-page
- activate
- upsell
- renew
- re-engage
- collect-info
- referral
- pure-value

### 1.3 Subject Line

- length
- personalization token?
- type: question / statement / curiosity-gap / list / announcement
- urgency?
- number?
- emoji?
- casing

### 1.4 Preheader

- present?
- length
- complements vs repeats subject

### 1.5 Sender

- name type: personal / company / hybrid
- identity used
- reply-to set?

### 1.6 Body

- length bucket: short (&lt;75w) / med / long (200w+)
- plain vs HTML
- image:text ratio
- link count
- reading grade
- scannable (bullets/bold)?

### 1.7 Copy Strategy

```
├── Author/methodology style: Ogilvy, Halbert, Hopkins, Sugarman, <book>, ...
├── Framework: AIDA / PAS / BAB / FAB / none
├── Persuasion (Cialdini): reciprocity / social-proof / authority / scarcity / liking / commitment
├── Emotion: fear / aspiration / curiosity / humor / FOMO / status / pain-relief
├── Social proof: testimonial / case-study / hard-stat / logos / user-count / none
├── Specificity: hard numbers vs vague
└── Personalization depth: generic / merge-field / segment-tailored / 1:1 researched
```

### 1.8 CTA

- count
- type: reply / book / buy / read / download
- placement
- style: button / link / reply
- copy

### 1.9 Offer

- has offer?
- type: % off / $ off / free-ship / BOGO / trial / bonus / bundle
- magnitude
- scarcity: time / quantity
- guarantee?

### 1.10 Sequence Position

**Position**

- email 1 (first touch) / 2 / 3 / 4+ / breakup / re-engagement / standalone

**Previous outcome**

- opened-no-reply
- didn't-open
- clicked-no-convert
- replied+
- replied-
- bounced

**Plus**

- days since previous
- new thread vs reply-on-thread

---

## Plane 2 — Context (observed; AI adapts, can't change)

### 2.1 Customer Segment

- cold prospect
- warm lead
- trial-active
- trial-expiring
- first-time buyer
- repeat (2–5)
- VIP (5+ or high LTV)
- churned (90d+)
- win-back (6mo+)
- referral source
- partner-affiliate
- investor-advisor

### 2.2 Industry / Vertical

SaaS / e-commerce / agency / healthcare / finance / real estate / education / manufacturing / hospitality / nonprofit / other

Keep free-text so the taxonomy grows from data.

### 2.3 Firmographics (B2B)

- company size
- role / seniority
- department

### 2.4 Geo

- country
- timezone
- language

### 2.5 Engagement History

Often the strongest single predictor.

- prior opens / clicks / replies
- lifetime emails received
- recency of last engagement
- lead source

### 2.6 Send Timing

- day of week
- hour (recipient local)
- time since signup
- time since last purchase

---

## Plane 3 — Deliverability

For cold email, more predictive than any copy tag.

### Infrastructure (input)

- sending domain / IP
- warmup status
- volume vs reputation limits
- SPF / DKIM / DMARC pass?

### Content spam risk (pre-send)

- spam-word score
- link count
- image:text ratio
- attachment?
- ALL-CAPS

### Placement (measured)

- delivered / bounced (hard vs soft)
- Primary / Promotions / Spam
- complaint rate

---

## Plane 4 — Outcomes

What "works" means. Capture timestamps for everything.

### Delivery

- delivered?
- bounce type
- placement

### Engagement

- opened? (+ time-to-open)
- clicked? (which link)
- replied? (+ sentiment)
- forwarded?

### Conversion

- goal completed (vs Intent 1.2)?
- revenue
- order value
- time-to-convert

### Negative

Weight equally with positive signals.

- unsubscribe
- spam complaint
- hard block
- negative reply

---

## Plane 5 — Experimentation

No randomization = the system reinforces what it already believes and optimizes into a local max.

- variant ID
- test type: A/B / multivariate / bandit / holdout
- bandit arm + explore-vs-exploit flag
- control / holdout membership
- hypothesis tag

**Decide up front:** does the AI score drafts, select among variants (bandit), or fine-tune on winners? Bandit-over-variants is the usual winning setup, but it needs traffic.

---

## Plane 6 — Guardrails

Constraints — never optimized. Cadence rules live here.

### Frequency

- max per contact per day / week
- cooldown after N non-engagements
- auto-pause on objection

### Cancellation

- over X/day → cancel
- after X sent → Y% cancel
- over Y → X

### Compliance

- CAN-SPAM / GDPR / CASL
- consent record
- suppression list
- unsubscribe honored

---

## Objective Function

The one decision that shapes everything.

Don't optimize raw conversion. 2% conversion with 10% unsubscribes burns your domain and kills the channel.

```
score = conversion_value − (unsubscribe + complaint + deliverability_decay penalties)
```

Weight complaints heavily — they damage deliverability for every future send.
