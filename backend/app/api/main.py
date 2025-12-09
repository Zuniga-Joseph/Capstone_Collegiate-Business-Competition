from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils, lexicon, questions, question_sets
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(lexicon.router)
api_router.include_router(questions.router)
api_router.include_router(question_sets.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
