"""Milestone 4: the recovery check is the real proof of learning.

By default this trains a moderate budget and asserts the policy demonstrably learns
(meaningful fraction of oracle, recovers key interactions, beats the random holdout
significantly). Set ``RECOVERY_FULL=1`` for the strict, long run that targets ~90% of
oracle (closer to the build-prompt acceptance bar).

This test is intentionally heavier than the others; run just it with:
    pytest tests/test_recovery.py
"""

import os

import pytest

from app.config import load_config
from app.metrics.recovery import recovery_report
from app.run_simulation import SimulationEngine

FULL = os.environ.get("RECOVERY_FULL") == "1"
ITERS = int(os.environ.get("RECOVERY_ITERS", "400000" if FULL else "150000"))
# evaluated at the operational candidate count (best-of-K=30, matching deployment)
RATIO = float(os.environ.get("RECOVERY_RATIO", "0.85" if FULL else "0.70"))


@pytest.fixture(scope="module")
def trained():
    cfg = load_config()
    cfg.bandit.exploration = "squarecb"
    cfg.bandit.cb_type = "mtr"
    cfg.bandit.learning_rate = 0.5
    cfg.bandit.gamma_scale = 100.0
    eng = SimulationEngine(cfg)
    eng.run(ITERS)
    rep = recovery_report(eng, eng.tracker, n_contexts=400, pool=30, ratio_threshold=RATIO)
    yield rep
    eng.policy.finish()


def test_policy_reaches_oracle_threshold(trained):
    assert trained["ratio"] >= RATIO, (
        f"policy reached only {trained['ratio']*100:.1f}% of oracle "
        f"(policy={trained['policy_mean']:+.4f}, oracle={trained['oracle_mean']:+.4f})"
    )


def test_policy_beats_random_holdout_significantly(trained):
    lift = trained["lift"]
    assert lift is not None
    assert lift["lift"] > 0, f"no positive lift: {lift}"
    assert lift["significant"], f"lift not statistically significant: {lift}"


def test_recovers_key_interactions(trained):
    checks = trained["interactions"]
    # the headline truths must be recovered
    assert checks["personalization_one_to_one>generic"]
    assert checks["format_plain>html"]
    assert checks["email1_avoids_scarcity"]
    # at least 5 of 6 planted truths overall
    assert trained["interactions_passed"] >= 5, checks


def test_overall_recovery_passes(trained):
    assert trained["pass"], trained
