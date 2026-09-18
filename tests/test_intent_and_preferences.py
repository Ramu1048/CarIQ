import pytest
from ai_service.app.recommendation.preference_extractor import preference_extractor


@pytest.mark.asyncio
async def test_preference_extraction_budget_and_body():
    query = "I need an automatic SUV under 15 lakh for city driving"
    pref, intent, conf = await preference_extractor.extract_preferences(query)

    assert pref.budget_max == 1500000
    assert pref.body_type == "SUV"
    assert pref.transmission == "Automatic"
    assert pref.usage == "city"
    assert intent == "car_recommendation"
    assert conf > 0.70


@pytest.mark.asyncio
async def test_preference_extraction_safety_and_ev():
    query = "Looking for a safe electric car under 12 lakh"
    pref, intent, conf = await preference_extractor.extract_preferences(query)

    assert pref.budget_max == 1200000
    assert pref.fuel_type == "Electric"
    assert "safety" in pref.priorities
    assert intent in ["car_recommendation", "EV"]


@pytest.mark.asyncio
async def test_intent_detection_compare():
    query = "Compare Tata Nexon and Maruti Brezza"
    pref, intent, conf = await preference_extractor.extract_preferences(query)

    assert intent == "car_comparison"


@pytest.mark.asyncio
async def test_intent_detection_finance():
    query = "Calculate monthly EMI for 12 lakh loan"
    pref, intent, conf = await preference_extractor.extract_preferences(query)

    assert intent == "finance"
