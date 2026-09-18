from typing import List
from ai_service.app.models.vehicle import Vehicle, VehicleFilter
from ai_service.app.schemas.preference import UserPreferences
from ai_service.app.services.vehicle_db_service import vehicle_db


class CandidateRetriever:
    """Retrieves candidate vehicles matching hard and soft user preference constraints."""

    def __init__(self):
        self.db = vehicle_db

    def get_candidates(self, preferences: UserPreferences) -> List[Vehicle]:
        # Construct filter from user preferences
        criteria = VehicleFilter(
            brand=preferences.brand,
            body_type=preferences.body_type,
            fuel_type=preferences.fuel_type,
            transmission=preferences.transmission,
            budget_max=preferences.budget_max,
            budget_min=preferences.budget_min,
            min_seating=preferences.seating_capacity if preferences.seating_capacity and preferences.seating_capacity > 5 else None,
        )

        candidates = self.db.filter_vehicles(criteria)

        # If strict filtering returned too few results (less than 2), relax constraints gradually
        if len(candidates) < 2:
            relaxed_criteria = VehicleFilter(
                body_type=preferences.body_type,
                budget_max=preferences.budget_max * 1.2 if preferences.budget_max else None,
            )
            candidates = self.db.filter_vehicles(relaxed_criteria)

        # If still empty, return all available vehicles for scoring
        if not candidates:
            candidates = self.db.get_all()

        return candidates


candidate_retriever = CandidateRetriever()
