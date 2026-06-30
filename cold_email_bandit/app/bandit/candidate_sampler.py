"""Candidate sampler: draws K candidate recipes per decision.

The full lever product is ~10^11, so we never enumerate it. Each decision draws K
random candidates; VW scores them with shared feature weights and thus generalizes to
recipes it has never seen. That generalization is the whole reason for CB-ADF over a
flat per-combo action index.
"""

from __future__ import annotations

import random

from app.planes.context import Context
from app.planes.features import DIMENSIONS, Recipe


def random_recipe(rng: random.Random) -> Recipe:
    """Uniform random choice on every lever dimension."""
    choices = {dim: rng.choice(values) for dim, values in DIMENSIONS.items()}
    return Recipe(**choices)


class CandidateSampler:
    def __init__(self, rng: random.Random):
        self.rng = rng

    def sample(self, context: Context, k: int) -> list[Recipe]:
        """K distinct candidate recipes. Context is accepted for future context-aware
        biasing; v1 samples uniformly because VW handles the conditioning."""
        seen: set[tuple] = set()
        out: list[Recipe] = []
        attempts = 0
        while len(out) < k and attempts < k * 20:
            attempts += 1
            r = random_recipe(self.rng)
            key = tuple(sorted(r.as_dict().items()))
            if key in seen:
                continue
            seen.add(key)
            out.append(r)
        return out
