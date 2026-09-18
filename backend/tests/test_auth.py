"""
CarIQ Backend — Auth Tests
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Test successful user registration."""
    response = await client.post("/api/v1/auth/register", json={
        "full_name": "John Doe",
        "email": "john.doe@test.com",
        "password": "SecurePass1",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "john.doe@test.com"
    assert data["full_name"] == "John Doe"
    assert data["role"] == "customer"
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test registration fails with duplicate email."""
    payload = {"full_name": "Jane", "email": "jane@test.com", "password": "SecurePass1"}
    await client.post("/api/v1/auth/register", json=payload)
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    """Test registration fails with weak password."""
    response = await client.post("/api/v1/auth/register", json={
        "full_name": "Test User",
        "email": "weakpass@test.com",
        "password": "weak",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, customer_user):
    """Test successful login returns tokens."""
    response = await client.post("/api/v1/auth/login", data={
        "username": customer_user.email,
        "password": "Password@123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, customer_user):
    """Test login fails with wrong password."""
    response = await client.post("/api/v1/auth/login", data={
        "username": customer_user.email,
        "password": "WrongPassword1",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient, customer_user):
    """Test /auth/me returns current user."""
    login = await client.post("/api/v1/auth/login", data={
        "username": customer_user.email,
        "password": "Password@123",
    })
    token = login.json()["access_token"]
    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == customer_user.email


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    """Test /auth/me returns 401 without token."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, customer_user):
    """Test refresh token returns new access token."""
    login = await client.post("/api/v1/auth/login", data={
        "username": customer_user.email,
        "password": "Password@123",
    })
    refresh_token = login.json()["refresh_token"]
    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_forgot_password(client: AsyncClient):
    """Test forgot password returns success regardless of email existence."""
    response = await client.post("/api/v1/auth/forgot-password", json={"email": "notexist@test.com"})
    assert response.status_code == 200
    assert response.json()["success"] is True
