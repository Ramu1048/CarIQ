import pytest
from ai_service.app.memory.conversation import conversation_memory
from ai_service.app.schemas.preference import UserPreferences


def test_conversation_memory_slot_accumulation():
    session = conversation_memory.get_or_create("session_test_123")

    # Turn 1: User says family car
    pref1 = UserPreferences(purpose="family", seating_capacity=5)
    session.merge_preferences(pref1)
    assert session.active_preferences.purpose == "family"

    # Turn 2: User says budget 15 lakh
    pref2 = UserPreferences(budget_max=1500000)
    session.merge_preferences(pref2)
    assert session.active_preferences.purpose == "family"
    assert session.active_preferences.budget_max == 1500000

    # Turn 3: User says petrol automatic
    pref3 = UserPreferences(fuel_type="Petrol", transmission="Automatic")
    session.merge_preferences(pref3)
    assert session.active_preferences.purpose == "family"
    assert session.active_preferences.budget_max == 1500000
    assert session.active_preferences.fuel_type == "Petrol"
    assert session.active_preferences.transmission == "Automatic"
