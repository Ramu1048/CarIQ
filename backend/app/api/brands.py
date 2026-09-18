"""
CarIQ Backend — Brands Router
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.vehicle import Vehicle
from app.schemas.vehicle import BrandOut, BrandCreate, BrandUpdate
from app.schemas.common import SuccessResponse
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/brands", tags=["Brands"])


@router.get("", response_model=List[BrandOut], summary="List all active brands")
async def list_brands(db: AsyncSession = Depends(get_db)):
    brands = await VehicleService.list_brands(db)
    # Enrich with vehicle count
    result = []
    for brand in brands:
        count_result = await db.execute(
            select(func.count()).select_from(Vehicle).where(
                Vehicle.brand_id == brand.id,
                Vehicle.is_deleted == False,  # noqa: E712
                Vehicle.is_active == True,  # noqa: E712
            )
        )
        count = count_result.scalar_one()
        brand_data = BrandOut.model_validate(brand)
        brand_data.vehicle_count = count
        result.append(brand_data)
    return result


@router.get("/{brand_id}", response_model=BrandOut, summary="Get brand by ID")
async def get_brand(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    brand = await VehicleService.get_brand(db, brand_id)
    return brand


@router.post("", response_model=BrandOut, status_code=201, summary="[Admin] Create brand")
async def create_brand(
    data: BrandCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    brand = await VehicleService.create_brand(db, data.model_dump())
    return brand


@router.put("/{brand_id}", response_model=BrandOut, summary="[Admin] Update brand")
async def update_brand(
    brand_id: uuid.UUID,
    data: BrandUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    brand = await VehicleService.get_brand(db, brand_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(brand, field, value)
    await db.commit()
    await db.refresh(brand)
    return brand
