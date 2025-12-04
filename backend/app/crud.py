import uuid
from datetime import datetime
from typing import Any

from sqlmodel import Session, select, func

from app.core.security import get_password_hash, verify_password
from app.models import (
    Event,
    EventCreate,
    EventParticipant,
    EventUpdate,
    Item,
    ItemCreate,
    User,
    UserCreate,
    UserUpdate,
)


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


# Event CRUD operations
def create_event(*, session: Session, event_in: EventCreate) -> Event:
    event_data = event_in.model_dump(exclude={"participant_ids"})
    db_event = Event.model_validate(event_data)
    session.add(db_event)
    session.commit()
    session.refresh(db_event)

    # Add participants if provided
    if event_in.participant_ids:
        for user_id in event_in.participant_ids:
            participant = EventParticipant(event_id=db_event.id, user_id=user_id)
            session.add(participant)
        session.commit()
        session.refresh(db_event)

    return db_event


def get_event(*, session: Session, event_id: uuid.UUID) -> Event | None:
    return session.get(Event, event_id)


def get_events(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Event], int]:
    count_statement = select(func.count()).select_from(Event)
    count = session.exec(count_statement).one()

    statement = select(Event).offset(skip).limit(limit)
    events = session.exec(statement).all()
    return list(events), count


def update_event(
    *, session: Session, db_event: Event, event_in: EventUpdate
) -> Event:
    event_data = event_in.model_dump(exclude_unset=True)
    event_data["updated_at"] = datetime.utcnow()
    db_event.sqlmodel_update(event_data)
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event


def delete_event(*, session: Session, event_id: uuid.UUID) -> None:
    event = session.get(Event, event_id)
    if event:
        session.delete(event)
        session.commit()


def add_event_participants(
    *, session: Session, event_id: uuid.UUID, user_ids: list[uuid.UUID]
) -> Event:
    event = session.get(Event, event_id)
    if not event:
        raise ValueError("Event not found")

    for user_id in user_ids:
        # Check if participation already exists
        existing = session.exec(
            select(EventParticipant).where(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == user_id,
            )
        ).first()
        if not existing:
            participant = EventParticipant(event_id=event_id, user_id=user_id)
            session.add(participant)

    session.commit()
    session.refresh(event)
    return event


def remove_event_participants(
    *, session: Session, event_id: uuid.UUID, user_ids: list[uuid.UUID]
) -> Event:
    event = session.get(Event, event_id)
    if not event:
        raise ValueError("Event not found")

    for user_id in user_ids:
        participant = session.exec(
            select(EventParticipant).where(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == user_id,
            )
        ).first()
        if participant:
            session.delete(participant)

    session.commit()
    session.refresh(event)
    return event


def get_event_participants(
    *, session: Session, event_id: uuid.UUID
) -> list[User]:
    statement = (
        select(User)
        .join(EventParticipant, EventParticipant.user_id == User.id)
        .where(EventParticipant.event_id == event_id)
    )
    participants = session.exec(statement).all()
    return list(participants)


def get_event_analytics(*, session: Session, event_id: uuid.UUID) -> dict[str, Any]:
    event = session.get(Event, event_id)
    if not event:
        raise ValueError("Event not found")

    participants = get_event_participants(session=session, event_id=event_id)
    total_participants = len(participants)

    # Group participants by university
    participants_by_school: dict[str, int] = {}
    for participant in participants:
        university = participant.university or "Unknown"
        participants_by_school[university] = participants_by_school.get(university, 0) + 1

    return {
        "event_id": event_id,
        "total_participants": total_participants,
        "participants_by_school": participants_by_school,
        "registration_status": event.status,
    }
