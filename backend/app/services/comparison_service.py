"""
CarIQ Backend — Comparison Service
"""
from __future__ import annotations
import json
import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comparison import Comparison
from app.models.vehicle import Vehicle
from app.services.ai_service import get_ai_provider, RECOMMENDATION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def build_comparison_table(vehicles: List[Vehicle]) -> List[Dict[str, Any]]:
    """Build a structured comparison table with winner detection."""
    def v_id(v: Vehicle) -> str:
        return str(v.id)

    def best(values: Dict[str, Any], higher_is_better: bool = True) -> Optional[str]:
        filtered = {k: v for k, v in values.items() if v is not None}
        if not filtered:
            return None
        return max(filtered, key=lambda k: filtered[k]) if higher_is_better else min(filtered, key=lambda k: filtered[k])

    fields = [
        {"label": "Price (Ex-Showroom)", "key": "ex_showroom_price", "unit": "INR", "higher_better": False},
        {"label": "Mileage", "key": "mileage_kmpl", "unit": "km/l", "higher_better": True},
        {"label": "Engine Displacement", "key": "engine_cc", "unit": "cc", "higher_better": True},
        {"label": "Horsepower", "key": "horsepower", "unit": "bhp", "higher_better": True},
        {"label": "Torque", "key": "torque_nm", "unit": "Nm", "higher_better": True},
        {"label": "Seating Capacity", "key": "seating_capacity", "unit": "persons", "higher_better": True},
        {"label": "Boot Space", "key": "boot_space_litres", "unit": "litres", "higher_better": True},
        {"label": "Ground Clearance", "key": "ground_clearance_mm", "unit": "mm", "higher_better": True},
        {"label": "Safety Rating (NCAP)", "key": "safety_rating", "unit": "★", "higher_better": True},
        {"label": "Airbags", "key": "num_airbags", "unit": "count", "higher_better": True},
        {"label": "Fuel Type", "key": "fuel_type", "unit": None, "higher_better": None},
        {"label": "Transmission", "key": "transmission", "unit": None, "higher_better": None},
        {"label": "Body Type", "key": "body_type", "unit": None, "higher_better": None},
        {"label": "EV Range", "key": "ev_range_km", "unit": "km", "higher_better": True},
        {"label": "Battery Capacity", "key": "battery_capacity_kwh", "unit": "kWh", "higher_better": True},
        {"label": "Sunroof", "key": "has_sunroof", "unit": None, "higher_better": True},
        {"label": "ADAS", "key": "has_adas", "unit": None, "higher_better": True},
        {"label": "ABS", "key": "has_abs", "unit": None, "higher_better": True},
        {"label": "Warranty", "key": "warranty_years", "unit": "years", "higher_better": True},
        {"label": "Warranty (km)", "key": "warranty_km", "unit": "km", "higher_better": True},
    ]

    table = []
    for f in fields:
        values = {v_id(v): getattr(v, f["key"], None) for v in vehicles}
        winner = None
        if f["higher_better"] is not None:
            winner = best(values, f["higher_better"])
        table.append({
            "label": f["label"],
            "values": values,
            "unit": f["unit"],
            "winner_id": winner,
        })
    return table


class ComparisonService:

    @staticmethod
    async def compare(
        db: AsyncSession,
        vehicle_ids: List[uuid.UUID],
        user_id: Optional[uuid.UUID] = None,
    ) -> Comparison:
        if len(vehicle_ids) < 2 or len(vehicle_ids) > 4:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Compare 2-4 vehicles")

        # Load vehicles
        result = await db.execute(
            select(Vehicle)
            .where(Vehicle.id.in_(vehicle_ids), Vehicle.is_deleted == False)  # noqa: E712
            .options(selectinload(Vehicle.brand), selectinload(Vehicle.images), selectinload(Vehicle.variants))
        )
        vehicles = list(result.scalars().all())

        if len(vehicles) != len(vehicle_ids):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more vehicles not found")

        # Reorder vehicles to match requested order
        vehicles_map = {v.id: v for v in vehicles}
        vehicles = [vehicles_map[vid] for vid in vehicle_ids if vid in vehicles_map]

        # Build comparison table
        comparison_table = build_comparison_table(vehicles)

        # AI summary
        ai = get_ai_provider()
        vehicle_summaries = "\n\n".join([
            f"{v.brand.name if v.brand else ''} {v.model_name}: "
            f"₹{v.ex_showroom_price/100000:.1f}L, {v.fuel_type}, {v.transmission}, "
            f"{v.mileage_kmpl or 'N/A'} kmpl, {v.safety_rating or 'N/A'}★ NCAP"
            for v in vehicles
        ])

        try:
            ai_summary = await ai.generate(
                prompt=(
                    f"Compare these {len(vehicles)} vehicles based ONLY on the provided data. "
                    f"Give a neutral, factual 3-5 sentence summary.\n\n{vehicle_summaries}"
                ),
                system_prompt=RECOMMENDATION_SYSTEM_PROMPT,
                max_tokens=300,
            )
            ai_verdict = await ai.generate(
                prompt=(
                    f"Based ONLY on the data provided, which vehicle offers the best value overall and why? "
                    f"Keep it to 2 sentences.\n\n{vehicle_summaries}"
                ),
                system_prompt=RECOMMENDATION_SYSTEM_PROMPT,
                max_tokens=150,
            )
        except Exception as e:
            logger.warning(f"AI comparison failed: {e}")
            ai_summary = "Comparison based on verified database specifications."
            ai_verdict = "Select the vehicle that best matches your specific requirements and budget."

        # Store comparison
        comp = Comparison(
            id=uuid.uuid4(),
            user_id=user_id,
            vehicle_ids=json.dumps([str(vid) for vid in vehicle_ids]),
            ai_summary=ai_summary,
            ai_verdict=ai_verdict,
            status="completed",
        )
        db.add(comp)
        await db.commit()
        await db.refresh(comp)

        # Attach for response
        comp._vehicles = vehicles
        comp._table = comparison_table
        return comp

    @staticmethod
    async def get_comparison(db: AsyncSession, comparison_id: uuid.UUID) -> Comparison:
        comp = await db.get(Comparison, comparison_id)
        if not comp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comparison not found")

        # Load vehicles
        vehicle_ids = [uuid.UUID(vid) for vid in json.loads(comp.vehicle_ids)]
        result = await db.execute(
            select(Vehicle)
            .where(Vehicle.id.in_(vehicle_ids))
            .options(selectinload(Vehicle.brand), selectinload(Vehicle.images), selectinload(Vehicle.variants))
        )
        vehicles = list(result.scalars().all())
        vehicles_map = {v.id: v for v in vehicles}
        vehicles = [vehicles_map[vid] for vid in vehicle_ids if vid in vehicles_map]

        comp._vehicles = vehicles
        comp._table = build_comparison_table(vehicles)
        return comp
