from datetime import timedelta
from sqlmodel import Session

from app import crud
from app.models import LeaderboardCreate, LeaderboardUpdate, ScoresCreate, ScoresUpdate
from tests.utils.leaderboard import create_random_leaderboard, create_random_score
from tests.utils.user import create_random_user
from tests.utils.utils import random_lower_string


def create_test_leaderboard(db: Session) -> None:
    event_name = random_lower_string()
    leaderboard_in = LeaderboardCreate(event_name=event_name)
    leaderboard = crud.create_leaderboard(session=db, leaderboard_in=leaderboard_in)

    assert leaderboard.event_name == event_name
    assert leaderboard.event_id is not None
    assert leaderboard.created_at is not None

def test_get_leaderboard(db: Session) -> None:
    leaderboard = create_random_leaderboard(db)
    stored_leaderboard = crud.get_leaderboard(session=db, event_id=leaderboard.event_id)

    assert stored_leaderboard
    assert stored_leaderboard.event_id == leaderboard.event_id
    assert stored_leaderboard.event_name == leaderboard.event_name

def test_update_leaderboard(db: Session) -> None:
    leaderboard = create_random_leaderboard(db)
    new_event_name = random_lower_string()
    leaderboard_update = LeaderboardUpdate(event_name=new_event_name)

    updated_leaderboard = crud.update_leaderboard(
        session=db, db_leaderboard=leaderboard, leaderboard_in=leaderboard_update
    )

    assert updated_leaderboard.event_id == leaderboard.event_id
    assert updated_leaderboard.event_name == new_event_name

def test_delete_leaderboard(db: Session) -> None:
    leaderboard = create_random_leaderboard(db)
    result = crud.delete_leaderboard(session=db, event_id=leaderboard.event_id)

    assert result is True
    deleted_leaderboard = crud.get_leaderboard(session=db, event_id=leaderboard.event_id)
    assert deleted_leaderboard is None

def test_create_score(db: Session) -> None:
    leaderboard = create_random_leaderboard(db)
    user = create_random_user(db)

    score_in = ScoresCreate(
        event_id=leaderboard.event_id,
        user_id=user.id,
        duration=timedelta(minutes=25, seconds=30),
        challenge_score=90,
        cg_score=85,
        si_score=80,
        mr_score=95
    )

    score = crud.create_score(session=db, score_in=score_in)

    assert score.event_id == leaderboard.event_id
    assert score.user_id == user.id
    assert score.duration == timedelta(minutes=25, seconds=30)
    assert score.challenge_score == 90
    assert score.cg_score == 85
    assert score.si_score == 80
    assert score.mr_score == 95
    assert score.id is not None
    assert score.created_at is not None

def test_get_score(db: Session) -> None:
    score = create_random_score(db)
    stored_score = crud.get_score(session=db, score_id=score.id)

    assert stored_score
    assert stored_score.id == score.id
    assert stored_score.event_id == score.event_id
    assert stored_score.user_id == score.user_id

def test_get_scores_by_leaderboard(db: Session) -> None:
    leaderboard = create_random_leaderboard(db)
    score_1 = create_random_score(db, leaderboard=leaderboard)
    score_2 = create_random_score(db, leaderboard=leaderboard)

    scores = crud.get_scores_by_leaderboard(session=db, event_id=leaderboard.event_id)

    assert len(scores) >= 2
    score_ids = [score.id for score in scores]
    assert score_1.id in score_ids
    assert score_2.id in score_ids

def test_get_scores_by_user(db: Session) -> None:
    user = create_random_user(db)
    score_1 = create_random_score(db, user_id=user.id)
    score_2 = create_random_score(db, user_id=user.id)

    scores = crud.get_scores_by_user(session=db, user_id=user.id)

    assert len(scores) >= 2
    score_ids = [score.id for score in scores]
    assert score_1.id in score_ids
    assert score_2.id in score_ids

def test_update_score(db: Session) -> None:
    score = create_random_score(db)
    score_update = ScoresUpdate(
        duration=timedelta(minutes=20, seconds=15),
        challenge_score=95,
        cg_score=90
    )

    updated_score = crud.update_score(session=db, db_score=score, score_in=score_update)

    assert updated_score.id == score.id
    assert updated_score.duration == timedelta(minutes=20, seconds=15)
    assert updated_score.challenge_score == 95
    assert updated_score.cg_score == 90
    assert updated_score.si_score == score.si_score
    assert updated_score.mr_score == score.mr_score

def test_delete_score(db: Session) -> None:
    score = create_random_score(db)
    result = crud.delete_score(session=db, score_id=score.id)

    assert result is True
    deleted_score = crud.get_score(session=db, score_id=score.id)
    assert deleted_score is None
