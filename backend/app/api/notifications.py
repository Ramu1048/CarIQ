"""
CarIQ Backend — Notifications Router
"""
import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", summary="Get notifications")
async def get_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    unread_only: bool = False,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    from app.services.notification_service import NotificationService
    from math import ceil

    notifications, total = await NotificationService.list_notifications(
        db, current_user.id, page, page_size, unread_only
    )
    return {
        "items": [
            {
                "id": str(n.id),
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
                "read_at": n.read_at.isoformat() if n.read_at else None,
            }
            for n in notifications
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": ceil(total / page_size) if page_size > 0 else 0,
    }


@router.put("/{notification_id}/read", response_model=SuccessResponse, summary="Mark notification as read")
async def mark_read(
    notification_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.notification_service import NotificationService
    await NotificationService.mark_read(db, notification_id, current_user.id)
    return SuccessResponse(message="Notification marked as read")


@router.put("/read-all", response_model=SuccessResponse, summary="Mark all notifications as read")
async def mark_all_read(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.notification_service import NotificationService
    count = await NotificationService.mark_all_read(db, current_user.id)
    return SuccessResponse(message=f"Marked {count} notifications as read")
