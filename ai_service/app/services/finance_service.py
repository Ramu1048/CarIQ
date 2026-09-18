import math
from typing import Any, Dict


class FinanceCalculationService:
    """
    Authoritative backend finance engine for calculating exact vehicle EMI,
    interest outgo, and amortization breakdown.
    Prevents LLM math hallucinations.
    """

    @classmethod
    def calculate_emi(
        cls,
        principal: float,
        annual_interest_rate: float = 8.75,
        tenure_months: int = 60,
        down_payment: float = 0.0,
    ) -> Dict[str, Any]:
        loan_amount = max(0.0, principal - down_payment)

        if loan_amount == 0:
            return {
                "principal": principal,
                "down_payment": down_payment,
                "loan_amount": 0.0,
                "monthly_emi": 0.0,
                "total_interest": 0.0,
                "total_payment": 0.0,
                "tenure_months": tenure_months,
                "annual_rate": annual_interest_rate,
            }

        # Monthly interest rate r = R / (12 * 100)
        r = annual_interest_rate / (12.0 * 100.0)
        n = tenure_months

        # EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
        factor = math.pow(1.0 + r, n)
        monthly_emi = (loan_amount * r * factor) / (factor - 1.0)
        total_payment = monthly_emi * n
        total_interest = total_payment - loan_amount

        return {
            "principal": round(principal, 2),
            "down_payment": round(down_payment, 2),
            "loan_amount": round(loan_amount, 2),
            "monthly_emi": int(round(monthly_emi)),
            "total_interest": int(round(total_interest)),
            "total_payment": int(round(total_payment)),
            "tenure_months": tenure_months,
            "annual_rate": annual_interest_rate,
            "formatted_emi": f"₹{int(round(monthly_emi)):,}",
            "formatted_total_interest": f"₹{int(round(total_interest)):,}",
        }


finance_service = FinanceCalculationService()
