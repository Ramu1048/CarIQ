import pytest
from ai_service.app.ai.response_validator import ResponseValidator
from ai_service.app.schemas.chat import ChatRequest
from ai_service.app.services.ai_service import ai_service_orchestrator


@pytest.mark.asyncio
async def test_chat_pipeline_returns_sources_and_intent():
    req = ChatRequest(message="What is the mileage of Maruti Brezza?")
    resp = await ai_service_orchestrator.chat(req)

    assert resp.success is True
    assert resp.data.intent in ["vehicle_information", "car_recommendation", "car_search"]
    assert len(resp.data.sources) > 0
    assert resp.meta.get("confidence", 0) > 0.40


@pytest.mark.asyncio
async def test_hallucination_control_unknown_car():
    req = ChatRequest(message="What is the nuclear warp drive fuel consumption of Ferrari Galaxy 3000?")
    resp = await ai_service_orchestrator.chat(req)

    assert resp.success is True
    # Should maintain low confidence or state inability to find verified data
    assert resp.meta.get("confidence", 1.0) <= 0.65 or "couldn't find" in resp.data.answer.lower()
