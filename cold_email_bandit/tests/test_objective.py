"""Plane 4 objective-function unit tests."""

from app.config import ObjectiveWeights
from app.planes.context import Intent
from app.planes.outcomes import Outcomes, cost, objective

W = ObjectiveWeights()


def test_empty_outcome_is_zero():
    assert objective(Outcomes(), Intent.GET_REPLY, W) == 0.0


def test_positive_reply_credited():
    o = Outcomes(delivered=True, opened=True, replied=True, reply_sentiment="positive")
    assert objective(o, Intent.GET_REPLY, W) == W.w_reply


def test_neutral_reply_not_credited_as_positive():
    o = Outcomes(delivered=True, opened=True, replied=True, reply_sentiment="neutral")
    assert objective(o, Intent.GET_REPLY, W) == 0.0


def test_meeting_only_counts_for_book_meeting_intent():
    o = Outcomes(delivered=True, opened=True, meeting_booked=True)
    assert objective(o, Intent.BOOK_MEETING, W) == W.w_meeting
    # same outcome under get_reply intent must NOT pay the meeting reward
    assert objective(o, Intent.GET_REPLY, W) == 0.0


def test_click_credited_small():
    o = Outcomes(delivered=True, opened=True, clicked=True)
    assert objective(o, Intent.GET_REPLY, W) == W.w_click


def test_complaint_penalty_is_heavy_and_dominates_a_reply():
    """A policy that farms a reply while generating a complaint must score negative."""
    o = Outcomes(
        delivered=True, opened=True, replied=True, reply_sentiment="positive",
        spam_complaint=True,
    )
    score = objective(o, Intent.GET_REPLY, W)
    assert score == W.w_reply - W.w_complaint
    assert score < 0  # complaint weight (6) >> reply weight (1)


def test_negative_reply_penalized():
    o = Outcomes(delivered=True, opened=True, replied=True, reply_sentiment="negative",
                 negative_reply=True)
    assert objective(o, Intent.GET_REPLY, W) == -W.w_negreply


def test_deliverability_decay_taxes_every_send():
    o = Outcomes(delivered=True, opened=True, clicked=True)
    base = objective(o, Intent.GET_REPLY, W, deliverability_decay=0.0)
    taxed = objective(o, Intent.GET_REPLY, W, deliverability_decay=0.5)
    assert taxed == base - W.w_deliv_decay * 0.5


def test_cost_is_negative_score():
    o = Outcomes(delivered=True, opened=True, meeting_booked=True)
    assert cost(o, Intent.BOOK_MEETING, W) == -objective(o, Intent.BOOK_MEETING, W)


def test_unsubscribe_penalized():
    o = Outcomes(delivered=True, opened=True, unsubscribe=True)
    assert objective(o, Intent.GET_REPLY, W) == -W.w_unsub
