from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import SessionDep, CurrentUser
from app.models import (
    UserRole,
    QuestionCreate,
    QuestionRead,
    BulkQuestionsCreate,
    BulkQuestionsRead,
)
from app.crud import (
    create_question,
    create_questions_bulk,
)

router = APIRouter(prefix="/questions", tags=["questions"])

def require_recruiter(user: CurrentUser):
    if user.role not in (UserRole.RECRUITER, UserRole.ADMIN):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only recruiters can create questions.")


@router.post("", response_model=QuestionRead, status_code=201)
def create_question_endpoint(
    question_in: QuestionCreate,
    session: SessionDep,
    current_user: CurrentUser,
):
    require_recruiter(current_user)
    return create_question(
        session=session,
        question_in=question_in,
        owner_id=current_user.id,
    )


@router.post("/bulk", response_model=BulkQuestionsRead, status_code=201)
def create_questions_bulk_endpoint(
    bulk_in: BulkQuestionsCreate,
    session: SessionDep,
    current_user: CurrentUser,
):
    require_recruiter(current_user)
    created = create_questions_bulk(
        session=session,
        bulk_in=bulk_in,
        owner_id=current_user.id,
    )
    return BulkQuestionsRead(questions=created, created_count=len(created))
