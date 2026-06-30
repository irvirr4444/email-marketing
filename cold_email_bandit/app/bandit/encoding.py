"""Encode (context, candidates) into VW CB-ADF multiline example strings.

Format (verified against VW 9.11 ``Workspace.parse`` semantics):
- one ``shared |Context ...`` line carrying the context features
- one ``|Action ...`` line per candidate recipe
- on ``learn``, the CHOSEN action's line carries an inline label
  ``<action_idx>:<cost>:<probability>``. VW identifies the chosen arm by the *position*
  of the labelled line; the cost is what we minimize and the probability is the logged
  propensity used for unbiased updates.

Namespaces are deliberately ``Context`` (C) and ``Action`` (A) so ``-q CA`` /
``--interactions CA`` cross them and the policy learns interactions rather than flat
per-lever averages.
"""

from __future__ import annotations

from app.planes.context import Context
from app.planes.features import Recipe


def shared_line(context: Context) -> str:
    toks = " ".join(f"{k}={v}" for k, v in context.feature_tokens().items())
    return f"shared |Context {toks}"


def action_line(recipe: Recipe, label: str | None = None) -> str:
    toks = " ".join(f"{k}={v}" for k, v in recipe.feature_tokens().items())
    prefix = f"{label} " if label else ""
    return f"{prefix}|Action {toks}"


def build_examples(
    context: Context,
    candidates: list[Recipe],
    chosen_idx: int | None = None,
    cost: float | None = None,
    probability: float | None = None,
) -> list[str]:
    """Build the multiline example. Pass chosen_idx/cost/probability only for learning."""
    lines = [shared_line(context)]
    for i, recipe in enumerate(candidates):
        if chosen_idx is not None and i == chosen_idx:
            label = f"{i}:{cost}:{probability}"
            lines.append(action_line(recipe, label))
        else:
            lines.append(action_line(recipe))
    return lines
