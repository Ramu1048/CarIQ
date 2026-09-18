import pytest
from ai_service.app.ai.llm_provider import MockDeterministicLLMProvider
from ai_service.app.recommendation.explanation import recommendation_explainer
from ai_service.app.schemas.preference import UserPreferences
from ai_service.app.services.finance_service import finance_service
from ai_service.app.services.vehicle_db_service import vehicle_db


@pytest.mark.asyncio
async def test_deterministic_llm_provider_fallback():
    provider = MockDeterministicLLMProvider()
    res = await provider.generate_text("Recommend a car under 15 lakh")
    assert "CarIQ database" in res


def test_deterministic_explanation_generation():
    nexon = vehicle_db.get_by_id("tata_nexon")
    assert nexon is not None

    prefs = UserPreferences(budget_max=1500000, transmission="Automatic")
    exp = recommendation_explainer.generate_deterministic_explanation(
        vehicle=nexon,
        preferences=prefs,
        match_score=90,
        factors={"budget": 1.0, "safety": 1.0},
    )

    assert "Tata" in exp
    assert "Nexon" in exp
    assert "recommends" in exp


def test_finance_calculation_accuracy():
    # Test ₹10 Lakh at 8.75% for 60 months
    emi_data = finance_service.calculate_emi(
        principal=1000000,
        annual_interest_rate=8.75,
        tenure_months=60,
        down_payment=0,
    )
    # Expected EMI is approx 20637
    assert 20600 <= emi_data["monthly_emi"] <= 20700
    assert emi_data["total_payment"] > 1000000
