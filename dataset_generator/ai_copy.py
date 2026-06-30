"""Async OpenAI copy and rationale generation."""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import AsyncOpenAI

import config

_REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_REPO_ROOT / ".env")


def _build_messages(
    context: dict[str, Any],
    analysis: dict[str, Any],
    variation_seed: int,
    prompt_variant: int,
    *,
    language_only: str | None = None,
) -> list[dict[str, str]]:
    directive = ""
    if prompt_variant < len(config.VARIATION_DIRECTIVES):
        directive = config.VARIATION_DIRECTIVES[prompt_variant]

    language_rule = ""
    language_note = ""
    if language_only == "en":
        language_rule = "\n- Write subject, preheader, body, and decision_rationale in English only."
        language_note = "\nWrite all copy in English."

    user_content = config.USER_PROMPT_TEMPLATE.format(
        variation_seed=variation_seed,
        variation_directive=directive,
        context_json=json.dumps(context, indent=2),
        analysis_json=json.dumps(analysis, indent=2),
    ) + language_note

    system = config.SYSTEM_PROMPT.format(language_rule=language_rule)
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]


async def _generate_one(
    client: AsyncOpenAI,
    semaphore: asyncio.Semaphore,
    row: dict[str, Any],
    index: int,
    prompt_variant: int,
    language_only: str | None = None,
) -> dict[str, Any]:
    context = row["context"]
    analysis = row["analysis"]
    messages = _build_messages(
        context, analysis, index, prompt_variant, language_only=language_only
    )

    async with semaphore:
        last_error: Exception | None = None
        for attempt in range(config.MAX_RETRIES + 1):
            try:
                response = await client.chat.completions.create(
                    model=config.OPENAI_MODEL,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=0.9,
                )
                raw = response.choices[0].message.content or "{}"
                parsed = json.loads(raw)
                for key in ("subject", "preheader", "body", "decision_rationale"):
                    if key not in parsed:
                        raise ValueError(f"Missing key in response: {key}")
                return {
                    "copy": {
                        "subject": parsed["subject"],
                        "preheader": parsed["preheader"],
                        "body": parsed["body"],
                    },
                    "decision_rationale": parsed["decision_rationale"],
                }
            except Exception as exc:
                last_error = exc
                if attempt < config.MAX_RETRIES:
                    await asyncio.sleep(2**attempt)
        raise RuntimeError(f"Copy generation failed for row {index}") from last_error


async def generate_copy_batch(
    rows: list[dict[str, Any]],
    *,
    prompt_variant: int = 0,
    concurrency: int = config.DEFAULT_CONCURRENCY,
    language_only: str | None = None,
) -> list[dict[str, Any]]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set in environment")

    client = AsyncOpenAI(api_key=api_key)
    semaphore = asyncio.Semaphore(concurrency)

    tasks = [
        _generate_one(
            client,
            semaphore,
            row,
            row.get("_index", i),
            prompt_variant,
            language_only,
        )
        for i, row in enumerate(rows)
    ]
    return list(await asyncio.gather(*tasks))


async def generate_copy_for_indices(
    all_rows: list[dict[str, Any]],
    indices: list[int],
    *,
    prompt_variant: int = 0,
    concurrency: int = config.DEFAULT_CONCURRENCY,
    language_only: str | None = None,
) -> dict[int, dict[str, Any]]:
    subset = [all_rows[i] for i in indices]
    results = await generate_copy_batch(
        subset,
        prompt_variant=prompt_variant,
        concurrency=concurrency,
        language_only=language_only,
    )
    return {indices[i]: results[i] for i in range(len(indices))}
