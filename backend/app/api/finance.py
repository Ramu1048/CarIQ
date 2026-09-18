"""
CarIQ Backend — Finance Router
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.schemas.finance import (
    EMIRequest, EMIResponse,
    AffordabilityRequest, AffordabilityResponse,
    TenureComparisonRequest, TenureComparisonResponse,
)
from app.services.finance_service import FinanceService

router = APIRouter(prefix="/finance", tags=["Finance & EMI"])


@router.post("/emi", response_model=EMIResponse, summary="Calculate EMI and amortization schedule")
async def calculate_emi(
    request: EMIRequest,
    current_user=Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Calculate monthly EMI, total interest, total repayment, and full amortization schedule.
    Calculation stored for authenticated users.
    """
    user_id = current_user.id if current_user else None
    return await FinanceService.compute_emi(db, request, user_id)


@router.post("/affordability", response_model=AffordabilityResponse, summary="Calculate maximum affordable vehicle price")
async def calculate_affordability(request: AffordabilityRequest):
    """
    Based on monthly income and existing EMIs, calculate the maximum vehicle price you can afford.
    Uses standard bank rule: EMI ≤ 40% of monthly income.
    """
    return FinanceService.compute_affordability(request)


@router.post("/tenure-comparison", response_model=TenureComparisonResponse, summary="Compare EMI across multiple loan tenures")
async def compare_tenures(request: TenureComparisonRequest):
    """
    Compare EMI, total interest, and total repayment across different loan tenures.
    Helpful for deciding the optimal loan period.
    """
    return FinanceService.compare_tenures(
        request.vehicle_price,
        request.down_payment,
        request.interest_rate_annual,
        request.tenures,
    )
