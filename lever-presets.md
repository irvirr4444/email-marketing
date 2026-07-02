# Levers and Preset Values

Reference for every lever in Email Lever Studio: **code defaults** (`DEFAULT_LEVER_SUGGESTION` in `email-lever-studio/shared/schema.ts`), **LLM suggest presets** (`email-lever-studio/server/prompts.ts`), and **runtime overrides** at generation time.

---

## 1. Intent

| Field | Preset value | All options |
|-------|-------------|-------------|
| **value** | `get_reply` | `book_meeting`, `drive_purchase`, `get_reply`, `click_to_page`, `collect_info`, `referral` |

**LLM guidance:** Pick any intent — best fit for context (no default bias).

---

## 2. Copy Strategy

| Field | Preset value | All options |
|-------|-------------|-------------|
| **framework** | `PAS` | `PAS`, `AIDA`, `BAB`, `FAB`, `QUEST`, `AIDCA`, `ACCA`, `Star-Story-Solution`, `Star-Chain-Hook`, `PASTOR`, `Because`, `Slippery Slide`, `Value Prop (Pain/Gain/Job)`, `4 Us`, `4 Cs`, `Hook-Story-Offer`, `PPPP`, `SLAP`, `none` |
| **persuasion** | `none` | `reciprocity`, `authority`, `scarcity`, `liking`, `commitment`, `none` |
| **emotion** | `curiosity` | `fear`, `aspiration`, `curiosity`, `humor`, `fomo`, `status`, `pain_relief` |
| **specificity** | `vague` | `hard_numbers`, `vague` |
| **personalizationDepth** | `merge_field` | `generic`, `merge_field`, `segment_tailored`, `one_to_one_researched` |

**LLM guidance:**

- Framework: any framework, independent of intent
- Emotion: `curiosity`
- Personalization: `merge_field` (unless notes support `one_to_one_researched`)
- Persuasion: never `none` — pick one of the five; prefer `authority` if social proof assets exist, else `reciprocity`

**Runtime override at generation** (`generation-defaults.ts`):

- If persuasion is still `none` → randomly picks one of: `authority`, `reciprocity`, `scarcity`, `liking`, `commitment`
- Writing style is randomly picked based on persuasion (e.g. `authority` → ogilvy / bencivenga / schwartz)

---

## 3. Subject Line

| Field | Preset value | All options |
|-------|-------------|-------------|
| **length** | `short` | `short`, `medium`, `long` |
| **type** | `question` | `question`, `statement`, `curiosity_gap`, `list`, `announcement` |
| **urgency** | `false` | `true`, `false` |
| **numberIncluded** | `false` | `true`, `false` |
| **emoji** | `false` | `true`, `false` |
| **casing** | `sentence` | `sentence`, `title`, `lowercase` |
| **personalizationToken** | `false` | `true`, `false` |

**LLM guidance:** Generally `short`, no emoji, no urgency, `sentence` casing, `question` or `curiosity_gap` type.

---

## 4. Preheader

| Field | Preset value | All options |
|-------|-------------|-------------|
| **present** | `true` | `true`, `false` |
| **length** | `medium` | `short`, `medium` |
| **relationship** | `complements` | `complements`, `repeats` |

**LLM guidance:** Always `present=true`; 40–90 chars; complements subject.

---

## 5. Sender

| Field | Preset value | All options |
|-------|-------------|-------------|
| **nameType** | `personal` | `personal`, `company`, `hybrid` |
| **replyToSet** | `true` | `true`, `false` |

**LLM guidance:** `personal` name, reply-to set.

---

## 6. Body

| Field | Preset value | All options |
|-------|-------------|-------------|
| **length** | `medium` | `short` (<75w), `medium` (75–150w), `long` (200w+) |
| **format** | `plain` | `plain`, `html` |
| **linkCount** | `one` | `zero`, `one`, `two_plus` |
| **readingLevel** | `simple` | `simple`, `moderate`, `advanced` |
| **scannable** | `false` | `true`, `false` |

**LLM guidance:** Short to medium, plain text, one link, simple reading level, not scannable unless context needs bullets.

---

