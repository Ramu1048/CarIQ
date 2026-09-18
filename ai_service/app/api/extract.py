from fastapi import APIRouter, Depends
from ai_service.app.core.security import check_rate_limit, verify_api_key
from ai_service.app.recommendation.preference_extractor import preference_extractor
from ai_service.app.schemas.preference import (
    PreferenceExtractionRequest,
    PreferenceExtractionResponse,
)

router = APIRouter(tags=["Preference Extraction"])


@router.post("/extract-preferences", response_model=PreferenceExtractionResponse)
async def extract_preferences_endpoint(
    request: PreferenceExtractionRequest,
    _rate: bool = Depends(check_rate_limit),
    _auth: bool = Depends(verify_api_key),
):
    """
    Extracts structured preferences and intent from user queries.
    """
    pref, intent, conf = await preference_extractor.extract_preferences(
        request.text, request.conversation_history
    )
    return PreferenceExtractionResponse(
        preferences=pref,
        intent=intent,
        confidence=conf,
        raw_entities={"input": request.text},
    )
