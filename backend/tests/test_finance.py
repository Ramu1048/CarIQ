"""
CarIQ Backend — Finance Tests
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_emi_calculation(client: AsyncClient):
    """Test basic EMI calculation."""
    response = await client.post("/api/v1/finance/emi", json={
        "vehicle_price": 1000000,
        "down_payment": 200000,
        "interest_rate_annual": 9.0,
        "tenure_months": 60,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["loan_amount"] == 800000
    assert data["monthly_emi"] > 0
    assert data["total_interest"] > 0
    assert data["total_repayment"] > data["loan_amount"]
    assert len(data["amortization_schedule"]) == 60


@pytest.mark.asyncio
async def test_emi_zero_interest(client: AsyncClient):
    """Test EMI with 0% interest (edge case)."""
    response = await client.post("/api/v1/finance/emi", json={
        "vehicle_price": 600000,
        "down_payment": 0,
        "interest_rate_annual": 0.1,
        "tenure_months": 12,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_emi"] > 0


@pytest.mark.asyncio
async def test_emi_down_payment_greater_than_price(client: AsyncClient):
    """Test EMI when down payment >= vehicle price."""
    response = await client.post("/api/v1/finance/emi", json={
        "vehicle_price": 500000,
        "down_payment": 600000,
        "interest_rate_annual": 9.0,
        "tenure_months": 24,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["loan_amount"] == 0


@pytest.mark.asyncio
async def test_affordability_calculation(client: AsyncClient):
    """Test affordability calculation."""
    response = await client.post("/api/v1/finance/affordability", json={
        "monthly_income": 100000,
        "existing_emi": 10000,
        "down_payment_available": 300000,
        "preferred_tenure_months": 60,
        "interest_rate_annual": 9.0,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["max_emi"] > 0
    assert data["max_vehicle_price"] > 0
    assert "recommendation" in data


@pytest.mark.asyncio
async def test_tenure_comparison(client: AsyncClient):
    """Test tenure comparison across multiple durations."""
    response = await client.post("/api/v1/finance/tenure-comparison", json={
        "vehicle_price": 1500000,
        "down_payment": 300000,
        "interest_rate_annual": 9.0,
        "tenures": [24, 36, 48, 60, 72, 84],
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["options"]) == 6
    # Shorter tenure = higher EMI, lower total interest
    sorted_options = sorted(data["options"], key=lambda x: x["tenure_months"])
    assert sorted_options[0]["monthly_emi"] > sorted_options[-1]["monthly_emi"]
    assert sorted_options[0]["total_interest"] < sorted_options[-1]["total_interest"]


@pytest.mark.asyncio
async def test_emi_amortization_integrity(client: AsyncClient):
    """Test that amortization schedule balances correctly."""
    response = await client.post("/api/v1/finance/emi", json={
        "vehicle_price": 1000000,
        "down_payment": 200000,
        "interest_rate_annual": 10.0,
        "tenure_months": 24,
    })
    assert response.status_code == 200
    data = response.json()
    schedule = data["amortization_schedule"]
    # Last balance should be near zero
    assert abs(schedule[-1]["balance"]) < 100  # Allow small floating-point error
