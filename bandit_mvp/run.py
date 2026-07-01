"""Training loop plus the recovery check. Plain terminal program, no framework.

    python run.py --mode planted --rounds 20000   verify it learns, runs recovery check
    python run.py --mode random  --rounds 20000   plumbing only, stays flat near 0.5
    python run.py --render                         render one winner, needs the API key

The recovery check - not a rising reward curve - is the real proof the bandit is wired
correctly: after training on the hidden planted truth, the greedy policy should exploit
toward the strong levers and AVOID the scarcity trap.
"""

from __future__ import annotations

import argparse
import random
from collections import Counter, deque

import reward as reward_mod
from bandit import Bandit
from levers import candidate_recipes, load_lever_weights, sample_context

CANDIDATES_PER_ROUND = 24
ROLLING_WINDOW = 2000
PRINT_EVERY = 4000
LOG_EPOCHS = 5  # passes over the logged sends when training on real data

# Levers whose recovery we report, with the planted expectation.
_RECOVERY_LEVERS = ["framework", "sp_specificity", "specificity", "persuasion", "sp_type", "cta_type"]


def train(mode: str, rounds: int, seed: int = 0) -> Bandit:
    rng = random.Random(seed)
    b = Bandit(seed=seed)
    weights = load_lever_weights()
    window: deque[float] = deque(maxlen=ROLLING_WINDOW)

    for t in range(1, rounds + 1):
        ctx = sample_context(rng)
        recipes = candidate_recipes(CANDIDATES_PER_ROUND, rng, weights)
        chosen, prob, _ = b.pick(ctx, recipes)
        r = reward_mod.reward(ctx, recipes[chosen], mode, rng)
        b.learn(ctx, recipes, chosen, prob, r)
        window.append(r)
        if t % PRINT_EVERY == 0:
            avg = sum(window) / len(window)
            print(f"  round {t:>7d}   rolling avg reward (last {len(window)}): {avg:.3f}")

    return b


def train_from_logs(rounds: int, seed: int = 0, epochs: int = LOG_EPOCHS) -> Bandit:
    """Train on real logged sends: (context, recipe, outcome, propensity) from the DB.

    Each logged send is fed to VW as a single-action cb example (the action that was
    actually sent). When a live-bandit propensity was logged it is used for the unbiased
    update; synthetic backfill has none, so we warm-start at propensity 1.0. ``rounds``
    caps how many logged rows are pulled; ``epochs`` reshuffles and replays them so the
    small log is seen enough times to converge.
    """
    import db

    rows = db.fetch_training_data(limit=rounds if rounds > 0 else None)
    if not rows:
        raise SystemExit(
            "No logged outcomes found. Set DATABASE_URL and populate the send/metrics "
            "tables first (see bandit_mvp/synth_outcomes.sql), then retry --mode real."
        )

    rng = random.Random(seed)
    b = Bandit(seed=seed)
    window: deque[float] = deque(maxlen=ROLLING_WINDOW)
    print(f"  loaded {len(rows)} logged sends; replaying {epochs} epoch(s)")

    step = 0
    for _ in range(epochs):
        rng.shuffle(rows)
        for row in rows:
            r = reward_mod.reward_from_outcome(row["outcome"])
            prob = row.get("propensity") or 1.0
            b.learn(row["ctx"], [row["recipe"]], 0, prob, r)
            window.append(r)
            step += 1
            if step % PRINT_EVERY == 0:
                avg = sum(window) / len(window)
                print(f"  step {step:>7d}   rolling avg reward (last {len(window)}): {avg:.3f}")

    return b


