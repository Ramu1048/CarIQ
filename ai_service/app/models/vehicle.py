from typing import List, Optional
from pydantic import BaseModel, Field


class Vehicle(BaseModel):
    id: str
    brand: str
    model: str
    variant: Optional[str] = None
    body_type: str  # SUV, Sedan, Hatchback, MUV
    segment: Optional[str] = None
    price_min: int = Field(description="Minimum price in INR")
    price_max: int = Field(description="Maximum price in INR")
    ex_showroom_price: int = Field(description="Typical ex-showroom price in INR")
    fuel_type: str  # Petrol, Diesel, Electric, Strong Hybrid, CNG
    transmission: str  # Manual, Automatic, AMT, CVT, DCT, e-CVT
    engine_displacement_cc: int = 0
    power_bhp: int = 0
    torque_nm: int = 0
    mileage_kmpl: float = 0.0
    battery_capacity_kwh: Optional[float] = None
    claimed_range_km: Optional[int] = None
    real_world_range_km: Optional[int] = None
    fast_charging_time_mins: Optional[int] = None
    seating_capacity: int = 5
    boot_space_litres: int = 0
    ground_clearance_mm: int = 0
    safety_rating_ncap: int = 0  # 0 to 5
    airbags_count: int = 2
    features: List[str] = Field(default_factory=list)
    maintenance_cost_annual_inr: int = 7000
    warranty_years: int = 3
    warranty_km: int = 100000
    pros: List[str] = Field(default_factory=list)
    cons: List[str] = Field(default_factory=list)
    ideal_for: List[str] = Field(default_factory=list)


class VehicleFilter(BaseModel):
    brand: Optional[str] = None
    body_type: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    min_seating: Optional[int] = None
    min_mileage: Optional[float] = None
    min_safety_rating: Optional[int] = None
    min_ground_clearance: Optional[int] = None
    features_required: Optional[List[str]] = None
