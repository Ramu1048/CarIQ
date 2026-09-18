"""
CarIQ Backend — Recommendation Service
Preference extraction → candidate retrieval → scoring → AI explanation
"""
from __future__ import annotations
import json
import logging
import re
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.recommendation import Recommendation
from app.models.vehicle import Vehicle
from app.schemas.recommendation import RecommendationItem, RecommendationRequest
from app.services.ai_service import (
    get_ai_provider,
    RECOMMENDATION_SYSTEM_PROMPT,
)

logger = logging.getLogger(__name__)


# ── Preference Extraction ─────────────────────────────────────────────────────
FUEL_KEYWORDS = {
    "petrol": "petrol", "gasoline": "petrol",
    "diesel": "diesel",
    "electric": "electric", "ev": "electric", "battery": "electric",
    "cng": "cng", "gas": "cng",
    "hybrid": "hybrid",
}
BODY_KEYWORDS = {
    "suv": "suv", "sports utility": "suv",
    "sedan": "sedan", "saloon": "sedan",
    "hatchback": "hatchback", "hatch": "hatchback",
    "muv": "muv", "mpv": "muv", "minivan": "muv",
    "coupe": "coupe",
}
TRANSMISSION_KEYWORDS = {
    "automatic": "automatic", "auto": "automatic", "at": "automatic",
    "manual": "manual", "mt": "manual", "stick": "manual",
    "amt": "amt",
}
USAGE_KEYWORDS = {"city": "city", "highway": "highway", "offroad": "offroad", "family": "family"}

PRICE_PATTERN = re.compile(r"(?:under|below|within|upto|up to)?\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|l|lac)?", re.IGNORECASE)
SEAT_PATTERN = re.compile(r"(\d)\s*(?:seater|seat|person|passenger)", re.IGNORECASE)


def extract_preferences(request: RecommendationRequest) -> Dict[str, Any]:
    """Extract structured preferences from request fields + natural language query."""
    prefs: Dict[str, Any] = {}
    text = request.query.lower()

    # Price from explicit params first, then NLP
    if request.budget_max:
        prefs["budget_max"] = request.budget_max
    else:
        match = PRICE_PATTERN.search(text)
        if match:
            val = float(match.group(1))
            if val < 100:  # likely in lakhs
                val *= 100_000
            prefs["budget_max"] = int(val)

    if request.budget_min:
        prefs["budget_min"] = request.budget_min

    # Fuel type
    if request.fuel_type:
        prefs["fuel_type"] = request.fuel_type
    else:
        for kw, ftype in FUEL_KEYWORDS.items():
            if kw in text:
                prefs["fuel_type"] = ftype
                break

    # Transmission
    if request.transmission:
        prefs["transmission"] = request.transmission
    else:
        for kw, ttype in TRANSMISSION_KEYWORDS.items():
            if kw in text:
                prefs["transmission"] = ttype
                break

    # Body type
    if request.body_type:
        prefs["body_type"] = request.body_type
    else:
        for kw, btype in BODY_KEYWORDS.items():
            if kw in text:
                prefs["body_type"] = btype
                break

    # Usage
    if request.usage:
        prefs["usage"] = request.usage
    else:
        for kw, utype in USAGE_KEYWORDS.items():
            if kw in text:
                prefs["usage"] = utype
                break

    # Seating
    if request.seating_min:
        prefs["seating_min"] = request.seating_min
    else:
        match = SEAT_PATTERN.search(text)
        if match:
            prefs["seating_min"] = int(match.group(1))

    # Mileage keywords
    if "good mileage" in text or "fuel efficient" in text or "fuel economy" in text:
        prefs["min_mileage"] = 16.0

    # Safety keywords
    if "safe" in text or "safety" in text or "ncap" in text:
        prefs["min_safety_rating"] = 4.0

    return prefs


