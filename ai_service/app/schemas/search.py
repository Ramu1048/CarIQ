from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from ai_service.app.models.vehicle import Vehicle
from ai_service.app.schemas.preference import UserPreferences


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., description="Natural language search query e.g. 'Safe family SUV under 15 lakh'")
    top_k: int = Field(default=5, ge=1, le=20)
    user_id: Optional[str] = None


class SemanticSearchResultItem(BaseModel):
    vehicle: Vehicle
    relevance_score: float
    match_reasons: List[str]


class SemanticSearchResponseData(BaseModel):
    query: str
    interpreted_preferences: UserPreferences
    results: List[SemanticSearchResultItem]
    total: int
    explanation: str


class SemanticSearchResponse(BaseModel):
    success: bool = True
    data: SemanticSearchResponseData
    meta: Dict[str, Any] = Field(default_factory=dict)
