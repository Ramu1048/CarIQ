"""
CarIQ Backend — Pagination Utilities
"""
from typing import TypeVar, Type, List, Tuple
from math import ceil

from app.schemas.common import PaginatedResponse

T = TypeVar("T")


def paginate(items: List[T], total: int, page: int, page_size: int) -> PaginatedResponse:
    pages = ceil(total / page_size) if page_size > 0 else 0
    return PaginatedResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        pages=pages,
    )
