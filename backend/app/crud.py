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

from app.models import (
    QuestionSet,
    QuestionSetCreate,
    Question,
    QuestionCreate,
    QuestionOption,
    QuestionOptionCreate,
    BulkQuestionsCreate,
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


# ============================================
# Question Set CRUD (owned by recruiter)
# ============================================

def create_question_set(
    *,
    session: Session,
    qs_in: QuestionSetCreate,
    owner_id: uuid.UUID,
) -> QuestionSet:
    db_qs = QuestionSet.model_validate(
        qs_in, update={"owner_id": owner_id}
    )
    session.add(db_qs)
    session.commit()
    session.refresh(db_qs)
    return db_qs


def list_question_sets_for_owner(
    *, session: Session, owner_id: uuid.UUID
):
    stmt = select(QuestionSet).where(QuestionSet.owner_id == owner_id)
    return session.exec(stmt).all()


def get_question_set_for_owner(
    *, session: Session, qs_id: uuid.UUID, owner_id: uuid.UUID
) -> QuestionSet | None:
    qs = session.get(QuestionSet, qs_id)
    if not qs or qs.owner_id != owner_id:
        return None
    return qs


def delete_question_set_for_owner(
    *, session: Session, qs_id: uuid.UUID, owner_id: uuid.UUID
):
    qs = get_question_set_for_owner(
        session=session, qs_id=qs_id, owner_id=owner_id
    )
    if qs:
        session.delete(qs)
        session.commit()


# ============================================
# Question CRUD
# ============================================

def _validate_question_payload(q: QuestionCreate):
    # Enforce your frontend rules: 4 options, exactly 1 correct
    if len(q.options) != 4:
        raise ValueError("Each question must have exactly 4 options.")

    correct_count = sum(1 for opt in q.options if opt.is_correct)
    if correct_count != 1:
        raise ValueError("Each question must have exactly one correct option.")


def create_question(
    *,
    session: Session,
    question_in: QuestionCreate,
    owner_id: uuid.UUID,
) -> Question:

    # Ensure question set belongs to this recruiter
    qs = get_question_set_for_owner(
        session=session,
        qs_id=question_in.question_set_id,
        owner_id=owner_id,
    )
    if qs is None:
        raise ValueError("Question set not found or does not belong to recruiter.")

    _validate_question_payload(question_in)

    db_question = Question.model_validate(
        question_in,
        update={"question_set_id": qs.id},
    )
    session.add(db_question)
    session.flush()  # now db_question.id is populated

    # Create answer options
    for opt in question_in.options:
        opt_obj = QuestionOption(
            question_id=db_question.id,
            text=opt.text,
            is_correct=opt.is_correct,
        )
        session.add(opt_obj)

    session.commit()
    session.refresh(db_question)
    return db_question


def create_questions_bulk(
    *,
    session: Session,
    bulk_in: BulkQuestionsCreate,
    owner_id: uuid.UUID,
):
    # Validate the set belongs to recruiter
    qs = get_question_set_for_owner(
        session=session,
        qs_id=bulk_in.question_set_id,
        owner_id=owner_id,
    )
    if qs is None:
        raise ValueError("Question set not found or does not belong to recruiter.")

    created = []

    for q in bulk_in.questions:
        q.question_set_id = qs.id  # overwrite client-provided ID for safety
        _validate_question_payload(q)

        db_question = Question.model_validate(q)
        session.add(db_question)
        session.flush()

        for opt in q.options:
            opt_obj = QuestionOption(
                question_id=db_question.id,
                text=opt.text,
                is_correct=opt.is_correct,
            )
            session.add(opt_obj)

        created.append(db_question)

    session.commit()

    for q in created:
        session.refresh(q)

    return created
