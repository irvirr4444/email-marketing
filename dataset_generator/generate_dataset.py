#!/usr/bin/env python3
"""Generate synthetic email marketing dataset (JSONL + CSV)."""

from __future__ import annotations

import argparse
import asyncio
import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import ai_copy
import config
import sampling

_DIR = Path(__file__).resolve().parent

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F300-\U0001F9FF"
    "\U00002600-\U000026FF"
    "\U00002700-\U000027BF"
    "]",
    flags=re.UNICODE,
)
PERSONALIZATION_PATTERN = re.compile(
    r"\{\{(?:first_name|company_name)\}\}|\{(?:first_name|company_name)\}",
    re.IGNORECASE,
)
CTA_PATTERN = re.compile(r"\[CTA_\d+:", re.IGNORECASE)


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def _first_sentence(text: str) -> str:
    text = text.strip()
    for sep in (".", "!", "?", "\n"):
        if sep in text:
            return text.split(sep)[0].strip().lower()
    return text[:80].lower()


def _ngrams(text: str, n: int = 3) -> set[str]:
    words = re.findall(r"\b\w+\b", text.lower())
    if len(words) < n:
        return set(words)
    return {" ".join(words[i : i + n]) for i in range(len(words) - n + 1)}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def validate_copy_alignment(
    analysis: dict[str, Any], copy: dict[str, str]
) -> list[str]:
    issues: list[str] = []
    subject = copy.get("subject", "")
    preheader = copy.get("preheader", "")
    body = copy.get("body", "")

    if analysis.get("has_personalization"):
        combined = f"{subject} {preheader} {body}"
        if not PERSONALIZATION_PATTERN.search(combined):
            issues.append("has_personalization=true but no {{first_name}}/{{company_name}} in copy")

    cta_expected = analysis.get("cta_count", 1)
    cta_found = len(CTA_PATTERN.findall(body))
    if cta_found != cta_expected:
        issues.append(f"cta_count={cta_expected} but found {cta_found} [CTA_n: markers")

    if analysis.get("has_emoji"):
        if not EMOJI_PATTERN.search(f"{subject} {preheader}"):
            issues.append("has_emoji=true but no emoji in subject/preheader")

    if analysis.get("has_urgency"):
        urgency_words = (
            "deadline", "limited", "expires", "last chance", "hurry", "ends", "today",
            "hours left", "running out", "closes soon", "won't last", "won’t last",
            "almost up", "final", "only ", "before friday", "before monday", "act now",
            "time's almost", "time is almost", "don't miss", "don’t miss", "ends soon",
        )
        combined_lower = f"{subject} {preheader} {body}".lower()
        if not any(w in combined_lower for w in urgency_words):
            issues.append("has_urgency=true but no urgency language detected")

    bl = analysis.get("body_length", "medium")
    wc = _word_count(body)
    lo, hi = config.BODY_WORD_LIMITS.get(bl, (75, 199))
    if wc < lo * 0.6 or wc > hi * 1.4:
        issues.append(f"body_length={bl} expected ~{lo}-{hi} words, got {wc}")

    return issues


