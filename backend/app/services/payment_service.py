"""
CarIQ Backend — Payment Service (Provider Abstraction)
Supports Mock, Razorpay, Stripe. Never stores sensitive card data.
"""
from __future__ import annotations
import hashlib
import hmac
import json
import logging
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.payment import Payment
from app.models.purchase import Purchase
from app.schemas.payment import CreatePaymentRequest, VerifyPaymentRequest

logger = logging.getLogger(__name__)


# ── Base Provider ─────────────────────────────────────────────────────────────
class BasePaymentProvider(ABC):
    @abstractmethod
    async def create_order(self, amount: int, currency: str, reference: str) -> Dict:
        ...

    @abstractmethod
    async def verify_payment(self, payment_id: str, order_id: str, signature: str) -> bool:
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...


# ── Mock Provider ─────────────────────────────────────────────────────────────
class MockPaymentProvider(BasePaymentProvider):
    @property
    def provider_name(self) -> str:
        return "mock"

    async def create_order(self, amount: int, currency: str, reference: str) -> Dict:
        mock_order_id = f"mock_order_{uuid.uuid4().hex[:12]}"
        return {
            "order_id": mock_order_id,
            "amount": amount,
            "currency": currency,
            "reference": reference,
            "status": "created",
            "provider": "mock",
            "checkout_url": None,
        }

    async def verify_payment(self, payment_id: str, order_id: str, signature: str) -> bool:
        # Mock: auto-approve any payment with "mock_" prefix
        return payment_id.startswith("mock_") or order_id.startswith("mock_")


# ── Razorpay Provider ─────────────────────────────────────────────────────────
class RazorpayPaymentProvider(BasePaymentProvider):
    @property
    def provider_name(self) -> str:
        return "razorpay"

    async def create_order(self, amount: int, currency: str, reference: str) -> Dict:
        try:
            import razorpay
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            order = client.order.create({
                "amount": amount,
                "currency": currency,
                "receipt": reference,
            })
            return {
                "order_id": order["id"],
                "amount": amount,
                "currency": currency,
                "reference": reference,
                "status": order["status"],
                "provider": "razorpay",
                "key_id": settings.RAZORPAY_KEY_ID,
            }
        except ImportError:
            raise HTTPException(status_code=500, detail="Razorpay SDK not installed")

    async def verify_payment(self, payment_id: str, order_id: str, signature: str) -> bool:
        if not settings.RAZORPAY_KEY_SECRET:
            return False
        msg = f"{order_id}|{payment_id}"
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(), msg.encode(), hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


# ── Factory ────────────────────────────────────────────────────────────────────
def get_payment_provider() -> BasePaymentProvider:
    provider = settings.PAYMENT_PROVIDER.lower()
    if provider == "razorpay" and settings.RAZORPAY_KEY_ID:
        return RazorpayPaymentProvider()
    return MockPaymentProvider()


# ── Payment Service ────────────────────────────────────────────────────────────
class PaymentService:

    @staticmethod
    async def create_payment(
        db: AsyncSession,
        request: CreatePaymentRequest,
        user_id: uuid.UUID,
    ) -> Payment:
        # Verify purchase
        purchase = await db.get(Purchase, request.purchase_id)
        if not purchase:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")
        if purchase.customer_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your purchase")

        provider = get_payment_provider()
        order_data = await provider.create_order(
            amount=request.amount,
            currency="INR",
            reference=purchase.reference_number,
        )

        payment = Payment(
            id=uuid.uuid4(),
            purchase_id=request.purchase_id,
            user_id=user_id,
            payment_type=request.payment_type,
            amount=request.amount,
            currency="INR",
            provider=provider.provider_name,
            provider_order_id=order_data.get("order_id"),
            status="created",
            payment_method_type=request.payment_method_type,
            metadata_json=json.dumps(order_data),
        )
        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        return payment

    @staticmethod
    async def verify_payment(
        db: AsyncSession,
        request: VerifyPaymentRequest,
        user_id: uuid.UUID,
    ) -> Payment:
        payment = await db.get(Payment, request.payment_id)
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        if payment.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your payment")

        provider = get_payment_provider()
        is_valid = await provider.verify_payment(
            request.provider_payment_id,
            request.provider_order_id or "",
            request.provider_signature or "",
        )

        if is_valid:
            payment.status = "captured"
            payment.provider_payment_id = request.provider_payment_id
            payment.provider_signature = request.provider_signature
            payment.captured_at = datetime.now(timezone.utc)

            # Update purchase status
            purchase = await db.get(Purchase, payment.purchase_id)
            if purchase and purchase.status == "payment_pending":
                purchase.status = "booked"
                purchase.booked_at = datetime.now(timezone.utc)
        else:
            payment.status = "failed"
            payment.failure_reason = "Signature verification failed"

        await db.commit()
        await db.refresh(payment)
        return payment

    @staticmethod
    async def get_payment(
        db: AsyncSession,
        payment_id: uuid.UUID,
        user_id: uuid.UUID,
        is_admin: bool = False,
    ) -> Payment:
        payment = await db.get(Payment, payment_id)
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        if not is_admin and payment.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return payment
