import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def auth_headers():
    """
    Replace this with a real Supabase JWT
    or a mocked token if you stub auth.
    """
    return {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IlJLU0M5RFZiMEZEVVBIbUgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2dha3JzaWhraGVzeXprcHhhZ3dpLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4NGZmNTI2Zi0zNjdmLTQzZjgtYmUzMi1hYjJkOTUzOTY5OWMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY2OTk0MDY4LCJpYXQiOjE3NjY5OTA0NjgsImVtYWlsIjoiYXBwbGljYW50QHNtYXJ0bGVuZC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl0sInJvbGUiOiJhcHBsaWNhbnQifSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjY5OTA0Njh9XSwic2Vzc2lvbl9pZCI6ImIxODc1NDA4LWY0MjAtNGExMi1iMWE2LTJlOTkzNjZmNWIwNyIsImlzX2Fub255bW91cyI6ZmFsc2V9.czMiQn17q6nNZnOgPrrcMQJjZ3r5pcErqOOi7LAIPaA"
    }


def test_submit_application_happy_path(auth_headers):
    payload = {
        "applicant": {
            "ssn": "123-45-6789",
            "annual_inc": 120000,
            "emp_length_num": 5,
            "home_ownership": "RENT",
            "verification_status": "Verified",
            "zip_region": "South"
        },
        "loan": {
            "loan_amnt": 200000,
            "term": 36,
            "purpose": "debt_consolidation"
        }
    }

    response = client.post(
        "/api/v1/applications",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 201, response.text

    data = response.json()

    # Core guarantees
    assert data["id"] is not None
    assert data["status"] in [
        "OFFERED",
        "MANUAL_REVIEW",
        "DECLINED"
    ]

    # Decision snapshot present
    assert data["decision"] is not None
    assert data["decision"]["outcome"] in [
        "APPROVE",
        "MANUAL_REVIEW",
        "DECLINE"
    ]

    # Economics populated
    assert data["economics"]["expected_value"] is not None
    assert data["economics"]["pricing_apr"] is not None
