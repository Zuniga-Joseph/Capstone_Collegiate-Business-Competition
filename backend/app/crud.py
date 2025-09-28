import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import Item, ItemCreate, User, UserCreate, UserUpdate

from app.models import LeaderboardCreate, Leaderboard, LeaderboardUpdate, ScoresCreate, Scores, ScoresUpdate


# =========================================================================== #
# USER CRUD
# =========================================================================== #


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


# =========================================================================== #
# LEADERBOARD CRUD
# =========================================================================== #


def create_leaderboard(*, session: Session, leaderboard_in: LeaderboardCreate) -> Leaderboard:
    db_leaderboard = Leaderboard.model_validate(leaderboard_in)
    session.add(db_leaderboard)
    session.commit()
    session.refresh(db_leaderboard)
    return db_leaderboard

def get_leaderboard(*, session: Session, event_id: uuid.UUID) -> Leaderboard | None:
    return session.get(Leaderboard, event_id)

def get_leaderboards(*, session: Session, skip: int = 0, limit: int = 100) -> list[Leaderboard]:
    statement = select(Leaderboard).offset(skip).limit(limit)
    return session.exec(statement).all()

def update_leaderboard(
    *, session: Session, db_leaderboard: Leaderboard, leaderboard_in: LeaderboardUpdate
) -> Leaderboard:
    update_data = leaderboard_in.model_dump(exclude_unset=True)
    db_leaderboard.sqlmodel_update(update_data)
    session.add(db_leaderboard)
    session.commit()
    session.refresh(db_leaderboard)
    return db_leaderboard

def delete_leaderboard(*, session: Session, event_id: uuid.UUID) -> bool:
    leaderboard = session.get(Leaderboard, event_id)
    if leaderboard:
        session.delete(leaderboard)
        session.commit()
        return True
    return False


# =========================================================================== #
# SCORES CRUD
# =========================================================================== #


def create_score(*, session: Session, score_in: ScoresCreate) -> Scores:
    db_score = Scores.model_validate(score_in)
    session.add(db_score)
    session.commit()
    session.refresh(db_score)
    return db_score

def get_score(*, session: Session, score_id: uuid.UUID) -> Scores | None:
    return session.get(Scores, score_id)

def get_scores(*, session: Session, skip: int = 0, limit: int = 100) -> list[Scores]:
    statement = select(Scores).offset(skip).limit(limit)
    return session.exec(statement).all()

def get_scores_by_leaderboard(
    *, session: Session, event_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Scores]:
    statement = select(Scores).where(Scores.event_id == event_id).offset(skip).limit(limit)
    return session.exec(statement).all()

def get_scores_by_user(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Scores]:
    statement = select(Scores).where(Scores.user_id == user_id).offset(skip).limit(limit)
    return session.exec(statement).all()

def update_score(
    *, session: Session, db_score: Scores, score_in: ScoresUpdate
) -> Scores:
    update_data = score_in.model_dump(exclude_unset=True)
    db_score.sqlmodel_update(update_data)
    session.add(db_score)
    session.commit()
    session.refresh(db_score)
    return db_score

def delete_score(*, session: Session, score_id: uuid.UUID) -> bool:
    score = session.get(Scores, score_id)
    if score:
        session.delete(score)
        session.commit()
        return True
    return False