# ── Scoring ───────────────────────────────────────────────────────────────────
def score_vehicle(vehicle: Vehicle, prefs: Dict[str, Any]) -> Tuple[float, List[str], List[str], List[str]]:
    """
    Multi-factor weighted scoring (0-100).
    Returns (score, matching_factors, advantages, limitations).
    """
    score = 0.0
    matching: List[str] = []
    advantages: List[str] = []
    limitations: List[str] = []
    max_score = 0.0

    # Budget (weight: 30)
    if "budget_max" in prefs:
        max_score += 30
        bmax = prefs["budget_max"]
        bmin = prefs.get("budget_min", 0)
        price = vehicle.ex_showroom_price
        if price <= bmax:
            score += 30
            matching.append(f"Within budget (₹{price/100000:.1f}L ≤ ₹{bmax/100000:.1f}L)")
            if price <= bmax * 0.85:
                advantages.append(f"Priced ₹{(bmax-price)/100000:.1f}L below your maximum budget")
        else:
            pct_over = ((price - bmax) / bmax) * 100
            if pct_over <= 10:
                score += 15
                limitations.append(f"Slightly over budget by {pct_over:.0f}%")
            else:
                limitations.append(f"Over budget by {pct_over:.0f}%")
    else:
        max_score += 30
        score += 30  # No budget constraint — full score

    # Fuel type (weight: 20)
    if "fuel_type" in prefs:
        max_score += 20
        if vehicle.fuel_type == prefs["fuel_type"]:
            score += 20
            matching.append(f"Fuel type matches: {vehicle.fuel_type}")
        else:
            limitations.append(f"Fuel type is {vehicle.fuel_type}, you preferred {prefs['fuel_type']}")
    else:
        max_score += 20
        score += 20

    # Transmission (weight: 15)
    if "transmission" in prefs:
        max_score += 15
        if vehicle.transmission == prefs["transmission"]:
            score += 15
            matching.append(f"Transmission matches: {vehicle.transmission}")
        else:
            limitations.append(f"Transmission is {vehicle.transmission}, you preferred {prefs['transmission']}")
    else:
        max_score += 15
        score += 15

    # Body type (weight: 15)
    if "body_type" in prefs:
        max_score += 15
        if vehicle.body_type == prefs["body_type"]:
            score += 15
            matching.append(f"Body type matches: {vehicle.body_type}")
        else:
            limitations.append(f"Body type is {vehicle.body_type}, you preferred {prefs['body_type']}")
    else:
        max_score += 15
        score += 15

    # Seating (weight: 10)
    if "seating_min" in prefs:
        max_score += 10
        if vehicle.seating_capacity >= prefs["seating_min"]:
            score += 10
            matching.append(f"Seats {vehicle.seating_capacity} (you need {prefs['seating_min']}+)")
        else:
            limitations.append(f"Only {vehicle.seating_capacity} seats (you need {prefs['seating_min']}+)")
    else:
        max_score += 10
        score += 10

    # Mileage (weight: 5)
    if "min_mileage" in prefs and vehicle.mileage_kmpl:
        max_score += 5
        if vehicle.mileage_kmpl >= prefs["min_mileage"]:
            score += 5
            advantages.append(f"Good mileage: {vehicle.mileage_kmpl} km/l")
        else:
            limitations.append(f"Mileage {vehicle.mileage_kmpl} km/l (wanted {prefs['min_mileage']}+)")
    else:
        max_score += 5
        if vehicle.mileage_kmpl and vehicle.mileage_kmpl >= 15:
            score += 5
            advantages.append(f"Good mileage: {vehicle.mileage_kmpl} km/l")

    # Safety rating (weight: 5)
    if "min_safety_rating" in prefs and vehicle.safety_rating:
        max_score += 5
        if vehicle.safety_rating >= prefs["min_safety_rating"]:
            score += 5
            advantages.append(f"Safety rating: {vehicle.safety_rating}★ NCAP")
        else:
            limitations.append(f"Safety rating {vehicle.safety_rating}★ (wanted {prefs['min_safety_rating']}★+)")
    else:
        max_score += 5
        if vehicle.safety_rating and vehicle.safety_rating >= 4:
            score += 5
            advantages.append(f"High safety rating: {vehicle.safety_rating}★ NCAP")

    # Normalise to 0-100
    final_score = (score / max_score * 100) if max_score > 0 else 0

    # Feature bonuses (informational)
    if vehicle.has_sunroof:
        advantages.append("Sunroof available")
    if vehicle.has_adas:
        advantages.append("ADAS safety features")
    if vehicle.has_apple_carplay:
        advantages.append("Apple CarPlay / Android Auto")
    if vehicle.fuel_type == "electric":
        advantages.append(f"Zero emissions | Range: {vehicle.ev_range_km or 'N/A'} km")

    return round(final_score, 1), matching, advantages, limitations


