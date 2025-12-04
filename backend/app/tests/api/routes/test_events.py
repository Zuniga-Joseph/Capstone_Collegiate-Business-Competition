import uuid
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.tests.utils.event import create_random_event
from app.tests.utils.user import create_random_user


def test_create_event_as_superuser(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test creating an event as superuser."""
    start_date = datetime.utcnow() + timedelta(days=7)
    end_date = start_date + timedelta(days=2)
    data = {
        "name": "Test Event",
        "description": "A test event",
        "event_type": "virtual",
        "location": None,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "registration_deadline": (start_date - timedelta(days=1)).isoformat(),
        "status": "draft",
        "participant_ids": [],
    }
    response = client.post(
        f"{settings.API_V1_STR}/events/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["description"] == data["description"]
    assert content["event_type"] == data["event_type"]
    assert "id" in content


def test_create_event_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test that normal users cannot create events."""
    start_date = datetime.utcnow() + timedelta(days=7)
    end_date = start_date + timedelta(days=2)
    data = {
        "name": "Test Event",
        "description": "A test event",
        "event_type": "virtual",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "status": "draft",
        "participant_ids": [],
    }
    response = client.post(
        f"{settings.API_V1_STR}/events/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_read_event(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test reading a single event."""
    event = create_random_event(db)
    response = client.get(
        f"{settings.API_V1_STR}/events/{event.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == event.name
    assert content["description"] == event.description
    assert content["id"] == str(event.id)


def test_read_event_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test reading a non-existent event."""
    response = client.get(
        f"{settings.API_V1_STR}/events/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Event not found"


def test_read_events(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test reading all events."""
    event1 = create_random_event(db)
    event2 = create_random_event(db)
    response = client.get(
        f"{settings.API_V1_STR}/events/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_update_event(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test updating an event."""
    event = create_random_event(db)
    update_data = {
        "name": "Updated Event Name",
        "status": "active",
    }
    response = client.put(
        f"{settings.API_V1_STR}/events/{event.id}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == update_data["name"]
    assert content["status"] == update_data["status"]
    assert content["id"] == str(event.id)


def test_update_event_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test that normal users cannot update events."""
    event = create_random_event(db)
    update_data = {"name": "Updated Event Name"}
    response = client.put(
        f"{settings.API_V1_STR}/events/{event.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == 403


def test_delete_event(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test deleting an event."""
    event = create_random_event(db)
    response = client.delete(
        f"{settings.API_V1_STR}/events/{event.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Event deleted successfully"

    # Verify deletion
    response = client.get(
        f"{settings.API_V1_STR}/events/{event.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_delete_event_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test that normal users cannot delete events."""
    event = create_random_event(db)
    response = client.delete(
        f"{settings.API_V1_STR}/events/{event.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_add_participants(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test adding participants to an event."""
    event = create_random_event(db)
    user = create_random_user(db)
    data = {"user_ids": [str(user.id)]}
    response = client.post(
        f"{settings.API_V1_STR}/events/{event.id}/participants",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200

    # Verify participant was added
    response = client.get(
        f"{settings.API_V1_STR}/events/{event.id}/participants",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    participants = response.json()
    assert len(participants) == 1
    assert participants[0]["id"] == str(user.id)


def test_remove_participants(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test removing participants from an event."""
    user = create_random_user(db)
    event = create_random_event(db, participant_ids=[user.id])

    # Remove participant - use request method with DELETE and json body
    response = client.request(
        method="DELETE",
        url=f"{settings.API_V1_STR}/events/{event.id}/participants",
        headers=superuser_token_headers,
        json={"user_ids": [str(user.id)]},
    )
    assert response.status_code == 200

    # Verify participant was removed
    response = client.get(
        f"{settings.API_V1_STR}/events/{event.id}/participants",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    participants = response.json()
    assert len(participants) == 0


def test_get_event_analytics(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test getting analytics for an event."""
    user1 = create_random_user(db)
    user2 = create_random_user(db)
    event = create_random_event(db, participant_ids=[user1.id, user2.id])

    response = client.get(
        f"{settings.API_V1_STR}/events/{event.id}/analytics",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["event_id"] == str(event.id)
    assert content["total_participants"] == 2
    assert "participants_by_school" in content


def test_get_event_analytics_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test that normal users cannot access event analytics."""
    event = create_random_event(db)
    response = client.get(
        f"{settings.API_V1_STR}/events/{event.id}/analytics",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
