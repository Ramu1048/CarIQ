"""
CarIQ Backend — Auth Service
Handles registration, login, token refresh, password reset, email verification
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenResponse

logger = logging.getLogger(__name__)


class AuthService:

    @staticmethod
    async def register(db: AsyncSession, data: RegisterRequest) -> User:
        """Register a new customer account."""
        # Check email uniqueness
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        user = User(
            id=uuid.uuid4(),
            email=data.email,
            full_name=data.full_name,
            phone=data.phone,
            hashed_password=hash_password(data.password),
            role="customer",
            is_active=True,
            is_email_verified=False,
            email_verification_token=create_email_verification_token(data.email),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"New user registered: {user.email}")
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> User:
        """Validate credentials and return the User."""
        result = await db.execute(
            select(User).where(User.email == email, User.is_deleted == False)  # noqa: E712
        )
        user: Optional[User] = result.scalar_one_or_none()

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Contact support.",
            )

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()
        return user

    @staticmethod
    def create_tokens(user: User) -> TokenResponse:
        """Create access + refresh tokens for a user."""
        access_token = create_access_token(
            subject=str(user.id),
            additional_claims={"role": user.role, "email": user.email},
        )
        refresh_token = create_refresh_token(subject=str(user.id))
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @staticmethod
    async def refresh_access_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
        """Exchange a valid refresh token for a new access token."""
        user_id = verify_token(refresh_token, expected_type="refresh")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        result = await db.execute(
            select(User).where(User.id == uuid.UUID(user_id), User.is_deleted == False)  # noqa: E712
        )
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

        return AuthService.create_tokens(user)

    @staticmethod
    async def initiate_password_reset(db: AsyncSession, email: str) -> str:
        """Generate a password reset token (email sending handled separately)."""
        result = await db.execute(select(User).where(User.email == email, User.is_deleted == False))  # noqa: E712
        user: Optional[User] = result.scalar_one_or_none()
        if not user:
            # Return success even if user doesn't exist (prevent email enumeration)
            return "If this email exists, a reset link has been sent"

        token = create_password_reset_token(email)
        user.password_reset_token = token
        user.password_reset_expires = datetime.now(timezone.utc).replace(
            hour=datetime.now(timezone.utc).hour + 1
        )
        await db.commit()
        logger.info(f"Password reset initiated for: {email}")
        return token

    @staticmethod
    async def reset_password(db: AsyncSession, token: str, new_password: str) -> bool:
        """Apply a new password using a valid reset token."""
        email = verify_token(token, expected_type="password_reset")
        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

        result = await db.execute(select(User).where(User.email == email))
        user: Optional[User] = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.hashed_password = hash_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        await db.commit()
        logger.info(f"Password reset completed for: {email}")
        return True

    @staticmethod
    async def verify_email(db: AsyncSession, token: str) -> bool:
        """Mark email as verified using verification token."""
        email = verify_token(token, expected_type="email_verification")
        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")

        result = await db.execute(select(User).where(User.email == email))
        user: Optional[User] = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.is_email_verified = True
        user.email_verification_token = None
        await db.commit()
        return True
