"""
CarIQ Backend — Vehicle Schemas
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import Field, field_validator

from app.schemas.common import CarIQBase


# ── Brand ─────────────────────────────────────────────────────────────────────
class BrandBase(CarIQBase):
    name: str = Field(..., min_length=1, max_length=100)
    country_of_origin: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    founded_year: Optional[int] = None
    logo_url: Optional[str] = None


class BrandCreate(BrandBase):
    pass


class BrandUpdate(CarIQBase):
    name: Optional[str] = None
    country_of_origin: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    founded_year: Optional[int] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None


class BrandOut(BrandBase):
    id: uuid.UUID
    slug: str
    is_active: bool
    created_at: datetime
    vehicle_count: Optional[int] = None


# ── Vehicle Image ─────────────────────────────────────────────────────────────
class VehicleImageOut(CarIQBase):
    id: uuid.UUID
    url: str
    alt_text: Optional[str] = None
    color: Optional[str] = None
    is_primary: bool
    sort_order: int


# ── Variant ───────────────────────────────────────────────────────────────────
class VariantOut(CarIQBase):
    id: uuid.UUID
    name: str
    slug: str
    ex_showroom_price: int
    on_road_price_approx: Optional[int] = None
    mileage_kmpl: Optional[float] = None
    engine_cc: Optional[int] = None
    horsepower: Optional[float] = None
    torque_nm: Optional[float] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    additional_features: Optional[str] = None
    color_options: Optional[str] = None
    is_active: bool
    sort_order: int


class VariantCreate(CarIQBase):
    name: str
    ex_showroom_price: int = Field(..., ge=0)
    on_road_price_approx: Optional[int] = None
    mileage_kmpl: Optional[float] = None
    engine_cc: Optional[int] = None
    horsepower: Optional[float] = None
    torque_nm: Optional[float] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    additional_features: Optional[str] = None
    color_options: Optional[str] = None
    sort_order: int = 0


# ── Vehicle ───────────────────────────────────────────────────────────────────
class VehicleBase(CarIQBase):
    model_name: str = Field(..., min_length=1, max_length=150)
    tagline: Optional[str] = None
    description: Optional[str] = None
    body_type: str
    vehicle_type: str = "new"
    fuel_type: str
    transmission: str
    ex_showroom_price: int = Field(..., ge=0)
    on_road_price_approx: Optional[int] = None
    engine_cc: Optional[int] = None
    engine_description: Optional[str] = None
    horsepower: Optional[float] = None
    torque_nm: Optional[float] = None
    mileage_kmpl: Optional[float] = None
    top_speed_kmph: Optional[int] = None
    acceleration_0_100: Optional[float] = None
    battery_capacity_kwh: Optional[float] = None
    ev_range_km: Optional[int] = None
    charging_time_ac_hours: Optional[float] = None
    charging_time_dc_minutes: Optional[int] = None
    length_mm: Optional[int] = None
    width_mm: Optional[int] = None
    height_mm: Optional[int] = None
    wheelbase_mm: Optional[int] = None
    ground_clearance_mm: Optional[int] = None
    boot_space_litres: Optional[int] = None
    fuel_tank_litres: Optional[int] = None
    kerb_weight_kg: Optional[int] = None
    seating_capacity: int = 5
    number_of_doors: Optional[int] = None
    safety_rating: Optional[float] = Field(None, ge=0, le=5)
    num_airbags: Optional[int] = None
    has_abs: bool = False
    has_esp: bool = False
    has_adas: bool = False
    adas_features: Optional[str] = None
    has_sunroof: bool = False
    has_cruise_control: bool = False
    infotainment_screen_inches: Optional[float] = None
    has_apple_carplay: bool = False
    has_android_auto: bool = False
    has_wireless_charging: bool = False
    has_ventilated_seats: bool = False
    has_360_camera: bool = False
    warranty_years: Optional[int] = None
    warranty_km: Optional[int] = None
    launch_year: Optional[int] = None


class VehicleCreate(VehicleBase):
    brand_id: uuid.UUID


class VehicleUpdate(CarIQBase):
    model_name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    ex_showroom_price: Optional[int] = None
    on_road_price_approx: Optional[int] = None
    mileage_kmpl: Optional[float] = None
    is_active: Optional[bool] = None
    safety_rating: Optional[float] = None
    has_sunroof: Optional[bool] = None
    has_adas: Optional[bool] = None
    num_airbags: Optional[int] = None


class VehicleSummary(CarIQBase):
    """Compact vehicle representation for lists."""
    id: uuid.UUID
    model_name: str
    slug: str
    body_type: str
    fuel_type: str
    transmission: str
    ex_showroom_price: int
    on_road_price_approx: Optional[int] = None
    mileage_kmpl: Optional[float] = None
    seating_capacity: int
    safety_rating: Optional[float] = None
    has_sunroof: bool
    ev_range_km: Optional[int] = None
    popularity_score: float
    brand: BrandOut
    primary_image_url: Optional[str] = None
    created_at: datetime


class VehicleDetail(VehicleSummary):
    """Full vehicle with variants and images."""
    vehicle_type: str
    engine_cc: Optional[int] = None
    engine_description: Optional[str] = None
    horsepower: Optional[float] = None
    torque_nm: Optional[float] = None
    top_speed_kmph: Optional[int] = None
    acceleration_0_100: Optional[float] = None
    battery_capacity_kwh: Optional[float] = None
    charging_time_ac_hours: Optional[float] = None
    charging_time_dc_minutes: Optional[int] = None
    length_mm: Optional[int] = None
    width_mm: Optional[int] = None
    height_mm: Optional[int] = None
    wheelbase_mm: Optional[int] = None
    ground_clearance_mm: Optional[int] = None
    boot_space_litres: Optional[int] = None
    fuel_tank_litres: Optional[int] = None
    kerb_weight_kg: Optional[int] = None
    number_of_doors: Optional[int] = None
    num_airbags: Optional[int] = None
    has_abs: bool
    has_esp: bool
    has_adas: bool
    adas_features: Optional[str] = None
    has_cruise_control: bool
    infotainment_screen_inches: Optional[float] = None
    has_apple_carplay: bool
    has_android_auto: bool
    has_wireless_charging: bool
    has_ventilated_seats: bool
    has_360_camera: bool
    warranty_years: Optional[int] = None
    warranty_km: Optional[int] = None
    launch_year: Optional[int] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    variants: List[VariantOut] = []
    images: List[VehicleImageOut] = []


# ── Filters ───────────────────────────────────────────────────────────────────
class VehicleFilterParams(CarIQBase):
    min_price: Optional[int] = Field(None, ge=0)
    max_price: Optional[int] = Field(None, ge=0)
    brand_id: Optional[uuid.UUID] = None
    brand_slug: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    body_type: Optional[str] = None
    min_seating: Optional[int] = Field(None, ge=2)
    max_seating: Optional[int] = Field(None, le=10)
    min_mileage: Optional[float] = Field(None, ge=0)
    min_safety_rating: Optional[float] = Field(None, ge=0, le=5)
    is_ev: Optional[bool] = None
    has_sunroof: Optional[bool] = None
    has_adas: Optional[bool] = None
    vehicle_type: Optional[str] = None
    sort_by: Optional[str] = Field(
        default="popularity",
        description="price_asc | price_desc | mileage | popularity | newest"
    )
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
