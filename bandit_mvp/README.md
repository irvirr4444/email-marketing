# Email Lever Contextual Bandit (MVP)

A contextual bandit that picks structured email levers. An LLM renders the chosen levers
into copy. The reward is synthetic today and is the single thing that gets swapped when
real Klaviyo / Shopify outcomes exist.

```
context  ->  bandit picks a lever recipe  ->  LLM renders copy
                    |
                 reward   <- the single swap point (reward.py)
```

Three parts stay decoupled on purpose:

1. The **bandit** picks levers, never prose. One full recipe per round from a candidate
   set, conditioned on context, and it returns the propensity it assigned. That propensity
   is logged live so off-policy evaluation stays correct on real logs later.
2. The **LLM** renders a chosen recipe into copy. It lives OUTSIDE the learning loop; the
   bandit runs tens of thousands of rounds with zero LLM calls.
3. The **reward** is isolated in one file. Today it is synthetic. When real data lands,
   one function changes and nothing else moves.

## Files

| File | Role |
|------|------|
| `levers.py` | Lever + context taxonomy (mirrors `email-lever-studio/shared/schema.ts`), recipe sampling, VW feature encoding, and the `recipe -> LeverSuggestion` bridge to the TS renderer. |
| `bandit.py` | Thin VW `cb_explore_adf` wrapper: `pick`, `learn`, `greedy_scores`, `save`. No email concepts leak in. |
| `reward.py` | **THE swap point.** `random` / `planted` now; `real_reward` (DB) later. |
| `renderer.py` | Claude renders a recipe into `subject, preheader, body, cta`. Offline/standalone path; the browser renders via the TS `/api/generate-draft`. |
| `run.py` | Training loop + recovery check + render-winner (terminal). |
| `service.py` | Thin FastAPI layer so the browser UI can drive `pick` / `learn`. The only web layer. |
| `db.py` | Optional Postgres seam. Empty and safe by default. |

## Setup

```bash
# from the repo root (a .venv already exists here)
.venv/bin/pip install -r bandit_mvp/requirements.txt
```

VW is confirmed to install and run `cb_explore_adf` on Python 3.12.

## Run from the terminal

```bash
cd bandit_mvp

# Verify it learns. Runs the recovery check.
../.venv/bin/python run.py --mode planted --rounds 20000

# Plumbing only. The reward stays flat near 0.5 because there is nothing to learn.
../.venv/bin/python run.py --mode random --rounds 12000

# Render one greedy winner (needs ANTHROPIC_API_KEY).
../.venv/bin/python run.py --mode planted --rounds 20000 --render
```

### What "learning" looks like

The proof is the **recovery check**, not a rising reward curve. After planted training the
greedy policy should exploit toward the strong levers and avoid the trap:

```
framework       aida ...           # favours aida
sp_specificity  specific ...       # favours specific
specificity     hard_numbers ...   # favours hard_numbers
persuasion      liking, none, ...  # scarcity is NOT in the top values (the trap)
sp_type         result, quote, consensus ...
cta_type        buy, read ...
```

## Serve it to the browser UI

```bash
# terminal 1: the bandit service
cd bandit_mvp && ../.venv/bin/python -m uvicorn service:app --port 8000
# (or, from email-lever-studio/: npm run bandit)

# terminal 2: the studio API + browser UI (needs CLAUDE_API_KEY)
cd email-lever-studio && npm run dev
# open http://127.0.0.1:3001
```

The UI flow: enter context -> **Pick levers** (`/api/bandit/pick`) -> **Render this email**
(`/api/generate-draft`) -> thumbs up/down or outcome events (`/api/bandit/learn`). Pick
again to watch the policy adapt, or **Show what it learned** for the recovery view.

## Train on logged data (`--mode real`)

The bandit can train directly off the sends logged in Postgres. The read path is already
wired end to end:

```
generated_email        the lever recipe
  -> generated_email_send   design -> message link
    -> email_message        one row per send
      -> email_context      context at send (segment / industry / seniority)
      -> email_metrics      outcome (opened / clicked / ordered / complained)
```

```bash
# point at the sigil-marketing project (Supabase -> Project Settings -> Database -> URI)
export DATABASE_URL='postgresql://postgres.<ref>:<password>@<host>:6543/postgres'

cd bandit_mvp
../.venv/bin/python run.py --mode real         # trains on the logged sends
```

`run.train_from_logs` pulls every logged send (`db.fetch_training_data`), turns each into
a single-action `cb_explore_adf` example, and replays the log for a few epochs. If a
live-bandit propensity was logged (`email_context.extras.bandit_propensity`) it is used for
the unbiased update; historical/backfilled sends have none, so they warm-start at
propensity 1.0.

### What "learning" looks like on real logs

Because levers are correlated in real data (and in the synthetic grid), the per-lever
recovery check is not the right proof. Instead `--mode real` runs a **policy-value check**:
it builds candidate sets from the actually-logged recipes, lets the greedy policy pick, and
compares the empirical reward of chosen recipes against a random pick. A positive **lift
over random** is the proof the pipeline learned:

```
Policy-value check (higher = the policy prefers better recipes):
  logged baseline mean reward : 0.586
  random pick from candidates : 0.586
  greedy policy pick          : 0.870
  lift over random            : +0.284  (LEARNED)
```

## Seeding synthetic outcomes (until real data lands)

The 50 rows in `generated_email` are lever designs with **no** feedback. `synth_outcomes.sql`
fabricates industry-anchored send + outcome logs (base rates ~30% open / ~10% click-of-open
/ ~8% order-of-click, plus a known planted lever tilt) so the whole `--mode real` path can
be exercised today. Run it once against the DB (it tags everything `source = 'synthetic_v1'`
and has a cleanup block at the top for re-runs). Swap it out the moment real Klaviyo /
Shopify outcomes arrive; the training path above does not change.

## The swap point (wiring real data)

Everything is anchored on two seams:

1. **`reward.py`** - `reward_from_outcome` holds the composite
   `1.0*opened + 3.0*clicked + 12.0*ordered - 25.0*complained` (same weights the browser
   uses). The heavy complaint penalty protects domain reputation. `real_reward` looks that
   up per (context, recipe) via `db.fetch_outcome`.
2. **`db.py`** - set `DATABASE_URL`; `fetch_training_data` (batch training),
   `fetch_outcome` (online reward), and `lever_value_frequencies` (so
   `levers.load_lever_weights` biases candidate sampling toward the real design
   distribution instead of uniform noise) are all implemented against the live schema.

Grep confirms the planted logic lives only in `reward.py`; no other file imports it.

## Honest limits

- The propensity MUST be logged live at send time for off-policy correctness. `service.py`
  writes it to `decisions.jsonl` at `pick` time.
- The planted environment proves the machinery **converges**, not that real recipients
  behave like the planted coefficients. Calibrate against the first real campaign before
  trusting outputs.
- The weak `framework` signal recovers less cleanly than high-leverage levers because the
  gap is small and reward is stochastic. This is expected and resolves on real effect
  sizes.
