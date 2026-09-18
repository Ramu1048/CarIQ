from typing import Dict
from ai_service.app.ai.llm_provider import get_llm_provider
from ai_service.app.ai.prompt_manager import PromptManager
from ai_service.app.core.logging import logger
from ai_service.app.models.vehicle import Vehicle
from ai_service.app.schemas.preference import UserPreferences


class RecommendationExplainer:
    """Generates natural language grounded explanations for recommended vehicles."""

    def __init__(self):
        self.llm = get_llm_provider()

    def generate_deterministic_explanation(
        self,
        vehicle: Vehicle,
        preferences: UserPreferences,
        match_score: int,
        factors: Dict[str, float],
    ) -> str:
        """Rule-based fallback explanation guaranteed to be 100% factual and hallucination-free."""
        reasons = []

        if preferences.budget_max and vehicle.ex_showroom_price <= preferences.budget_max:
            reasons.append(f"fits your budget of ₹{preferences.budget_max/100000:.1f} Lakh (₹{vehicle.ex_showroom_price/100000:.2f}L)")
        
        if preferences.transmission and preferences.transmission.lower() in vehicle.transmission.lower():
            reasons.append(f"offers the desired {vehicle.transmission} gearbox")

        if vehicle.safety_rating_ncap >= 4:
            reasons.append(f"features a {vehicle.safety_rating_ncap}-Star NCAP safety rating with {vehicle.airbags_count} airbags")

        if vehicle.fuel_type == "Electric":
            reasons.append("provides ultra-low city operating costs with instant electric acceleration")
        elif vehicle.mileage_kmpl >= 19.0:
            reasons.append(f"delivers high fuel economy ({vehicle.mileage_kmpl} km/l)")

        joined_reasons = ", ".join(reasons)
        tradeoff = f"Consider that {vehicle.cons[0].lower()}" if vehicle.cons else ""

        text = f"CarIQ recommends the {vehicle.brand} {vehicle.model} because it {joined_reasons}."
        if tradeoff:
            text += f" {tradeoff}."

        return text

    async def explain(
        self,
        vehicle: Vehicle,
        preferences: UserPreferences,
        match_score: int,
        factors: Dict[str, float],
    ) -> str:
        """Generates explanation using LLM with deterministic fallback."""
        try:
            prompt = PromptManager.build_explanation_prompt(
                vehicle=vehicle,
                preferences=preferences,
                match_score=match_score,
                factors=factors,
            )
            explanation = await self.llm.generate_text(
                prompt=prompt,
                system_instruction=PromptManager.SYSTEM_PROMPT,
                temperature=0.2,
                max_tokens=300,
            )
            if explanation and len(explanation.strip()) > 30:
                return explanation.strip()
        except Exception as e:
            logger.debug(f"LLM explanation fallback: {e}")

        return self.generate_deterministic_explanation(
            vehicle=vehicle,
            preferences=preferences,
            match_score=match_score,
            factors=factors,
        )


recommendation_explainer = RecommendationExplainer()
