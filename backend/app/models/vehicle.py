"""
CarIQ Backend — Vehicle Model
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Enum, Float, Integer,
    String, Text, ForeignKey, func, Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = (
        Index("ix_vehicles_price", "ex_showroom_price"),
        Index("ix_vehicles_fuel_type", "fuel_type"),
        Index("ix_vehicles_body_type", "body_type"),
        Index("ix_vehicles_transmission", "transmission"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False, index=True)

    # Identity
    model_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    tagline: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Classification
    body_type: Mapped[str] = mapped_column(
        Enum("hatchback", "sedan", "suv", "muv", "coupe", "convertible",
             "pickup", "van", "wagon", "crossover", name="body_type_enum"),
        nullable=False,
    )
    vehicle_type: Mapped[str] = mapped_column(
        Enum("new", "used", "certified_used", name="vehicle_type_enum"),
        default="new", nullable=False,
    )
    fuel_type: Mapped[str] = mapped_column(
        Enum("petrol", "diesel", "cng", "electric", "hybrid", "lpg", name="fuel_type_enum"),
        nullable=False,
    )
    transmission: Mapped[str] = mapped_column(
        Enum("manual", "automatic", "amt", "cvt", "dct", name="transmission_enum"),
        nullable=False,
    )

    # Pricing (in INR)
    ex_showroom_price: Mapped[int] = mapped_column(Integer, nullable=False)
    on_road_price_approx: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Engine & Performance
    engine_cc: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    engine_description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    horsepower: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    torque_nm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mileage_kmpl: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    top_speed_kmph: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    acceleration_0_100: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # EV-specific
    battery_capacity_kwh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ev_range_km: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    charging_time_ac_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    charging_time_dc_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Dimensions
    length_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    width_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    wheelbase_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ground_clearance_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    boot_space_litres: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fuel_tank_litres: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    kerb_weight_kg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Seating & Capacity
    seating_capacity: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    number_of_doors: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Safety
    safety_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # NCAP stars (0-5)
    num_airbags: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    has_abs: Mapped[bool] = mapped_column(Boolean, default=False)
    has_esp: Mapped[bool] = mapped_column(Boolean, default=False)
    has_adas: Mapped[bool] = mapped_column(Boolean, default=False)
    adas_features: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array

    # Features
    has_sunroof: Mapped[bool] = mapped_column(Boolean, default=False)
    has_cruise_control: Mapped[bool] = mapped_column(Boolean, default=False)
    infotainment_screen_inches: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    has_apple_carplay: Mapped[bool] = mapped_column(Boolean, default=False)
    has_android_auto: Mapped[bool] = mapped_column(Boolean, default=False)
    has_wireless_charging: Mapped[bool] = mapped_column(Boolean, default=False)
    has_ventilated_seats: Mapped[bool] = mapped_column(Boolean, default=False)
    has_360_camera: Mapped[bool] = mapped_column(Boolean, default=False)

    # Warranty
    warranty_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    warranty_km: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Launch & Status
    launch_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    popularity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    brand: Mapped["Brand"] = relationship("Brand", back_populates="vehicles")  # noqa: F821
    variants: Mapped[list["Variant"]] = relationship("Variant", back_populates="vehicle", cascade="all, delete-orphan")  # noqa: F821
    images: Mapped[list["VehicleImage"]] = relationship("VehicleImage", back_populates="vehicle", cascade="all, delete-orphan")  # noqa: F821
    wishlists: Mapped[list["Wishlist"]] = relationship("Wishlist", back_populates="vehicle")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Vehicle id={self.id} model={self.model_name}>"


class VehicleImage(Base):
    __tablename__ = "vehicle_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt_text: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="images")
