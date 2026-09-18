"""
CarIQ Backend — Vehicles Router
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional, require_admin
from app.schemas.vehicle import (
    VehicleDetail, VehicleSummary, VehicleCreate, VehicleUpdate, VehicleFilterParams,
)
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.services.vehicle_service import VehicleService
from app.utils.helpers import get_primary_image
from app.utils.pagination import paginate

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


def enrich_vehicle_summary(v) -> dict:
    data = {
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
    }
    return data


@router.get("", response_model=PaginatedResponse, summary="List vehicles with filters and sorting")
async def list_vehicles(
    min_price: Optional[int] = Query(None, ge=0),
    max_price: Optional[int] = Query(None, ge=0),
    brand_id: Optional[uuid.UUID] = None,
    fuel_type: Optional[str] = None,
    transmission: Optional[str] = None,
    body_type: Optional[str] = None,
    min_seating: Optional[int] = Query(None, ge=2),
    max_seating: Optional[int] = Query(None, le=10),
    min_mileage: Optional[float] = None,
    min_safety_rating: Optional[float] = Query(None, ge=0, le=5),
    is_ev: Optional[bool] = None,
    has_sunroof: Optional[bool] = None,
    has_adas: Optional[bool] = None,
    vehicle_type: Optional[str] = None,
    sort_by: str = Query(default="popularity", description="price_asc|price_desc|mileage|popularity|newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = VehicleFilterParams(
        min_price=min_price, max_price=max_price, brand_id=brand_id,
        fuel_type=fuel_type, transmission=transmission, body_type=body_type,
        min_seating=min_seating, max_seating=max_seating, min_mileage=min_mileage,
        min_safety_rating=min_safety_rating, is_ev=is_ev, has_sunroof=has_sunroof,
        has_adas=has_adas, vehicle_type=vehicle_type, sort_by=sort_by,
        page=page, page_size=page_size,
    )
    vehicles, total = await VehicleService.list_vehicles(db, filters)
    items = [VehicleSummary.model_validate(enrich_vehicle_summary(v)) for v in vehicles]
    return paginate(items, total, page, page_size)


@router.get("/{vehicle_id}", response_model=VehicleDetail, summary="Get vehicle detail by ID")
async def get_vehicle(
    vehicle_id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await VehicleService.get_vehicle_by_id(db, vehicle_id)
    data = enrich_vehicle_summary(vehicle)
    data.update({
        "vehicle_type": vehicle.vehicle_type,
        "engine_cc": vehicle.engine_cc,
        "engine_description": vehicle.engine_description,
        "horsepower": vehicle.horsepower,
        "torque_nm": vehicle.torque_nm,
        "top_speed_kmph": vehicle.top_speed_kmph,
        "acceleration_0_100": vehicle.acceleration_0_100,
        "battery_capacity_kwh": vehicle.battery_capacity_kwh,
        "charging_time_ac_hours": vehicle.charging_time_ac_hours,
        "charging_time_dc_minutes": vehicle.charging_time_dc_minutes,
        "length_mm": vehicle.length_mm,
        "width_mm": vehicle.width_mm,
        "height_mm": vehicle.height_mm,
        "wheelbase_mm": vehicle.wheelbase_mm,
        "ground_clearance_mm": vehicle.ground_clearance_mm,
        "boot_space_litres": vehicle.boot_space_litres,
        "fuel_tank_litres": vehicle.fuel_tank_litres,
        "kerb_weight_kg": vehicle.kerb_weight_kg,
        "number_of_doors": vehicle.number_of_doors,
        "num_airbags": vehicle.num_airbags,
        "has_abs": vehicle.has_abs,
        "has_esp": vehicle.has_esp,
        "has_adas": vehicle.has_adas,
        "adas_features": vehicle.adas_features,
        "has_cruise_control": vehicle.has_cruise_control,
        "infotainment_screen_inches": vehicle.infotainment_screen_inches,
        "has_apple_carplay": vehicle.has_apple_carplay,
        "has_android_auto": vehicle.has_android_auto,
        "has_wireless_charging": vehicle.has_wireless_charging,
        "has_ventilated_seats": vehicle.has_ventilated_seats,
        "has_360_camera": vehicle.has_360_camera,
        "warranty_years": vehicle.warranty_years,
        "warranty_km": vehicle.warranty_km,
        "launch_year": vehicle.launch_year,
        "tagline": vehicle.tagline,
        "description": vehicle.description,
        "variants": vehicle.variants,
        "images": vehicle.images,
    })
    return VehicleDetail.model_validate(data)


@router.post("", response_model=VehicleDetail, status_code=201, summary="[Admin] Create vehicle")
async def create_vehicle(
    data: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    vehicle = await VehicleService.create_vehicle(db, data)
    return await get_vehicle(vehicle.id, db)


@router.put("/{vehicle_id}", response_model=VehicleDetail, summary="[Admin] Update vehicle")
async def update_vehicle(
    vehicle_id: uuid.UUID,
    data: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    await VehicleService.update_vehicle(db, vehicle_id, data)
    return await get_vehicle(vehicle_id, db)


@router.delete("/{vehicle_id}", response_model=SuccessResponse, summary="[Admin] Soft-delete vehicle")
async def delete_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    await VehicleService.soft_delete_vehicle(db, vehicle_id)
    return SuccessResponse(message="Vehicle deactivated successfully")
