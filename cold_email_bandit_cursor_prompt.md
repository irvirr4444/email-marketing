# Cursor Build Prompt: Self-Learning Cold Email Agent (Vowpal Wabbit Contextual Bandit)

You are building a cold email marketing agent that gets measurably better at writing high-converting cold emails on every iteration. It learns with a Vowpal Wabbit contextual bandit, generates real email copy with an LLM, and validates its own learning inside a synthetic environment with a hidden ground-truth reward model.

Build this incrementally, in the milestone order at the bottom. Each milestone must run and be testable before moving to the next. Do not build the whole thing at once.

---

## 1. The core architecture (read this first, it governs every decision)

The system is three decoupled parts. Keeping them separate is the whole point.

1. **The bandit picks levers, not prose.** Vowpal Wabbit chooses a structured "recipe" of email features (subject type, copy framework, persuasion lever, CTA style, body length, send time, etc.) conditioned on the prospect's context (industry, role, seniority, sequence position, prior engagement). The bandit operates entirely on this structured feature space. This is what makes it tractable and what lets it learn interactions like "case-study social proof wins for SaaS on email 2, loses on email 1."

2. **The LLM renders the chosen recipe into copy.** A separate renderer takes the selected levers plus the prospect context and writes the actual subject, preheader, and body. The LLM is a deterministic-ish renderer, never the learner. Keep LLM calls OUT of the inner learning loop so you can run tens of thousands of iterations cheaply.

3. **The synthetic environment scores outcomes against a hidden truth.** A ground-truth reward model (planted coefficients the bandit cannot see) converts a recipe + context into simulated outcomes: placement, open, click, reply, sentiment, meeting, and negative events (unsubscribe, complaint). The bandit's job is to rediscover the planted truths. Because you know the truths, you can measure exactly how close to optimal it gets.

The "fake stat counter" the user asked for is this synthetic environment plus a metrics layer plus a dashboard.

---

## 2. Scope: cold outreach only

Hard-fix `campaign_type = cold_outreach`. Remove newsletter, lifecycle, promotional, transactional, nurture-drip, website-triggered, and list-building entirely. No discount offers (no % off, BOGO, free shipping). Cold-appropriate offers only: `none`, `free_resource`, `free_audit`, `trial`. Two valid intents only: `book_meeting` and `get_reply`. Intent is set per campaign (context), not learned.

---

## 3. Tech stack

- **Language:** Python 3.11+
- **Bandit:** `vowpalwabbit` (pip package), contextual bandit with action-dependent features (CB-ADF)
- **Backend / API:** FastAPI + uvicorn
- **Storage:** SQLite by default for zero-setup local runs. Abstract the data layer behind a repository interface so it swaps to Postgres/Supabase without touching loop code. Default must run with no external services.
- **LLM renderer:** Anthropic API (Claude), behind a `Renderer` interface. The renderer must be mockable so the core loop runs with zero API calls.
- **Dashboard:** FastAPI serves a single static HTML page using Chart.js (no build step). Also ship a headless CLI mode that prints a live metrics table and writes PNG charts via matplotlib, so the learning loop runs on a server with no browser.
- **Config:** a single `config.yaml` plus pydantic settings.

Do not add a frontend build pipeline. Keep it runnable with `python -m app.run_simulation`.

---

## 4. Repository structure

```
cold_email_bandit/
  config.yaml
  pyproject.toml
  app/
    run_simulation.py        # entrypoint: runs the learning loop headless
    api.py                   # FastAPI app: metrics endpoints + dashboard
    config.py                # pydantic settings loader
    planes/
      features.py            # Plane 1: the lever space (enums + cardinalities)
      context.py             # Plane 2: prospect context space
      deliverability.py      # Plane 3: spam-risk scoring from a recipe
      outcomes.py            # Plane 4: outcome dataclasses + objective function
      guardrails.py          # Plane 6: hard constraints applied pre-send
    bandit/
      vw_policy.py           # VW CB-ADF wrapper: predict / learn / save / load
      encoding.py            # recipe + context -> VW ADF example strings
      candidate_sampler.py   # generates K candidate recipes per decision
    environment/
      ground_truth.py        # hidden reward model with planted coefficients
      simulator.py           # recipe + context -> simulated outcomes
      prospects.py           # synthetic prospect/context generator
    rendering/
      renderer.py            # Renderer interface
      llm_renderer.py        # Anthropic-backed renderer
      mock_renderer.py       # template renderer, no API calls
    metrics/
      tracker.py             # rolling metrics, holdout lift, recovery check
      store.py               # repository interface + SQLite impl
    dashboard/
      index.html             # Chart.js single page
  tests/
    test_objective.py
    test_guardrails.py
    test_recovery.py         # asserts the bandit recovers planted truths
```

