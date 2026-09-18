import pytest
from ai_service.app.schemas.compare import CompareRequest
from ai_service.app.services.ai_service import ai_service_orchestrator


@pytest.mark.asyncio
async def test_vehicle_comparison():
    req = CompareRequest(vehicle_ids=["tata_nexon", "maruti_brezza"])
    resp = await ai_service_orchestrator.compare(req)

    assert resp.success is True
    assert len(resp.data.vehicles) == 2
    assert len(resp.data.comparison_table) >= 5
    assert len(resp.data.suggested_questions) > 0

    # Ensure dimension table has price, mileage, safety
    dim_names = [d.name for d in resp.data.comparison_table]
    assert "Ex-Showroom Price" in dim_names
    assert "Safety Rating" in dim_names
