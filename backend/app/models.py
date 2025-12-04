import uuid
import enum
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column
from sqlalchemy import Enum as SAEnum

from typing import Any, List


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

# =========================
# Lexicon suggestions
# =========================

class LexiconCategory(str, enum.Enum):
    SOCIAL_INTELLIGENCE = "social_intelligence"
    MENTAL_RESILIENCE = "mental_resilience"
    COACHABILITY_GROWTH = "coachability_growth"


class LexiconDimension(str, enum.Enum):
    # Social Intelligence
    EMPATHY = "empathy"
    POLITE = "polite"

    # Mental Resilience
    RESILIENCE = "resilience"
    CATASTROPHIZE = "catastrophize"

    # Coachability & Growth
    GROWTH = "growth"
    ACCEPT = "accept"


class LexiconSuggestionBase(SQLModel):
    word: str = Field(
        index=True,
        max_length=64,
        description="Candidate lexicon token suggested by TF-IDF / analysis",
    )

    category: LexiconCategory = Field(
        sa_column=Column(
            SAEnum(LexiconCategory, name="lexicon_category_enum"),
            nullable=False,
        ),
        index=True,
        description="High-level construct: social_intelligence / mental_resilience / coachability_growth",
    )

    dimension: LexiconDimension | None = Field(
        default=None,
        sa_column=Column(
            SAEnum(LexiconDimension, name="lexicon_dimension_enum"),
            nullable=True,
        ),
        index=True,
        description="Sub-dimension inside the construct (empathy, polite, resilience, etc.)",
    )

    tfidf_score: float | None = Field(
        default=None,
        description="Representative TF-IDF score when this word was first suggested",
    )

    frequency: int | None = Field(
        default=None,
        description="How many times this word occurred in the corpus (optional)",
    )

    approved: bool = Field(
        default=False,
        index=True,
        description="True when a human has approved this word into the core lexicon",
    )

    rejected: bool = Field(
        default=False,
        index=True,
        description="True if explicitly rejected; avoid re-suggesting",
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="When this suggestion was first created",
    )

    approved_at: datetime | None = Field(
        default=None,
        description="When the suggestion was approved, if ever",
    )


class LexiconSuggestion(LexiconSuggestionBase, table=True):
    __tablename__ = "lexicon_suggestions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


class TranscriptIn(SQLModel):
    """
    One transcript block we want to mine for TF-IDF-based lexicon suggestions.
    Later you can add metadata (player_id, game_id, etc.).
    """
    text: str


class TFIDFSuggestionRequest(SQLModel):
    """
    Payload for generating lexicon suggestions from a batch of transcripts.
    The caller chooses which construct/dimension these suggestions are for.
    """
    transcripts: List[TranscriptIn]
    category: LexiconCategory
    dimension: LexiconDimension | None = None
    top_k: int = 20  # how many candidate words to store at most

from typing import Any  # if not already imported


class TranscriptWithId(SQLModel):
    """
    One transcript to analyze. `id` is optional but helps you tie back to a player.
    """
    id: str | None = None
    text: str


class PlayerAnalysis(SQLModel):
    """
    Per-player analysis payload returned to the frontend.
    """
    index: int
    transcript_id: str | None = None
    scores: dict[str, float]
    features: dict[str, dict[str, Any]]


class BatchAnalysisRequest(SQLModel):
    """
    Full request: a batch of transcripts, plus which construct/dimension to
    generate TF-IDF lexicon suggestions for.
    """
    transcripts: list[TranscriptWithId]
    category: LexiconCategory
    dimension: LexiconDimension | None = None
    top_k: int = 20  # maximum number of candidate words to keep


class BatchAnalysisResponse(SQLModel):
    """
    Combined response: per-player trait scores + lexicon suggestions.
    """
    players: list[PlayerAnalysis]
    suggestions: list[LexiconSuggestion]

