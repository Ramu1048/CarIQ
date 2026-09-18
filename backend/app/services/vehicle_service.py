"""
CarIQ Backend — Vehicle Service
CRUD operations, filtering, sorting, search
"""
import json
import logging
import uuid
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func, select, and_, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.brand import Brand
from app.models.vehicle import Vehicle, VehicleImage
from app.models.variant import Variant
from app.models.wishlist import Wishlist
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleFilterParams

logger = logging.getLogger(__name__)


class VehicleService:

    @staticmethod
    async def list_vehicles(
        db: AsyncSession,
        filters: VehicleFilterParams,
    ) -> Tuple[List[Vehicle], int]:
        """Retrieve filtered, sorted, paginated vehicles."""
        query = (
            select(Vehicle)
            .where(Vehicle.is_deleted == False, Vehicle.is_active == True)  # noqa: E712
            .options(selectinload(Vehicle.brand), selectinload(Vehicle.images))
        )

        # Filters
        if filters.min_price is not None:
            query = query.where(Vehicle.ex_showroom_price >= filters.min_price)
        if filters.max_price is not None:
            query = query.where(Vehicle.ex_showroom_price <= filters.max_price)
        if filters.brand_id:
            query = query.where(Vehicle.brand_id == filters.brand_id)
        if filters.fuel_type:
            query = query.where(Vehicle.fuel_type == filters.fuel_type)
        if filters.transmission:
            query = query.where(Vehicle.transmission == filters.transmission)
        if filters.body_type:
            query = query.where(Vehicle.body_type == filters.body_type)
        if filters.min_seating:
            query = query.where(Vehicle.seating_capacity >= filters.min_seating)
        if filters.max_seating:
            query = query.where(Vehicle.seating_capacity <= filters.max_seating)
        if filters.min_mileage:
            query = query.where(Vehicle.mileage_kmpl >= filters.min_mileage)
        if filters.min_safety_rating:
            query = query.where(Vehicle.safety_rating >= filters.min_safety_rating)
        if filters.is_ev is True:
            query = query.where(Vehicle.fuel_type == "electric")
        if filters.has_sunroof is not None:
            query = query.where(Vehicle.has_sunroof == filters.has_sunroof)
        if filters.has_adas is not None:
            query = query.where(Vehicle.has_adas == filters.has_adas)
        if filters.vehicle_type:
            query = query.where(Vehicle.vehicle_type == filters.vehicle_type)

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar_one()

        # Sorting
        sort = filters.sort_by or "popularity"
        if sort == "price_asc":
            query = query.order_by(asc(Vehicle.ex_showroom_price))
        elif sort == "price_desc":
            query = query.order_by(desc(Vehicle.ex_showroom_price))
        elif sort == "mileage":
            query = query.order_by(desc(Vehicle.mileage_kmpl))
        elif sort == "newest":
            query = query.order_by(desc(Vehicle.created_at))
        else:  # popularity (default)
            query = query.order_by(desc(Vehicle.popularity_score))

        # Pagination
        offset = (filters.page - 1) * filters.page_size
        query = query.offset(offset).limit(filters.page_size)

        result = await db.execute(query)
        vehicles = list(result.scalars().all())
        return vehicles, total

    @staticmethod
    async def get_vehicle_by_id(db: AsyncSession, vehicle_id: uuid.UUID) -> Vehicle:
        result = await db.execute(
            select(Vehicle)
            .where(Vehicle.id == vehicle_id, Vehicle.is_deleted == False)  # noqa: E712
            .options(
                selectinload(Vehicle.brand),
                selectinload(Vehicle.images),
                selectinload(Vehicle.variants),
            )
        )
        vehicle = result.scalar_one_or_none()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        return vehicle

    @staticmethod
    async def get_vehicle_by_slug(db: AsyncSession, slug: str) -> Vehicle:
        result = await db.execute(
            select(Vehicle)
            .where(Vehicle.slug == slug, Vehicle.is_deleted == False)  # noqa: E712
            .options(
                selectinload(Vehicle.brand),
                selectinload(Vehicle.images),
                selectinload(Vehicle.variants),
            )
        )
        vehicle = result.scalar_one_or_none()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        return vehicle

    @staticmethod
    async def create_vehicle(db: AsyncSession, data: VehicleCreate) -> Vehicle:
        # Verify brand exists
        brand = await db.get(Brand, data.brand_id)
        if not brand:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")

        from slugify import slugify
        slug = slugify(f"{brand.name}-{data.model_name}")
        # Ensure unique slug
        count = (await db.execute(select(func.count()).select_from(Vehicle).where(Vehicle.slug.like(f"{slug}%")))).scalar_one()
        if count > 0:
            slug = f"{slug}-{count + 1}"

        vehicle_data = data.model_dump()
        vehicle = Vehicle(id=uuid.uuid4(), slug=slug, **vehicle_data)
        db.add(vehicle)
        await db.commit()
        await db.refresh(vehicle)
        return vehicle

    @staticmethod
    async def update_vehicle(db: AsyncSession, vehicle_id: uuid.UUID, data: VehicleUpdate) -> Vehicle:
        vehicle = await VehicleService.get_vehicle_by_id(db, vehicle_id)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(vehicle, field, value)
        await db.commit()
        await db.refresh(vehicle)
        return vehicle

    @staticmethod
    async def soft_delete_vehicle(db: AsyncSession, vehicle_id: uuid.UUID) -> bool:
        from datetime import datetime, timezone
        vehicle = await VehicleService.get_vehicle_by_id(db, vehicle_id)
        vehicle.is_deleted = True
        vehicle.deleted_at = datetime.now(timezone.utc)
        vehicle.is_active = False
        await db.commit()
        return True

    @staticmethod
    async def search_vehicles(
        db: AsyncSession,
        query_text: str,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Vehicle], int, Dict[str, Any]]:
        """Full-text style search on model name, brand name, body type."""
        keywords = query_text.lower().split()

        # Build conditions
        conditions = []
        for kw in keywords:
            conditions.append(
                or_(
                    Vehicle.model_name.ilike(f"%{kw}%"),
                    Vehicle.body_type.ilike(f"%{kw}%"),
                    Vehicle.fuel_type.ilike(f"%{kw}%"),
                    Vehicle.transmission.ilike(f"%{kw}%"),
                )
            )

        base_query = (
            select(Vehicle)
            .join(Brand, Vehicle.brand_id == Brand.id)
            .where(
                Vehicle.is_deleted == False,  # noqa: E712
                Vehicle.is_active == True,  # noqa: E712
                or_(*conditions) if conditions else True,
            )
            .options(selectinload(Vehicle.brand), selectinload(Vehicle.images))
        )

        # Also search brand names
        brand_query = (
            select(Vehicle)
            .join(Brand, Vehicle.brand_id == Brand.id)
            .where(
                Vehicle.is_deleted == False,  # noqa: E712
                Vehicle.is_active == True,  # noqa: E712
                or_(*[Brand.name.ilike(f"%{kw}%") for kw in keywords]) if keywords else True,
            )
            .options(selectinload(Vehicle.brand), selectinload(Vehicle.images))
        )

        total_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        result = await db.execute(
            base_query.order_by(desc(Vehicle.popularity_score)).offset(offset).limit(page_size)
        )
        vehicles = list(result.scalars().all())

        applied_filters = {"query": query_text, "keywords": keywords}
        return vehicles, total, applied_filters

    # ── Brands ─────────────────────────────────────────────────────────────────
    @staticmethod
    async def list_brands(db: AsyncSession) -> List[Brand]:
        result = await db.execute(
            select(Brand).where(Brand.is_active == True).order_by(Brand.name)  # noqa: E712
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_brand(db: AsyncSession, brand_id: uuid.UUID) -> Brand:
        brand = await db.get(Brand, brand_id)
        if not brand or not brand.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
        return brand

    @staticmethod
    async def create_brand(db: AsyncSession, data: dict) -> Brand:
        from slugify import slugify
        slug = slugify(data["name"])
        brand = Brand(id=uuid.uuid4(), slug=slug, **data)
        db.add(brand)
        await db.commit()
        await db.refresh(brand)
        return brand

    # ── Wishlist ───────────────────────────────────────────────────────────────
    @staticmethod
    async def add_to_wishlist(db: AsyncSession, user_id: uuid.UUID, vehicle_id: uuid.UUID) -> Wishlist:
        # Check vehicle exists
        await VehicleService.get_vehicle_by_id(db, vehicle_id)

        # Check duplicate
        result = await db.execute(
            select(Wishlist).where(Wishlist.user_id == user_id, Wishlist.vehicle_id == vehicle_id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vehicle already in wishlist")

        item = Wishlist(id=uuid.uuid4(), user_id=user_id, vehicle_id=vehicle_id)
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item

    @staticmethod
    async def remove_from_wishlist(db: AsyncSession, user_id: uuid.UUID, vehicle_id: uuid.UUID) -> bool:
        result = await db.execute(
            select(Wishlist).where(Wishlist.user_id == user_id, Wishlist.vehicle_id == vehicle_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not in wishlist")
        await db.delete(item)
        await db.commit()
        return True

    @staticmethod
    async def get_wishlist(db: AsyncSession, user_id: uuid.UUID) -> List[Vehicle]:
        result = await db.execute(
            select(Vehicle)
            .join(Wishlist, Wishlist.vehicle_id == Vehicle.id)
            .where(Wishlist.user_id == user_id, Vehicle.is_deleted == False)  # noqa: E712
            .options(selectinload(Vehicle.brand), selectinload(Vehicle.images))
            .order_by(desc(Wishlist.created_at))
        )
        return list(result.scalars().all())
