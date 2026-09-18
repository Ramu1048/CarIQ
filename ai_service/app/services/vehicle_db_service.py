import json
import os
from typing import Dict, List, Optional
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger
from ai_service.app.models.vehicle import Vehicle, VehicleFilter


class VehicleDatabaseService:
    """Manages verified structured vehicle catalog data with flexible querying and lookup."""

    def __init__(self, catalog_path: Optional[str] = None):
        self.catalog_path = catalog_path or settings.VEHICLES_FILE
        self._vehicles: Dict[str, Vehicle] = {}
        self.load_catalog()

    def load_catalog(self):
        if not os.path.exists(self.catalog_path):
            logger.warning(f"Vehicle catalog file not found at {self.catalog_path}")
            return

        try:
            with open(self.catalog_path, "r", encoding="utf-8") as f:
                raw_list = json.load(f)

            for item in raw_list:
                v = Vehicle(**item)
                self._vehicles[v.id] = v
            logger.info(f"Loaded {len(self._vehicles)} vehicles into VehicleDatabaseService.")
        except Exception as e:
            logger.error(f"Error loading vehicle catalog: {e}")

    def get_by_id(self, vehicle_id: str) -> Optional[Vehicle]:
        return self._vehicles.get(vehicle_id)

    def get_all(self) -> List[Vehicle]:
        return list(self._vehicles.values())

    def filter_vehicles(self, criteria: VehicleFilter) -> List[Vehicle]:
        results = []
        for v in self._vehicles.values():
            # Brand filter
            if criteria.brand and criteria.brand.lower() not in v.brand.lower():
                continue

            # Body type filter
            if criteria.body_type and criteria.body_type.lower() != v.body_type.lower():
                continue

            # Fuel type filter
            if criteria.fuel_type:
                ft = criteria.fuel_type.lower()
                if ft == "hybrid" and "hybrid" not in v.fuel_type.lower():
                    continue
                elif ft == "ev" and "electric" not in v.fuel_type.lower():
                    continue
                elif ft in ["petrol", "diesel", "cng", "electric", "strong hybrid"]:
                    if ft not in v.fuel_type.lower():
                        continue

            # Transmission filter
            if criteria.transmission:
                tr = criteria.transmission.lower()
                if "auto" in tr and v.transmission.lower() in ["manual", "mt"]:
                    continue
                elif "manual" in tr and v.transmission.lower() not in ["manual", "mt"]:
                    continue

            # Budget Max filter (allow 10% tolerance for close match)
            if criteria.budget_max and v.price_min > (criteria.budget_max * 1.10):
                continue

            # Budget Min filter
            if criteria.budget_min and v.price_max < criteria.budget_min:
                continue

            # Seating capacity
            if criteria.min_seating and v.seating_capacity < criteria.min_seating:
                continue

            # Safety rating
            if criteria.min_safety_rating and v.safety_rating_ncap < criteria.min_safety_rating:
                continue

            # Mileage
            if criteria.min_mileage and v.mileage_kmpl < criteria.min_mileage and v.fuel_type != "Electric":
                continue

            results.append(v)
        return results

    def find_by_name(self, name: str) -> Optional[Vehicle]:
        name_clean = name.lower().strip()
        for v in self._vehicles.values():
            full_name = f"{v.brand} {v.model}".lower()
            if name_clean in full_name or v.model.lower() in name_clean:
                return v
        return None


vehicle_db = VehicleDatabaseService()