---

## 5. Plane 1 — FEATURES (the levers the bandit chooses)

Define each as a Python Enum with explicit values. These are the action dimensions. A "recipe" is one choice per dimension.

- **subject_type:** question | curiosity_gap | statement | direct_ask | pattern_interrupt
- **subject_length:** short_3to5w | med_6to9w | long_10w_plus
- **subject_personalization:** none | first_name | company | role_specific
- **subject_case:** sentence | title | lower
- **subject_has_number:** false | true
- **subject_emoji:** false | true
- **preheader:** none | complements | repeats
- **sender_type:** personal | company | hybrid
- **body_length:** short_lt75 | med_75to150 | long_150plus
- **format:** plain | light_html
- **link_count:** zero | one | two_plus
- **reading_grade:** simple | moderate | complex
- **scannable:** false | true
- **framework:** none | AIDA | PAS | BAB | FAB
- **persuasion:** none | reciprocity | social_proof_casestudy | social_proof_stat | social_proof_logos | authority | scarcity | liking | commitment
- **emotion:** none | curiosity | aspiration | pain_relief | status | humor | fomo
- **specificity:** vague | hard_numbers
- **personalization_depth:** generic | merge_field | segment_tailored | one_to_one_researched
- **cta_count:** one | two
- **cta_type:** soft_reply | book_link | resource_link
- **cta_placement:** early | end | both
- **offer:** none | free_resource | free_audit | trial
- **send_daypart:** mon_am | midweek_am | midweek_pm | fri_am | offhours (recipient local time)

The full Cartesian product is large (~10^9). You will NOT enumerate it. The candidate sampler draws K candidates per decision and VW scores them via shared feature weights, so it generalizes across unseen combinations. That generalization is the reason to use CB-ADF rather than a flat action index.

---

## 6. Plane 2 — CONTEXT (observed, bandit adapts, cannot change)

- **industry:** SaaS | ecommerce | agency | healthcare | finance | real_estate | education | manufacturing | other (keep free-text passthrough so the taxonomy can grow)
- **company_size:** smb | mid | enterprise
- **role_seniority:** ic | manager | director | vp | c_level
- **department:** sales | marketing | engineering | ops | finance | founder
- **geo_timezone:** bucket the prospect into a tz region (drives send_daypart interaction)
- **language:** fix to `en` for v1
- **sequence_position:** email_1 | email_2 | email_3 | email_4plus | breakup
- **prior_outcome:** none | opened_no_reply | didnt_open | clicked_no_reply (carried from the previous email in the sequence)
- **days_since_previous:** integer
- **lifetime_emails_received:** integer

Context is the `shared` example in CB-ADF. The bandit must learn lever choices conditioned on context, which is the entire value proposition.

---

## 7. Plane 3 — DELIVERABILITY (the gate in front of everything)

For cold email this is more predictive than any copy tag, so model it as a gate before opens are even possible.

Compute a `spam_risk` score in [0,1] from the recipe (not from context):
- `link_count = two_plus` raises risk
- `format = light_html` raises risk vs `plain`
- `subject_emoji = true` raises risk
- `subject_case = title` with `subject_has_number = true` raises risk slightly (looks promotional)
- `cta_count = two` raises risk
- presence of scarcity/fomo raises a "spammy tone" component

Map `spam_risk` to a placement distribution:
- low risk -> mostly `primary`
- medium -> split `primary` / `promotions`
- high -> meaningful `spam` probability

Placement gates the open probability hard: `spam` placement crushes opens, `promotions` dampens them, `primary` is full. Infrastructure inputs (domain warmup, SPF/DKIM/DMARC) are a fixed healthy config in v1, exposed in `config.yaml` so they can later degrade.

---

## 8. Plane 4 — OUTCOMES and the objective function

Outcome chain, each conditional on the previous, all stochastic:

