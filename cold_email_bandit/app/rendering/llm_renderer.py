"""Anthropic-backed renderer. Used only for human inspection of the learned policy's
output — never in the learning loop, never as a learning signal.

Falls back loudly if the key/package is missing so the caller can disable rendering and
keep the loop running offline.
"""

from __future__ import annotations

import json
import os
from typing import Optional

from app.config import RenderingConfig
from app.planes.context import Context
from app.planes.features import Recipe
from app.rendering.renderer import Email, build_brief

_SYSTEM = (
    "You are an expert cold-email copywriter. You will be given a strict creative brief "
    "of structured levers. Write ONE cold email that obeys EVERY lever exactly. "
    "Return ONLY JSON with keys: subject, preheader, body. Use fictional company/product "
    "names. Cold outreach only; never offer discounts."
)


class AnthropicRenderer:
    def __init__(self, cfg: RenderingConfig, api_key: Optional[str] = None):
        try:
            import anthropic  # noqa: F401
        except ImportError as e:  # pragma: no cover
            raise RuntimeError("anthropic package not installed") from e
        key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")
        from anthropic import Anthropic

        self.cfg = cfg
        self.client = Anthropic(api_key=key)

    def render(self, recipe: Recipe, context: Context) -> Email:
        brief = build_brief(recipe, context)
        msg = self.client.messages.create(
            model=self.cfg.model,
            max_tokens=self.cfg.max_tokens,
            system=_SYSTEM,
            messages=[{"role": "user", "content": brief + "\n\nRespond with JSON only."}],
        )
        text = "".join(block.text for block in msg.content if getattr(block, "type", "") == "text")
        return _parse(text)


def _parse(text: str) -> Email:
    text = text.strip()
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1:
        try:
            data = json.loads(text[start : end + 1])
            return {
                "subject": str(data.get("subject", "")),
                "preheader": str(data.get("preheader", "")),
                "body": str(data.get("body", "")),
            }
        except json.JSONDecodeError:
            pass
    return {"subject": "", "preheader": "", "body": text}
