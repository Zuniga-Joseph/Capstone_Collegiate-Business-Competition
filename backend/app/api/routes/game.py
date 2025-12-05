import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    GameLeaderboardEntry,
    GameParticipant,
    GameSession,
    GameSessionCreate,
    GameSessionLeaderboard,
    GameSessionPublic,
    GameSessionsPublic,
    GameSessionStatus,
    GameSessionUpdate,
    Message,
    User,
)

router = APIRouter(prefix="/game", tags=["game"])


@router.post("/sessions", response_model=GameSessionPublic)
def create_game_session(
    *, session: SessionDep, session_in: GameSessionCreate
) -> Any:
    """
    Create a new game session.
    Used by game server when a new game starts.
    """
    db_session = GameSession.model_validate(session_in)
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session


@router.get("/sessions", response_model=GameSessionsPublic)
def list_game_sessions(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    event_id: uuid.UUID | None = None,
) -> Any:
    """
    List game sessions, optionally filtered by event.
    """
    count_statement = select(func.count()).select_from(GameSession)
    statement = select(GameSession).offset(skip).limit(limit)

    if event_id:
        count_statement = count_statement.where(GameSession.event_id == event_id)
        statement = statement.where(GameSession.event_id == event_id)

    count = session.exec(count_statement).one()
    sessions = session.exec(statement).all()

    return GameSessionsPublic(data=list(sessions), count=count)


@router.get("/sessions/{session_id}", response_model=GameSessionPublic)
def get_game_session(
    session: SessionDep, current_user: CurrentUser, session_id: uuid.UUID
) -> Any:
    """
    Get a specific game session.
    """
    db_session = session.get(GameSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Game session not found")
    return db_session


@router.put("/sessions/{session_id}", response_model=GameSessionPublic)
def update_game_session(
    *,
    session: SessionDep,
    session_id: uuid.UUID,
    session_in: GameSessionUpdate,
) -> Any:
    """
    Update a game session (e.g., mark as completed).
    Used by game server when game state changes.
    """
    db_session = session.get(GameSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Game session not found")

    update_data = session_in.model_dump(exclude_unset=True)
    db_session.sqlmodel_update(update_data)
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session


@router.post("/sessions/{session_id}/participants/{user_id}")
def add_participant(
    session: SessionDep, session_id: uuid.UUID, user_id: uuid.UUID
) -> Message:
    """
    Add a participant to a game session.
    Used when a player joins a game.
    """
    # Verify session exists
    db_session = session.get(GameSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Game session not found")

    # Verify user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already participating
    existing = session.exec(
        select(GameParticipant).where(
            GameParticipant.session_id == session_id,
            GameParticipant.user_id == user_id,
        )
    ).first()

    if existing:
        return Message(message="Participant already in session")

    # Add participant
    participant = GameParticipant(session_id=session_id, user_id=user_id)
    session.add(participant)
    session.commit()

    return Message(message="Participant added successfully")


@router.post("/sessions/{session_id}/scores")
def update_scores(
    session: SessionDep, session_id: uuid.UUID, scores: dict[str, int]
) -> Message:
    """
    Update scores for all participants in a session.
    Used by game server when game ends.

    Request body: { "user_id": score, "user_id2": score2, ... }
    """
    # Verify session exists
    db_session = session.get(GameSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Game session not found")

    # Sort by score to calculate ranks
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    # Update each participant's score and rank
    for rank, (user_id_str, score) in enumerate(sorted_scores, 1):
        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            continue

        participant = session.exec(
            select(GameParticipant).where(
                GameParticipant.session_id == session_id,
                GameParticipant.user_id == user_id,
            )
        ).first()

        if participant:
            participant.score = score
            participant.rank = rank
            session.add(participant)

    session.commit()
    return Message(message=f"Updated scores for {len(scores)} participants")


@router.get("/sessions/{session_id}/leaderboard", response_model=GameSessionLeaderboard)
def get_session_leaderboard(
    session: SessionDep, current_user: CurrentUser, session_id: uuid.UUID
) -> Any:
    """
    Get the leaderboard for a specific game session.
    """
    db_session = session.get(GameSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Game session not found")

    # Get participants with user info, ordered by rank
    statement = (
        select(GameParticipant, User)
        .join(User, GameParticipant.user_id == User.id)
        .where(GameParticipant.session_id == session_id)
        .order_by(GameParticipant.rank)
    )

    results = session.exec(statement).all()

    entries = [
        GameLeaderboardEntry(
            user_id=participant.user_id,
            full_name=user.full_name,
            university=user.university,
            score=participant.score or 0,
            rank=participant.rank or 0,
        )
        for participant, user in results
    ]

    return GameSessionLeaderboard(
        session_id=session_id, event_id=db_session.event_id, entries=entries
    )


@router.get("/leaderboard/global", response_model=list[GameLeaderboardEntry])
def get_global_leaderboard(
    session: SessionDep, current_user: CurrentUser, limit: int = 100
) -> Any:
    """
    Get global leaderboard across all game sessions.
    """
    # Get all participants with their user info
    statement = (
        select(GameParticipant, User)
        .join(User, GameParticipant.user_id == User.id)
    )

    results = session.exec(statement).all()

    # Aggregate scores by user
    user_scores: dict[uuid.UUID, dict] = {}
    for participant, user in results:
        if participant.user_id not in user_scores:
            user_scores[participant.user_id] = {
                "user_id": participant.user_id,
                "full_name": user.full_name,
                "university": user.university,
                "total_score": 0,
                "best_rank": float('inf')
            }

        user_scores[participant.user_id]["total_score"] += participant.score or 0
        if participant.rank:
            user_scores[participant.user_id]["best_rank"] = min(
                user_scores[participant.user_id]["best_rank"],
                participant.rank
            )

    # Sort by total score and apply limit
    sorted_users = sorted(
        user_scores.values(),
        key=lambda x: x["total_score"],
        reverse=True
    )[:limit]

    return [
        GameLeaderboardEntry(
            user_id=user_data["user_id"],
            full_name=user_data["full_name"],
            university=user_data["university"],
            score=user_data["total_score"],
            rank=user_data["best_rank"] if user_data["best_rank"] != float('inf') else 0,
        )
        for user_data in sorted_users
    ]
