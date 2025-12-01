import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import Item, ItemCreate, User, UserCreate, UserUpdate


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

# ============================================
# Lexicon Suggestion CRUD
# ============================================

from datetime import datetime
from app.models import LexiconSuggestion, LexiconCategory, LexiconDimension
from sqlmodel import Session, select

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
