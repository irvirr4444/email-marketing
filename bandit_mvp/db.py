"""Postgres connector seam. Reads the logged sends the bandit trains on.

Nothing here runs unless ``DATABASE_URL`` is set AND ``psycopg`` is installed. When the DB
is unreachable every function degrades to a safe default (``None`` / uniform sampling) so
the synthetic ``planted`` / ``random`` modes keep working with no database at all.

The join model (matches the sigil-marketing schema):

    generated_email        the lever recipe (framework, emotion, cta_type, ...)
      -> generated_email_send   design -> message link
        -> email_message        one row per send
          -> email_context      the context at send (segment / industry / seniority)
          -> email_metrics      the outcome (opened / clicked / ordered / complained)

Three consumers:
  - ``levers.load_lever_weights`` -> ``lever_value_frequencies`` (bias candidate sampling
    toward the real email distribution instead of uniform noise).
  - ``run.train_from_logs``       -> ``fetch_training_data`` (the (context, recipe,
    outcome, propensity) tuples the bandit learns from).
  - ``reward.real_reward``        -> ``fetch_outcome`` (composite reward for one recipe).
"""

from __future__ import annotations

import os
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

_DISABLED_LOGGED = False


def _load_dotenv_files() -> None:
    """Minimal .env loader (no dependency). Loads the repo-root .env first, then
    bandit_mvp/.env so the closer file wins. Values from .env OVERRIDE the shell so the
    file is the single source of truth for this project (a stale exported DATABASE_URL in
    the shell will not silently shadow the .env).
    """
    here = Path(__file__).resolve().parent
    for candidate in (here.parent / ".env", here / ".env"):
        if not candidate.exists():
            continue
        for line in candidate.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            os.environ[key.strip()] = val.strip().strip('"').strip("'")


_load_dotenv_files()


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL") or None


def enabled() -> bool:
    return _database_url() is not None


def _connect():
    """Return a live connection, or None if the DB is not configured/available."""
    global _DISABLED_LOGGED
    url = _database_url()
    if not url:
        return None
    try:
        import psycopg  # local import so the dependency stays optional
    except Exception:
        if not _DISABLED_LOGGED:
            print("[db] psycopg not installed; DB features disabled")
            _DISABLED_LOGGED = True
        return None
    try:
        return psycopg.connect(url)
    except Exception as exc:  # pragma: no cover - depends on live DB
        if not _DISABLED_LOGGED:
            print(f"[db] could not connect ({exc}); DB features disabled")
            _DISABLED_LOGGED = True
        return None


# ---------------------------------------------------------------------------
# Column -> taxonomy mapping. The ONLY place the DB schema meets levers.py.
# Keys on the right are the lever/context feature names used by VW (levers.py).
# ---------------------------------------------------------------------------
def _yn(v: Any) -> str:
    return "yes" if v else "no"


def _norm(v: Any, default: str = "none") -> str:
    if v is None:
        return default
    return str(v).lower()


def _row_to_context(row: dict[str, Any]) -> dict[str, str]:
    """email_context (+ the design's intent) -> the bandit context dict."""
    return {
        "segment": _norm(row.get("segment"), "cold_prospect"),
        "intent": _norm(row.get("intent"), "get_reply"),
        "industry": _norm(row.get("industry"), "other"),
        "seniority": _norm(row.get("seniority"), "ic"),
    }


def _row_to_recipe(row: dict[str, Any]) -> dict[str, str]:
    """generated_email columns -> the lever recipe dict (levers.py feature names).

    Only the levers actually stored on ``generated_email`` are emitted. VW handles a
    variable feature set per action line, so missing levers simply do not contribute.
    """
    recipe = {
        "framework": _norm(row.get("framework")),
        "emotion": _norm(row.get("emotion")),
        "persuasion": _norm(row.get("persuasion")),
        "specificity": _norm(row.get("specificity"), "vague"),
        "personalization": _norm(row.get("personalization_depth"), "generic"),
        "sl_type": _norm(row.get("subject_type"), "statement"),
        "sl_length": _norm(row.get("subject_length"), "medium"),
        "sl_casing": _norm(row.get("subject_casing"), "sentence"),
        "ph_present": _yn(row.get("preheader_present")),
        "ph_length": _norm(row.get("preheader_length"), "short"),
        "ph_relationship": _norm(row.get("preheader_relationship"), "complements"),
        "body_length": _norm(row.get("body_length"), "medium"),
        "body_links": _norm(row.get("body_links"), "one"),
        "body_scannable": _yn(row.get("body_scannable")),
        "sp_type": _norm(row.get("social_proof_type")),
        "sp_placement": _norm(row.get("social_proof_placement"), "body"),
        "sp_specificity": _norm(row.get("social_proof_specificity"), "vague"),
        "cta_type": _norm(row.get("cta_type"), "reply"),
        "cta_style": _norm(row.get("cta_style"), "link"),
        "cta_placement": _norm(row.get("cta_placement"), "end"),
        "offer_has": _yn(row.get("has_offer")),
        "offer_type": _norm(row.get("offer_type")),
    }
    return recipe


# The lever columns pulled from generated_email (drives both the recipe mapping and the
# candidate-sampling frequency prior). Names here match the keys _row_to_recipe reads.
_DESIGN_COLUMNS = (
    "framework, emotion, persuasion, specificity, personalization_depth, "
    "subject_type, subject_length, subject_casing, "
    "preheader_present, preheader_length, preheader_relationship, "
    "body_length, body_links, body_scannable, "
    "social_proof_type, social_proof_placement, social_proof_specificity, "
    "cta_type, cta_style, cta_placement, has_offer, offer_type, intent"
)