# ── Main Service ──────────────────────────────────────────────────────────────
class RecommendationService:

    @staticmethod
    async def recommend(
        db: AsyncSession,
        request: RecommendationRequest,
        user_id: Optional[uuid.UUID] = None,
    ) -> Recommendation:
        start_ms = int(time.time() * 1000)

        # 1. Extract preferences
        prefs = extract_preferences(request)

        # 2. Retrieve candidates from database
        query = (
            select(Vehicle)
            .where(Vehicle.is_deleted == False, Vehicle.is_active == True)  # noqa: E712
            .options(selectinload(Vehicle.brand), selectinload(Vehicle.images))
        )
        if "budget_max" in prefs:
            # Allow 15% over budget to catch near matches
            query = query.where(Vehicle.ex_showroom_price <= int(prefs["budget_max"] * 1.15))
        if "budget_min" in prefs:
            query = query.where(Vehicle.ex_showroom_price >= prefs["budget_min"])
        if "fuel_type" in prefs:
            query = query.where(Vehicle.fuel_type == prefs["fuel_type"])

        result = await db.execute(query.limit(50))
        candidates = list(result.scalars().all())

        # 3. Score candidates
        scored = []
        for v in candidates:
            score, matching, advantages, limitations = score_vehicle(v, prefs)
            if score >= 30:  # Minimum relevance threshold
                scored.append((v, score, matching, advantages, limitations))

        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:request.limit]

        # 4. Build results with AI explanation
        ai = get_ai_provider()
        results = []
        for v, score, matching, advantages, limitations in top:
            # Build AI prompt with ONLY database facts
            vehicle_facts = (
                f"Vehicle: {v.brand.name if v.brand else 'Unknown'} {v.model_name}\n"
                f"Price: ₹{v.ex_showroom_price/100000:.2f}L ex-showroom\n"
                f"Body: {v.body_type}, Fuel: {v.fuel_type}, Transmission: {v.transmission}\n"
                f"Seating: {v.seating_capacity}, Mileage: {v.mileage_kmpl or 'N/A'} km/l\n"
                f"Safety: {v.safety_rating or 'N/A'}★ NCAP, Airbags: {v.num_airbags or 'N/A'}\n"
                f"Engine: {v.engine_cc or 'N/A'}cc, HP: {v.horsepower or 'N/A'}\n"
                f"Sunroof: {v.has_sunroof}, ADAS: {v.has_adas}\n"
                f"Match score: {score}/100\n"
                f"User query: {request.query}"
            )
            try:
                reason = await ai.generate(
                    prompt=f"In 2-3 sentences, explain why this car is recommended based ONLY on the data:\n{vehicle_facts}",
                    system_prompt=RECOMMENDATION_SYSTEM_PROMPT,
                    max_tokens=200,
                )
            except Exception:
                reason = f"This vehicle scores {score:.0f}/100 based on your requirements: {', '.join(matching[:3])}."

            results.append({
                "vehicle_id": str(v.id),
                "score": score,
                "matching_factors": matching,
                "advantages": advantages,
                "limitations": limitations,
                "reason": reason,
            })

        # 5. Store recommendation record
        processing_ms = int(time.time() * 1000) - start_ms
        rec = Recommendation(
            id=uuid.uuid4(),
            user_id=user_id,
            query_text=request.query,
            extracted_preferences=json.dumps(prefs),
            results=json.dumps(results),
            ai_provider_used=ai.provider_name,
            processing_time_ms=processing_ms,
        )
        db.add(rec)
        await db.commit()
        await db.refresh(rec)

        # Attach vehicle objects for response
        rec._vehicles = {v.id: v for v, *_ in top}
        rec._results_data = results
        return rec
