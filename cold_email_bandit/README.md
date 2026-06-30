# Cold Email Bandit

A self-learning cold-email agent that gets measurably better at choosing high-converting
email **recipes** on every iteration. It learns with a [Vowpal Wabbit](https://vowpalwabbit.org/)
contextual bandit (CB-ADF), renders chosen recipes into copy with an LLM (optional), and
**validates its own learning** inside a synthetic environment with a hidden ground-truth
reward model whose planted truths it must rediscover.

The whole core demo runs headless, offline, with **no API keys and no external services**.

## The architecture (three decoupled parts)

1. **The bandit picks levers, not prose.** VW chooses a structured *recipe* (subject
   type, framework, persuasion lever, CTA style, body length, send daypart, …) conditioned
   on the prospect's *context* (industry, role, sequence position, prior engagement). It
   operates entirely on this feature space, which is what lets it learn interactions like
   *"case-study social proof wins for SaaS on email 2, loses on email 1."*
2. **The LLM renders the recipe into copy** (`rendering/`). It is a translator, never the
   learner, and is kept **out of the inner loop** so tens of thousands of iterations run
   in seconds. A deterministic `MockRenderer` is the default; an Anthropic renderer is
   available for human inspection.
3. **The synthetic environment scores outcomes against a hidden truth** (`environment/`).
   `ground_truth.py` holds planted coefficients the bandit can never see; the simulator
   draws a stochastic funnel (placement → open → click → reply → meeting + negative
   events). Because we know the truth, we can measure exactly how close to optimal the
   policy gets (`metrics/recovery.py`).

Scope is hard-fixed to **cold outreach** (intents: `book_meeting`, `get_reply`; no
discount offers).

## Install

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e .            # or: pip install -r <deps in pyproject>
pip install -e ".[dev]"     # for tests
```

Requires Python 3.11+. VW wheels install via pip (`vowpalwabbit>=9.10`).

## Run the learning loop (headless, offline)

```bash
python -m app.run_simulation                 # uses config.yaml
python -m app.run_simulation -n 50000         # quick run (~1 min), clear holdout lift
python -m app.run_simulation -n 400000 --charts --save vw_model.bin   # full, writes PNGs
python -m app.run_simulation --exploration epsilon   # baseline exploration
```

It prints a live table of bandit vs random-holdout mean score, lift (with CI),
deliverability decay, and throughput.

## Live dashboard

```bash
python -m app.api          # then open http://127.0.0.1:8000
# or: uvicorn app.api:app
```

Training runs in a background thread; the Chart.js page polls:

- `/metrics/curve` — bandit vs holdout vs oracle ceiling
- `/metrics/funnel` — delivered → primary → open → click → reply → meeting
- `/metrics/levers?industry=SaaS&role=vp&seq=email_2` — recommended lever per dimension, sliced by context (shows interaction learning)
- `/metrics/recovery` — the recovery score + interaction checklist
- `/metrics/exploration` — exploration rate, regret proxy, lift

## Is it actually learning? (recovery check)

Because ground truth is known, `metrics/recovery.py` compares, per context, the policy's
argmax recipe to the oracle's, reporting the realized-score ratio, lever-match rate, and
direct probes of planted truths (e.g. *one-to-one personalization > generic*, *plain >
HTML*, *email-1 avoids scarcity*, *SaaS×email-2 prefers case studies*).

```bash
pytest tests/test_recovery.py                 # moderate budget, robust thresholds
RECOVERY_FULL=1 pytest tests/test_recovery.py # long run targeting ~90% of oracle
python -m app.sweep -n 100000                 # compare exploration/lr/gamma configs
```

## Tests

```bash
pytest tests/ --ignore=tests/test_recovery.py   # fast unit + integration suite
pytest tests/                                    # includes the heavier recovery check
```

## Repo layout

```
app/
  run_simulation.py   # headless learning loop (SimulationEngine + CLI)
  api.py              # FastAPI metrics endpoints + dashboard
  config.py           # pydantic settings (loads config.yaml)
  planes/             # 1 features, 2 context, 3 deliverability, 4 outcomes/objective, 6 guardrails
  bandit/             # vw_policy (CB-ADF), encoding, candidate_sampler
  environment/        # ground_truth (planted), simulator, prospects
  rendering/          # Renderer interface, mock + Anthropic
  metrics/            # tracker, store (sqlite/memory), recovery
  dashboard/          # index.html (Chart.js), cli_charts (matplotlib PNGs)
tests/
```

## Key design choices

- **CB-ADF with `-q CA --interactions CA`** crosses the Context and Action namespaces so
  the policy learns interactions, not flat per-lever averages. Feature-described candidate
  arms let it generalize across the ~10¹¹ recipe space without enumerating it.
- **Optimize the composite objective, not raw conversion.** Complaints are weighted
  heavily (`w_complaint=6`) and a running deliverability-decay term taxes domain-burning
  policies, so scarcity/fomo "traps" that lift raw clicks still lose on score.
- **Guardrails prune the action set and gate sends; they never enter the cost**, so the
  bandit cannot learn its way around a compliance or frequency rule.
- **Tuning that mattered:** SquareCB + `mtr` + `lr=0.5` + high `gamma_scale` is far more
  stable than epsilon+DR under the heavy Bernoulli noise of rare email events; greedier
  exploration plus more iterations closes the gap to the oracle.