`delivered -> placement -> opened (+time_to_open) -> clicked -> replied (+sentiment) -> [meeting_booked if intent=book_meeting] -> negative events`

Negative events: `unsubscribe`, `spam_complaint`, `hard_block`, `negative_reply`. Capture timestamps on everything.

**Objective function (the reward fed to the bandit). Do not optimize raw conversion.**

```
conversion_value =
    w_reply        * replied_positive
  + w_meeting      * meeting_booked        # only if intent = book_meeting
  + w_click        * clicked

penalty =
    w_unsub        * unsubscribe
  + w_complaint    * spam_complaint        # weight this heavily
  + w_negreply     * negative_reply
  + w_deliv_decay  * deliverability_decay  # rises with cumulative complaints in the run

score = conversion_value - penalty
```

Default weights in config (tune later): `w_reply=1.0`, `w_meeting=3.0`, `w_click=0.15`, `w_unsub=2.0`, `w_complaint=6.0`, `w_negreply=1.0`, `w_deliv_decay` scales a running domain-health variable that complaints erode and that reduces everyone's deliverability for the rest of the run. The complaint weight being high is deliberate: a policy that farms replies while burning the domain must score worse than a calmer policy.

VW minimizes cost, so `cost = -score`. Feed cost, not score.

---

## 9. The Vowpal Wabbit policy (bandit/vw_policy.py)

Use CB-ADF with exploration. Recommended init string:

```
--cb_explore_adf --squarecb -q CA --interactions CA -l 0.02 --power_t 0 --normalize --quiet
```

Notes:
- `-q CA` and `--interactions CA` cross the Context namespace with the Action namespace. This is what produces interaction learning ("persuasion x industry x sequence_position") rather than flat per-lever averages. Without these crosses the system cannot learn the interactions the architecture exists to capture.
- Start with `--epsilon 0.1` (epsilon-greedy) as the simplest exploration to get a baseline working, then switch to `--squarecb` (smarter, reward-sensitive exploration) and compare. Also try `--cover 5`. Make the exploration algorithm a config knob.
- Add an exploration decay option (epsilon shrinks as iterations grow) and expose it in config so you can show regret narrowing over time.

**Example encoding (encoding.py).** Build one shared line for context and one line per candidate recipe. Attach the CB label to the chosen action's line as `action:cost:probability`, where probability is the propensity returned by `predict`. Conceptual shape:

```
shared |Context industry=SaaS role=vp dept=sales size=mid seqpos=email_2 prior=opened_no_reply tz=us_eastern
|Action subj=question slen=short pers=role_specific frame=PAS persu=social_proof_casestudy cta=soft_reply blen=short_lt75 fmt=plain daypart=midweek_am
|Action subj=curiosity_gap slen=med pers=company frame=BAB persu=authority cta=book_link blen=med fmt=light_html daypart=midweek_pm
... (K candidates)
```

The chosen line on `learn` carries the label. Use VW's Python `Workspace` API and follow the official CB-ADF tutorial for exact label placement rather than hand-formatting strings blindly: https://vowpalwabbit.org/docs/vowpal_wabbit/python/latest/tutorials/python_Contextual_bandits_and_Vowpal_Wabbit.html

Wrapper interface:
```python
class VWPolicy:
    def predict(self, context, candidates) -> tuple[int, float]:  # (chosen_idx, propensity)
    def learn(self, context, candidates, chosen_idx, cost, propensity) -> None
    def save(self, path) -> None
    def load(self, path) -> None
```

The propensity must be the probability the exploration policy assigned to the chosen action. Log it; you need it for unbiased learning and for the off-policy holdout estimator.

---

## 10. The synthetic environment (environment/)

This is the part that makes learning verifiable. The bandit must never see any of this.

**ground_truth.py** holds planted coefficients. Outcomes are drawn from logits built from base rates plus lever main-effects plus context-conditioned interaction effects plus Gaussian noise. Plant a realistic, opinionated truth, for example:

