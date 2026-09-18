"""
CarIQ Backend — Auth Router
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.auth import (
    RegisterRequest, TokenResponse, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest,
    AccessTokenResponse,
)
from app.schemas.user import UserPublic
from app.schemas.common import SuccessResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new customer. Returns the created user profile."""
    user = await AuthService.register(db, data)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and obtain JWT tokens",
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth2 password flow login.
    Returns access token + refresh token.
    """
    user = await AuthService.authenticate(db, form_data.username, form_data.password)
    return AuthService.create_tokens(user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token using refresh token",
)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.refresh_access_token(db, data.refresh_token)


@router.post(
    "/logout",
    response_model=SuccessResponse,
    summary="Logout (client-side token invalidation)",
)
async def logout(current_user=Depends(get_current_user)):
    """
    JWT is stateless — logout is handled client-side by discarding the token.
    For production, add token to a Redis blacklist here.
    """
    return SuccessResponse(message="Logged out successfully. Please discard your tokens.")


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get current authenticated user",
)
async def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.post(
    "/forgot-password",
    response_model=SuccessResponse,
    summary="Initiate password reset",
)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generates a password reset token.
    In production, this token would be sent via email.
    """
    token = await AuthService.initiate_password_reset(db, data.email)
    return SuccessResponse(
        message="If this email is registered, a reset link has been sent."
    )


@router.post(
    "/reset-password",
    response_model=SuccessResponse,
    summary="Reset password using token",
)
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    await AuthService.reset_password(db, data.token, data.new_password)
    return SuccessResponse(message="Password reset successfully. Please login with your new password.")


@router.post(
    "/verify-email",
    response_model=SuccessResponse,
    summary="Verify email address using token",
)
async def verify_email(
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    await AuthService.verify_email(db, data.token)
    return SuccessResponse(message="Email verified successfully.")
