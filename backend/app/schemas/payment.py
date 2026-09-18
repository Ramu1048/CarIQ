"""
CarIQ Backend — Payment Schemas
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import CarIQBase


class CreatePaymentRequest(CarIQBase):
    purchase_id: uuid.UUID
    payment_type: str = Field(default="booking", pattern="^(booking|purchase|refund|emi)$")
    amount: int = Field(..., ge=1, description="Amount in INR paise (multiply rupees by 100)")
    payment_method_type: Optional[str] = None  # upi | card | netbanking | wallet


class VerifyPaymentRequest(CarIQBase):
    payment_id: uuid.UUID
    provider_payment_id: str
    provider_order_id: Optional[str] = None
    provider_signature: Optional[str] = None


class PaymentOut(CarIQBase):
    id: uuid.UUID
    purchase_id: uuid.UUID
    user_id: uuid.UUID
    payment_type: str
    amount: int
    currency: str
    provider: str
    provider_payment_id: Optional[str] = None
    status: str
    payment_method_type: Optional[str] = None
    failure_reason: Optional[str] = None
    created_at: datetime
    captured_at: Optional[datetime] = None
