import uuid
from datetime import datetime, timedelta

from sqlmodel import Session

from app import crud
from app.models import EventCreate, EventType, EventStatus


def create_random_event(db: Session, participant_ids: list[uuid.UUID] | None = None) -> any:
    """Create a random event for testing."""
    name = f"Test Event {uuid.uuid4()}"
    description = "A test event for unit testing"
    start_date = datetime.utcnow() + timedelta(days=7)
    end_date = start_date + timedelta(days=2)
    registration_deadline = start_date - timedelta(days=1)

    event_in = EventCreate(
        name=name,
        description=description,
        event_type=EventType.virtual,
        location=None,
        start_date=start_date,
        end_date=end_date,
        registration_deadline=registration_deadline,
        status=EventStatus.draft,
        participant_ids=participant_ids or [],
    )
    return crud.create_event(session=db, event_in=event_in)
