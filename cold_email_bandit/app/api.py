"""FastAPI app: live metrics endpoints + the single-page Chart.js dashboard.

Training runs in a background thread so the page can poll while the bandit learns. Start
with: ``uvicorn app.api:app --reload`` (or ``python -m app.api``).
"""

from __future__ import annotations

import random
import threading
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse

from app.bandit.candidate_sampler import CandidateSampler
from app.config import load_config
from app.metrics import recovery as recovery_mod
from app.planes.context import Industry, RoleSeniority, SequencePosition
from app.planes.features import DIMENSION_NAMES
from app.run_simulation import SimulationEngine, build_engine

app = FastAPI(title="Cold Email Bandit")

_DIR = Path(__file__).resolve().parent
_state: dict = {"engine": None, "thread": None, "running": False, "target": 0, "oracle_ceiling": None}


def _oracle_ceiling(engine: SimulationEngine, k: int, m: int = 300) -> float:
    cfg, gt = engine.cfg, engine.gt
    from app.environment.prospects import ProspectStream

    stream = ProspectStream(random.Random(123))
    samp = CandidateSampler(random.Random(124))
    s = 0.0
    for _ in range(m):
        c = stream.next().context
        cands = samp.sample(c, k)
        s += max(gt.expected_score(r, c, cfg.objective, cfg.deliverability) for r in cands)
    return s / m


def _train_loop(engine: SimulationEngine, n: int) -> None:
    _state["running"] = True
    for _ in range(n):
        engine.step()
    _state["running"] = False


def start_training(n: int | None = None, config_path: str | None = None) -> None:
    cfg = load_config(config_path)
    n = n or cfg.simulation.n_iterations
    engine = build_engine(cfg)
    _state["engine"] = engine
    _state["target"] = n
    _state["oracle_ceiling"] = _oracle_ceiling(engine, cfg.simulation.candidates_per_decision)
    t = threading.Thread(target=_train_loop, args=(engine, n), daemon=True)
    _state["thread"] = t
    t.start()


@app.on_event("startup")
def _startup() -> None:
    if _state["engine"] is None:
        start_training()


def _engine() -> SimulationEngine:
    eng = _state["engine"]
    if eng is None:
        start_training()
        eng = _state["engine"]
    return eng


@app.get("/api/status")
def status() -> JSONResponse:
    eng = _engine()
    return JSONResponse({
        "t": eng.t, "target": _state["target"], "running": _state["running"],
        "oracle_ceiling": _state["oracle_ceiling"],
    })


@app.get("/metrics/curve")
def curve() -> JSONResponse:
    eng = _engine()
    return JSONResponse({"curve": eng.tracker.curve, "oracle_ceiling": _state["oracle_ceiling"]})


@app.get("/metrics/funnel")
def funnel() -> JSONResponse:
    return JSONResponse(_engine().tracker.funnel_rates())


@app.get("/metrics/exploration")
def exploration() -> JSONResponse:
    eng = _engine()
    lift = eng.tracker.lift()
    return JSONResponse({
        "epsilon": eng.policy.current_epsilon(),
        "exploration": eng.cfg.bandit.exploration,
        "domain_decay": eng.tracker.last_decay,
        "regret_proxy": (_state["oracle_ceiling"] or 0.0) - eng.tracker.bandit.rolling_mean,
        "lift": lift,
    })


@app.get("/metrics/levers")
def levers(industry: str = "SaaS", role: str = "vp", seq: str = "email_2") -> JSONResponse:
    """Policy's recommended lever per dimension for a context slice (+ a few slices)."""
    eng = _engine()
    samp = CandidateSampler(random.Random(7))

    def recommend(context, pool: int = 200) -> dict:
        cands = samp.sample(context, pool)
        idx = eng.policy.best(context, cands)
        return cands[idx].as_dict()

    try:
        c = recovery_mod.ctx(
            industry=Industry(industry), role_seniority=RoleSeniority(role),
            sequence_position=SequencePosition(seq),
        )
    except ValueError:
        c = recovery_mod.ctx()
    primary = recommend(c)

    slices = {
        "SaaS x vp x email_1": recovery_mod.ctx(
            industry=Industry.SAAS, role_seniority=RoleSeniority.VP,
            sequence_position=SequencePosition.EMAIL_1),
        "SaaS x vp x email_2": recovery_mod.ctx(
            industry=Industry.SAAS, role_seniority=RoleSeniority.VP,
            sequence_position=SequencePosition.EMAIL_2),
        "finance x c_level x email_1": recovery_mod.ctx(
            industry=Industry.FINANCE, role_seniority=RoleSeniority.C_LEVEL,
            sequence_position=SequencePosition.EMAIL_1),
    }
    return JSONResponse({
        "dimensions": list(DIMENSION_NAMES),
        "primary": primary,
        "slices": {name: recommend(cc) for name, cc in slices.items()},
    })


@app.get("/metrics/recovery")
def recovery() -> JSONResponse:
    eng = _engine()
    rep = recovery_mod.recovery_report(eng, eng.tracker, n_contexts=150, pool=30)
    return JSONResponse(rep)


@app.get("/", response_class=HTMLResponse)
def index() -> HTMLResponse:
    html = (_DIR / "dashboard" / "index.html").read_text(encoding="utf-8")
    return HTMLResponse(html)


def main() -> None:
    import uvicorn

    uvicorn.run("app.api:app", host="127.0.0.1", port=8000, reload=False)


if __name__ == "__main__":
    main()
