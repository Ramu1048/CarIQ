import pytest
from fastapi.testclient import TestClient
from ai_service.app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["components"]["vehicle_database"]["total_vehicles"] > 0


def test_api_chat_endpoint():
    payload = {
        "message": "Recommend a safe SUV under 15 lakh",
    }
    response = client.post("/api/v1/ai/chat", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert "answer" in res_json["data"]
    assert len(res_json["data"]["recommendations"]) > 0


def test_api_recommend_endpoint():
    payload = {
        "natural_language_query": "Automatic family car under 18 lakh",
        "top_k": 3,
    }
    response = client.post("/api/v1/ai/recommend", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert len(res_json["data"]["recommendations"]) > 0


def test_api_compare_endpoint():
    payload = {
        "vehicle_ids": ["tata_nexon", "maruti_brezza"],
    }
    response = client.post("/api/v1/ai/compare", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert len(res_json["data"]["comparison_table"]) > 0


def test_api_search_endpoint():
    payload = {
        "query": "Best mileage hybrid car",
        "top_k": 4,
    }
    response = client.post("/api/v1/ai/search", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["total"] > 0


def test_api_extract_preferences():
    payload = {
        "text": "Looking for a 7 seater diesel car under 25 lakh",
    }
    response = client.post("/api/v1/ai/extract-preferences", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["preferences"]["budget_max"] == 2500000
    assert res_json["preferences"]["seating_capacity"] == 7
    assert res_json["preferences"]["fuel_type"] == "Diesel"


def test_api_rag_search_endpoint():
    payload = {
        "query": "What is the Bharat NCAP safety protocol?",
        "top_k": 3,
    }
    response = client.post("/api/v1/rag/search", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert len(res_json["data"]["chunks"]) > 0
