"""
CarIQ Backend — Purchase Schemas
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import CarIQBase
from app.schemas.vehicle import VehicleSummary


class PurchaseCreate(CarIQBase):
    vehicle_id: uuid.UUID
    variant_id: Optional[uuid.UUID] = None
    is_financed: bool = False
    down_payment: Optional[int] = Field(None, ge=0)
    loan_amount: Optional[int] = Field(None, ge=0)
    interest_rate: Optional[float] = Field(None, ge=0)
    loan_tenure_months: Optional[int] = Field(None, ge=6, le=84)
    customer_address: Optional[str] = None
    delivery_pincode: Optional[str] = Field(None, max_length=10)
    customer_notes: Optional[str] = None


class PurchaseStatusUpdate(CarIQBase):
    status: str
    admin_notes: Optional[str] = None


class PurchaseSummary(CarIQBase):
    id: uuid.UUID
    reference_number: str
    status: str
    agreed_price: int
    booking_amount: Optional[int] = None
    is_financed: bool
    monthly_emi: Optional[float] = None
    vehicle: VehicleSummary
    created_at: datetime
    updated_at: datetime


class PurchaseDetail(PurchaseSummary):
    customer_id: uuid.UUID
    variant_id: Optional[uuid.UUID] = None
    discount_amount: int
    loan_amount: Optional[int] = None
    down_payment: Optional[int] = None
    interest_rate: Optional[float] = None
    loan_tenure_months: Optional[int] = None
    finance_provider: Optional[str] = None
    customer_address: Optional[str] = None
    delivery_pincode: Optional[str] = None
    customer_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    booked_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
