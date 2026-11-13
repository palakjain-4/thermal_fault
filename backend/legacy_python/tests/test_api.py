import pytest
import io
import numpy as np
import cv2
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.database import MongoDBConnectionError

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "model" in data
    assert data["database"]["type"] == "MongoDB"

def test_model_info_endpoint():
    response = client.get("/api/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "modelName" in data
    assert "supportedClasses" in data
    assert len(data["supportedClasses"]) == 5
    assert "Normal" in data["supportedClasses"]
    assert "Overheating" in data["supportedClasses"]

def test_upload_invalid_file_extension():
    # Send a text file disguised as scan
    file_content = b"fake payload"
    response = client.post(
        "/api/analyze",
        files={"file": ("malicious_script.sh", file_content, "application/x-sh")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.text

def test_upload_empty_file():
    response = client.post(
        "/api/analyze",
        files={"file": ("empty_scan.png", b"", "image/png")}
    )
    assert response.status_code == 400
    assert "empty" in response.text.lower()

def test_analyze_mongodb_failure_returns_503():
    """Verify that if MongoDB is offline, /api/analyze returns 503 instead of pretending records saved."""
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    _, buf = cv2.imencode('.png', img)

    with patch("app.database.analysis_repository.create") as mock_create:
        mock_create.side_effect = MongoDBConnectionError(
            message="Database connection refused.",
            details="MongoDB is offline at localhost:27017"
        )
        response = client.post(
            "/api/analyze",
            files={"file": ("valid_scan.png", buf.tobytes(), "image/png")}
        )
        assert response.status_code == 503
        data = response.json()
        assert "Database Connection Failure" in str(data)

def test_analyses_history_mongodb_failure_returns_503():
    """Verify that /api/analyses returns 503 when MongoDB is unreachable."""
    with patch("app.database.analysis_repository.list_all") as mock_list:
        mock_list.side_effect = MongoDBConnectionError(
            message="Cannot reach MongoDB server.",
            details="Connection timeout"
        )
        response = client.get("/api/analyses")
        assert response.status_code == 503

def test_dashboard_stats_mongodb_failure_returns_503():
    """Verify that /api/dashboard/stats returns 503 when MongoDB is unreachable."""
    with patch("app.database.analysis_repository.get_stats") as mock_stats:
        mock_stats.side_effect = MongoDBConnectionError(
            message="Cannot reach MongoDB server.",
            details="Connection timeout"
        )
        response = client.get("/api/dashboard/stats")
        assert response.status_code == 503

def test_successful_analysis_with_mocked_db():
    """Test full analysis pipeline when database successfully persists."""
    img = np.zeros((120, 120, 3), dtype=np.uint8)
    cv2.rectangle(img, (20, 20), (100, 100), (180, 80, 20), -1)
    cv2.circle(img, (60, 60), 12, (255, 255, 255), -1)
    _, buf = cv2.imencode('.png', img)

    fake_id = "test-mock-id-999"
    with patch("app.database.analysis_repository.create") as mock_create:
        def fake_create(rec):
            rec["_id"] = fake_id
            return rec
        mock_create.side_effect = fake_create

        response = client.post(
            "/api/analyze",
            files={"file": ("test_thermal_transformer.png", buf.tobytes(), "image/png")}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["_id"] == fake_id
        assert data["imageFilename"] == "test_thermal_transformer.png"
        assert data["predictedCondition"] in ["Normal", "Fault Detected"]
        assert "confidence" in data
        assert "reportUrl" in data
