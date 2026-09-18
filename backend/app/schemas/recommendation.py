"""
CarIQ Backend — Recommendation Schemas
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

from pydantic import Field

from app.schemas.common import CarIQBase
from app.schemas.vehicle import VehicleSummary


class RecommendationRequest(CarIQBase):
    query: str = Field(..., min_length=5, max_length=1000, examples=["I need a family car under 15 lakh with good mileage"])
    budget_max: Optional[int] = Field(None, ge=0, examples=[1500000])
    budget_min: Optional[int] = Field(None, ge=0)
    usage: Optional[str] = Field(None, examples=["city"])
    fuel_type: Optional[str] = Field(None, examples=["petrol"])
    transmission: Optional[str] = Field(None, examples=["automatic"])
    body_type: Optional[str] = None
    seating_min: Optional[int] = Field(None, ge=2, le=10)
    min_mileage: Optional[float] = None
    safety_rating_min: Optional[float] = Field(None, ge=0, le=5)
    limit: int = Field(default=5, ge=1, le=10)


class RecommendationItem(CarIQBase):
    vehicle: VehicleSummary
    match_score: float = Field(..., ge=0, le=100, description="Match score 0-100")
    matching_factors: List[str]
    advantages: List[str]
    limitations: List[str]
    recommendation_reason: str


class RecommendationResponse(CarIQBase):
    id: uuid.UUID
    query: str
    extracted_preferences: Dict[str, Any]
    recommendations: List[RecommendationItem]
    ai_provider_used: str
    processing_time_ms: int
    created_at: datetime


class ChatMessage(CarIQBase):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(CarIQBase):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_history: Optional[List[ChatMessage]] = Field(default_factory=list)
    context_vehicle_ids: Optional[List[uuid.UUID]] = None


class ChatResponse(CarIQBase):
    reply: str
    conversation_history: List[ChatMessage]
    referenced_vehicles: Optional[List[VehicleSummary]] = None
    ai_provider_used: str
