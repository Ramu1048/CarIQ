"""
CarIQ Backend — Admin Tests
"""
import pytest
from httpx import AsyncClient


async def get_customer_token(client: AsyncClient, user) -> str:
    response = await client.post("/api/v1/auth/login", data={
        "username": user.email, "password": "Password@123"
    })
    return response.json()["access_token"]


async def get_admin_token(client: AsyncClient, user) -> str:
    response = await client.post("/api/v1/auth/login", data={
        "username": user.email, "password": "Admin@123456"
    })
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_dashboard_requires_admin(client: AsyncClient, customer_user):
    """Test dashboard requires admin role."""
    token = await get_customer_token(client, customer_user)
    response = await client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_dashboard_accessible(client: AsyncClient, admin_user):
    """Test admin can access dashboard."""
    token = await get_admin_token(client, admin_user)
    response = await client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_vehicles" in data
    assert "total_purchases" in data
    assert "revenue_inr" in data
    assert "popular_vehicles" in data


@pytest.mark.asyncio
async def test_admin_list_users(client: AsyncClient, admin_user):
    """Test admin can list all users."""
    token = await get_admin_token(client, admin_user)
    response = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_customer_cannot_list_users(client: AsyncClient, customer_user):
    """Test customers cannot access admin user list."""
    token = await get_customer_token(client, customer_user)
    response = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_create_brand(client: AsyncClient, admin_user):
    """Test admin can create a brand."""
    token = await get_admin_token(client, admin_user)
    response = await client.post(
        "/api/v1/brands",
        json={"name": f"TestAdminBrand-{admin_user.id.hex[:6]}", "country_of_origin": "Japan"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    assert "id" in response.json()


@pytest.mark.asyncio
async def test_customer_cannot_create_brand(client: AsyncClient, customer_user):
    """Test customers cannot create brands."""
    token = await get_customer_token(client, customer_user)
    response = await client.post(
        "/api/v1/brands",
        json={"name": "Unauthorized Brand"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
