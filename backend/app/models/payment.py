"""
CarIQ Backend — Payment Model
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, Integer, String, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("purchases.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Payment details
    payment_type: Mapped[str] = mapped_column(
        Enum("booking", "purchase", "refund", "emi", name="payment_type_enum"),
        nullable=False,
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # In paise / cents
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)

    # Provider details (never store card/CVV here)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)  # mock | razorpay | stripe
    provider_payment_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    provider_order_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    provider_signature: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        Enum("created", "pending", "captured", "failed", "refunded", name="payment_status_enum"),
        default="created", nullable=False, index=True,
    )

    # Metadata (safe to store)
    payment_method_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # upi | card | netbanking | wallet
    failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Additional provider data

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    captured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    purchase: Mapped["Purchase"] = relationship("Purchase", back_populates="payments")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Payment id={self.id} amount={self.amount} status={self.status}>"