# Same columns, qualified with the generated_email alias ``g`` for the join query.
_DESIGN_COLUMNS_G = ", ".join(f"g.{c.strip()}" for c in _DESIGN_COLUMNS.split(","))

# One logged send = context (email_context) + recipe (generated_email) + outcome (email_metrics).
# email_context.extras.bandit_propensity is used when the send was chosen by the live
# bandit; synthetic backfill has none, so it comes back NULL -> warm-start propensity.
_TRAINING_SQL = f"""
select
    ctx.segment_at_send                       as segment,
    ctx.industry                              as industry,
    ctx.seniority                             as seniority,
    {_DESIGN_COLUMNS_G},
    coalesce(m.delivered, false)              as delivered,
    coalesce(m.opened, false)                 as opened,
    coalesce(m.clicked, false)                as clicked,
    coalesce(m.replied, false)                as replied,
    (m.goal_completed or coalesce(m.revenue, 0) > 0) as ordered,
    coalesce(m.spam_complaint, false)         as complained,
    coalesce(m.unsubscribed, false)           as unsubscribed,
    (ctx.extras->>'bandit_propensity')::float as propensity
from email_metrics m
join email_context ctx        on ctx.message_id = m.message_id
join generated_email_send s   on s.message_id = m.message_id
join generated_email g        on g.id = s.generated_email_id
where coalesce(m.metrics_known, false) = true
"""


def fetch_training_data(limit: int | None = None) -> list[dict[str, Any]] | None:
    """Every logged send as a training row, or None when the DB is empty/unavailable.

    Each row is ``{"ctx", "recipe", "outcome", "propensity"}`` where ``outcome`` holds the
    boolean events (``opened``/``clicked``/``ordered``/``complained``/...). The composite
    reward lives in ``reward.reward_from_outcome`` (the swap point), not here.
    """
    conn = _connect()
    if conn is None:
        return None
    sql = _TRAINING_SQL + ("" if limit is None else f" limit {int(limit)}")
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            cols = [d.name for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        conn.close()

    if not rows:
        return None

    out: list[dict[str, Any]] = []
    for row in rows:
        # g.intent came through as "intent"; expose it to the context builder.
        row["intent"] = row.get("intent")
        out.append(
            {
                "ctx": _row_to_context(row),
                "recipe": _row_to_recipe(row),
                "outcome": {
                    "delivered": bool(row["delivered"]),
                    "opened": bool(row["opened"]),
                    "clicked": bool(row["clicked"]),
                    "replied": bool(row["replied"]),
                    "ordered": bool(row["ordered"]),
                    "complained": bool(row["complained"]),
                    "unsubscribed": bool(row["unsubscribed"]),
                },
                "propensity": row.get("propensity"),
            }
        )
    return out


def lever_value_frequencies() -> dict[str, dict[str, float]] | None:
    """Observed per-value frequency of each lever across the labelled designs.

    Wired into ``levers.load_lever_weights`` so ``sample_recipe`` draws candidates from the
    real email distribution instead of uniform noise. Returns None when the design table is
    empty / unreachable -> uniform sampling.
    """
    conn = _connect()
    if conn is None:
        return None
    try:
        with conn.cursor() as cur:
            cur.execute(f"select {_DESIGN_COLUMNS} from generated_email")
            cols = [d.name for d in cur.description]
            designs = [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        conn.close()

    if not designs:
        return None

    counters: dict[str, Counter] = defaultdict(Counter)
    for d in designs:
        for lever, value in _row_to_recipe(d).items():
            counters[lever][value] += 1

    freqs: dict[str, dict[str, float]] = {}
    for lever, counter in counters.items():
        total = sum(counter.values())
        if total:
            freqs[lever] = {v: c / total for v, c in counter.items()}
    return freqs


def fetch_outcome(ctx: dict[str, str], recipe: dict[str, str]) -> dict[str, Any] | None:
    """Aggregate outcome for one (context, recipe), or None if never logged.

    Used by ``reward.real_reward`` for the single-lookup online path. Matches on the
    high-signal levers plus context; returns the mean event rates over matching sends so a
    composite reward can be computed. Returns None when there is no matching logged send.
    """
    conn = _connect()
    if conn is None:
        return None
    sql = _TRAINING_SQL + """
      and lower(coalesce(g.framework, 'none')) = %(framework)s
      and lower(coalesce(g.persuasion, 'none')) = %(persuasion)s
      and lower(g.specificity) = %(specificity)s
      and lower(g.cta_type) = %(cta_type)s
      and lower(coalesce(g.social_proof_type, 'none')) = %(sp_type)s
      and ctx.segment_at_send = %(segment)s
    """
    params = {
        "framework": recipe.get("framework", "none"),
        "persuasion": recipe.get("persuasion", "none"),
        "specificity": recipe.get("specificity", "vague"),
        "cta_type": recipe.get("cta_type", "reply"),
        "sp_type": recipe.get("sp_type", "none"),
        "segment": ctx.get("segment", "cold_prospect"),
    }
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            cols = [d.name for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        conn.close()

    if not rows:
        return None
    n = len(rows)
    return {
        "n": n,
        "opened": sum(bool(r["opened"]) for r in rows) / n,
        "clicked": sum(bool(r["clicked"]) for r in rows) / n,
        "ordered": sum(bool(r["ordered"]) for r in rows) / n,
        "complained": sum(bool(r["complained"]) for r in rows) / n,
    }


if __name__ == "__main__":
    print("DATABASE_URL set:", enabled())
    rows = fetch_training_data(limit=3)
    print("sample training rows:", rows)
    freqs = lever_value_frequencies()
    if freqs:
        print("framework frequencies:", freqs.get("framework"))
