from fastapi import APIRouter, Depends
from ai_service.app.core.security import check_rate_limit, verify_api_key
from ai_service.app.schemas.search import SemanticSearchRequest, SemanticSearchResponse
from ai_service.app.services.ai_service import ai_service_orchestrator

router = APIRouter(tags=["Semantic Search"])


@router.post("/search", response_model=SemanticSearchResponse)
async def semantic_car_search(
    request: SemanticSearchRequest,
    _rate: bool = Depends(check_rate_limit),
    _auth: bool = Depends(verify_api_key),
):
    """
    Translates natural-language search queries into structured + semantic matches.
    """
    return await ai_service_orchestrator.semantic_search(request)
