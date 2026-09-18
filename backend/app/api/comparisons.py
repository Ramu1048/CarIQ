"""
CarIQ Backend — Comparisons Router
"""
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.schemas.comparison import ComparisonRequest, ComparisonResponse
from app.schemas.vehicle import VehicleDetail, VehicleImageOut, VariantOut
from app.services.comparison_service import ComparisonService
from app.utils.helpers import get_primary_image

router = APIRouter(prefix="/comparisons", tags=["Comparisons"])


def vehicle_to_detail(v) -> VehicleDetail:
    return VehicleDetail.model_validate({
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
        "vehicle_type": v.vehicle_type,
        "engine_cc": v.engine_cc, "engine_description": v.engine_description,
        "horsepower": v.horsepower, "torque_nm": v.torque_nm,
        "top_speed_kmph": v.top_speed_kmph, "acceleration_0_100": v.acceleration_0_100,
        "battery_capacity_kwh": v.battery_capacity_kwh,
        "charging_time_ac_hours": v.charging_time_ac_hours,
        "charging_time_dc_minutes": v.charging_time_dc_minutes,
        "length_mm": v.length_mm, "width_mm": v.width_mm, "height_mm": v.height_mm,
        "wheelbase_mm": v.wheelbase_mm, "ground_clearance_mm": v.ground_clearance_mm,
        "boot_space_litres": v.boot_space_litres, "fuel_tank_litres": v.fuel_tank_litres,
        "kerb_weight_kg": v.kerb_weight_kg, "number_of_doors": v.number_of_doors,
        "num_airbags": v.num_airbags, "has_abs": v.has_abs,
        "has_esp": v.has_esp, "has_adas": v.has_adas,
        "adas_features": v.adas_features, "has_cruise_control": v.has_cruise_control,
        "infotainment_screen_inches": v.infotainment_screen_inches,
        "has_apple_carplay": v.has_apple_carplay, "has_android_auto": v.has_android_auto,
        "has_wireless_charging": v.has_wireless_charging,
        "has_ventilated_seats": v.has_ventilated_seats,
        "has_360_camera": v.has_360_camera,
        "warranty_years": v.warranty_years, "warranty_km": v.warranty_km,
        "launch_year": v.launch_year, "tagline": v.tagline, "description": v.description,
        "variants": v.variants if hasattr(v, "variants") else [],
        "images": v.images if hasattr(v, "images") else [],
    })


@router.post("", response_model=ComparisonResponse, summary="Compare 2-4 vehicles side by side")
async def compare_vehicles(
    request: ComparisonRequest,
    current_user=Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Compare 2-4 vehicles. Returns a structured comparison table with winner detection
    and an AI-generated neutral summary.
    """
    user_id = current_user.id if current_user else None
    comp = await ComparisonService.compare(db, request.vehicle_ids, user_id)

    return ComparisonResponse(
        id=comp.id,
        vehicles=[vehicle_to_detail(v) for v in comp._vehicles],
        comparison_table=comp._table,
        ai_summary=comp.ai_summary,
        ai_verdict=comp.ai_verdict,
        created_at=comp.created_at,
    )


@router.get("/{comparison_id}", response_model=ComparisonResponse, summary="Get a saved comparison")
async def get_comparison(
    comparison_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    comp = await ComparisonService.get_comparison(db, comparison_id)
    return ComparisonResponse(
        id=comp.id,
        vehicles=[vehicle_to_detail(v) for v in comp._vehicles],
        comparison_table=comp._table,
        ai_summary=comp.ai_summary,
        ai_verdict=comp.ai_verdict,
        created_at=comp.created_at,
    )
