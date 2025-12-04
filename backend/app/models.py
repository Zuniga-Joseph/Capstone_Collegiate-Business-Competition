import uuid
from datetime import datetime
from enum import Enum

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    university: str | None = Field(default=None, max_length=200)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)
    university: str | None = Field(default=None, max_length=200)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    university: str | None = Field(default=None, max_length=200)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    event_participations: list["EventParticipant"] = Relationship(
        back_populates="user", cascade_delete=True
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# Event status enum
class EventStatus(str, Enum):
    draft = "draft"
    active = "active"
    completed = "completed"
    archived = "archived"


# Event type enum
class EventType(str, Enum):
    virtual = "virtual"
    in_person = "in_person"
    hybrid = "hybrid"


# Shared properties for Event
class EventBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    event_type: EventType = Field(default=EventType.virtual)
    location: str | None = Field(default=None, max_length=255)
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime | None = Field(default=None)
    status: EventStatus = Field(default=EventStatus.draft)


# Properties to receive on event creation
class EventCreate(EventBase):
    participant_ids: list[uuid.UUID] = Field(default_factory=list)


# Properties to receive on event update
class EventUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    event_type: EventType | None = None
    location: str | None = Field(default=None, max_length=255)
    start_date: datetime | None = None
    end_date: datetime | None = None
    registration_deadline: datetime | None = None
    status: EventStatus | None = None


# Database model for Event
class Event(EventBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    participants: list["EventParticipant"] = Relationship(
        back_populates="event", cascade_delete=True
    )


# Properties to return via API
class EventPublic(EventBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# List of events
class EventsPublic(SQLModel):
    data: list[EventPublic]
    count: int


# Event with participant details
class EventWithParticipants(EventPublic):
    participants: list[UserPublic]


# Link table for many-to-many relationship between Event and User
class EventParticipant(SQLModel, table=True):
    event_id: uuid.UUID = Field(
        foreign_key="event.id", primary_key=True, ondelete="CASCADE"
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.id", primary_key=True, ondelete="CASCADE"
    )
    registered_at: datetime = Field(default_factory=datetime.utcnow)
    event: Event = Relationship(back_populates="participants")
    user: User = Relationship(back_populates="event_participations")


# Add/remove participants request models
class EventParticipantAdd(SQLModel):
    user_ids: list[uuid.UUID]


class EventParticipantRemove(SQLModel):
    user_ids: list[uuid.UUID]


# Event analytics/statistics
class EventAnalytics(SQLModel):
    event_id: uuid.UUID
    total_participants: int
    participants_by_school: dict[str, int]
    registration_status: str
