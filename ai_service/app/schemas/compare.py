from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from ai_service.app.models.vehicle import Vehicle


class CompareRequest(BaseModel):
    vehicle_ids: List[str] = Field(..., min_length=2, max_length=4, description="List of 2 to 4 vehicle IDs to compare")
    user_preferences: Optional[Dict[str, Any]] = None


class ComparisonDimension(BaseModel):
    name: str
    values: Dict[str, Any]  # { "car1": "118 bhp", "car2": "102 bhp" }
    winner_id: Optional[str] = None
    verdict: str


class CompareResponseData(BaseModel):
    vehicles: List[Vehicle]
    comparison_table: List[ComparisonDimension]
    ai_verdict: str
    pros_and_cons: Dict[str, Dict[str, List[str]]]
    recommendation_scenario: Dict[str, str]  # { "tata_nexon": "Best if safety and rugged ground clearance are #1", ... }
    suggested_questions: List[str]


class CompareResponse(BaseModel):
    success: bool = True
    data: CompareResponseData
    meta: Dict[str, Any] = Field(default_factory=dict)
