from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from ai_service.app.models.knowledge import CitationSource
from ai_service.app.schemas.preference import UserPreferences


class RecommendationFactorBreakdown(BaseModel):
    budget: float = Field(default=1.0, description="0.0 to 1.0 score")
    safety: float = Field(default=1.0)
    fuel_efficiency: float = Field(default=1.0)
    usage_compatibility: float = Field(default=1.0)
    body_and_transmission: float = Field(default=1.0)
    features_and_tech: float = Field(default=1.0)


class VehicleRecommendationItem(BaseModel):
    vehicle_id: str
    brand: str
    model: str
    variant: Optional[str] = None
    price_min: int
    price_max: int
    match_score: int = Field(description="Deterministic match score 0-100")
    factors: Dict[str, float] = Field(default_factory=dict)
    key_highlights: List[str] = Field(default_factory=list)
    reason: str
    potential_tradeoffs: List[str] = Field(default_factory=list)
    specs_summary: Dict[str, Any] = Field(default_factory=dict)


class RecommendationRequest(BaseModel):
    preferences: Optional[UserPreferences] = None
    natural_language_query: Optional[str] = None
    user_id: Optional[str] = None
    top_k: int = Field(default=3, ge=1, le=10)


class RecommendationResponseData(BaseModel):
    recommendations: List[VehicleRecommendationItem]
    summary_explanation: str
    interpreted_preferences: UserPreferences
    suggested_questions: List[str] = Field(default_factory=list)
    sources: List[CitationSource] = Field(default_factory=list)


class RecommendationResponse(BaseModel):
    success: bool = True
    data: RecommendationResponseData
    meta: Dict[str, Any] = Field(default_factory=dict)


class ExplainRecommendationRequest(BaseModel):
    vehicle_id: str
    preferences: UserPreferences
    user_id: Optional[str] = None


class ExplainRecommendationResponse(BaseModel):
    success: bool = True
    data: Dict[str, Any]
    meta: Dict[str, Any] = Field(default_factory=dict)
