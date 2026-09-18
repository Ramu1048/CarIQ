"""
CarIQ Backend — Wishlist Model
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Wishlist(Base):
    __tablename__ = "wishlists"
    __table_args__ = (
        UniqueConstraint("user_id", "vehicle_id", name="uq_wishlists_user_id_vehicle_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="wishlists")  # noqa: F821
    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="wishlists")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Wishlist user={self.user_id} vehicle={self.vehicle_id}>"
