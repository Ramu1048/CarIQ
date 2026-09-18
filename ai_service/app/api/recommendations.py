from fastapi import APIRouter, Depends
from ai_service.app.core.security import check_rate_limit, verify_api_key
from ai_service.app.schemas.recommendation import (
    ExplainRecommendationRequest,
    ExplainRecommendationResponse,
    RecommendationRequest,
    RecommendationResponse,
)
from ai_service.app.services.ai_service import ai_service_orchestrator

router = APIRouter(tags=["Recommendations"])


@router.post("/recommend", response_model=RecommendationResponse)
async def get_car_recommendations(
    request: RecommendationRequest,
    _rate: bool = Depends(check_rate_limit),
    _auth: bool = Depends(verify_api_key),
):
    """
    Returns ranked vehicle recommendations calculated deterministically with multi-factor scoring.
    """
    return await ai_service_orchestrator.recommend(request)


@router.post("/explain-recommendation", response_model=ExplainRecommendationResponse)
async def explain_car_recommendation(
    request: ExplainRecommendationRequest,
    _rate: bool = Depends(check_rate_limit),
    _auth: bool = Depends(verify_api_key),
):
    """
    Explains why a specific vehicle is recommended for given user preferences.
    """
    return await ai_service_orchestrator.explain_recommendation(request)