Main effects (cold email reality):
- `personalization_depth = one_to_one_researched` is the single strongest positive lever on reply. `generic` is strongly negative.
- `format = plain` beats `light_html` on both deliverability and reply.
- `body_length = short_lt75` wins on email_1; medium becomes acceptable later in the sequence.
- `framework`: PAS and BAB positive, AIDA mild positive, none negative.
- `cta_count = one` with `cta_type = soft_reply` beats two CTAs and beats hard `book_link` on first touch.
- `sender_type = personal` beats company for cold.
- `subject_emoji = true` and `subject_case = title` hurt (spam + B2B mismatch).
- `subject_type = question` or `curiosity_gap` at `short` length helps opens.
- `scarcity` and `fomo` RAISE complaints and unsubscribes in cold context. They are traps that lift short-term clicks but tank the objective via penalties.

Interaction effects (the reason for `-q CA`):
- `social_proof_casestudy x SaaS x email_2` strongly positive.
- `social_proof_stat x finance` positive; `humor x healthcare` negative.
- `authority x c_level` positive; `body_length=long x vp` negative (busy execs).
- `scarcity x email_1` strongly negative on score; mild scarcity x `breakup` is the ONE place it helps replies.
- `daypart=midweek_am x matching timezone` mild positive; `offhours` negative.

Add per-logit Gaussian noise so the truth is not trivially separable and the bandit needs repeated samples per context to converge.

**simulator.py** runs the outcome chain using ground_truth, applies the deliverability gate, returns an `Outcomes` object. **prospects.py** generates a stream of synthetic prospects with realistic context distributions and maintains sequence state (so email_2 for a prospect carries the prior_outcome from email_1).

---

## 11. The learning loop (app/run_simulation.py)

```
for t in range(N_ITERATIONS):
    prospect = prospects.next()                       # context, incl. sequence state
    context  = build_context(prospect)

    if holdout.member(prospect):                      # ~10% random-policy holdout
        recipe, prob = random_policy.choose()
    else:
        candidates  = candidate_sampler.sample(context, K)
        candidates  = guardrails.filter(candidates, prospect)   # prune illegal actions
        idx, prob   = vw.predict(context, candidates)
        recipe      = candidates[idx]

    outcomes = simulator.run(recipe, context)         # hidden truth scores it
    score    = objective(outcomes, intent)
    cost     = -score

    if not holdout.member(prospect):
        vw.learn(context, candidates, idx, cost, prob)

    metrics.record(prospect, recipe, outcomes, score, prob, is_holdout)
    prospects.update_sequence_state(prospect, outcomes)

    if t % RENDER_EVERY == 0:                          # cheap: render only occasionally
        email = renderer.render(recipe, context)       # real LLM copy for inspection
        metrics.attach_rendered_email(t, email)
```

Keep the LLM out of the hot path. Render only a sampled subset (and the current best recipe per context) so the loop can run 20k+ iterations in seconds with the mock renderer and without burning API budget.

---

## 12. Plane 6 — GUARDRAILS (guardrails.py, never learned from)

Applied AFTER the bandit picks candidates and BEFORE send, by pruning or vetoing:
- Frequency: max emails per contact per day/week; cooldown after N consecutive non-engagements; auto-pause a sequence after a negative_reply, unsubscribe, or complaint.
- Cancellation thresholds: over X sends/day cancels the run; complaint rate over a ceiling pauses sending.
- Compliance: suppression list honored, unsubscribe is permanent, consent record present. In the simulator, sending to a suppressed or unsubscribed prospect is impossible (filtered), so the bandit cannot learn its way around a guardrail.

Guardrails reduce the candidate set; they never enter the cost. If guardrails empty the candidate set, skip the send.

---

## 13. Plane 5 — EXPERIMENTATION and the holdout

- Maintain a random-policy holdout cohort (config `holdout_fraction`, default 0.1). The holdout never learns.
- Report **policy lift** = mean score (bandit) minus mean score (holdout), with confidence intervals, over a rolling window. This is your honest "is it better than random" signal.
- Log propensities so the run is replayable and so a later off-policy estimator (IPS / doubly robust) can score a candidate policy on logged data without new sends. Stretch goal in section 16 wires this to the Open Bandit Pipeline.

---

## 14. The renderer (rendering/)

`Renderer.render(recipe, context) -> {subject, preheader, body}`. The LLM renderer prompts Claude to write a cold email that strictly obeys every lever in the recipe (length bucket, framework, persuasion type, CTA style, personalization depth) for the given prospect. The mock renderer fills templates deterministically. The system must run end to end with the mock renderer and zero API keys. Real rendering is for human inspection of what the learned policy actually produces, not for the learning signal.

