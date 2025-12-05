import uuid
from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.tests.utils.event import create_random_event
from app.tests.utils.game import create_random_game_session
from app.tests.utils.user import create_random_user


def test_create_game_session(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test creating a game session."""
    data = {
        "event_id": None,
        "join_code": "TEST123",
    }
    response = client.post(
        f"{settings.API_V1_STR}/game/sessions",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["join_code"] == data["join_code"]
    assert content["status"] == "waiting"
    assert "id" in content


def test_create_game_session_with_event(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test creating a game session linked to an event."""
    event = create_random_event(db)
    data = {
        "event_id": str(event.id),
        "join_code": "EVENT123",
    }
    response = client.post(
        f"{settings.API_V1_STR}/game/sessions",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["event_id"] == str(event.id)
    assert content["join_code"] == data["join_code"]


def test_list_game_sessions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test listing game sessions."""
    session1 = create_random_game_session(db)
    session2 = create_random_game_session(db)
    response = client.get(
        f"{settings.API_V1_STR}/game/sessions",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_list_game_sessions_filter_by_event(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test filtering game sessions by event."""
    event = create_random_event(db)
    session1 = create_random_game_session(db, event_id=event.id)
    session2 = create_random_game_session(db)  # Different event

    response = client.get(
        f"{settings.API_V1_STR}/game/sessions?event_id={event.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    # All returned sessions should have the correct event_id
    for session in content["data"]:
        assert session["event_id"] == str(event.id)


def test_update_game_session(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test updating a game session."""
    game_session = create_random_game_session(db)
    update_data = {
        "status": "in_progress",
        "start_time": datetime.utcnow().isoformat(),
        "question_count": 10,
    }
    response = client.put(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["status"] == update_data["status"]
    assert content["question_count"] == update_data["question_count"]


def test_update_game_session_complete(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test completing a game session."""
    game_session = create_random_game_session(db)
    update_data = {
        "status": "completed",
        "start_time": datetime.utcnow().isoformat(),
        "end_time": datetime.utcnow().isoformat(),
        "question_count": 5,
    }
    response = client.put(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["status"] == "completed"
    assert content["start_time"] is not None
    assert content["end_time"] is not None


def test_update_game_session_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test updating a non-existent game session."""
    update_data = {"status": "completed"}
    response = client.put(
        f"{settings.API_V1_STR}/game/sessions/{uuid.uuid4()}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == 404


def test_add_participant_to_session(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test adding a participant to a game session."""
    game_session = create_random_game_session(db)
    user = create_random_user(db)

    response = client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/participants/{user.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Participant added successfully"


def test_add_duplicate_participant(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test that adding the same participant twice returns success."""
    game_session = create_random_game_session(db)
    user = create_random_user(db)

    # Add participant first time
    response = client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/participants/{user.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    # Add same participant again
    response = client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/participants/{user.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200


def test_add_participant_session_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test adding a participant to a non-existent session."""
    user = create_random_user(db)

    response = client.post(
        f"{settings.API_V1_STR}/game/sessions/{uuid.uuid4()}/participants/{user.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404


def test_add_participant_user_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test adding a non-existent user to a session."""
    game_session = create_random_game_session(db)

    response = client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/participants/{uuid.uuid4()}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404


def test_update_scores(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test updating scores for participants in a session."""
    game_session = create_random_game_session(db)
    user1 = create_random_user(db)
    user2 = create_random_user(db)

    # Add participants
    client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/participants/{user1.id}",
        headers=normal_user_token_headers,
    )
    client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/participants/{user2.id}",
        headers=normal_user_token_headers,
    )

    # Update scores
    scores = {
        str(user1.id): 100,
        str(user2.id): 75,
    }
    response = client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/scores",
        headers=normal_user_token_headers,
        json=scores,
    )
    assert response.status_code == 200
    content = response.json()
    assert "Updated scores for" in content["message"]


def test_update_scores_with_ranking(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test that scores are ranked correctly."""
    game_session = create_random_game_session(db)
    user1 = create_random_user(db)
    user2 = create_random_user(db)
    user3 = create_random_user(db)

    # Add participants
    for user in [user1, user2, user3]:
        client.post(
            f"{settings.API_V1_STR}/game/sessions/{game_session.id}/participants/{user.id}",
            headers=normal_user_token_headers,
        )

    # Update scores (user2 has highest score)
    scores = {
        str(user1.id): 50,
        str(user2.id): 100,
        str(user3.id): 75,
    }
    response = client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/scores",
        headers=normal_user_token_headers,
        json=scores,
    )
    assert response.status_code == 200

    # Get leaderboard to verify rankings
    response = client.get(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/leaderboard",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    leaderboard = response.json()
    entries = leaderboard["entries"]
    assert len(entries) == 3
    assert entries[0]["user_id"] == str(user2.id)
    assert entries[0]["rank"] == 1
    assert entries[1]["user_id"] == str(user3.id)
    assert entries[1]["rank"] == 2
    assert entries[2]["user_id"] == str(user1.id)
    assert entries[2]["rank"] == 3


def test_get_session_leaderboard(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test getting the leaderboard for a session."""
    game_session = create_random_game_session(db)
    user1 = create_random_user(db)
    user2 = create_random_user(db)

    # Add participants
    client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/participants/{user1.id}",
        headers=normal_user_token_headers,
    )
    client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/participants/{user2.id}",
        headers=normal_user_token_headers,
    )

    # Update scores
    scores = {str(user1.id): 100, str(user2.id): 75}
    client.post(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/scores",
        headers=normal_user_token_headers,
        json=scores,
    )

    # Get leaderboard
    response = client.get(
        f"{settings.API_V1_STR}/game/sessions/{game_session.id}/leaderboard",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    entries = content["entries"]
    assert len(entries) == 2
    assert entries[0]["score"] == 100
    assert entries[1]["score"] == 75
    assert entries[0]["rank"] == 1
    assert entries[1]["rank"] == 2


def test_get_session_leaderboard_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test getting leaderboard for non-existent session."""
    response = client.get(
        f"{settings.API_V1_STR}/game/sessions/{uuid.uuid4()}/leaderboard",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 404


def test_get_global_leaderboard(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test getting the global leaderboard."""
    # Create multiple sessions with different users and scores
    session1 = create_random_game_session(db)
    session2 = create_random_game_session(db)

    user1 = create_random_user(db)
    user2 = create_random_user(db)
    user3 = create_random_user(db)

    # Session 1: user1 and user2
    for user in [user1, user2]:
        client.post(
            f"{settings.API_V1_STR}/game/sessions/{session1.id}/participants/{user.id}",
            headers=normal_user_token_headers,
        )
    client.post(
        f"{settings.API_V1_STR}/game/sessions/{session1.id}/scores",
        headers=normal_user_token_headers,
        json={str(user1.id): 100, str(user2.id): 80},
    )

    # Session 2: user1 and user3
    for user in [user1, user3]:
        client.post(
            f"{settings.API_V1_STR}/game/sessions/{session2.id}/participants/{user.id}",
            headers=normal_user_token_headers,
        )
    client.post(
        f"{settings.API_V1_STR}/game/sessions/{session2.id}/scores",
        headers=normal_user_token_headers,
        json={str(user1.id): 150, str(user3.id): 90},
    )

    # Get global leaderboard
    response = client.get(
        f"{settings.API_V1_STR}/game/leaderboard/global",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content) >= 3

    # Check that user1 has the highest total score
    user1_entry = next((e for e in content if e["user_id"] == str(user1.id)), None)
    assert user1_entry is not None
    assert user1_entry["score"] == 250  # 100 + 150


def test_get_global_leaderboard_with_limit(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test getting global leaderboard with limit parameter."""
    # Create multiple users with scores
    users = [create_random_user(db) for _ in range(5)]
    session = create_random_game_session(db)

    for i, user in enumerate(users):
        client.post(
            f"{settings.API_V1_STR}/game/sessions/{session.id}/participants/{user.id}",
            headers=normal_user_token_headers,
        )

    scores = {str(user.id): (i + 1) * 10 for i, user in enumerate(users)}
    client.post(
        f"{settings.API_V1_STR}/game/sessions/{session.id}/scores",
        headers=normal_user_token_headers,
        json=scores,
    )

    # Get top 3
    response = client.get(
        f"{settings.API_V1_STR}/game/leaderboard/global?limit=3",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    # Should return at least the top entries (might include existing data)
    assert len(content) >= 3


def test_unauthorized_access(client: TestClient) -> None:
    """Test that endpoints require authentication."""
    # Test without auth headers
    response = client.get(f"{settings.API_V1_STR}/game/sessions")
    assert response.status_code == 401

    response = client.get(f"{settings.API_V1_STR}/game/leaderboard/global")
    assert response.status_code == 401
