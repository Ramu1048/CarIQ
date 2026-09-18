"""
CarIQ Backend — Test Configuration
"""
import asyncio
import os
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

os.environ.setdefault("DATABASE_URL", TEST_DATABASE_URL)
os.environ.setdefault("SYNC_DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-32chars")
os.environ.setdefault("AI_PROVIDER", "mock")
os.environ.setdefault("PAYMENT_PROVIDER", "mock")
os.environ.setdefault("REDIS_ENABLED", "false")

from app.core.database import Base
from app.core.security import hash_password
# Import ALL models so SQLAlchemy mapper can resolve relationship strings
import app.models  # noqa: F401 — side-effect import required
from app.models.brand import Brand
from app.models.user import User
from app.models.vehicle import Vehicle, VehicleImage
from app.models.variant import Variant

# Test engine
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db) -> AsyncGenerator[AsyncClient, None]:
    from app.main import app
    from app.core.database import get_db

    app.dependency_overrides[get_db] = lambda: db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_brand(db: AsyncSession) -> Brand:
    brand = Brand(
        id=uuid.uuid4(),
        name=f"TestBrand-{uuid.uuid4().hex[:6]}",
        slug=f"testbrand-{uuid.uuid4().hex[:6]}",
        is_active=True,
    )
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return brand


@pytest_asyncio.fixture
async def test_vehicle(db: AsyncSession, test_brand: Brand) -> Vehicle:
    vehicle = Vehicle(
        id=uuid.uuid4(),
        brand_id=test_brand.id,
        model_name="Test Car",
        slug=f"test-car-{uuid.uuid4().hex[:6]}",
        body_type="hatchback",
        fuel_type="petrol",
        transmission="manual",
        ex_showroom_price=800000,
        mileage_kmpl=18.0,
        seating_capacity=5,
        safety_rating=4.0,
        num_airbags=6,
        has_abs=True,
        is_active=True,
        popularity_score=75.0,
    )
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@pytest_asyncio.fixture
async def customer_user(db: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"customer-{uuid.uuid4().hex[:6]}@test.com",
        full_name="Test Customer",
        hashed_password=hash_password("Password@123"),
        role="customer",
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_user(db: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"admin-{uuid.uuid4().hex[:6]}@test.com",
        full_name="Test Admin",
        hashed_password=hash_password("Admin@123456"),
        role="admin",
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_auth_token(client: AsyncClient, email: str, password: str) -> str:
    response = await client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]
