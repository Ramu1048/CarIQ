"""
CarIQ Backend — Recommendation Tests
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_recommendation_basic(client: AsyncClient, test_vehicle):
    """Test recommendation with a basic query."""
    response = await client.post("/api/v1/recommendations", json={
        "query": "I need a petrol hatchback for city driving",
    })
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert "extracted_preferences" in data
    assert "ai_provider_used" in data
    assert isinstance(data["recommendations"], list)


@pytest.mark.asyncio
async def test_recommendation_with_budget(client: AsyncClient, test_vehicle):
    """Test recommendation with budget constraint."""
    response = await client.post("/api/v1/recommendations", json={
        "query": "I want a car under 10 lakh",
        "budget_max": 1000000,
    })
    assert response.status_code == 200
    data = response.json()
    prefs = data["extracted_preferences"]
    assert prefs.get("budget_max") == 1000000


@pytest.mark.asyncio
async def test_recommendation_extract_nlp_budget(client: AsyncClient, test_vehicle):
    """Test that budget is extracted from natural language."""
    response = await client.post("/api/v1/recommendations", json={
        "query": "family car under 15 lakh automatic",
    })
    assert response.status_code == 200
    data = response.json()
    prefs = data["extracted_preferences"]
    # Should extract budget from "15 lakh"
    assert "budget_max" in prefs
    assert prefs["budget_max"] <= 1600000  # ≈15L + margin


@pytest.mark.asyncio
async def test_recommendation_items_have_required_fields(client: AsyncClient, test_vehicle):
    """Test that each recommendation item has required fields."""
    response = await client.post("/api/v1/recommendations", json={
        "query": "good petrol car",
    })
    assert response.status_code == 200
    for rec in response.json().get("recommendations", []):
        assert "vehicle" in rec
        assert "match_score" in rec
        assert "matching_factors" in rec
        assert "advantages" in rec
        assert "limitations" in rec
        assert "recommendation_reason" in rec
        assert 0 <= rec["match_score"] <= 100


@pytest.mark.asyncio
async def test_recommendation_limit(client: AsyncClient, test_vehicle):
    """Test recommendation result limit."""
    response = await client.post("/api/v1/recommendations", json={
        "query": "any car", "limit": 3
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) <= 3