---

## 15. Metrics, recovery check, and dashboard (metrics/ + dashboard/)

The "fake stat counter." Per email, store a row: prospect context, chosen recipe, full outcomes, score, propensity, holdout flag, placement, and (if rendered) the copy.

Aggregate and expose via FastAPI:
- `/metrics/curve` rolling mean score, bandit vs holdout, over iterations
- `/metrics/levers` current learned best lever value per dimension, sliced by context (e.g. SaaS x vp x email_2)
- `/metrics/exploration` exploration rate and regret over time
- `/metrics/recovery` the recovery score (below)
- `/metrics/funnel` delivered -> primary placement -> open -> click -> reply -> meeting, plus complaint and unsub rates

**Recovery check (tests/test_recovery.py, this is the real proof of learning).** Because ground_truth is known, after training compute, per sampled context, the bandit's argmax recipe and compare it to the oracle's argmax recipe. Report:
- lever-match rate (what fraction of lever dimensions match the oracle, per context)
- realized-score gap vs the oracle policy (how much score is left on the table)
- a pass threshold (for example, the trained policy must reach at least 90% of oracle mean score and beat the holdout by a significant margin)

The dashboard is a single Chart.js page polling these endpoints: a learning curve (bandit vs holdout vs oracle ceiling), a per-context lever table, the funnel, and the recovery score. The headless CLI prints the same numbers and writes PNGs.

---

## 16. Build milestones (do these in order, each must run and pass tests)

1. **Skeleton + planes.** Enums for Plane 1 and 2, objective function with unit tests, guardrails with unit tests. No bandit yet. `test_objective.py`, `test_guardrails.py` green.
2. **Synthetic environment.** ground_truth, simulator, prospects. Drive it with a fixed random policy and confirm outcome distributions look sane (reply rates in a believable cold-email range, complaints rise with scarcity).
3. **VW integration.** vw_policy, encoding, candidate_sampler. Run the loop with `--epsilon 0.1`. Confirm mean score rises above the random holdout over iterations.
4. **Metrics + recovery.** tracker, store, recovery check. `test_recovery.py` asserts the policy reaches the oracle threshold. Tune VW (`--squarecb`, learning rate, K, interactions) until it passes.
5. **Dashboard.** FastAPI endpoints + Chart.js page + CLI charts.
6. **LLM renderer.** Mock first, then Anthropic. Render the learned best recipe per top context so the user can read the actual winning emails.
7. **Polish.** Exploration decay, per-context drill-down, deliverability decay dynamics, config sweep script.

---

## 17. Acceptance criteria (how you know it is brilliant, not just running)

- Bandit mean score beats the random holdout by a statistically clear margin and the gap widens over iterations.
- Recovery check passes: the trained policy reaches at least 90% of oracle mean score and its per-context argmax levers largely match the planted optimum.
- The system demonstrably learns INTERACTIONS, not averages: for `SaaS x email_2` it favors case-study social proof, while for `email_1` it avoids scarcity. Show this in the per-context lever table.
- It refuses the traps: scarcity and fomo do not dominate despite lifting raw clicks, because the complaint and unsub penalties make them lose on score.
- The whole learning loop runs headless with the mock renderer, no API keys, no external DB, in seconds for tens of thousands of iterations.

---

## 18. Stretch goals

- Wire the logged propensities into the Open Bandit Pipeline for formal off-policy evaluation (IPS, doubly robust) so a new candidate policy can be scored on past logs before any send.
- Swap SQLite for Supabase/Postgres via the repository interface, no loop changes.
- Add a real ESP adapter behind the simulator interface so the same policy can drive live sends later. The send path is identical; only the outcome source changes from simulator to real webhooks.
- Add concept drift: let ground_truth coefficients shift slowly mid-run and confirm the bandit re-adapts (this is where online learning earns its keep over a static model).

---

## 19. Anti-requirements (do NOT do these)

- Do not put an LLM call inside the inner learning loop.
- Do not optimize raw conversion or reply rate. Optimize the composite score with penalties.
- Do not use a flat action index over the full lever product. Use CB-ADF with feature-described candidate arms so the policy generalizes.
- Do not let the bandit learn from or around guardrails. Guardrails prune the action set and never enter the cost.
- Do not require any external service to run the core demo.
