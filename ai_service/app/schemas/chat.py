from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from ai_service.app.models.knowledge import CitationSource
from ai_service.app.schemas.recommendation import VehicleRecommendationItem
from ai_service.app.schemas.preference import UserPreferences


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant' or 'system'")
    content: str = Field(..., description="Message text content")
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(..., description="User question or input")
    conversation_id: Optional[str] = Field(default=None, description="Conversation session ID for memory")
    user_id: Optional[str] = Field(default=None, description="User ID for persistent profile")
    context_filters: Optional[Dict[str, Any]] = None


class ChatResponseData(BaseModel):
    answer: str
    intent: str
    recommendations: List[VehicleRecommendationItem] = Field(default_factory=list)
    sources: List[CitationSource] = Field(default_factory=list)
    suggested_questions: List[str] = Field(default_factory=list)
    active_preferences: Optional[UserPreferences] = None
    conversation_id: str


class ChatResponse(BaseModel):
    success: bool = True
    data: ChatResponseData
    meta: Dict[str, Any] = Field(default_factory=dict)
