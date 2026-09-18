"""
CarIQ Backend — Recommendation Model
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # Input
    query_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extracted_preferences: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON

    # Results: JSON array of {vehicle_id, score, factors, reason}
    results: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # AI provider used
    ai_provider_used: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    processing_time_ms: Mapped[Optional[int]] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="recommendations")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Recommendation id={self.id}>"
