import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.crud import (
    add_event_participants,
    create_event,
    delete_event,
    get_event,
    get_event_analytics,
    get_event_participants,
    get_events,
    remove_event_participants,
    update_event,
)
from app.models import (
    Event,
    EventAnalytics,
    EventCreate,
    EventParticipantAdd,
    EventParticipantRemove,
    EventPublic,
    EventsPublic,
    EventUpdate,
    EventWithParticipants,
    Message,
    UserPublic,
)

router = APIRouter(prefix="/events", tags=["events"])

SuperUserDep = Annotated[CurrentUser, Depends(get_current_active_superuser)]


@router.get("/", response_model=EventsPublic)
def read_events(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve events. All users can view events.
    """
    events, count = get_events(session=session, skip=skip, limit=limit)
    return EventsPublic(data=events, count=count)


@router.get("/{event_id}", response_model=EventPublic)
def read_event(
    session: SessionDep, current_user: CurrentUser, event_id: uuid.UUID
) -> Any:
    """
    Get event by ID. All users can view event details.
    """
    event = get_event(session=session, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/{event_id}/participants", response_model=list[UserPublic])
def read_event_participants(
    session: SessionDep, current_user: CurrentUser, event_id: uuid.UUID
) -> Any:
    """
    Get participants for an event. All users can view participants.
    """
    event = get_event(session=session, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    participants = get_event_participants(session=session, event_id=event_id)
    return participants


@router.get("/{event_id}/analytics", response_model=EventAnalytics)
def read_event_analytics(
    session: SessionDep, current_user: SuperUserDep, event_id: uuid.UUID
) -> Any:
    """
    Get analytics for an event. Admin only.
    """
    try:
        analytics = get_event_analytics(session=session, event_id=event_id)
        return analytics
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/", response_model=EventPublic)
def create_new_event(
    *, session: SessionDep, current_user: SuperUserDep, event_in: EventCreate
) -> Any:
    """
    Create new event. Admin only.
    """
    event = create_event(session=session, event_in=event_in)
    return event


@router.put("/{event_id}", response_model=EventPublic)
def update_existing_event(
    *,
    session: SessionDep,
    current_user: SuperUserDep,
    event_id: uuid.UUID,
    event_in: EventUpdate,
) -> Any:
    """
    Update an event. Admin only.
    """
    event = get_event(session=session, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    updated_event = update_event(session=session, db_event=event, event_in=event_in)
    return updated_event


@router.delete("/{event_id}")
def delete_existing_event(
    session: SessionDep, current_user: SuperUserDep, event_id: uuid.UUID
) -> Message:
    """
    Delete an event. Admin only.
    """
    event = get_event(session=session, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    delete_event(session=session, event_id=event_id)
    return Message(message="Event deleted successfully")


@router.post("/{event_id}/participants", response_model=EventPublic)
def add_participants_to_event(
    *,
    session: SessionDep,
    current_user: SuperUserDep,
    event_id: uuid.UUID,
    participants_in: EventParticipantAdd,
) -> Any:
    """
    Add participants to an event. Admin only.
    """
    try:
        event = add_event_participants(
            session=session, event_id=event_id, user_ids=participants_in.user_ids
        )
        return event
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{event_id}/participants", response_model=EventPublic)
def remove_participants_from_event(
    *,
    session: SessionDep,
    current_user: SuperUserDep,
    event_id: uuid.UUID,
    participants_in: EventParticipantRemove,
) -> Any:
    """
    Remove participants from an event. Admin only.
    """
    try:
        event = remove_event_participants(
            session=session, event_id=event_id, user_ids=participants_in.user_ids
        )
        return event
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
