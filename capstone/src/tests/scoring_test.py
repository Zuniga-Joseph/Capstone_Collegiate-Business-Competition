import pytest
from backend.scoring import score_round, ScoreResult

DEFAULT_ARGS = dict(
    time_limit_ms=60_000,
    time_bonus_cap=5.0,
    time_bonus_per_sec=0.25,
    streak_step=0.5
)

def test_correct_answer_earns_base_points():
    r = score_round(chosen_id="A", correct_id="A",
                    category_weight=0.8, time_ms=30_000, streak=0, **DEFAULT_ARGS)
    assert r.correct is True
    assert r.base_points == pytest.approx(8.0)   # 10 * 0.8
    assert r.total >= r.base_points

def test_incorrect_answer_earns_zero_everything():
    r = score_round(chosen_id="B", correct_id="A",
                    category_weight=1.0, time_ms=10_000, streak=3, **DEFAULT_ARGS)
    assert r.correct is False
    assert r.base_points == 0
    assert r.time_bonus == 0
    assert r.streak_bonus == 0
    assert r.total == 0

@pytest.mark.parametrize("weight", [0.0, 0.3, 0.75, 1.0])
def test_points_scale_with_category_weight(weight):
    r = score_round(chosen_id="A", correct_id="A",
                    category_weight=weight, time_ms=40_000, streak=0, **DEFAULT_ARGS)
    assert r.base_points == pytest.approx(10 * weight)

def test_time_bonus_calculates_and_caps():
    # 10 seconds remaining -> 10 * 0.25 = 2.5, below cap 5.0
    r = score_round(chosen_id="A", correct_id="A",
                    category_weight=1.0, time_ms=50_000, streak=0, **DEFAULT_ARGS)
    assert r.time_bonus == pytest.approx(2.5)

    # 40 seconds remaining -> 10.0 but capped at 5.0
    r2 = score_round(chosen_id="A", correct_id="A",
                     category_weight=1.0, time_ms=20_000, streak=0, **DEFAULT_ARGS)
    assert r2.time_bonus == pytest.approx(5.0)

def test_streak_bonus_increases_linearly_and_resets_on_wrong():
    r1 = score_round(chosen_id="A", correct_id="A",
                     category_weight=1.0, time_ms=40_000, streak=0, **DEFAULT_ARGS)
    r2 = score_round(chosen_id="A", correct_id="A",
                     category_weight=1.0, time_ms=40_000, streak=3, **DEFAULT_ARGS)
    assert r1.streak_bonus == pytest.approx(0.0)
    assert r2.streak_bonus == pytest.approx(3 * DEFAULT_ARGS["streak_step"])

    wrong = score_round(chosen_id="B", correct_id="A",
                        category_weight=1.0, time_ms=40_000, streak=3, **DEFAULT_ARGS)
    assert wrong.streak_bonus == 0.0  # reset on wrong

def test_total_is_rounded_and_deterministic():
    a = score_round(chosen_id="A", correct_id="A",
                    category_weight=0.333333333, time_ms=41_337, streak=2, **DEFAULT_ARGS)
    b = score_round(chosen_id="A", correct_id="A",
                    category_weight=0.333333333, time_ms=41_337, streak=2, **DEFAULT_ARGS)
    assert a.total == b.total
    # sanity on rounding
    assert str(a.total) == str(b.total)

def test_handles_edge_times_without_crashing():
    early = score_round(chosen_id="A", correct_id="A",
                        category_weight=1.0, time_ms=0, streak=0, **DEFAULT_ARGS)
    late = score_round(chosen_id="A", correct_id="A",
                       category_weight=1.0, time_ms=10**9, streak=0, **DEFAULT_ARGS)
    assert early.total >= early.base_points
    assert late.time_bonus == 0

def test_invalid_inputs_raise():
    with pytest.raises(ValueError, match="category_weight"):
        score_round(chosen_id="A", correct_id="A",
                    category_weight=-0.1, time_ms=1000, streak=0,
                    time_limit_ms=60_000, time_bonus_cap=5.0,
                    time_bonus_per_sec=0.25, streak_step=0.5)
