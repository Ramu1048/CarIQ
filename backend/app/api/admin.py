"""
CarIQ Backend — Admin Router
Dashboard, user management, purchase management
"""
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.purchase import Purchase
from app.models.recommendation import Recommendation
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.payment import Payment
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.purchase import PurchaseSummary, PurchaseStatusUpdate
from app.schemas.user import UserPublic
from app.services.purchase_service import PurchaseService
from app.utils.pagination import paginate

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", summary="Admin dashboard statistics")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> Dict[str, Any]:
    """Returns platform-wide statistics for the admin dashboard."""

    # Counts
    total_users = (await db.execute(select(func.count()).select_from(User).where(User.is_deleted == False))).scalar_one()  # noqa
    active_users = (await db.execute(select(func.count()).select_from(User).where(User.is_deleted == False, User.is_active == True))).scalar_one()  # noqa
    total_vehicles = (await db.execute(select(func.count()).select_from(Vehicle).where(Vehicle.is_deleted == False))).scalar_one()  # noqa
    total_recommendations = (await db.execute(select(func.count()).select_from(Recommendation))).scalar_one()
    total_purchases = (await db.execute(select(func.count()).select_from(Purchase).where(Purchase.is_deleted == False))).scalar_one()  # noqa
    pending_purchases = (await db.execute(
        select(func.count()).select_from(Purchase).where(
            Purchase.is_deleted == False,  # noqa
            Purchase.status.in_(["initiated", "details_pending", "documents_pending", "finance_pending", "payment_pending", "booked", "processing"])
        )
    )).scalar_one()
    completed_purchases = (await db.execute(
        select(func.count()).select_from(Purchase).where(Purchase.is_deleted == False, Purchase.status == "completed")  # noqa
    )).scalar_one()

    # Revenue
    revenue_result = await db.execute(
        select(func.sum(Payment.amount)).where(Payment.status == "captured")
    )
    revenue = revenue_result.scalar_one() or 0

    # Popular vehicles (top 5 by popularity score)
    popular_result = await db.execute(
        select(Vehicle.id, Vehicle.model_name, Vehicle.popularity_score)
        .where(Vehicle.is_deleted == False, Vehicle.is_active == True)  # noqa
        .order_by(Vehicle.popularity_score.desc())
        .limit(5)
    )
    popular_vehicles = [{"id": str(r[0]), "name": r[1], "score": r[2]} for r in popular_result]

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_vehicles": total_vehicles,
        "total_recommendations": total_recommendations,
        "total_purchases": total_purchases,
        "pending_purchases": pending_purchases,
        "completed_purchases": completed_purchases,
        "revenue_inr": revenue,
        "popular_vehicles": popular_vehicles,
    }


@router.get("/users", summary="List all users")
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> PaginatedResponse:
    query = select(User).where(User.is_deleted == False)  # noqa
    if role:
        query = query.where(User.role == role)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(User.created_at.desc()).offset(offset).limit(page_size))
    users = list(result.scalars().all())
    return paginate([UserPublic.model_validate(u) for u in users], total, page, page_size)


@router.get("/purchases", summary="List all purchases")
async def list_all_purchases(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> PaginatedResponse:
    from sqlalchemy.orm import selectinload
    from app.models.vehicle import Vehicle as VehicleModel

    query = select(Purchase).where(Purchase.is_deleted == False)  # noqa
    if status:
        query = query.where(Purchase.status == status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    result = await db.execute(
        query.options(
            selectinload(Purchase.vehicle).selectinload(VehicleModel.brand),
            selectinload(Purchase.vehicle).selectinload(VehicleModel.images),
        )
        .order_by(Purchase.created_at.desc())
        .offset(offset).limit(page_size)
    )
    purchases = list(result.scalars().all())
    return paginate([PurchaseSummary.model_validate(p) for p in purchases], total, page, page_size)


@router.put("/purchases/{purchase_id}/status", response_model=SuccessResponse, summary="Update purchase status")
async def admin_update_purchase_status(
    purchase_id: uuid.UUID,
    data: PurchaseStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    await PurchaseService.update_status(db, purchase_id, data, is_admin=True)
    return SuccessResponse(message=f"Purchase status updated to '{data.status}'")
