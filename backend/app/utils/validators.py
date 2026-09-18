"""
CarIQ Backend — Validators
"""
import re

PHONE_RE = re.compile(r"^\+?[6-9]\d{9}$")
PINCODE_RE = re.compile(r"^\d{6}$")


def is_valid_phone(phone: str) -> bool:
    return bool(PHONE_RE.match(phone))


def is_valid_pincode(pincode: str) -> bool:
    return bool(PINCODE_RE.match(pincode))


def sanitize_string(s: str, max_length: int = 500) -> str:
    """Strip whitespace and truncate."""
    return s.strip()[:max_length]
