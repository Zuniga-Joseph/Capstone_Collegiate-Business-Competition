from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID

from app.api.deps import SessionDep, CurrentUser
from app.models import UserRole, QuestionSetCreate, QuestionSetRead, QuestionSetReadWithQuestions
from app.crud import create_question_set, list_question_sets_for_owner, get_question_set_for_owner, delete_question_set_for_owner

router = APIRouter(prefix="/question-sets", tags=["question-sets"])

def require_recruiter(user: CurrentUser):
    if user.role not in (UserRole.RECRUITER, UserRole.ADMIN):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only recruiters may manage question sets.")


@router.post("", response_model=QuestionSetRead, status_code=201)
def create_set(
    qs_in: QuestionSetCreate,
    session: SessionDep,
    current_user: CurrentUser,
):
    require_recruiter(current_user)
    return create_question_set(session=session, qs_in=qs_in, owner_id=current_user.id)


@router.get("", response_model=list[QuestionSetRead])
def list_sets(
    session: SessionDep,
    current_user: CurrentUser,
):
    require_recruiter(current_user)
    return list_question_sets_for_owner(session=session, owner_id=current_user.id)
