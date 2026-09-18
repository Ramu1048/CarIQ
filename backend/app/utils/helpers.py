"""
CarIQ Backend — Helpers
"""
import json
import uuid
from typing import Any, List, Optional


def parse_json_field(value: Optional[str]) -> List[Any]:
    """Safely parse a JSON string field into a list."""
    if not value:
        return []
    try:
        return json.loads(value)
    except Exception:
        return []


def format_price_inr(amount: int) -> str:
    """Format price in Indian Rupee notation."""
    if amount >= 10_000_000:
        return f"₹{amount/10_000_000:.2f} Cr"
    elif amount >= 100_000:
        return f"₹{amount/100_000:.2f} L"
    else:
        return f"₹{amount:,}"


def get_primary_image(images: list) -> Optional[str]:
    """Return primary image URL from a list of VehicleImage objects."""
    for img in images:
        if img.is_primary:
            return img.url
    return images[0].url if images else None
