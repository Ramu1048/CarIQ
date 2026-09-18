import pytest
from ai_service.app.models.vehicle import Vehicle
from ai_service.app.recommendation.ranking import vehicle_ranker
from ai_service.app.recommendation.scoring import scoring_engine
from ai_service.app.schemas.preference import UserPreferences
from ai_service.app.services.vehicle_db_service import vehicle_db


def test_deterministic_scoring_budget_and_safety():
    nexon = vehicle_db.get_by_id("tata_nexon")
    assert nexon is not None

    prefs = UserPreferences(
        budget_max=1600000,
        body_type="SUV",
        priorities=["safety"],
    )

    score, factors = scoring_engine.calculate_match(nexon, prefs)

    assert score >= 80
    assert factors["budget"] >= 0.90
    assert factors["safety"] == 1.0  # Nexon has 5-star NCAP


def test_scoring_penalizes_over_budget():
    hycross = vehicle_db.get_by_id("toyota_innova_hycross")  # Ex showroom > 30L
    assert hycross is not None

    tight_budget_prefs = UserPreferences(
        budget_max=1200000,
        body_type="MUV",
    )

    score, factors = scoring_engine.calculate_match(hycross, tight_budget_prefs)
    assert factors["budget"] <= 0.30


def test_ranking_orders_correctly():
    prefs = UserPreferences(
        budget_max=1500000,
        body_type="SUV",
        priorities=["safety"],
    )

    ranked = vehicle_ranker.rank_vehicles(prefs, top_k=3)
    assert len(ranked) >= 2
    top_vehicle, top_score, _ = ranked[0]
    assert top_score >= 75
