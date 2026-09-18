"""
CarIQ Backend — Common Schemas (pagination, response wrappers, enums)
"""
from __future__ import annotations
from math import ceil
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


# ── Base Config ───────────────────────────────────────────────────────────────
class CarIQBase(BaseModel):
    model_config = {"from_attributes": True}


# ── Standard Response ─────────────────────────────────────────────────────────
class SuccessResponse(CarIQBase):
    success: bool = True
    message: str


class ErrorResponse(CarIQBase):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    detail: Optional[Any] = None


# ── Paginated Response ────────────────────────────────────────────────────────
class PaginatedResponse(CarIQBase, Generic[T]):
    items: List[T]
    page: int
    page_size: int
    total: int
    pages: int

    @classmethod
    def create(cls, items: List[T], page: int, page_size: int, total: int) -> "PaginatedResponse[T]":
        pages = ceil(total / page_size) if page_size > 0 else 0
        return cls(items=items, page=page, page_size=page_size, total=total, pages=pages)


# ── Pagination Query Params ───────────────────────────────────────────────────
class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


# ── Health Check ──────────────────────────────────────────────────────────────
class HealthResponse(CarIQBase):
    status: str = "ok"
    version: str
    environment: str
    database: str
    redis: str
