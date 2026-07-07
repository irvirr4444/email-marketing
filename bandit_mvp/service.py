"""Thin HTTP layer over the bandit so the browser UI can drive the learning loop.

This is the ONLY web layer in the project. The core bandit files (levers.py, bandit.py,
reward.py) stay framework-free per the build spec; this module simply exposes them:

    context  ->  POST /pick   ->  chosen lever recipe + propensity + decisionId
    (browser renders via the TypeScript /api/generate-draft)
    feedback ->  POST /learn  ->  bandit.learn(reward), policy persisted

The propensity is logged live at /pick time (decisions.jsonl) which is what keeps
off-policy evaluation correct once real outcomes replace the thumbs up/down signal.

Run:  uvicorn service:app --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

import json
import threading
import uuid
from collections import Counter
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import db
import run
from bandit import Bandit
from levers import (
    CONTEXT,
    candidate_recipes,
    candidate_recipes_flagged,
    load_lever_weights,
    recipe_to_lever_suggestion,
    sample_context,
)
from run import CANDIDATES_PER_ROUND, _RECOVERY_LEVERS

HERE = Path(__file__).parent
POLICY_PATH = HERE / "policy.vw"
DECISIONS_PATH = HERE / "decisions.jsonl"

# Composite reward weights for real-style event feedback (mirrors reward.real_reward).
EVENT_WEIGHTS = {"opened": 1.0, "clicked": 3.0, "ordered": 12.0, "complained": -25.0}

_lock = threading.Lock()
_bandit = Bandit(seed=0, init_regressor=str(POLICY_PATH) if POLICY_PATH.exists() else None)
_weights = load_lever_weights()
# decisionId -> {ctx, recipes, chosen, propensity}
_decisions: dict[str, dict[str, Any]] = {}


def _load_decisions() -> None:
    if not DECISIONS_PATH.exists():
        return
    with DECISIONS_PATH.open() as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                _decisions[rec["decisionId"]] = rec
            except Exception:
                continue


_load_decisions()

app = FastAPI(title="Email Lever Bandit")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class PickRequest(BaseModel):
    context: dict[str, str] | None = None
    candidates: int | None = None


class LearnRequest(BaseModel):
    decisionId: str
    reward: float | None = None
    events: dict[str, bool] | None = None


class TrainRequest(BaseModel):
    rounds: int | None = None   # cap on logged rows pulled; 0/None = all
    epochs: int | None = None   # replays over the log
    seed: int | None = None
    trials: int | None = None   # policy-value evaluation trials


def _normalize_context(raw: dict[str, str] | None) -> dict[str, str]:
    """Keep only known context keys; fill missing ones with a sensible default."""
    if not raw:
        return sample_context()
    out: dict[str, str] = {}
    for key, allowed in CONTEXT.items():
        val = raw.get(key)
        out[key] = val if val in allowed else allowed[0]
    return out


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/pick")
def pick(req: PickRequest) -> dict[str, Any]:
    ctx = _normalize_context(req.context)
    k = req.candidates or CANDIDATES_PER_ROUND

    # Candidate generation runs under the lock too: coordinate ascent makes many predict
    # calls on the shared (non-thread-safe) VW workspace.
    with _lock:
        recipes, optimized = candidate_recipes_flagged(
            k, weights=_weights, bandit=_bandit, ctx=ctx
        )
        chosen, propensity, pmf = _bandit.pick(ctx, recipes)

    decision_id = uuid.uuid4().hex
    record = {
        "decisionId": decision_id,
        "ctx": ctx,
        "recipes": recipes,
        "chosen": chosen,
        "propensity": propensity,
        "optimized": optimized,
    }
    _decisions[decision_id] = record
    with DECISIONS_PATH.open("a") as f:
        f.write(json.dumps(record) + "\n")

    recipe = recipes[chosen]
    return {
        "decisionId": decision_id,
        "context": ctx,
        "recipe": recipe,
        "levers": recipe_to_lever_suggestion(recipe, ctx),
        "propensity": propensity,
        "candidateCount": k,
    }


@app.post("/learn")
def learn(req: LearnRequest) -> dict[str, Any]:
    record = _decisions.get(req.decisionId)
    if record is None:
        raise HTTPException(status_code=404, detail="unknown decisionId")

    if req.reward is not None:
        reward_value = float(req.reward)
    elif req.events is not None:
        reward_value = sum(EVENT_WEIGHTS.get(k, 0.0) for k, v in req.events.items() if v)
    else:
        raise HTTPException(status_code=400, detail="provide reward or events")

    with _lock:
        _bandit.learn(
            record["ctx"],
            record["recipes"],
            record["chosen"],
            record["propensity"],
            reward_value,
        )
        _bandit.save(POLICY_PATH)

    return {"ok": True, "reward": reward_value}


@app.post("/train")
def train(req: TrainRequest) -> dict[str, Any]:
    """Train the live policy on the logged sends in Postgres and evaluate it.

    Replaces the in-memory policy with the freshly trained one (so subsequent /pick uses
    it) and persists it to policy.vw. Returns the reward curve + policy-value summary.
    """
    global _bandit
    if not db.enabled():
        raise HTTPException(
            status_code=400,
            detail="DATABASE_URL not set. Add it to bandit_mvp/.env to train on logged data.",
        )
    try:
        with _lock:
            trained, stats = run.train_and_evaluate(
                rounds=req.rounds or 0,
                seed=req.seed or 0,
                epochs=req.epochs or run.LOG_EPOCHS,
                trials=req.trials or 3000,
            )
            trained.save(POLICY_PATH)
            _bandit = trained
    except Exception as exc:  # surface DB / training errors to the UI as JSON
        raise HTTPException(status_code=500, detail=f"training failed: {exc}")

    return {"ok": True, **stats}


@app.get("/recovery")
def recovery(trials: int = 2000) -> dict[str, Any]:
    counters: dict[str, Counter] = {lever: Counter() for lever in _RECOVERY_LEVERS}
    with _lock:
        for _ in range(trials):
            ctx = sample_context()
            recipes = candidate_recipes(CANDIDATES_PER_ROUND)
            best = _bandit.greedy_best(ctx, recipes)
            winner = recipes[best]
            for lever in _RECOVERY_LEVERS:
                counters[lever][winner[lever]] += 1

    return {
        "trials": trials,
        "top": {lever: counters[lever].most_common(3) for lever in _RECOVERY_LEVERS},
        "expectation": {
            "framework": "aida",
            "sp_specificity": "specific",
            "specificity": "hard_numbers",
            "persuasion": "avoids scarcity",
        },
    }
