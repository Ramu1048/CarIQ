"""
CarIQ Backend — User Model
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Enum, Integer, String, Text,
    func, ARRAY,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Role & Status
    role: Mapped[str] = mapped_column(
        Enum("customer", "admin", "seller", name="user_role_enum"),
        default="customer",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Profile
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    location_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location_pincode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Preferences
    preferred_budget_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    preferred_budget_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    preferred_fuel_types: Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # JSON array
    preferred_body_types: Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # JSON array
    preferred_transmission: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    preferred_brands: Mapped[Optional[str]] = mapped_column(Text, nullable=True)       # JSON array
    driving_usage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    annual_kilometers: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    city_highway_split: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    family_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ownership_priorities: Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # JSON array

    # Password Reset / Email Verification
    password_reset_token: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    password_reset_expires: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    email_verification_token: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Soft Delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    wishlists: Mapped[list["Wishlist"]] = relationship(  # noqa: F821
        "Wishlist", back_populates="user", cascade="all, delete-orphan"
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(  # noqa: F821
        "Recommendation", back_populates="user", cascade="all, delete-orphan"
    )
    purchases: Mapped[list["Purchase"]] = relationship(  # noqa: F821
        "Purchase", back_populates="customer", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(  # noqa: F821
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
