from datetime import timedelta
from sqlmodel import Session

from app import crud
from app.models import Leaderboard, LeaderboardCreate, Scores, ScoresCreate
from tests.utils.user import create_random_user
from tests.utils.utils import random_lower_string


def create_random_leaderboard(db: Session) -> Leaderboard:
    event_name = random_lower_string()
    leaderboard_in = LeaderboardCreate(event_name=event_name)
    return crud.create_leaderboard(session=db, leaderboard_in=leaderboard_in)

def create_random_score(
    db: Session, leaderboard: Leaderboard | None = None, user_id: str | None = None
) -> Scores:
    if not leaderboard:
        leaderboard = create_random_leaderboard(db)

    if not user_id:
        user = create_random_user(db)
        user_id = user.id

    score_in = ScoresCreate(
        event_id=leaderboard.event_id,
        user_id=user_id,
        duration=timedelta(minutes=30, seconds=45),
        challenge_score=85,
        cg_score=92,
        si_score=78,
        mr_score=88
    )

    return crud.create_score(session=db, score_in=score_in)