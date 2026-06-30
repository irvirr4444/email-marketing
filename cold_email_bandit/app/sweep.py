"""Config sweep: train several bandit configurations and compare recovery + lift.

Useful for showing how exploration algorithm, learning rate, gamma, candidate count, and
iteration budget move the policy toward the oracle. Run:

    python -m app.sweep --iterations 100000
"""

from __future__ import annotations

import argparse
import itertools
import json
from dataclasses import replace

from app.config import load_config
from app.metrics.recovery import recovery_report
from app.run_simulation import SimulationEngine

# (exploration, cb_type, learning_rate, gamma_scale)
DEFAULT_GRID = [
    ("squarecb", "mtr", 0.5, 100.0),
    ("squarecb", "mtr", 0.5, 30.0),
    ("squarecb", "mtr", 0.2, 100.0),
    ("epsilon", "mtr", 0.5, 0.0),
    ("epsilon", "dr", 0.5, 0.0),
]


def run_one(base_cfg, expl, cbt, lr, gamma, iterations):
    cfg = base_cfg.model_copy(deep=True)
    cfg.bandit.exploration = expl
    cfg.bandit.cb_type = cbt
    cfg.bandit.learning_rate = lr
    if gamma:
        cfg.bandit.gamma_scale = gamma
    eng = SimulationEngine(cfg)
    eng.run(iterations)
    rep = recovery_report(eng, eng.tracker, n_contexts=300, pool=30, ratio_threshold=0.85)
    eng.policy.finish()
    return {
        "exploration": expl, "cb_type": cbt, "lr": lr, "gamma_scale": gamma,
        "ratio": round(rep["ratio"], 4), "policy_mean": round(rep["policy_mean"], 4),
        "oracle_mean": round(rep["oracle_mean"], 4), "lever_match": round(rep["lever_match_rate"], 3),
        "lift": round(rep["lift"]["lift"], 4), "significant": rep["lift"]["significant"],
        "interactions": f"{rep['interactions_passed']}/{rep['interactions_total']}",
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Bandit config sweep")
    ap.add_argument("-n", "--iterations", type=int, default=100000)
    ap.add_argument("--config", default=None)
    ap.add_argument("--out", default="sweep_results.json")
    args = ap.parse_args(argv)

    base = load_config(args.config)
    results = []
    print(f"Sweeping {len(DEFAULT_GRID)} configs @ {args.iterations} iters each\n")
    header = f"{'exploration':10} {'cb':4} {'lr':>4} {'gamma':>6} {'ratio':>7} {'lift':>8} {'sig':>4} {'inter':>6}"
    print(header)
    print("-" * len(header))
    for expl, cbt, lr, gamma in DEFAULT_GRID:
        r = run_one(base, expl, cbt, lr, gamma, args.iterations)
        results.append(r)
        print(f"{r['exploration']:10} {r['cb_type']:4} {r['lr']:>4} {r['gamma_scale']:>6} "
              f"{r['ratio']*100:>6.1f}% {r['lift']:>+8.4f} {str(r['significant']):>4} {r['interactions']:>6}")

    results.sort(key=lambda x: x["ratio"], reverse=True)
    with open(args.out, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nbest: {results[0]['exploration']} lr={results[0]['lr']} "
          f"gamma={results[0]['gamma_scale']} -> {results[0]['ratio']*100:.1f}% of oracle")
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