def log_policy_value(b: Bandit, trials: int = 3000, seed: int = 321) -> None:
    """Validation for real-log training: does the policy prefer higher-reward recipes?

    The per-lever recovery check assumes independent levers; real (and the synthetic grid)
    data has correlated levers, so instead we measure policy VALUE. We build candidate sets
    from the actual logged recipes, let the greedy policy choose, and compare the empirical
    mean reward of chosen recipes against the mean reward of a random pick. A positive lift
    is the proof the pipeline learned something from the logs.
    """
    import db

    rows = db.fetch_training_data()
    if not rows:
        print("  (no logs to evaluate)")
        return

    # Empirical mean reward per distinct recipe (its "true" value from the logs).
    sums: dict[tuple, float] = {}
    counts: dict[tuple, int] = {}
    recipe_by_key: dict[tuple, dict[str, str]] = {}
    for row in rows:
        key = tuple(sorted(row["recipe"].items()))
        sums[key] = sums.get(key, 0.0) + reward_mod.reward_from_outcome(row["outcome"])
        counts[key] = counts.get(key, 0) + 1
        recipe_by_key[key] = row["recipe"]
    value = {k: sums[k] / counts[k] for k in sums}
    keys = list(value)

    baseline = sum(value[k] * counts[k] for k in keys) / sum(counts.values())

    rng = random.Random(seed)
    picked_total = 0.0
    random_total = 0.0
    for _ in range(trials):
        ctx = sample_context(rng)
        cand_keys = rng.sample(keys, min(CANDIDATES_PER_ROUND, len(keys)))
        cand = [recipe_by_key[k] for k in cand_keys]
        best = b.greedy_best(ctx, cand)
        picked_total += value[cand_keys[best]]
        random_total += sum(value[k] for k in cand_keys) / len(cand_keys)

    policy_value = picked_total / trials
    random_value = random_total / trials
    print("\nPolicy-value check (higher = the policy prefers better recipes):")
    print(f"  logged baseline mean reward : {baseline:.3f}")
    print(f"  random pick from candidates : {random_value:.3f}")
    print(f"  greedy policy pick          : {policy_value:.3f}")
    lift = policy_value - random_value
    print(f"  lift over random            : {lift:+.3f}  ({'LEARNED' if lift > 0.02 else 'no clear gain'})")


def recovery_check(b: Bandit, trials: int = 4000, seed: int = 999) -> None:
    rng = random.Random(seed)
    counters: dict[str, Counter] = {lever: Counter() for lever in _RECOVERY_LEVERS}

    for _ in range(trials):
        ctx = sample_context(rng)
        recipes = candidate_recipes(CANDIDATES_PER_ROUND, rng)
        best = b.greedy_best(ctx, recipes)
        winner = recipes[best]
        for lever in _RECOVERY_LEVERS:
            counters[lever][winner[lever]] += 1

    print("\nRecovery check (top lever values the greedy policy exploits toward):")
    for lever in _RECOVERY_LEVERS:
        top = counters[lever].most_common(3)
        pretty = ", ".join(f"{v} {c}" for v, c in top)
        print(f"  {lever:15s} {pretty}")

    print("\nExpectation:")
    print("  framework favours aida")
    print("  sp_specificity favours specific")
    print("  specificity favours hard_numbers")
    print("  persuasion AVOIDS scarcity")


def render_winner(b: Bandit, seed: int = 7) -> None:
    rng = random.Random(seed)
    ctx = {
        "segment": "cold_prospect",
        "intent": "drive_purchase",
        "industry": "ecommerce",
        "seniority": "manager",
    }
    recipes = candidate_recipes(64, rng)
    best = b.greedy_best(ctx, recipes)
    winner = recipes[best]

    import renderer

    print(renderer.preview(ctx, winner))
    print("\nRendering with Claude...\n")
    try:
        draft = renderer.render(ctx, winner)
        print(f"SUBJECT:   {draft['subject']}")
        print(f"PREHEADER: {draft['preheader']}")
        print(f"CTA:       {draft['cta']}")
        print(f"\nBODY:\n{draft['body']}")
    except Exception as exc:
        print(f"[render skipped] {exc}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Email lever contextual bandit MVP")
    parser.add_argument("--mode", choices=["planted", "random", "real"], default="planted")
    parser.add_argument("--rounds", type=int, default=20000)
    parser.add_argument("--render", action="store_true", help="render one greedy winner (needs ANTHROPIC_API_KEY)")
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--out", default="policy.vw")
    args = parser.parse_args()

    print(f"Training: mode={args.mode} rounds={args.rounds}")
    if args.mode == "real":
        b = train_from_logs(args.rounds, args.seed)
    else:
        b = train(args.mode, args.rounds, args.seed)

    if args.mode == "planted":
        recovery_check(b)
    elif args.mode == "random":
        print("\n(random mode: no structure to learn - a flat reward curve is the correct result)")
    elif args.mode == "real":
        log_policy_value(b)

    if args.render:
        print("\n" + "=" * 60)
        render_winner(b)

    b.save(args.out)
    print(f"\nSaved policy to {args.out}")
    b.finish()


if __name__ == "__main__":
    main()
