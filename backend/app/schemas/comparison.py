"""
CarIQ Backend — Comparison Schemas
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

from pydantic import Field, field_validator

from app.schemas.common import CarIQBase
from app.schemas.vehicle import VehicleDetail


class ComparisonRequest(CarIQBase):
    vehicle_ids: List[uuid.UUID] = Field(..., min_length=2, max_length=4)

    @field_validator("vehicle_ids")
    @classmethod
    def unique_vehicles(cls, v: List[uuid.UUID]) -> List[uuid.UUID]:
        if len(set(v)) != len(v):
            raise ValueError("All vehicle IDs must be unique")
        return v


class ComparisonField(CarIQBase):
    label: str
    values: Dict[str, Any]  # vehicle_id -> value
    unit: Optional[str] = None
    winner_id: Optional[str] = None  # vehicle_id with best value


class ComparisonResponse(CarIQBase):
    id: uuid.UUID
    vehicles: List[VehicleDetail]
    comparison_table: List[ComparisonField]
    ai_summary: Optional[str] = None
    ai_verdict: Optional[str] = None
    created_at: datetime
