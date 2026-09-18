from typing import List, Optional
from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    budget_min: Optional[int] = Field(default=None, description="Minimum budget in INR")
    budget_max: Optional[int] = Field(default=None, description="Maximum budget in INR")
    brand: Optional[str] = Field(default=None, description="Preferred brand")
    body_type: Optional[str] = Field(default=None, description="SUV, Sedan, Hatchback, MUV")
    fuel_type: Optional[str] = Field(default=None, description="Petrol, Diesel, Electric, Strong Hybrid, CNG")
    transmission: Optional[str] = Field(default=None, description="Automatic, Manual, CVT, DCT, AMT")
    seating_capacity: Optional[int] = Field(default=5, description="Number of seats required")
    usage: Optional[str] = Field(default="mixed", description="city, highway, mixed, offroad")
    purpose: Optional[str] = Field(default=None, description="family, daily_commute, luxury, performance")
    priorities: List[str] = Field(default_factory=list, description="safety, mileage, comfort, features, performance, budget")
    monthly_running_km: Optional[int] = Field(default=None, description="Estimated monthly driving in km")


class PreferenceExtractionRequest(BaseModel):
    text: str = Field(..., description="User freeform query text")
    conversation_history: Optional[List[dict]] = None


class PreferenceExtractionResponse(BaseModel):
    preferences: UserPreferences
    intent: str
    confidence: float
    raw_entities: Optional[dict] = None
