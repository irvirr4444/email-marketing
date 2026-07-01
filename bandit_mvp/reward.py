"""THE swap point. This is the only file that changes when real data arrives.

Today the reward is synthetic. Two modes:

  mode="random"   pure noise. The bandit will not improve because there is nothing to
                  learn. That is the correct result and proves the plumbing is honest.

  mode="planted"  a hidden ground truth the bandit cannot see, used to VERIFY learning.
                  Planted coefficients + a context interaction + a deliberate trap,
                  squashed through a sigmoid to a rate, then a Bernoulli 0/1 draw.

When real Klaviyo/Shopify outcomes land, implement ``real_reward`` and point the caller at
it. Nothing else in the system moves: no other file imports the planted logic (grep
``planted`` / ``PLANTED_`` and you will only find it here).
"""

from __future__ import annotations

import math
import random
from typing import Any

# ---------------------------------------------------------------------------
# Planted ground truth (VERIFICATION ONLY - never referenced outside this file)
# Coefficients are expressed on the real lever taxonomy (levers.py / schema.ts).
# ---------------------------------------------------------------------------
PLANTED_MAIN: dict[str, dict[str, float]] = {
    "framework": {"aida": 0.9, "pas": 0.6},
    "sp_type": {"result": 0.7, "quote": 0.6, "consensus": 0.5},
    "sp_specificity": {"specific": 0.8},
    "specificity": {"hard_numbers": 0.6},
    "cta_type": {"buy": 0.5, "read": 0.4},
    # TRAP: scarcity looks tempting but hurts. The recovery check must show the policy
    # learns to AVOID it.
    "persuasion": {"scarcity": -0.8},
}

# Reactivation-style segments (the real-taxonomy analogue of the spec's "reactivate"
# intent): here curiosity beats fear.
_REACTIVATION_SEGMENTS = {"churned", "win_back"}


def _planted_score(ctx: dict[str, str], recipe: dict[str, str]) -> float:
    total = 0.0
    for lever, table in PLANTED_MAIN.items():
        total += table.get(recipe.get(lever, ""), 0.0)

    # Context interaction: on reactivation segments, curiosity helps and fear hurts.
    if ctx.get("segment") in _REACTIVATION_SEGMENTS:
        if recipe.get("emotion") == "curiosity":
            total += 0.6
        elif recipe.get("emotion") == "fear":
            total -= 0.3

    return total


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def reward(ctx: dict[str, str], recipe: dict[str, str], mode: str, rng: random.Random | None = None) -> float:
    rng = rng or random
    if mode == "random":
        return rng.random()
    if mode == "planted":
        p = _sigmoid(_planted_score(ctx, recipe) - 1.0)
        return 1.0 if rng.random() < p else 0.0
    if mode == "real":
        return real_reward(ctx, recipe)
    raise ValueError(f"unknown reward mode: {mode!r}")


# ---------------------------------------------------------------------------
# The composite reward. This is the definition of "good" the bandit optimizes.
# Same weights the browser uses (service.EVENT_WEIGHTS). The heavy complaint penalty is
# deliberate: a spam complaint hurts domain reputation far more than one order helps.
# ---------------------------------------------------------------------------
REWARD_WEIGHTS: dict[str, float] = {
    "opened": 1.0,
    "clicked": 3.0,
    "ordered": 12.0,
    "complained": -25.0,
}


def reward_from_outcome(outcome: dict[str, Any]) -> float:
    """Composite reward from a logged outcome dict (event flags -> scalar).

    ``outcome`` keys are the event booleans/rates: opened, clicked, ordered, complained
    (rates in [0,1] also work, for aggregated outcomes). This is the single place the
    business definition of reward lives; change the weights here, nothing else moves.
    """
    return sum(w * float(outcome.get(event, 0)) for event, w in REWARD_WEIGHTS.items())


def real_reward(ctx: dict[str, str], recipe: dict[str, str]) -> float:
    """Composite reward from real logged outcomes (the online single-lookup path).

    Looks up the aggregated outcome of this recipe under this context (db.fetch_outcome
    joins generated_email -> generated_email_send -> email_message -> email_metrics) and
    feeds it through the shared composite in ``reward_from_outcome``. Raises LookupError
    when nothing matching was logged, so the caller can fall back or skip.

    For batch/offline training over the whole log, prefer ``db.fetch_training_data`` +
    ``reward_from_outcome`` (see run.train_from_logs); this per-call lookup is for online
    scoring.
    """
    from db import fetch_outcome  # lazy import; db.py is the connector seam

    outcome = fetch_outcome(ctx, recipe)
    if outcome is None:
        raise LookupError("no logged outcome for this context + recipe")
    return reward_from_outcome(outcome)


if __name__ == "__main__":
    rng = random.Random(0)
    ctx = {"segment": "churned", "intent": "drive_purchase", "industry": "ecommerce", "seniority": "manager"}
    strong = {"framework": "aida", "sp_type": "result", "sp_specificity": "specific",
              "specificity": "hard_numbers", "cta_type": "buy", "persuasion": "authority",
              "emotion": "curiosity"}
    weak = {"framework": "none", "sp_type": "none", "sp_specificity": "vague",
            "specificity": "vague", "cta_type": "reply", "persuasion": "scarcity",
            "emotion": "fear"}
    n = 20000
    sr = sum(reward(ctx, strong, "planted", rng) for _ in range(n)) / n
    wr = sum(reward(ctx, weak, "planted", rng) for _ in range(n)) / n
    rr = sum(reward(ctx, strong, "random", rng) for _ in range(n)) / n
    print(f"planted strong recipe rate: {sr:.3f}")
    print(f"planted weak/trap recipe rate: {wr:.3f}")
    print(f"random mode mean (should be ~0.5): {rr:.3f}")
