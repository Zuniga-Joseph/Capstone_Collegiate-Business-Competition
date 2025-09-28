from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.db import engine, init_db
from app.main import app
from app.models import Item, User, Scores, Leaderboard
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import get_superuser_token_headers


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        init_db(session)
        yield session

        try:
            # foreign key to user & leaderboard
            session.exec(delete(Scores))
            # foreign key to user
            session.exec(delete(Leaderboard))
            session.exec(delete(Item))
            session.exec(delete(User))
            session.commit()
        except Exception as e:
            print(f"Cleanup error: {e}")
            session.rollback()

        # statement = delete(Scores)
        # statement.execute(statement)
        # statement = delete(Leaderboard)
        # statement.execute(statement)
        # statement = delete(Item)
        # session.execute(statement)
        # statement = delete(User)
        # session.execute(statement)
        # session.commit()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
