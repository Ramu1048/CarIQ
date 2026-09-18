import re
from typing import Any, Dict, List, Optional, Tuple
from ai_service.app.ai.llm_provider import get_llm_provider
from ai_service.app.ai.prompt_manager import PromptManager
from ai_service.app.core.logging import logger
from ai_service.app.schemas.preference import UserPreferences


class PreferenceExtractor:
    """
    Extracts structured car buying preferences and intents from natural language queries
    using a high-accuracy hybrid approach (rule-based deterministic parser + LLM semantic extraction).
    """

    def __init__(self):
        self.llm = get_llm_provider()

    def _extract_budget(self, text: str) -> Tuple[Optional[int], Optional[int]]:
        """Extracts budget min and max from expressions like 'under 15 lakh', 'between 10 to 18 lakh', etc."""
        text_lower = text.lower()
        min_b = None
        max_b = None

        # Pattern: between X and Y lakh / X to Y lakh
        range_match = re.search(r"(?:between|from)?\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:to|-|and)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lacs?|l\b)", text_lower)
        if range_match:
            min_b = int(float(range_match.group(1)) * 100000)
            max_b = int(float(range_match.group(2)) * 100000)
            return min_b, max_b

        # Pattern: under / below / within / max X lakh
        under_match = re.search(r"(?:under|below|within|upto|up\s*to|max|budget\s*(?:of|is|:)?)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lacs?|l\b)", text_lower)
        if under_match:
            max_b = int(float(under_match.group(1)) * 100000)
            return min_b, max_b

        # Direct mention of X lakh (e.g. "15 lakh car")
        direct_lakh = re.search(r"(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lacs?|l\b)", text_lower)
        if direct_lakh:
            max_b = int(float(direct_lakh.group(1)) * 100000)

        return min_b, max_b

    def extract_deterministic(self, text: str) -> Tuple[UserPreferences, str, float]:
        """Fast regex & keyword rule-based slot filling."""
        text_lower = text.lower()
        pref = UserPreferences()
        detected_intent = "car_recommendation"
        confidence = 0.85

        # 1. Intent Detection
        if any(w in text_lower for w in ["compare", "versus", " vs ", "difference between"]):
            detected_intent = "car_comparison"
        elif any(w in text_lower for w in ["emi", "loan", "down payment", "interest rate", "finance"]):
            detected_intent = "finance"
        elif any(w in text_lower for w in ["service cost", "maintenance", "warranty", "reliability"]):
            detected_intent = "maintenance"
        elif any(w in text_lower for w in ["safety rating", "ncap", "airbags", "crash test"]):
            detected_intent = "safety"
        elif any(w in text_lower for w in ["ev ", "electric", "battery", "charging", "range"]):
            detected_intent = "EV"
        elif any(w in text_lower for w in ["boot space", "ground clearance", "engine", "dimensions", "specs"]):
            detected_intent = "vehicle_information"

        # 2. Budget
        min_b, max_b = self._extract_budget(text)
        pref.budget_min = min_b
        pref.budget_max = max_b

        # 3. Body Type
        if re.search(r"\bsuv\b|compact suv|micro suv", text_lower):
            pref.body_type = "SUV"
        elif re.search(r"\bsedan\b", text_lower):
            pref.body_type = "Sedan"
        elif re.search(r"\bhatchback\b", text_lower):
            pref.body_type = "Hatchback"
        elif re.search(r"\bmuv\b|\bmpv\b|7 seater", text_lower):
            pref.body_type = "MUV"

        # 4. Fuel Type
        if re.search(r"\belectric\b|\bev\b", text_lower):
            pref.fuel_type = "Electric"
        elif re.search(r"\bhybrid\b|strong hybrid", text_lower):
            pref.fuel_type = "Strong Hybrid"
        elif re.search(r"\bdiesel\b", text_lower):
            pref.fuel_type = "Diesel"
        elif re.search(r"\bpetrol\b", text_lower):
            pref.fuel_type = "Petrol"
        elif re.search(r"\bcng\b", text_lower):
            pref.fuel_type = "CNG"

        # 5. Transmission
        if re.search(r"\bautomatic\b|\bat\b|\bdct\b|\bdca\b|\bcvt\b|\bivt\b|\bamt\b", text_lower):
            pref.transmission = "Automatic"
        elif re.search(r"\bmanual\b|\bmt\b", text_lower):
            pref.transmission = "Manual"

        # 6. Seating
        if re.search(r"7\s*seater|7\s*seats|large family", text_lower):
            pref.seating_capacity = 7
        elif re.search(r"5\s*seater|5\s*seats", text_lower):
            pref.seating_capacity = 5

        # 7. Usage & Purpose
        if "city" in text_lower:
            pref.usage = "city"
        elif "highway" in text_lower:
            pref.usage = "highway"

        if "family" in text_lower:
            pref.purpose = "family"

        # 8. Priorities
        priorities = []
        if any(w in text_lower for w in ["safety", "safe", "ncap", "airbag"]):
            priorities.append("safety")
        if any(w in text_lower for w in ["mileage", "fuel efficient", "fuel economy", "average"]):
            priorities.append("mileage")
        if any(w in text_lower for w in ["comfort", "plush", "smooth", "ventilated"]):
            priorities.append("comfort")
        if any(w in text_lower for w in ["performance", "fast", "turbo", "power", "speed"]):
            priorities.append("performance")
        if any(w in text_lower for w in ["feature", "sunroof", "screen", "camera", "adas"]):
            priorities.append("features")
        if any(w in text_lower for w in ["low maintenance", "budget", "cheap", "affordable"]):
            priorities.append("budget")
        pref.priorities = priorities

        # 9. Brand mentions
        brands = ["Tata", "Maruti Suzuki", "Hyundai", "Kia", "Mahindra", "Toyota", "Honda", "Skoda"]
        for b in brands:
            if b.lower() in text_lower or (b == "Maruti Suzuki" and "maruti" in text_lower):
                pref.brand = b
                break

        return pref, detected_intent, confidence

    async def extract_preferences(
        self, text: str, conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[UserPreferences, str, float]:
        """Extracts preferences combining rule-based deterministic parsing with LLM fallback."""
        pref, intent, conf = self.extract_deterministic(text)

        # If rule-based extracted key items, return immediately for sub-millisecond response
        if pref.budget_max or pref.body_type or pref.fuel_type or pref.transmission:
            return pref, intent, conf

        # Otherwise invoke LLM for complex / nuanced sentences
        try:
            prompt = PromptManager.INTENT_EXTRACTION_PROMPT.format(user_message=text)
            data = await self.llm.generate_json(prompt=prompt)
            if data and "preferences" in data:
                llm_pref_data = data["preferences"]
                llm_intent = data.get("intent", intent)
                llm_conf = data.get("confidence", 0.90)

                # Merge with deterministic
                extracted_pref = UserPreferences(**{k: v for k, v in llm_pref_data.items() if v is not None})
                return extracted_pref, llm_intent, llm_conf
        except Exception as e:
            logger.debug(f"LLM preference extraction fallback to deterministic: {e}")

        return pref, intent, conf


preference_extractor = PreferenceExtractor()
