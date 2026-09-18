"""
CarIQ Backend — Recommendations Router
"""
import json
import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse, RecommendationItem
from app.schemas.vehicle import VehicleSummary
from app.services.recommendation_service import RecommendationService
from app.utils.helpers import get_primary_image

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


def vehicle_to_summary(v) -> VehicleSummary:
    return VehicleSummary.model_validate({
        "id": v.id, "model_name": v.model_name, "slug": v.slug,
        "body_type": v.body_type, "fuel_type": v.fuel_type,
        "transmission": v.transmission,
        "ex_showroom_price": v.ex_showroom_price,
        "on_road_price_approx": v.on_road_price_approx,
        "mileage_kmpl": v.mileage_kmpl,
        "seating_capacity": v.seating_capacity,
        "safety_rating": v.safety_rating,
        "has_sunroof": v.has_sunroof,
        "ev_range_km": v.ev_range_km,
        "popularity_score": v.popularity_score,
        "brand": v.brand,
        "primary_image_url": get_primary_image(v.images) if v.images else None,
        "created_at": v.created_at,
    })


@router.post("", response_model=RecommendationResponse, summary="Get AI-powered car recommendations")
async def get_recommendations(
    request: RecommendationRequest,
    current_user=Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit your requirements in natural language and receive scored car recommendations.
    Vehicle facts are sourced exclusively from the database.
    """
    user_id = current_user.id if current_user else None
    rec = await RecommendationService.recommend(db, request, user_id)

    # Build response
    results_data = rec._results_data
    vehicles = rec._vehicles  # Dict[UUID, Vehicle]

    items = []
    for r in results_data:
        v_id = uuid.UUID(r["vehicle_id"])
        if v_id in vehicles:
            items.append(RecommendationItem(
                vehicle=vehicle_to_summary(vehicles[v_id]),
                match_score=r["score"],
                matching_factors=r["matching_factors"],
                advantages=r["advantages"],
                limitations=r["limitations"],
                recommendation_reason=r["reason"],
            ))

    return RecommendationResponse(
        id=rec.id,
        query=rec.query_text,
        extracted_preferences=json.loads(rec.extracted_preferences or "{}"),
        recommendations=items,
        ai_provider_used=rec.ai_provider_used,
        processing_time_ms=rec.processing_time_ms or 0,
        created_at=rec.created_at,
    )
