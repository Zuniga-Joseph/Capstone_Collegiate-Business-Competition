import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# shared properties
class LeaderboardBase(SQLModel):
    event_name: str = Field(min_length=1, max_length=255)

# properties to receive on leaderboard creation
class LeaderboardCreate(LeaderboardBase):
    pass

# properties to receive on leaderboard update
class LeaderboardUpdate(SQLModel):
    event_name: str | None = Field(default=None, min_length=1, max_length=255)

class Leaderboard(LeaderboardBase, table=True):
    event_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    scores: List["Scores"] = Relationship(back_populates="leaderboard")

# properties to return w/ API
class LeaderboardPublic(LeaderboardBase):
    event_id: uuid.UUID
    created_at: datetime

# shared properties for scores
class ScoresBase(SQLModel):
    duration: timedelta = Field()
    challenge_score: int = Field(default=0, ge=0)
    cg_score: int = Field(default=0, ge=0)
    si_score: int = Field(default=0, ge=0)
    mr_score: int = Field(default=0, ge=0)

# properties to receive on score creation
class ScoresCreate(ScoresBase):
    event_id: uuid.UUID
    user_id: uuid.UUID

# properties to receive on score update
class ScoresUpdate(SQLModel):
    duration: timedelta | None = Field(default=None)
    challenge_score: int | None = Field(default=None, ge=0)
    cg_score: int | None = Field(default=None, ge=0)
    si_score: int | None = Field(default=None, ge=0)
    mr_score: int | None = Field(default=None, ge=0)

class Scores(ScoresBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: uuid.UUID = Field(foreign_key="leaderboard.event_id", nullable=False, ondelete="CASCADE")
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # relationships
    leaderboard: Optional[Leaderboard] = Relationship(back_populates="scores")
    user: Optional["User"] = Relationship() # forward ref to user

class ScoresPublic(ScoresBase):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

class ScoresPublicWithUser(ScoresPublic):
    user: "UserPublic | None" = None

class ScoresPublicWithLeaderboard(ScoresPublic):
    leaderboard: LeaderboardPublic | None = None

class ScoresListPublic(SQLModel):
    data: list[ScoresPublic]
    count: int

# class Scores(SQLModel):
#     id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
#     event_id: uuid.UUID = Field(foreign_key="leaderboard.event_id", nullable=False)
#     # REFERENCE USER TABLE
#     user_id: uuid.UUID = Field(nullable=False)
#     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
#     duration: timedelta = Field(nullable=False)
#     challenge_score: int = Field(default=0)
#     cg_score: int = Field(default=0)
#     si_score: int = Field(default=0)
#     mr_score: int = Field(default=0)
#     # ... Look into this further...
#     leaderboard: Optional[Leaderboard] = Relationship(back_populates="scores")


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    scores: list["Scores"] = Relationship(back_populates="user")


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
