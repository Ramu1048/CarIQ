"""
CarIQ Backend — Purchase Service
"""
from __future__ import annotations
import logging
import uuid
import random
import string
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.purchase import Purchase
from app.models.vehicle import Vehicle
from app.schemas.purchase import PurchaseCreate, PurchaseStatusUpdate
from app.services.finance_service import FinanceService

logger = logging.getLogger(__name__)

VALID_STATUS_TRANSITIONS = {
    "initiated": ["details_pending", "cancelled"],
    "details_pending": ["documents_pending", "cancelled"],
    "documents_pending": ["finance_pending", "payment_pending", "cancelled"],
    "finance_pending": ["payment_pending", "cancelled"],
    "payment_pending": ["booked", "cancelled"],
    "booked": ["processing", "cancelled"],
    "processing": ["completed", "cancelled"],
    "completed": [],
    "cancelled": [],
}


def generate_reference_number() -> str:
    """Generate a unique purchase reference: CIQ-XXXXXXXX."""
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"CIQ-{suffix}"


class PurchaseService:

    @staticmethod
    async def create_purchase(
        db: AsyncSession,
        data: PurchaseCreate,
        customer_id: uuid.UUID,
    ) -> Purchase:
        # Verify vehicle exists
        vehicle = await db.get(Vehicle, data.vehicle_id)
        if not vehicle or vehicle.is_deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

        # Calculate EMI if financed
        monthly_emi = None
        if data.is_financed and data.loan_amount and data.interest_rate and data.loan_tenure_months:
            monthly_emi = FinanceService.calculate_emi(
                data.loan_amount, data.interest_rate, data.loan_tenure_months
            )

        purchase = Purchase(
            id=uuid.uuid4(),
            customer_id=customer_id,
            vehicle_id=data.vehicle_id,
            variant_id=data.variant_id,
            reference_number=generate_reference_number(),
            status="initiated",
            agreed_price=vehicle.ex_showroom_price,
            booking_amount=int(vehicle.ex_showroom_price * 0.02),  # 2% booking amount
            is_financed=data.is_financed,
            loan_amount=data.loan_amount,
            down_payment=data.down_payment,
            interest_rate=data.interest_rate,
            loan_tenure_months=data.loan_tenure_months,
            monthly_emi=monthly_emi,
            customer_address=data.customer_address,
            delivery_pincode=data.delivery_pincode,
            customer_notes=data.customer_notes,
        )
        db.add(purchase)
        await db.commit()
        await db.refresh(purchase)
        logger.info(f"Purchase created: {purchase.reference_number}")
        return purchase

    @staticmethod
    async def get_purchase(
        db: AsyncSession,
        purchase_id: uuid.UUID,
        customer_id: Optional[uuid.UUID] = None,
        is_admin: bool = False,
    ) -> Purchase:
        query = (
            select(Purchase)
            .where(Purchase.id == purchase_id, Purchase.is_deleted == False)  # noqa: E712
            .options(
                selectinload(Purchase.vehicle).selectinload(Vehicle.brand),
                selectinload(Purchase.vehicle).selectinload(Vehicle.images),
            )
        )
        if not is_admin:
            query = query.where(Purchase.customer_id == customer_id)

        result = await db.execute(query)
        purchase = result.scalar_one_or_none()
        if not purchase:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")
        return purchase

    @staticmethod
    async def list_purchases(
        db: AsyncSession,
        customer_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Purchase], int]:
        query = (
            select(Purchase)
            .where(Purchase.is_deleted == False)  # noqa: E712
            .options(
                selectinload(Purchase.vehicle).selectinload(Vehicle.brand),
                selectinload(Purchase.vehicle).selectinload(Vehicle.images),
            )
        )
        if customer_id:
            query = query.where(Purchase.customer_id == customer_id)

        total_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        result = await db.execute(query.order_by(Purchase.created_at.desc()).offset(offset).limit(page_size))
        return list(result.scalars().all()), total

    @staticmethod
    async def update_status(
        db: AsyncSession,
        purchase_id: uuid.UUID,
        update: PurchaseStatusUpdate,
        is_admin: bool = False,
    ) -> Purchase:
        purchase = await db.get(Purchase, purchase_id)
        if not purchase:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")

        valid_next = VALID_STATUS_TRANSITIONS.get(purchase.status, [])
        if update.status not in valid_next:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from '{purchase.status}' to '{update.status}'. Valid transitions: {valid_next}",
            )

        now = datetime.now(timezone.utc)
        purchase.status = update.status
        if update.admin_notes:
            purchase.admin_notes = update.admin_notes

        if update.status == "booked":
            purchase.booked_at = now
        elif update.status == "completed":
            purchase.completed_at = now
        elif update.status == "cancelled":
            purchase.cancelled_at = now

        await db.commit()
        await db.refresh(purchase)
        return purchase
