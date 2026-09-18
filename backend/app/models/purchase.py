"""
CarIQ Backend — Purchase Model
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, Integer, String, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True)
    variant_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("variants.id"), nullable=True)

    # Reference number
    reference_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)

    # Status
    status: Mapped[str] = mapped_column(
        Enum(
            "initiated", "details_pending", "documents_pending",
            "finance_pending", "payment_pending", "booked",
            "processing", "completed", "cancelled",
            name="purchase_status_enum",
        ),
        default="initiated", nullable=False, index=True,
    )

    # Pricing snapshot at time of purchase
    agreed_price: Mapped[int] = mapped_column(Integer, nullable=False)
    booking_amount: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    discount_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Financing
    is_financed: Mapped[bool] = mapped_column(Boolean, default=False)
    loan_amount: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    down_payment: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    interest_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    loan_tenure_months: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    monthly_emi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    finance_provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Customer Details
    customer_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivery_pincode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Notes
    customer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Soft delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    booked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    customer: Mapped["User"] = relationship("User", back_populates="purchases")  # noqa: F821
    vehicle: Mapped["Vehicle"] = relationship("Vehicle")  # noqa: F821
    variant: Mapped[Optional["Variant"]] = relationship("Variant")  # noqa: F821
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="purchase", cascade="all, delete-orphan")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Purchase id={self.id} ref={self.reference_number} status={self.status}>"
