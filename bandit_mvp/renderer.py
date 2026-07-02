"""Claude renders a chosen recipe into copy. This lives OUTSIDE the learning loop.

The bandit runs tens of thousands of rounds with zero LLM calls; only when you want to see
an actual email (``run.py --render`` or the browser "render winner" button) does this get
called. In the browser flow, rendering goes through the richer TypeScript
``/api/generate-draft`` endpoint instead; this module is the standalone/offline path so a
recipe can be eyeballed with or without an API key.

Style rule for all generated copy: no hyphens and no em dashes in the copy text.
"""

from __future__ import annotations

import json
import os

from levers import LEVERS

_SYSTEM = (
    "You are an expert cold-email copywriter. You are given a structured recipe of email "
    "levers and the recipient context. Express EVERY lever faithfully in the copy. "
    "Hard style rule: use no hyphens and no em dashes anywhere in the copy text. "
    "Return STRICT JSON ONLY, no prose, no code fence, with exactly these keys: "
    '"subject", "preheader", "body", "cta".'
)


def _user_prompt(ctx: dict[str, str], recipe: dict[str, str]) -> str:
    ctx_lines = "\n".join(f"  {k}: {v}" for k, v in ctx.items())
    rec_lines = "\n".join(f"  {k}: {v}" for k, v in recipe.items())
    return (
        f"Context:\n{ctx_lines}\n\n"
        f"Recipe (levers to express):\n{rec_lines}\n\n"
        "Write the email now as strict JSON."
    )


def preview(ctx: dict[str, str], recipe: dict[str, str]) -> str:
    """A plain-text summary of context + recipe. No API call. Always available."""
    lines = ["CONTEXT", "-------"]
    lines += [f"  {k:14s} {v}" for k, v in ctx.items()]
    lines += ["", "RECIPE", "------"]
    lines += [f"  {k:16s} {recipe.get(k, '')}" for k in LEVERS]
    return "\n".join(lines)


def render(ctx: dict[str, str], recipe: dict[str, str], model: str = "claude-sonnet-4-6") -> dict[str, str]:
    """Render one recipe into ``{subject, preheader, body, cta}`` via the Anthropic SDK.

    Requires ANTHROPIC_API_KEY. Raises on missing key or malformed response so callers can
    catch and report without crashing the whole run.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")

    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model=model,
        max_tokens=1024,
        system=_SYSTEM,
        messages=[{"role": "user", "content": _user_prompt(ctx, recipe)}],
    )
    text = "".join(block.text for block in msg.content if getattr(block, "type", None) == "text").strip()

    # Strip a leading/trailing code fence if the model added one.
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text[: -3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

    data = json.loads(text)
    return {
        "subject": data.get("subject", ""),
        "preheader": data.get("preheader", ""),
        "body": data.get("body", ""),
        "cta": data.get("cta", ""),
    }


if __name__ == "__main__":
    import random

    from levers import sample_context, sample_recipe

    rng = random.Random(0)
    ctx = sample_context(rng)
    recipe = sample_recipe(rng)
    print(preview(ctx, recipe))
