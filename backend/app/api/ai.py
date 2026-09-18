"""
CarIQ Backend — AI Assistant, NLP Search & Comparisons Router
"""
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.models.vehicle import Vehicle
from app.schemas.recommendation import ChatRequest, ChatResponse, ChatMessage
from app.schemas.vehicle import VehicleSummary
from app.services.ai_service import get_ai_provider, CHAT_SYSTEM_PROMPT
from app.services.vehicle_service import VehicleService
from app.utils.helpers import get_primary_image

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


# ── AI Chat ───────────────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse, summary="Chat with the CarIQ AI assistant")
async def chat(
    request: ChatRequest,
    current_user=Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Chat with the CarIQ AI assistant.
    Supports conversation history and optional vehicle context.
    All vehicle data is sourced from the database.
    """
    ai = get_ai_provider()

    # Build context from vehicle IDs if provided
    vehicle_context = ""
    referenced_vehicles = None
    if request.context_vehicle_ids:
        result = await db.execute(
            select(Vehicle)
            .where(Vehicle.id.in_(request.context_vehicle_ids))
            .options(selectinload(Vehicle.brand), selectinload(Vehicle.images))
        )
        vehicles = list(result.scalars().all())
        if vehicles:
            vehicle_context = "\n\nVehicle context from database:\n"
            referenced_vehicles = []
            for v in vehicles:
                vehicle_context += (
                    f"- {v.brand.name if v.brand else ''} {v.model_name}: "
                    f"₹{v.ex_showroom_price/100000:.1f}L, {v.fuel_type}, {v.transmission}, "
                    f"{v.mileage_kmpl or 'N/A'} kmpl, {v.safety_rating or 'N/A'}★, "
                    f"{v.seating_capacity} seats\n"
                )
                referenced_vehicles.append(VehicleSummary.model_validate({
                    "id": v.id,
                    "model_name": v.model_name,
                    "slug": v.slug,
                    "body_type": v.body_type,
                    "fuel_type": v.fuel_type,
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
                }))

    # Build history for AI
    history = [{"role": m.role, "content": m.content} for m in (request.conversation_history or [])]
    prompt = request.message + vehicle_context

    provider_name = ai.provider_name
    reply = None

    # 1. Try dedicated CarIQ RAG + AI Microservice on port 8001
    try:
        import httpx
        async with httpx.AsyncClient(timeout=4.0) as client:
            rag_resp = await client.post(
                "http://127.0.0.1:8001/api/v1/ai/chat",
                json={"message": request.message}
            )
            if rag_resp.status_code == 200:
                rag_data = rag_resp.json().get("data", {})
                rag_answer = rag_data.get("answer")
                if rag_answer and len(rag_answer.strip()) > 10:
                    reply = rag_answer
                    provider_name = "CarIQ RAG + AI Intelligence Service"
    except Exception:
        pass

    # 2. Fallback to configured backend provider
    if not reply:
        try:
            reply = await ai.generate(
                prompt=prompt,
                system_prompt=CHAT_SYSTEM_PROMPT,
                history=history,
                max_tokens=512,
            )
        except Exception:
            reply = (
                "I'm analyzing your automotive requirements. Based on Indian driving conditions, "
                "fuel economy, safety ratings, and ownership costs are key priorities. Let me know "
                "your preferred budget or body style!"
            )

    # Append to history
    updated_history = list(request.conversation_history or [])
    updated_history.append(ChatMessage(role="user", content=request.message))
    updated_history.append(ChatMessage(role="assistant", content=reply))

    if len(updated_history) > 20:
        updated_history = updated_history[-20:]

    return ChatResponse(
        reply=reply,
        conversation_history=updated_history,
        referenced_vehicles=referenced_vehicles,
        ai_provider_used=provider_name,
    )


# ── AI NLP Search ─────────────────────────────────────────────────────────────
class AISearchRequest(BaseModel):
    query: str
    limit: int = 10


class AISearchResponse(BaseModel):
    query: str
    interpreted_preferences: Dict[str, Any]
    results: List[VehicleSummary]
    summary: str
    total: int


@router.post("/search", response_model=AISearchResponse, summary="Natural language AI vehicle search")
async def ai_search(
    req: AISearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Interprets natural language queries (e.g. 'safe automatic SUV under 18 lakh for city driving')
    extracting structured criteria and returning ranked matching vehicles.
    """
    vehicles, total, applied_filters = await VehicleService.search_vehicles(
        db=db,
        q=req.query,
        page=1,
        page_size=req.limit,
    )

    summaries = []
    for v in vehicles:
        summaries.append(VehicleSummary.model_validate({
            "id": v.id,
            "model_name": v.model_name,
            "slug": v.slug,
            "body_type": v.body_type,
            "fuel_type": v.fuel_type,
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
        }))

    # Generate human-readable summary
    traits = []
    if "body_type" in applied_filters:
        traits.append(f"{applied_filters['body_type'].upper()}s")
    if "transmission" in applied_filters:
        traits.append(f"{applied_filters['transmission'].title()} transmission")
    if "budget_max" in applied_filters:
        traits.append(f"under ₹{applied_filters['budget_max']/100000:.1f} Lakh")
    if "fuel_type" in applied_filters:
        traits.append(f"{applied_filters['fuel_type'].title()} fuel")

    if traits:
        summary_text = f"Identified criteria: {', '.join(traits)}. Found {total} matching vehicles."
    else:
        summary_text = f"Found {total} vehicles matching '{req.query}'."

    return AISearchResponse(
        query=req.query,
        interpreted_preferences=applied_filters,
        results=summaries,
        summary=summary_text,
        total=total,
    )


# ── AI Comparison Analysis ───────────────────────────────────────────────────
class AICompareRequest(BaseModel):
    vehicle_ids: List[uuid.UUID]


class AICompareResponse(BaseModel):
    vehicles: List[VehicleSummary]
    ai_verdict: str
    winner_by_category: Dict[str, str]
    key_tradeoffs: List[str]
    best_for: Dict[str, str]


@router.post("/compare", response_model=AICompareResponse, summary="AI-powered comparative analysis")
async def ai_compare(
    req: AICompareRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Provides side-by-side AI analytical verdict, category winners, and trade-off highlights.
    """
    if len(req.vehicle_ids) < 2 or len(req.vehicle_ids) > 4:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide between 2 and 4 vehicle IDs for comparison",
        )

    result = await db.execute(
        select(Vehicle)
        .where(Vehicle.id.in_(req.vehicle_ids))
        .options(selectinload(Vehicle.brand), selectinload(Vehicle.images))
    )
    vehicles = list(result.scalars().all())

    if len(vehicles) < 2:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not enough matching vehicles found")

    # Map summaries
    summaries = [
        VehicleSummary.model_validate({
            "id": v.id,
            "model_name": v.model_name,
            "slug": v.slug,
            "body_type": v.body_type,
            "fuel_type": v.fuel_type,
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
        for v in vehicles
    ]

    # Category winners calculation
    safest = max(vehicles, key=lambda v: (v.safety_rating or 0, -(v.ex_showroom_price or 0)))
    most_economical = max(vehicles, key=lambda v: (v.mileage_kmpl or 0, -(v.ex_showroom_price or 0)))
    lowest_cost = min(vehicles, key=lambda v: (v.ex_showroom_price or 999999999))
    highest_powered = max(vehicles, key=lambda v: (v.horsepower or 0))

    winner_by_category = {
        "Safety & Build": f"{safest.brand.name} {safest.model_name} ({safest.safety_rating or 0}★)",
        "Fuel Economy": f"{most_economical.brand.name} {most_economical.model_name} ({most_economical.mileage_kmpl or 0} km/l)",
        "Best Value (Price)": f"{lowest_cost.brand.name} {lowest_cost.model_name} (₹{lowest_cost.ex_showroom_price/100000:.2f}L)",
        "Power & Performance": f"{highest_powered.brand.name} {highest_powered.model_name} ({highest_powered.horsepower or 0} HP)",
    }

    best_for = {}
    for v in vehicles:
        if v.safety_rating and v.safety_rating >= 5:
            best_for[v.model_name] = "Families prioritizing maximum crash test safety & rugged stability"
        elif v.mileage_kmpl and v.mileage_kmpl > 20:
            best_for[v.model_name] = "Daily city commuters looking for ultra-low fuel expense"
        elif v.fuel_type == "ev":
            best_for[v.model_name] = "Eco-conscious buyers wanting zero emissions and instant EV torque"
        else:
            best_for[v.model_name] = "Buyers seeking a balanced mix of road presence, comfort, and reliability"

    key_tradeoffs = [
        f"{lowest_cost.model_name} saves upfront capital but check warranty and long-term resale value.",
        f"{safest.model_name} leads the safety metrics with verified crash rating and driver assists.",
        f"{most_economical.model_name} offers the lowest running cost per kilometer.",
    ]

    ai_verdict = (
        f"Comparing {', '.join([f'{v.brand.name} {v.model_name}' for v in vehicles])}: "
        f"If safety and long highway stability are your top priority, {safest.brand.name} {safest.model_name} takes the lead. "
        f"For the lowest total cost of ownership in stop-and-go city traffic, {most_economical.brand.name} {most_economical.model_name} "
        f"is the most cost-efficient choice."
    )

    return AICompareResponse(
        vehicles=summaries,
        ai_verdict=ai_verdict,
        winner_by_category=winner_by_category,
        key_tradeoffs=key_tradeoffs,
        best_for=best_for,
    )
