"""
CarIQ Backend — Payments Router
"""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.payment import CreatePaymentRequest, VerifyPaymentRequest, PaymentOut
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/create", response_model=PaymentOut, status_code=201, summary="Create payment order")
async def create_payment(
    request: CreatePaymentRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a payment order with the configured provider.
    Returns provider order details for client-side checkout.
    Never stores card/CVV/sensitive payment credentials.
    """
    return await PaymentService.create_payment(db, request, current_user.id)


@router.post("/verify", response_model=PaymentOut, summary="Verify payment after checkout")
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify payment signature after user completes checkout.
    On success, marks payment as captured and updates purchase status.
    """
    return await PaymentService.verify_payment(db, request, current_user.id)


@router.get("/{payment_id}", response_model=PaymentOut, summary="Get payment details")
async def get_payment(
    payment_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    is_admin = current_user.role == "admin"
    return await PaymentService.get_payment(db, payment_id, current_user.id, is_admin)
