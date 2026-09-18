"""
CarIQ Backend — Purchase Tests
"""
import pytest
import uuid
from httpx import AsyncClient


async def get_token(client: AsyncClient, user) -> str:
    response = await client.post("/api/v1/auth/login", data={
        "username": user.email, "password": "Password@123"
    })
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_create_purchase(client: AsyncClient, customer_user, test_vehicle):
    """Test creating a purchase."""
    token = await get_token(client, customer_user)
    response = await client.post(
        "/api/v1/purchases",
        json={"vehicle_id": str(test_vehicle.id)},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "initiated"
    assert "reference_number" in data
    assert data["reference_number"].startswith("CIQ-")


@pytest.mark.asyncio
async def test_list_purchases(client: AsyncClient, customer_user, test_vehicle):
    """Test listing customer purchases."""
    token = await get_token(client, customer_user)
    await client.post(
        "/api/v1/purchases",
        json={"vehicle_id": str(test_vehicle.id)},
        headers={"Authorization": f"Bearer {token}"},
    )
    response = await client.get(
        "/api/v1/purchases",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_purchase_requires_auth(client: AsyncClient, test_vehicle):
    """Test purchase creation requires authentication."""
    response = await client.post(
        "/api/v1/purchases",
        json={"vehicle_id": str(test_vehicle.id)},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_purchase_not_found_vehicle(client: AsyncClient, customer_user):
    """Test purchase with non-existent vehicle returns 404."""
    token = await get_token(client, customer_user)
    response = await client.post(
        "/api/v1/purchases",
        json={"vehicle_id": str(uuid.uuid4())},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_customer_cannot_access_others_purchase(
    client: AsyncClient, customer_user, admin_user, test_vehicle
):
    """Test customer cannot view another customer's purchase."""
    # Admin creates a purchase (as customer fixtures use admin token)
    token_c = await get_token(client, customer_user)
    create_resp = await client.post(
        "/api/v1/purchases",
        json={"vehicle_id": str(test_vehicle.id)},
        headers={"Authorization": f"Bearer {token_c}"},
    )
    purchase_id = create_resp.json()["id"]

    # Create another customer
    reg = await client.post("/api/v1/auth/register", json={
        "full_name": "Another Customer",
        "email": "another@test.com",
        "password": "Secure123A",
    })
    login2 = await client.post("/api/v1/auth/login", data={
        "username": "another@test.com", "password": "Secure123A"
    })
    token2 = login2.json()["access_token"]

    response = await client.get(
        f"/api/v1/purchases/{purchase_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert response.status_code == 404  # Should not see other's purchase
