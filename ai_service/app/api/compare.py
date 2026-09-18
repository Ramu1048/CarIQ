from fastapi import APIRouter, Depends
from ai_service.app.core.security import check_rate_limit, verify_api_key
from ai_service.app.schemas.compare import CompareRequest, CompareResponse
from ai_service.app.services.ai_service import ai_service_orchestrator

router = APIRouter(tags=["Car Comparison"])


@router.post("/compare", response_model=CompareResponse)
async def compare_vehicles(
    request: CompareRequest,
    _rate: bool = Depends(check_rate_limit),
    _auth: bool = Depends(verify_api_key),
):
    """
    Compares 2 to 4 vehicles across dimensions (Price, Mileage, Safety, Space, Ground Clearance, Power).
    """
    return await ai_service_orchestrator.compare(request)