def check_diversity(rows: list[dict[str, Any]]) -> tuple[bool, list[str]]:
    """Return (passed, issues) for copy diversity across preview rows."""
    issues: list[str] = []
    bodies = [r.get("copy", {}).get("body", "") for r in rows if r.get("copy")]
    if len(bodies) < 2:
        return True, []

    openings = [_first_sentence(b) for b in bodies]
    opening_counts = Counter(openings)
    dominant, count = opening_counts.most_common(1)[0]
    if count / len(openings) > config.DIVERSITY_DOMINANT_OPENING_FRACTION:
        issues.append(
            f"{count}/{len(openings)} emails share opening pattern: {dominant[:60]}..."
        )

    similarities: list[float] = []
    for i in range(len(bodies)):
        for j in range(i + 1, len(bodies)):
            sim = _jaccard(_ngrams(bodies[i]), _ngrams(bodies[j]))
            similarities.append(sim)

    if similarities:
        similarities.sort()
        median = similarities[len(similarities) // 2]
        if median > config.DIVERSITY_MEDIAN_SIMILARITY_THRESHOLD:
            issues.append(f"Median body 3-gram Jaccard similarity {median:.2f} too high")

    opening_sims: list[float] = []
    for i in range(len(openings)):
        for j in range(i + 1, len(openings)):
            opening_sims.append(_jaccard(set(openings[i].split()), set(openings[j].split())))
    if opening_sims:
        opening_sims.sort()
        if opening_sims[-1] > config.DIVERSITY_OPENING_SIMILARITY_THRESHOLD:
            issues.append("Some opening sentences are nearly identical")

    return len(issues) == 0, issues


def assemble_row(
    structured: dict[str, Any],
    copy_result: dict[str, Any],
) -> dict[str, Any]:
    return {
        "context": structured["context"],
        "analysis": structured["analysis"],
        "metrics": structured["metrics"],
        "copy": copy_result["copy"],
        "decision_rationale": copy_result["decision_rationale"],
    }


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def flatten_row(row: dict[str, Any]) -> dict[str, str]:
    flat: dict[str, str] = {}
    for section in ("context", "analysis", "metrics", "copy"):
        for k, v in row.get(section, {}).items():
            key = f"{section}.{k}"
            if isinstance(v, list):
                flat[key] = "|".join(str(x) for x in v)
            elif v is None:
                flat[key] = ""
            elif isinstance(v, bool):
                flat[key] = str(v).lower()
            else:
                flat[key] = str(v)
    flat["decision_rationale"] = row.get("decision_rationale", "")
    return flat


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    flat_rows = [flatten_row(r) for r in rows]
    fieldnames = list(flat_rows[0].keys())
    for fr in flat_rows[1:]:
        for k in fr:
            if k not in fieldnames:
                fieldnames.append(k)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(flat_rows)


def print_preview_summary(rows: list[dict[str, Any]]) -> None:
    print("\n--- Preview rows ---")
    for i, row in enumerate(rows):
        copy = row.get("copy", {})
        body = copy.get("body", "")
        snippet = body[:120].replace("\n", " ") + ("..." if len(body) > 120 else "")
        print(
            f"\n[{i}] {row['context']['segment_at_send']} | "
            f"{row['analysis']['campaign_type']} | {row['analysis']['intent']}"
        )
        print(f"  Subject: {copy.get('subject', '')}")
        print(f"  Body: {snippet}")
        align = validate_copy_alignment(row["analysis"], copy)
        if align:
            print(f"  Alignment issues: {align}")


async def _retry_misaligned(
    structured_rows: list[dict[str, Any]],
    assembled: list[dict[str, Any] | None],
    indices: list[int],
    prompt_variant: int,
    concurrency: int,
    language_only: str | None = None,
) -> None:
    for attempt in range(2):
        retry_indices = []
        for i in indices:
            if assembled[i] is None:
                continue
            issues = validate_copy_alignment(
                structured_rows[i]["analysis"], assembled[i]["copy"]  # type: ignore[index]
            )
            if issues:
                retry_indices.append(i)
        if not retry_indices:
            return
        print(f"Retrying {len(retry_indices)} rows with alignment issues (attempt {attempt + 1})...")
        results = await ai_copy.generate_copy_for_indices(
            structured_rows,
            retry_indices,
            prompt_variant=prompt_variant,
            concurrency=concurrency,
            language_only=language_only,
        )
        for idx, result in results.items():
            assembled[idx] = assemble_row(structured_rows[idx], result)


async def run_generation(args: argparse.Namespace) -> int:
    import random

    rng = random.Random(args.seed)
    n = args.n if not args.preview_only else min(args.n, config.PREVIEW_COUNT)
    preview_count = min(config.PREVIEW_COUNT, n)
    language_only = args.language

    combos = sampling.allocate_combos(n, rng)
    tiers = sampling.allocate_tiers(n, rng)

    structured_rows: list[dict[str, Any]] = []
    for i in range(n):
        row = sampling.sample_row(
            i, combos[i], tiers[i], rng, language_only=language_only
        )
        sampling.assert_funnel_invariants(row["metrics"])
        structured_rows.append(row)

    if language_only:
        print(f"Sampled {n} structured rows (language={language_only} only).")
    else:
        print(f"Sampled {n} structured rows (context/analysis/metrics).")

    prompt_variant = 0
    preview_structured = structured_rows[:preview_count]

    for revision in range(config.MAX_PROMPT_REVISIONS + 1):
        print(f"Generating preview copy ({preview_count} rows, prompt_variant={prompt_variant})...")
        preview_copy = await ai_copy.generate_copy_batch(
            preview_structured,
            prompt_variant=prompt_variant,
            concurrency=args.concurrency,
            language_only=language_only,
        )
        preview_assembled = [
            assemble_row(s, c) for s, c in zip(preview_structured, preview_copy)
        ]

        print_preview_summary(preview_assembled)

        align_issues = []
        for row in preview_assembled:
            align_issues.extend(validate_copy_alignment(row["analysis"], row["copy"]))

        diversity_ok, diversity_issues = check_diversity(preview_assembled)

        print("\n--- Self-check ---")
        if align_issues:
            print(f"Tag alignment issues ({len(align_issues)}): {align_issues[:5]}")
        else:
            print("Tag alignment: OK")
        if diversity_ok:
            print("Copy diversity: OK")
        else:
            print(f"Copy diversity issues: {diversity_issues}")

        preview_path = Path(args.preview_out)
        write_jsonl(preview_path, preview_assembled)
        print(f"Wrote {preview_path}")

        if diversity_ok and not align_issues:
            break
        if revision < config.MAX_PROMPT_REVISIONS:
            prompt_variant += 1
            print(f"Revising prompts (variant {prompt_variant}) and regenerating preview...")
        else:
            print("Max prompt revisions reached; continuing with current variant.")

    if args.preview_only:
        print("Preview-only mode; done.")
        return 0

    assembled: list[dict[str, Any] | None] = [None] * n
    for i in range(preview_count):
        assembled[i] = preview_assembled[i]

    remaining = list(range(preview_count, n))
    if remaining:
        print(f"Generating copy for remaining {len(remaining)} rows...")
        batch_size = 50
        for start in range(0, len(remaining), batch_size):
            batch_indices = remaining[start : start + batch_size]
            results = await ai_copy.generate_copy_for_indices(
                structured_rows,
                batch_indices,
                prompt_variant=prompt_variant,
                concurrency=args.concurrency,
                language_only=language_only,
            )
            for idx, result in results.items():
                assembled[idx] = assemble_row(structured_rows[idx], result)
            print(f"  Completed {min(start + batch_size, len(remaining))}/{len(remaining)}")

    all_indices = list(range(n))
    await _retry_misaligned(
        structured_rows,
        assembled,
        all_indices,
        prompt_variant,
        args.concurrency,
        language_only=language_only,
    )

    final_rows: list[dict[str, Any]] = []
    for i, row in enumerate(assembled):
        if row is None:
            raise RuntimeError(f"Missing assembled row at index {i}")
        final_rows.append(row)

    out_path = Path(args.out)
    csv_path = Path(args.csv)

    if args.append and out_path.exists():
        existing = [json.loads(line) for line in out_path.read_text(encoding="utf-8").splitlines() if line.strip()]
        print(f"Appending {len(final_rows)} rows to {len(existing)} existing rows.")
        final_rows = existing + final_rows

    write_jsonl(out_path, final_rows)
    write_csv(csv_path, final_rows)
    print(f"\nWrote {len(final_rows)} rows to {out_path} and {csv_path}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate synthetic email marketing dataset")
    parser.add_argument("--n", type=int, default=300, help="Number of examples (default: 300)")
    parser.add_argument(
        "--out",
        type=str,
        default=str(_DIR / "synthetic_emails.jsonl"),
        help="Output JSONL path",
    )
    parser.add_argument(
        "--csv",
        type=str,
        default=str(_DIR / "synthetic_emails.csv"),
        help="Output CSV path",
    )
    parser.add_argument(
        "--preview-out",
        type=str,
        default=str(_DIR / "preview.jsonl"),
        help="Preview JSONL path",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for sampling")
    parser.add_argument(
        "--concurrency",
        type=int,
        default=config.DEFAULT_CONCURRENCY,
        help="Max concurrent OpenAI requests",
    )
    parser.add_argument(
        "--preview-only",
        action="store_true",
        help="Generate only preview rows and run self-check",
    )
    parser.add_argument(
        "--language",
        type=str,
        default=None,
        help="Restrict to a single language code (e.g. en)",
    )
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append new rows to existing output file instead of overwriting",
    )
    args = parser.parse_args()
    return asyncio.run(run_generation(args))


if __name__ == "__main__":
    sys.exit(main())
