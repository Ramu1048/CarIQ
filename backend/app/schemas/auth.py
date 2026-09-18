"""
CarIQ Backend — Auth Schemas
"""
from __future__ import annotations
from typing import Optional

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import CarIQBase


class RegisterRequest(CarIQBase):
    full_name: str = Field(..., min_length=2, max_length=255, examples=["Ravi Kumar"])
    email: EmailStr = Field(..., examples=["ravi@example.com"])
    password: str = Field(..., min_length=8, max_length=128, examples=["SecurePass123!"])
    phone: Optional[str] = Field(None, pattern=r"^\+?[6-9]\d{9}$", examples=["9876543210"])

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(CarIQBase):
    email: EmailStr
    password: str


class RefreshTokenRequest(CarIQBase):
    refresh_token: str


class ForgotPasswordRequest(CarIQBase):
    email: EmailStr


class ResetPasswordRequest(CarIQBase):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class VerifyEmailRequest(CarIQBase):
    token: str


class TokenResponse(CarIQBase):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class AccessTokenResponse(CarIQBase):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
