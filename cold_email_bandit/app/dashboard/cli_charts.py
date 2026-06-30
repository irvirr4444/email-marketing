"""Headless PNG charts via matplotlib for browser-less servers."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

from app.metrics.tracker import Tracker  # noqa: E402


def write_charts(tracker: Tracker, outdir: str | Path = "charts", oracle_ceiling: Optional[float] = None) -> list[str]:
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    paths: list[str] = []

    # 1) learning curve
    if tracker.curve:
        ts = [c["t"] for c in tracker.curve]
        b = [c["bandit_rolling"] for c in tracker.curve]
        h = [c["holdout_rolling"] for c in tracker.curve]
        fig, ax = plt.subplots(figsize=(9, 5))
        ax.plot(ts, b, label="bandit (rolling)", color="#2563eb", lw=2)
        ax.plot(ts, h, label="holdout / random (rolling)", color="#9ca3af", lw=2)
        if oracle_ceiling is not None:
            ax.axhline(oracle_ceiling, ls="--", color="#16a34a", label=f"oracle ceiling ({oracle_ceiling:+.3f})")
        ax.axhline(0, color="#000", lw=0.6, alpha=0.3)
        ax.set_xlabel("iteration")
        ax.set_ylabel("mean score")
        ax.set_title("Learning curve: bandit vs random holdout")
        ax.legend()
        fig.tight_layout()
        p = out / "learning_curve.png"
        fig.savefig(p, dpi=110)
        plt.close(fig)
        paths.append(str(p))

    # 2) funnel
    rates = tracker.funnel_rates()
    order = ["delivered", "primary", "opened", "clicked", "replied", "positive", "meeting"]
    vals = [rates.get(k, 0.0) * 100 for k in order]
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.bar(order, vals, color="#2563eb")
    ax.set_ylabel("% of sends")
    ax.set_title("Bandit funnel")
    for i, v in enumerate(vals):
        ax.text(i, v, f"{v:.1f}%", ha="center", va="bottom", fontsize=8)
    fig.tight_layout()
    p = out / "funnel.png"
    fig.savefig(p, dpi=110)
    plt.close(fig)
    paths.append(str(p))

    return paths
