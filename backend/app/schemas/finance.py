"""
CarIQ Backend — Finance / EMI Schemas
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import Field

from app.schemas.common import CarIQBase


class EMIRequest(CarIQBase):
    vehicle_price: int = Field(..., ge=50000, description="Vehicle ex-showroom price in INR")
    down_payment: int = Field(..., ge=0)
    interest_rate_annual: float = Field(..., ge=0.1, le=30.0, description="Annual interest rate %")
    tenure_months: int = Field(..., ge=6, le=84, description="Loan tenure in months")
    vehicle_id: Optional[uuid.UUID] = None

    @property
    def loan_amount(self) -> int:
        return max(0, self.vehicle_price - self.down_payment)


class AmortizationEntry(CarIQBase):
    month: int
    emi: float
    principal: float
    interest: float
    balance: float


class EMIResponse(CarIQBase):
    vehicle_price: int
    down_payment: int
    loan_amount: int
    interest_rate_annual: float
    tenure_months: int
    monthly_emi: float
    total_interest: float
    total_repayment: float
    amortization_schedule: List[AmortizationEntry]


class AffordabilityRequest(CarIQBase):
    monthly_income: int = Field(..., ge=10000)
    existing_emi: int = Field(default=0, ge=0)
    down_payment_available: int = Field(..., ge=0)
    preferred_tenure_months: int = Field(default=60, ge=6, le=84)
    interest_rate_annual: float = Field(default=9.0, ge=0.1, le=30.0)


class AffordabilityResponse(CarIQBase):
    max_emi: float
    max_loan_amount: float
    max_vehicle_price: float
    monthly_income: int
    existing_emi: int
    disposable_income: float
    recommendation: str


class TenureComparisonRequest(CarIQBase):
    vehicle_price: int
    down_payment: int
    interest_rate_annual: float = Field(default=9.0)
    tenures: List[int] = Field(default=[24, 36, 48, 60, 72, 84])


class TenureComparisonItem(CarIQBase):
    tenure_months: int
    monthly_emi: float
    total_interest: float
    total_repayment: float


class TenureComparisonResponse(CarIQBase):
    loan_amount: int
    interest_rate_annual: float
    options: List[TenureComparisonItem]
