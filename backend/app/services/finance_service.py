"""
CarIQ Backend — Finance / EMI Service
"""
from __future__ import annotations
import json
import logging
import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance import FinanceCalculation
from app.schemas.finance import (
    AffordabilityRequest,
    AffordabilityResponse,
    AmortizationEntry,
    EMIRequest,
    EMIResponse,
    TenureComparisonItem,
    TenureComparisonResponse,
)

logger = logging.getLogger(__name__)


class FinanceService:

    @staticmethod
    def calculate_emi(principal: int, annual_rate: float, months: int) -> float:
        """Standard reducing-balance EMI formula."""
        if annual_rate == 0:
            return round(principal / months, 2)
        monthly_rate = annual_rate / 12 / 100
        emi = principal * monthly_rate * ((1 + monthly_rate) ** months) / (((1 + monthly_rate) ** months) - 1)
        return round(emi, 2)

    @staticmethod
    def build_amortization(principal: int, annual_rate: float, months: int, emi: float) -> List[AmortizationEntry]:
        schedule: List[AmortizationEntry] = []
        balance = float(principal)
        monthly_rate = annual_rate / 12 / 100

        for month in range(1, months + 1):
            interest = round(balance * monthly_rate, 2)
            principal_paid = round(emi - interest, 2)
            balance = round(balance - principal_paid, 2)
            if balance < 0:
                balance = 0.0
            schedule.append(AmortizationEntry(
                month=month,
                emi=emi,
                principal=principal_paid,
                interest=interest,
                balance=balance,
            ))
        return schedule

    @staticmethod
    async def compute_emi(
        db: AsyncSession,
        request: EMIRequest,
        user_id: Optional[uuid.UUID] = None,
    ) -> EMIResponse:
        loan_amount = request.vehicle_price - request.down_payment
        if loan_amount < 0:
            loan_amount = 0

        emi = FinanceService.calculate_emi(loan_amount, request.interest_rate_annual, request.tenure_months)
        total_repayment = round(emi * request.tenure_months, 2)
        total_interest = round(total_repayment - loan_amount, 2)
        amortization = FinanceService.build_amortization(
            loan_amount, request.interest_rate_annual, request.tenure_months, emi
        )

        # Store calculation
        calc = FinanceCalculation(
            id=uuid.uuid4(),
            user_id=user_id,
            vehicle_id=request.vehicle_id,
            vehicle_price=request.vehicle_price,
            down_payment=request.down_payment,
            loan_amount=loan_amount,
            interest_rate_annual=request.interest_rate_annual,
            tenure_months=request.tenure_months,
            monthly_emi=emi,
            total_interest=total_interest,
            total_repayment=total_repayment,
            amortization_schedule=json.dumps([e.model_dump() for e in amortization]),
        )
        db.add(calc)
        await db.commit()

        return EMIResponse(
            vehicle_price=request.vehicle_price,
            down_payment=request.down_payment,
            loan_amount=loan_amount,
            interest_rate_annual=request.interest_rate_annual,
            tenure_months=request.tenure_months,
            monthly_emi=emi,
            total_interest=total_interest,
            total_repayment=total_repayment,
            amortization_schedule=amortization,
        )

    @staticmethod
    def compute_affordability(request: AffordabilityRequest) -> AffordabilityResponse:
        """Calculate maximum affordable vehicle price based on income."""
        # Standard bank rule: EMI ≤ 40% of net monthly income
        max_emi = (request.monthly_income * 0.40) - request.existing_emi
        if max_emi <= 0:
            max_emi = 1

        # Reverse EMI formula to get loan amount
        annual_rate = request.interest_rate_annual
        months = request.preferred_tenure_months
        monthly_rate = annual_rate / 12 / 100

        if monthly_rate == 0:
            max_loan = max_emi * months
        else:
            max_loan = max_emi * (((1 + monthly_rate) ** months) - 1) / (monthly_rate * ((1 + monthly_rate) ** months))

        max_vehicle_price = max_loan + request.down_payment_available

        recommendation = ""
        if max_vehicle_price < 500000:
            recommendation = "Consider a used car or CNG hatchback for your budget."
        elif max_vehicle_price < 1000000:
            recommendation = "Hatchbacks and entry-level sedans are well within reach."
        elif max_vehicle_price < 2000000:
            recommendation = "You can comfortably consider sedans, compact SUVs, and hatchbacks."
        else:
            recommendation = "Premium sedans, full-size SUVs, and luxury vehicles are within range."

        return AffordabilityResponse(
            max_emi=round(max_emi, 2),
            max_loan_amount=round(max_loan, 2),
            max_vehicle_price=round(max_vehicle_price, 2),
            monthly_income=request.monthly_income,
            existing_emi=request.existing_emi,
            disposable_income=round(max_emi, 2),
            recommendation=recommendation,
        )

    @staticmethod
    def compare_tenures(
        vehicle_price: int,
        down_payment: int,
        interest_rate_annual: float,
        tenures: List[int],
    ) -> TenureComparisonResponse:
        loan_amount = max(0, vehicle_price - down_payment)
        options: List[TenureComparisonItem] = []
        for months in tenures:
            emi = FinanceService.calculate_emi(loan_amount, interest_rate_annual, months)
            total_repayment = round(emi * months, 2)
            total_interest = round(total_repayment - loan_amount, 2)
            options.append(TenureComparisonItem(
                tenure_months=months,
                monthly_emi=emi,
                total_interest=total_interest,
                total_repayment=total_repayment,
            ))

        return TenureComparisonResponse(
            loan_amount=loan_amount,
            interest_rate_annual=interest_rate_annual,
            options=options,
        )
