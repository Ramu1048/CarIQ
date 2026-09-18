"""
CarIQ Backend — Variant Model
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Variant(Base):
    __tablename__ = "variants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    ex_showroom_price: Mapped[int] = mapped_column(Integer, nullable=False)
    on_road_price_approx: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Overrides from base vehicle
    mileage_kmpl: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    engine_cc: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    horsepower: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    torque_nm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    transmission: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    fuel_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Additional features in this variant
    additional_features: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON list
    color_options: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON list

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="variants")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Variant id={self.id} name={self.name}>"
