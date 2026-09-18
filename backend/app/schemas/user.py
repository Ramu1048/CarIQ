"""
CarIQ Backend — User Schemas
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import EmailStr, Field

from app.schemas.common import CarIQBase


class UserPublic(CarIQBase):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    is_active: bool
    is_email_verified: bool
    avatar_url: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    created_at: datetime


class UserProfile(UserPublic):
    """Extended user info including preferences."""
    location_pincode: Optional[str] = None
    preferred_budget_min: Optional[int] = None
    preferred_budget_max: Optional[int] = None
    preferred_fuel_types: Optional[str] = None
    preferred_body_types: Optional[str] = None
    preferred_transmission: Optional[str] = None
    preferred_brands: Optional[str] = None
    driving_usage: Optional[str] = None
    annual_kilometers: Optional[int] = None
    city_highway_split: Optional[str] = None
    family_size: Optional[int] = None
    ownership_priorities: Optional[str] = None
    last_login_at: Optional[datetime] = None
    updated_at: datetime


class UpdateProfileRequest(CarIQBase):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, pattern=r"^\+?[6-9]\d{9}$")
    avatar_url: Optional[str] = None
    location_city: Optional[str] = Field(None, max_length=100)
    location_state: Optional[str] = Field(None, max_length=100)
    location_pincode: Optional[str] = Field(None, max_length=10)

    # Preferences
    preferred_budget_min: Optional[int] = Field(None, ge=0)
    preferred_budget_max: Optional[int] = Field(None, ge=0)
    preferred_fuel_types: Optional[str] = None   # JSON string
    preferred_body_types: Optional[str] = None   # JSON string
    preferred_transmission: Optional[str] = None
    preferred_brands: Optional[str] = None       # JSON string
    driving_usage: Optional[str] = None
    annual_kilometers: Optional[int] = Field(None, ge=0)
    city_highway_split: Optional[str] = None
    family_size: Optional[int] = Field(None, ge=1, le=20)
    ownership_priorities: Optional[str] = None   # JSON string


class ChangePasswordRequest(CarIQBase):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
