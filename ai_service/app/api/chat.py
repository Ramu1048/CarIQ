from fastapi import APIRouter, Depends
from ai_service.app.core.security import check_rate_limit, verify_api_key
from ai_service.app.schemas.chat import ChatRequest, ChatResponse
from ai_service.app.services.ai_service import ai_service_orchestrator

router = APIRouter(tags=["Chat Assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat_assistant(
    request: ChatRequest,
    _rate: bool = Depends(check_rate_limit),
    _auth: bool = Depends(verify_api_key),
):
    """
    Main Conversational AI Endpoint for CarIQ Assistant.
    Provides RAG-grounded answers, recommendations, source citations, and follow-up suggestions.
    """
    return await ai_service_orchestrator.chat(request)
