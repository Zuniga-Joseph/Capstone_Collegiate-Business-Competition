import uuid
from datetime import datetime
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Item,
    ItemCreate,
    User,
    UserCreate,
    UserUpdate,
    UserRole,
    LexiconSuggestion,
    LexiconCategory,
    LexiconDimension,
)


# ============================
# User CRUD
# ============================

def create_user(
    *,
    session: Session,
    user_create: UserCreate,
    role: UserRole | None = None,
) -> User:
    """
    Create a user with hashed password.
    If `role` is provided, it overrides user_create.role.
    Otherwise, UserBase/UserCreate default (CANDIDATE) is used.
    """
    update_data: dict[str, Any] = {
        "hashed_password": get_password_hash(user_create.password),
    }
    if role is not None:
        update_data["role"] = role

    db_obj = User.model_validate(
        user_create,
        update=update_data,
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def create_recruiter_user(
    *,
    session: Session,
    user_create: UserCreate,
) -> User:
    """
    Convenience helper: always create a recruiter.
    Useful for /register-recruiter endpoint.
    """
    return create_user(session=session, user_create=user_create, role=UserRole.RECRUITER)


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data: dict[str, Any] = {}

    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
        # Remove plain password from data; it's not a column on User
        user_data.pop("password", None)

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


# ============================================
# Lexicon Suggestion CRUD
# ============================================

def upsert_lexicon_suggestion(
    *,
    session: Session,
    word: str,
    category: LexiconCategory,
    dimension: LexiconDimension | None,
    tfidf_score: float,
    frequency: int = 1,
) -> LexiconSuggestion:

    statement = (
        select(LexiconSuggestion)
        .where(LexiconSuggestion.word == word)
        .where(LexiconSuggestion.category == category)
        .where(LexiconSuggestion.dimension == dimension)
    )

    existing = session.exec(statement).first()

    if existing:
        existing.tfidf_score = max(existing.tfidf_score or 0.0, tfidf_score)
        existing.frequency = (existing.frequency or 0) + frequency
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    suggestion = LexiconSuggestion(
        word=word,
        category=category,
        dimension=dimension,
        tfidf_score=tfidf_score,
        frequency=frequency,
        approved=False,
        rejected=False,
    )
    session.add(suggestion)
    session.commit()
    session.refresh(suggestion)
    return suggestion
