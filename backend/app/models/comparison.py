"""
CarIQ Backend — Comparison Model
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Comparison(Base):
    __tablename__ = "comparisons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # Serialized list of vehicle IDs (JSON) — 2-4 vehicles
    vehicle_ids: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array of UUIDs

    # AI-generated summary
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_verdict: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(30), default="completed", nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Comparison id={self.id}>"
