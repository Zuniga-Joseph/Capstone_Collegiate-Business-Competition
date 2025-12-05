import uuid
from datetime import datetime

from sqlmodel import Session

from app import crud
from app.models import GameSession, GameSessionCreate, GameSessionStatus


def create_random_game_session(
    db: Session,
    event_id: uuid.UUID | None = None,
    join_code: str | None = None,
    status: GameSessionStatus = GameSessionStatus.waiting,
) -> GameSession:
    """Create a random game session for testing."""
    if join_code is None:
        join_code = f"TEST{uuid.uuid4().hex[:6].upper()}"

    session_in = GameSessionCreate(
        event_id=event_id,
        join_code=join_code,
        status=status,
    )

    game_session = GameSession.model_validate(session_in)
    db.add(game_session)
    db.commit()
    db.refresh(game_session)
    return game_session
