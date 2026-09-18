from typing import List, Tuple
from ai_service.app.models.vehicle import Vehicle
from ai_service.app.recommendation.candidate_retriever import candidate_retriever
from ai_service.app.recommendation.scoring import scoring_engine
from ai_service.app.schemas.preference import UserPreferences


class VehicleRanker:
    """Ranks vehicles based on deterministic multi-factor match scores and generates key highlights."""

    def __init__(self):
        self.candidate_retriever = candidate_retriever
        self.scoring_engine = scoring_engine

    def rank_vehicles(
        self, preferences: UserPreferences, top_k: int = 3
    ) -> List[Tuple[Vehicle, int, dict]]:
        candidates = self.candidate_retriever.get_candidates(preferences)

        scored_list = []
        for vehicle in candidates:
            score, factors = self.scoring_engine.calculate_match(vehicle, preferences)
            scored_list.append((vehicle, score, factors))

        # Sort descending by match score
        scored_list.sort(key=lambda x: x[1], reverse=True)

        return scored_list[:top_k]


vehicle_ranker = VehicleRanker()
