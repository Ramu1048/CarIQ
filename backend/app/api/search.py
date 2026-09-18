"""
CarIQ Backend — Search Router
"""
from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.vehicle import VehicleSummary
from app.services.vehicle_service import VehicleService
from app.utils.helpers import get_primary_image
from app.utils.pagination import paginate

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=Dict[str, Any], summary="Intelligent vehicle search")
async def search(
    q: str = Query(..., min_length=2, description="Search query e.g. 'automatic SUV under 20 lakh'"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Natural-language vehicle search.
    Extracts filters from query like 'automatic SUV under 20 lakh' or '7 seater family car'.
    """
    vehicles, total, applied_filters = await VehicleService.search_vehicles(db, q, page, page_size)

    items = []
    for v in vehicles:
        items.append(VehicleSummary.model_validate({
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

    from math import ceil
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": ceil(total / page_size) if page_size > 0 else 0,
        "applied_filters": applied_filters,
        "query": q,
    }
