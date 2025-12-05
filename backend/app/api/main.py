from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils, recordings, events, game
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(events.router)
api_router.include_router(game.router)
api_router.include_router(recordings.router, prefix="/recordings", tags=["recordings"],)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
