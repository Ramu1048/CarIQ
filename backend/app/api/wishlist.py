"""
CarIQ Backend — Wishlist Router
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.vehicle import VehicleSummary
from app.schemas.common import SuccessResponse
from app.services.vehicle_service import VehicleService
from app.utils.helpers import get_primary_image

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("", response_model=List[VehicleSummary], summary="Get wishlist")
async def get_wishlist(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    vehicles = await VehicleService.get_wishlist(db, current_user.id)
    return [
        VehicleSummary.model_validate({
            "id": v.id, "model_name": v.model_name, "slug": v.slug,
            "body_type": v.body_type, "fuel_type": v.fuel_type,
            "transmission": v.transmission,
            "ex_showroom_price": v.ex_showroom_price,
            "on_road_price_approx": v.on_road_price_approx,
            "mileage_kmpl": v.mileage_kmpl, "seating_capacity": v.seating_capacity,
            "safety_rating": v.safety_rating, "has_sunroof": v.has_sunroof,
            "ev_range_km": v.ev_range_km, "popularity_score": v.popularity_score,
            "brand": v.brand,
            "primary_image_url": get_primary_image(v.images) if v.images else None,
            "created_at": v.created_at,
        })
        for v in vehicles
    ]


@router.post("/{vehicle_id}", response_model=SuccessResponse, status_code=201, summary="Add vehicle to wishlist")
async def add_to_wishlist(
    vehicle_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await VehicleService.add_to_wishlist(db, current_user.id, vehicle_id)
    return SuccessResponse(message="Vehicle added to wishlist")


@router.delete("/{vehicle_id}", response_model=SuccessResponse, summary="Remove vehicle from wishlist")
async def remove_from_wishlist(
    vehicle_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await VehicleService.remove_from_wishlist(db, current_user.id, vehicle_id)
    return SuccessResponse(message="Vehicle removed from wishlist")
