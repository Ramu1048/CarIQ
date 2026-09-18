"""
CarIQ Backend — Notification Service
"""
from __future__ import annotations
import json
import logging
import uuid
from typing import List, Optional, Tuple
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification

logger = logging.getLogger(__name__)


class NotificationService:

    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: uuid.UUID,
        type: str,
        title: str,
        body: str,
        data: Optional[dict] = None,
    ) -> Notification:
        notif = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            data_json=json.dumps(data) if data else None,
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        return notif

    @staticmethod
    async def list_notifications(
        db: AsyncSession,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        unread_only: bool = False,
    ) -> Tuple[List[Notification], int]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)  # noqa: E712

        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar_one()

        offset = (page - 1) * page_size
        result = await db.execute(
            query.order_by(Notification.created_at.desc()).offset(offset).limit(page_size)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def mark_read(
        db: AsyncSession,
        notification_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Notification:
        notif = await db.get(Notification, notification_id)
        if not notif or notif.user_id != user_id:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(notif)
        return notif

    @staticmethod
    async def mark_all_read(db: AsyncSession, user_id: uuid.UUID) -> int:
        from sqlalchemy import update
        result = await db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read == False,  # noqa: E712
            )
        )
        notifications = result.scalars().all()
        now = datetime.now(timezone.utc)
        for n in notifications:
            n.is_read = True
            n.read_at = now
        await db.commit()
        return len(notifications)