## 7. Social Proof

| Field | Preset value | All options |
|-------|-------------|-------------|
| **type** | `none` | `none`, `volume`, `name_drop`, `peer`, `result`, `quote`, `recency`, `consensus` |
| **placement** | `body` | `opener`, `body`, `pre_cta`, `ps` |
| **specificity** | `vague` | `vague`, `specific` |

**LLM guidance:** Default `type=none` unless assets provided. Asset-based preferences:

| Asset | Suggested type | Suggested specificity |
|-------|---------------|----------------------|
| `specificResult` | `result` | `specific` |
| `recognizableCustomer` | `name_drop` | `specific` |
| `customerQuote` | `quote` | `specific` |
| `customerCount` | `volume` | `specific` |
| `recentWin` | `recency` | `specific` |

Placement by intent: `opener` for consensus/name_drop, `pre_cta` for result/quote, `ps` for recency.

**Runtime override at generation** (`applySocialProofFromAssets`):

If research returned assets and type is still `none`, auto-sets from first matching asset:

| Asset field | Auto type | Auto placement |
|-------------|-----------|----------------|
| `recentWin` | `recency` | `ps` |
| `recognizableCustomer` | `name_drop` | `opener` |
| `customerQuote` | `quote` | `pre_cta` |
| `customerCount` | `volume` | `body` |
| `specificResult` | `result` | `pre_cta` |

Also forces `specificity = specific` when assets exist.

---

## 8. CTA (Call to Action)

| Field | Preset value | All options |
|-------|-------------|-------------|
| **count** | `one` | `one`, `two` |
| **type** | `reply` | `reply`, `book`, `buy`, `read`, `download` |
| **placement** | `end` | `inline`, `end`, `both` |
| **style** | `plain_reply_ask` | `plain_reply_ask`, `link`, `button` |
| **ctaCopy** | `"Would you be open to a quick reply?"` | free text |

**LLM guidance:** Single soft reply ask at end, `plain_reply_ask` style, short natural `ctaCopy`.

---

## 9. Offer

| Field | Preset value | All options |
|-------|-------------|-------------|
| **hasOffer** | `false` | `true`, `false` |
| **type** | `free_trial` | `percent_off`, `dollar_off`, `free_trial`, `bonus`, `bundle`, `guarantee` |
| **magnitude** | `""` (empty) | free text |
| **scarcity** | `none` | `time_limited`, `quantity_limited`, `none` |

**LLM guidance:** `hasOffer=false` unless context explicitly mentions a promotion, trial, or incentive.

---

## 10. Social Proof Research (pre-generation)

From `DEFAULT_RESEARCH_CONFIG` in `email-lever-studio/client/src/lib/display.ts`:

| Field | Preset value | All options |
|-------|-------------|-------------|
| **layers** | `ingredient`, `direct`, `company`, `origin` | `ingredient`, `origin`, `industry`, `behavioral`, `expert`, `direct`, `company` |
| **tone** | `clinical` | `clinical`, `mass_market`, `luxury`, `casual` |
| **depth** | `full` | `quick`, `full`, `fused` |

---

## 11. Writing Style (generation-time)

Not part of `LeverSuggestion`, but applied at draft generation:

- If persuasion is `none` → random style from all 12 authors
- Otherwise → random style from persuasion-mapped pool:

| Persuasion | Style pool |
|------------|-----------|
| `authority` | ogilvy, bencivenga, schwartz |
| `reciprocity` | kern, settle, brunson |
| `scarcity` | kennedy, halbert, makepeace |
| `liking` | kern, carlton, settle |
| `commitment` | chaperon, albuquerque, brunson |

---

## Source files

| What | File |
|------|------|
| Code defaults | `email-lever-studio/shared/schema.ts` (`DEFAULT_*` constants) |
| LLM suggest presets | `email-lever-studio/server/prompts.ts` |
| Persuasion/style overrides | `email-lever-studio/shared/generation-defaults.ts` |
| Social proof asset overrides | `applySocialProofFromAssets()` in `schema.ts` |
| Lever definitions (prompt copy) | `email-lever-studio/shared/lever-definitions.ts` |
