"""
CarIQ Backend — Finance / EMI Calculation Record Model
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FinanceCalculation(Base):
    __tablename__ = "finance_calculations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    vehicle_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)

    # Inputs
    vehicle_price: Mapped[int] = mapped_column(Integer, nullable=False)
    down_payment: Mapped[int] = mapped_column(Integer, nullable=False)
    loan_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    interest_rate_annual: Mapped[float] = mapped_column(Float, nullable=False)
    tenure_months: Mapped[int] = mapped_column(Integer, nullable=False)

    # Results
    monthly_emi: Mapped[float] = mapped_column(Float, nullable=False)
    total_interest: Mapped[float] = mapped_column(Float, nullable=False)
    total_repayment: Mapped[float] = mapped_column(Float, nullable=False)

    # Amortization schedule (JSON)
    amortization_schedule: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<FinanceCalculation id={self.id} emi={self.monthly_emi}>"
