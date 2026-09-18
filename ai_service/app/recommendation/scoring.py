from typing import Dict, Tuple
from ai_service.app.models.vehicle import Vehicle
from ai_service.app.schemas.preference import UserPreferences


class RecommendationScoringEngine:
    """
    Deterministic multi-factor car recommendation scoring engine.
    Computes objective compatibility score (0 to 100) with factor breakdowns.
    """

    DEFAULT_WEIGHTS = {
        "budget": 0.25,
        "safety": 0.20,
        "fuel_efficiency": 0.15,
        "usage_compatibility": 0.15,
        "body_and_transmission": 0.15,
        "features_and_tech": 0.10,
    }

    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or self.DEFAULT_WEIGHTS

    def _score_budget(self, vehicle: Vehicle, pref: UserPreferences) -> float:
        if not pref.budget_max:
            return 0.90  # Neutral high if budget unconstrained

        target_max = pref.budget_max
        if vehicle.ex_showroom_price <= target_max:
            # Full score if ex-showroom is well within budget
            ratio = vehicle.ex_showroom_price / target_max
            return 1.0 if ratio >= 0.70 else 0.95
        elif vehicle.price_min <= target_max:
            # Lower variant is within budget
            return 0.85
        elif vehicle.price_min <= target_max * 1.15:
            # Slight stretch (within 15%)
            return 0.60
        else:
            # Over budget
            return 0.20

    def _score_safety(self, vehicle: Vehicle, pref: UserPreferences) -> float:
        # Base safety score from NCAP stars (0-5) and airbags
        star_score = vehicle.safety_rating_ncap / 5.0
        airbag_score = min(1.0, vehicle.airbags_count / 6.0)
        base = (star_score * 0.7) + (airbag_score * 0.3)

        # Boost if safety is a stated priority
        if "safety" in pref.priorities:
            if vehicle.safety_rating_ncap == 5:
                return 1.0
            elif vehicle.safety_rating_ncap == 4:
                return 0.75
            else:
                return 0.40
        return base

    def _score_fuel(self, vehicle: Vehicle, pref: UserPreferences) -> float:
        if vehicle.fuel_type == "Electric":
            # EVs get top score for low running cost
            return 1.0 if pref.usage in ["city", "mixed"] else 0.80

        if vehicle.fuel_type == "Strong Hybrid":
            # Strong hybrids get ~28 km/l
            return 0.98

        # Petrol / Diesel ICE mileage scoring
        mileage = vehicle.mileage_kmpl
        if mileage >= 22.0:
            score = 0.95
        elif mileage >= 18.0:
            score = 0.85
        elif mileage >= 15.0:
            score = 0.70
        else:
            score = 0.55

        if "mileage" in pref.priorities and score < 0.80:
            score *= 0.80
        return score

    def _score_usage(self, vehicle: Vehicle, pref: UserPreferences) -> float:
        score = 0.85
        usage = (pref.usage or "mixed").lower()

        if usage == "city":
            if vehicle.fuel_type == "Electric":
                score = 1.0
            elif vehicle.transmission.lower() in ["automatic", "cvt", "dca", "amt", "e-cvt"]:
                score = 0.95
            elif vehicle.body_type in ["Hatchback", "Compact SUV"]:
                score = 0.90
        elif usage == "highway":
            if vehicle.safety_rating_ncap == 5 and vehicle.power_bhp >= 115:
                score = 1.0
            elif vehicle.fuel_type in ["Diesel", "Petrol", "Strong Hybrid"]:
                score = 0.90
        elif usage == "mixed":
            score = 0.90

        if pref.purpose == "family":
            if vehicle.seating_capacity >= (pref.seating_capacity or 5) and vehicle.boot_space_litres >= 350:
                score = min(1.0, score + 0.10)

        return min(1.0, score)

    def _score_body_transmission(self, vehicle: Vehicle, pref: UserPreferences) -> float:
        body_match = 1.0
        if pref.body_type:
            body_match = 1.0 if pref.body_type.lower() == vehicle.body_type.lower() else 0.40

        trans_match = 1.0
        if pref.transmission:
            user_t = pref.transmission.lower()
            veh_t = vehicle.transmission.lower()
            if "auto" in user_t:
                trans_match = 1.0 if veh_t not in ["manual", "mt"] else 0.20
            elif "manual" in user_t:
                trans_match = 1.0 if veh_t in ["manual", "mt"] else 0.50

        return (body_match * 0.5) + (trans_match * 0.5)

    def _score_features(self, vehicle: Vehicle, pref: UserPreferences) -> float:
        score = min(1.0, len(vehicle.features) / 8.0)
        if "comfort" in pref.priorities:
            if any("ventilated" in f.lower() or "sunroof" in f.lower() for f in vehicle.features):
                score = min(1.0, score + 0.20)
        if "features" in pref.priorities:
            if any("adas" in f.lower() or "360" in f.lower() or "screen" in f.lower() for f in vehicle.features):
                score = min(1.0, score + 0.20)
        return score

    def calculate_match(self, vehicle: Vehicle, pref: UserPreferences) -> Tuple[int, Dict[str, float]]:
        """Calculates 0-100 score and individual factor scores."""
        factors = {
            "budget": round(self._score_budget(vehicle, pref), 3),
            "safety": round(self._score_safety(vehicle, pref), 3),
            "fuel_efficiency": round(self._score_fuel(vehicle, pref), 3),
            "usage_compatibility": round(self._score_usage(vehicle, pref), 3),
            "body_and_transmission": round(self._score_body_transmission(vehicle, pref), 3),
            "features_and_tech": round(self._score_features(vehicle, pref), 3),
        }

        weighted_sum = sum(factors[k] * self.weights[k] for k in factors)
        total_score = int(round(weighted_sum * 100))
        total_score = max(10, min(99, total_score))

        return total_score, factors


scoring_engine = RecommendationScoringEngine()
