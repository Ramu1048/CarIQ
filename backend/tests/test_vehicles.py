"""
CarIQ Backend — Vehicle Tests
"""
import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_vehicles(client: AsyncClient, test_vehicle):
    response = await client.get("/api/v1/vehicles")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data


@pytest.mark.asyncio
async def test_get_vehicle_by_id(client: AsyncClient, test_vehicle):
    response = await client.get(f"/api/v1/vehicles/{test_vehicle.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_vehicle.id)
    assert data["model_name"] == test_vehicle.model_name


@pytest.mark.asyncio
async def test_get_vehicle_not_found(client: AsyncClient):
    response = await client.get(f"/api/v1/vehicles/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_filter_by_fuel_type(client: AsyncClient, test_vehicle):
    response = await client.get("/api/v1/vehicles", params={"fuel_type": "petrol"})
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["fuel_type"] == "petrol"


@pytest.mark.asyncio
async def test_filter_by_price_range(client: AsyncClient, test_vehicle):
    response = await client.get("/api/v1/vehicles", params={
        "min_price": 500000,
        "max_price": 1000000,
    })
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert 500000 <= item["ex_showroom_price"] <= 1000000


@pytest.mark.asyncio
async def test_search_vehicles(client: AsyncClient, test_vehicle):
    response = await client.get("/api/v1/search", params={"q": "Test Car"})
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "applied_filters" in data


@pytest.mark.asyncio
async def test_list_brands(client: AsyncClient, test_brand):
    response = await client.get("/api/v1/brands")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_pagination(client: AsyncClient):
    response = await client.get("/api/v1/vehicles", params={"page": 1, "page_size": 5})
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 5


@pytest.mark.asyncio
async def test_create_vehicle_requires_admin(client: AsyncClient, customer_user, test_brand):
    """Non-admins should not be able to create vehicles."""
    login = await client.post("/api/v1/auth/login", data={
        "username": customer_user.email, "password": "Password@123"
    })
    token = login.json()["access_token"]
    response = await client.post(
        "/api/v1/vehicles",
        json={
            "brand_id": str(test_brand.id),
            "model_name": "Admin Only Car",
            "body_type": "sedan",
            "fuel_type": "petrol",
            "transmission": "manual",
            "ex_showroom_price": 1000000,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
