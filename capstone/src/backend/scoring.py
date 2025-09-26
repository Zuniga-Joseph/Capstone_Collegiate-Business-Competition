# backend/scoring.py
from dataclasses import dataclass

@dataclass(frozen=True)
class ScoreResult:
    correct: bool
    base_points: float
    time_bonus: float
    streak_bonus: float
    total: float

def score_round(*, chosen_id: str, correct_id: str,
                category_weight: float,
                time_ms: int,
                time_bonus_cap: float,
                time_bonus_per_sec: float,
                time_limit_ms: int,
                streak: int,
                streak_step: float = 0.5) -> ScoreResult:

    # ---- validation ----
    if not (0.0 <= category_weight <= 1.0):
        raise ValueError("category_weight must be in [0, 1].")
    if time_limit_ms <= 0:
        raise ValueError("time_limit_ms must be > 0.")
    if time_ms < 0:
        raise ValueError("time_ms cannot be negative.")
    if streak < 0:
        raise ValueError("streak cannot be negative.")
    if time_bonus_cap < 0 or time_bonus_per_sec < 0 or streak_step < 0:
        raise ValueError("bonus parameters must be non-negative.")

    # ---- scoring ----
    is_correct = (chosen_id == correct_id)
    base = 10.0 * category_weight if is_correct else 0.0

    if is_correct:
        seconds_remaining = max(0, time_limit_ms - time_ms) / 1000.0
        time_bonus = min(time_bonus_cap, seconds_remaining * time_bonus_per_sec)
        streak_bonus = streak * streak_step
    else:
        time_bonus = 0.0
        streak_bonus = 0.0

    total = round(base + time_bonus + streak_bonus, 6)
    return ScoreResult(is_correct, base, time_bonus, streak_bonus, total)
