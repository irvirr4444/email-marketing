"""Store repository + renderer + encoding tests (fast)."""

import random

from app.bandit.candidate_sampler import random_recipe
from app.bandit.encoding import build_examples
from app.config import load_config
from app.metrics.store import MemoryStore, SQLiteStore
from app.planes.context import (
    CompanySize, Context, Department, GeoTimezone, Industry, Intent,
    PriorOutcome, RoleSeniority, SequencePosition,
)
from app.rendering.mock_renderer import MockRenderer


def _ctx():
    return Context(
        industry=Industry.SAAS, company_size=CompanySize.MID, role_seniority=RoleSeniority.VP,
        department=Department.SALES, geo_timezone=GeoTimezone.US_EASTERN,
        sequence_position=SequencePosition.EMAIL_2, prior_outcome=PriorOutcome.OPENED_NO_REPLY,
        intent=Intent.BOOK_MEETING,
    )


def test_encoding_shape_and_label():
    rng = random.Random(0)
    ctx = _ctx()
    cands = [random_recipe(rng) for _ in range(4)]
    lines = build_examples(ctx, cands)
    assert lines[0].startswith("shared |Context ")
    assert all(l.startswith("|Action ") or ":" in l for l in lines[1:])
    # labelled version puts the inline cost label on the chosen line only
    labelled = build_examples(ctx, cands, chosen_idx=2, cost=-0.5, probability=0.3)
    assert labelled[3].startswith("2:-0.5:0.3 |Action ")
    assert labelled[1].startswith("|Action ")


def test_memory_store_roundtrip():
    s = MemoryStore()
    s.log_decision({"t": 1, "is_holdout": False, "score": 0.5, "context": {"industry": "SaaS"}})
    s.log_decision({"t": 2, "is_holdout": True, "score": -0.1, "context": {"industry": "finance"}})
    assert s.count() == 2
    assert len(s.fetch(is_holdout=True)) == 1


def test_sqlite_store_roundtrip(tmp_path):
    db = tmp_path / "t.db"
    s = SQLiteStore(db, batch_size=1)
    s.log_decision({
        "t": 1, "is_holdout": False, "score": 0.5, "propensity": 0.2, "placement": "primary",
        "context": {"industry": "SaaS", "intent": "get_reply", "role_seniority": "vp",
                    "sequence_position": "email_1"},
        "recipe": {"format": "plain"}, "outcomes": {"opened": True},
    })
    s.flush()
    assert s.count() == 1
    rows = s.fetch()
    assert rows[0]["context"]["industry"] == "SaaS"
    assert rows[0]["recipe"]["format"] == "plain"
    s.close()


def test_mock_renderer_obeys_levers():
    r = MockRenderer()
    rng = random.Random(3)
    for _ in range(40):
        recipe = random_recipe(rng)
        email = r.render(recipe, _ctx())
        assert email["subject"] and email["body"]
        if recipe.subject_emoji:
            assert "\u2728" in email["subject"]
        # one_to_one / segment / merge use a first-name token
        if recipe.personalization_depth.value in ("one_to_one_researched", "segment_tailored", "merge_field"):
            assert "{{first_name}}" in email["body"] or "{{first_name}}" in email["subject"]


def test_epsilon_decay_shrinks_over_time():
    from app.config import BanditConfig
    from app.bandit.vw_policy import VWPolicy
    from app.bandit.candidate_sampler import CandidateSampler
    cfg = BanditConfig(exploration="epsilon", epsilon=0.2, epsilon_decay=True, epsilon_decay_floor=0.02)
    pol = VWPolicy(cfg, seed=0)
    start = pol.current_epsilon()
    samp = CandidateSampler(random.Random(0))
    cands = samp.sample(_ctx(), 8)
    for _ in range(20000):
        idx, prob = pol.predict(_ctx(), cands)
        assert 0.0 < prob <= 1.0
    end = pol.current_epsilon()
    assert end < start and end >= cfg.epsilon_decay_floor
    pol.finish()


def test_propensity_is_valid_probability():
    from app.config import BanditConfig
    from app.bandit.vw_policy import VWPolicy
    from app.bandit.candidate_sampler import CandidateSampler
    pol = VWPolicy(BanditConfig(exploration="squarecb"), seed=1)
    samp = CandidateSampler(random.Random(1))
    cands = samp.sample(_ctx(), 12)
    idx, prob = pol.predict(_ctx(), cands)
    assert 0 <= idx < len(cands)
    assert 0.0 < prob <= 1.0
    pol.finish()


def test_mock_renderer_html_format():
    r = MockRenderer()
    rng = random.Random(1)
    recipe = random_recipe(rng)
    from dataclasses import replace
    from app.planes.features import Format
    html = r.render(replace(recipe, format=Format.LIGHT_HTML), _ctx())
    assert "<p>" in html["body"]
