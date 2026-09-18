"""
CarIQ Backend — Users Router
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.user import UserProfile, UpdateProfileRequest
from app.schemas.common import SuccessResponse
from app.schemas.auth import RegisterRequest
from app.core.security import verify_password, hash_password

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfile, summary="Get full user profile")
async def get_profile(current_user=Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserProfile, summary="Update user profile and preferences")
async def update_profile(
    data: UpdateProfileRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/me", response_model=SuccessResponse, summary="Soft-delete own account")
async def delete_account(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.is_deleted = True
    current_user.is_active = False
    current_user.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return SuccessResponse(message="Account deleted. Contact support to recover it within 30 days.")
