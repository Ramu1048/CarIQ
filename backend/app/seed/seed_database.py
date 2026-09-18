"""
CarIQ Backend — Database Seed Script
Idempotent: safe to run multiple times.
Creates 10+ brands, 30+ vehicles, variants, images, and admin user.

Run with:
    python -m app.seed.seed_database
"""
import asyncio
import json
import logging
import sys
import uuid
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
from app.models.brand import Brand
from app.models.user import User
from app.models.vehicle import Vehicle, VehicleImage
from app.models.variant import Variant

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


# ── Seed Data ──────────────────────────────────────────────────────────────────
BRANDS_DATA = [
    {"name": "Maruti Suzuki", "country_of_origin": "Japan/India", "founded_year": 1981, "logo_url": "https://placehold.co/200x80/1a1a2e/white?text=Maruti"},
    {"name": "Hyundai", "country_of_origin": "South Korea", "founded_year": 1967, "logo_url": "https://placehold.co/200x80/002c5f/white?text=Hyundai"},
    {"name": "Tata Motors", "country_of_origin": "India", "founded_year": 1945, "logo_url": "https://placehold.co/200x80/00235b/white?text=Tata"},
    {"name": "Mahindra", "country_of_origin": "India", "founded_year": 1945, "logo_url": "https://placehold.co/200x80/e31837/white?text=Mahindra"},
    {"name": "Honda", "country_of_origin": "Japan", "founded_year": 1948, "logo_url": "https://placehold.co/200x80/cc0000/white?text=Honda"},
    {"name": "Toyota", "country_of_origin": "Japan", "founded_year": 1937, "logo_url": "https://placehold.co/200x80/eb0a1e/white?text=Toyota"},
    {"name": "Kia", "country_of_origin": "South Korea", "founded_year": 1944, "logo_url": "https://placehold.co/200x80/05141f/white?text=Kia"},
    {"name": "MG Motors", "country_of_origin": "UK/China", "founded_year": 1924, "logo_url": "https://placehold.co/200x80/b01e23/white?text=MG"},
    {"name": "Volkswagen", "country_of_origin": "Germany", "founded_year": 1937, "logo_url": "https://placehold.co/200x80/001e50/white?text=VW"},
    {"name": "Skoda", "country_of_origin": "Czech Republic", "founded_year": 1895, "logo_url": "https://placehold.co/200x80/1e4620/white?text=Skoda"},
    {"name": "Renault", "country_of_origin": "France", "founded_year": 1899, "logo_url": "https://placehold.co/200x80/efdf00/black?text=Renault"},
    {"name": "Jeep", "country_of_origin": "USA", "founded_year": 1941, "logo_url": "https://placehold.co/200x80/2e4a7b/white?text=Jeep"},
]

# Vehicle seed data: (brand_name, model_data)
VEHICLES_DATA = [
    # ── Maruti Suzuki ──────────────────────────────────────────────────────────
    ("Maruti Suzuki", {
        "model_name": "Swift", "body_type": "hatchback", "fuel_type": "petrol",
        "transmission": "manual", "ex_showroom_price": 699000,
        "engine_cc": 1197, "horsepower": 89.0, "torque_nm": 113.0,
        "mileage_kmpl": 23.76, "seating_capacity": 5,
        "ground_clearance_mm": 163, "boot_space_litres": 268,
        "safety_rating": 3.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": False, "has_adas": False,
        "has_apple_carplay": True, "has_android_auto": True,
        "infotainment_screen_inches": 9.0,
        "warranty_years": 2, "warranty_km": 40000, "launch_year": 2024,
        "tagline": "The most popular hatchback in India",
        "popularity_score": 95.0,
        "images": ["/images/cars/swift.jpg"],
        "variants": [
            {"name": "LXi", "ex_showroom_price": 699000, "sort_order": 1},
            {"name": "VXi", "ex_showroom_price": 749000, "sort_order": 2},
            {"name": "ZXi", "ex_showroom_price": 849000, "sort_order": 3},
            {"name": "ZXi+", "ex_showroom_price": 935000, "sort_order": 4},
        ]
    }),
    ("Maruti Suzuki", {
        "model_name": "Baleno", "body_type": "hatchback", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 882000,
        "engine_cc": 1197, "horsepower": 88.5, "torque_nm": 113.0,
        "mileage_kmpl": 22.35, "seating_capacity": 5,
        "ground_clearance_mm": 170, "boot_space_litres": 339,
        "safety_rating": 2.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": False, "has_adas": False,
        "has_apple_carplay": True, "has_android_auto": True,
        "infotainment_screen_inches": 9.0,
        "warranty_years": 2, "warranty_km": 40000, "launch_year": 2022,
        "tagline": "Premium hatchback with superior comfort",
        "popularity_score": 82.0,
        "images": ["/images/cars/baleno.jpg"],
        "variants": [
            {"name": "Sigma", "ex_showroom_price": 682000, "transmission": "manual", "sort_order": 1},
            {"name": "Delta", "ex_showroom_price": 770000, "sort_order": 2},
            {"name": "Zeta", "ex_showroom_price": 862000, "sort_order": 3},
            {"name": "Alpha", "ex_showroom_price": 882000, "sort_order": 4},
        ]
    }),
    ("Maruti Suzuki", {
        "model_name": "Brezza", "body_type": "suv", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1329000,
        "engine_cc": 1462, "horsepower": 103.0, "torque_nm": 137.0,
        "mileage_kmpl": 19.8, "seating_capacity": 5,
        "ground_clearance_mm": 198, "boot_space_litres": 328,
        "safety_rating": 4.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": False,
        "has_apple_carplay": True, "has_android_auto": True,
        "infotainment_screen_inches": 9.0,
        "warranty_years": 2, "warranty_km": 40000, "launch_year": 2022,
        "tagline": "The bold compact SUV",
        "popularity_score": 88.0,
        "images": ["/images/cars/brezza.jpg"],
        "variants": [
            {"name": "LXi", "ex_showroom_price": 829000, "transmission": "manual", "sort_order": 1},
            {"name": "VXi", "ex_showroom_price": 1049000, "sort_order": 2},
            {"name": "ZXi", "ex_showroom_price": 1329000, "sort_order": 3},
            {"name": "ZXi+", "ex_showroom_price": 1499000, "sort_order": 4},
        ]
    }),
    # ── Hyundai ────────────────────────────────────────────────────────────────
    ("Hyundai", {
        "model_name": "i20", "body_type": "hatchback", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1153000,
        "engine_cc": 1197, "horsepower": 88.0, "torque_nm": 172.0,
        "mileage_kmpl": 20.35, "seating_capacity": 5,
        "ground_clearance_mm": 165, "boot_space_litres": 311,
        "safety_rating": 3.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": False,
        "has_apple_carplay": True, "has_android_auto": True,
        "infotainment_screen_inches": 10.25,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2023,
        "tagline": "Drive your way",
        "popularity_score": 78.0,
        "images": ["/images/cars/i20.jpg"],
        "variants": [
            {"name": "Magna", "ex_showroom_price": 724000, "transmission": "manual", "sort_order": 1},
            {"name": "Sportz", "ex_showroom_price": 920000, "sort_order": 2},
            {"name": "Asta", "ex_showroom_price": 1153000, "sort_order": 3},
        ]
    }),
    ("Hyundai", {
        "model_name": "Creta", "body_type": "suv", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1500000,
        "engine_cc": 1482, "horsepower": 115.0, "torque_nm": 144.0,
        "mileage_kmpl": 17.4, "seating_capacity": 5,
        "ground_clearance_mm": 190, "boot_space_litres": 433,
        "safety_rating": 5.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "adas_features": '["Lane Keep Assist","Blind Spot Monitor","Forward Collision Warning"]',
        "has_apple_carplay": True, "has_android_auto": True,
        "has_360_camera": True,
        "infotainment_screen_inches": 10.25,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2024,
        "tagline": "India's favourite SUV",
        "popularity_score": 96.0,
        "images": ["/images/cars/creta.png"],
        "variants": [
            {"name": "E", "ex_showroom_price": 1100000, "sort_order": 1},
            {"name": "S", "ex_showroom_price": 1350000, "sort_order": 2},
            {"name": "SX", "ex_showroom_price": 1500000, "sort_order": 3},
            {"name": "SX(O)", "ex_showroom_price": 2000000, "sort_order": 4},
        ]
    }),
    ("Hyundai", {
        "model_name": "Alcazar", "body_type": "suv", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 2049000,
        "engine_cc": 1999, "horsepower": 159.0, "torque_nm": 192.0,
        "mileage_kmpl": 14.5, "seating_capacity": 7,
        "ground_clearance_mm": 200, "boot_space_litres": 180,
        "safety_rating": 4.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "has_apple_carplay": True, "has_android_auto": True,
        "infotainment_screen_inches": 10.25,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2023,
        "tagline": "7-seater premium SUV",
        "popularity_score": 72.0,
        "images": ["/images/cars/alcazar.png"],
        "variants": [
            {"name": "Prestige", "ex_showroom_price": 1799000, "sort_order": 1},
            {"name": "Platinum", "ex_showroom_price": 2049000, "sort_order": 2},
        ]
    }),
    # ── Tata Motors ────────────────────────────────────────────────────────────
    ("Tata Motors", {
        "model_name": "Nexon", "body_type": "suv", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1402000,
        "engine_cc": 1199, "horsepower": 120.0, "torque_nm": 170.0,
        "mileage_kmpl": 17.01, "seating_capacity": 5,
        "ground_clearance_mm": 209, "boot_space_litres": 350,
        "safety_rating": 5.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "adas_features": '["Auto Emergency Braking","Lane Departure Warning","Traffic Sign Recognition"]',
        "has_apple_carplay": True, "has_android_auto": True,
        "has_360_camera": True, "has_wireless_charging": True,
        "infotainment_screen_inches": 10.25,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2023,
        "tagline": "5-Star Safety SUV",
        "popularity_score": 90.0,
        "images": ["/images/cars/nexon.jpg"],
        "variants": [
            {"name": "Smart", "ex_showroom_price": 800000, "transmission": "manual", "sort_order": 1},
            {"name": "Pure", "ex_showroom_price": 950000, "sort_order": 2},
            {"name": "Creative", "ex_showroom_price": 1300000, "sort_order": 3},
            {"name": "Fearless", "ex_showroom_price": 1402000, "sort_order": 4},
        ]
    }),
    ("Tata Motors", {
        "model_name": "Nexon EV", "body_type": "suv", "fuel_type": "electric",
        "transmission": "automatic", "ex_showroom_price": 1419900,
        "horsepower": 143.0, "torque_nm": 250.0,
        "mileage_kmpl": None, "seating_capacity": 5,
        "battery_capacity_kwh": 40.5, "ev_range_km": 465,
        "charging_time_ac_hours": 8.6, "charging_time_dc_minutes": 56,
        "ground_clearance_mm": 209, "boot_space_litres": 350,
        "safety_rating": 5.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "has_apple_carplay": True, "has_android_auto": True,
        "has_wireless_charging": True,
        "infotainment_screen_inches": 10.25,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2023,
        "tagline": "India's best-selling electric SUV",
        "popularity_score": 88.0,
        "images": ["/images/cars/nexon-ev.png"],
        "variants": [
            {"name": "Medium Range", "ex_showroom_price": 1419900, "sort_order": 1},
            {"name": "Long Range", "ex_showroom_price": 1719900, "sort_order": 2},
        ]
    }),
    ("Tata Motors", {
        "model_name": "Punch", "body_type": "suv", "fuel_type": "petrol",
        "transmission": "manual", "ex_showroom_price": 606000,
        "engine_cc": 1199, "horsepower": 86.0, "torque_nm": 113.0,
        "mileage_kmpl": 18.82, "seating_capacity": 5,
        "ground_clearance_mm": 187, "boot_space_litres": 366,
        "safety_rating": 5.0, "num_airbags": 2,
        "has_abs": True, "has_sunroof": False, "has_adas": False,
        "has_apple_carplay": True, "has_android_auto": True,
        "infotainment_screen_inches": 7.0,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2021,
        "tagline": "Most affordable 5-star rated car",
        "popularity_score": 85.0,
        "images": ["/images/cars/punch.png"],
        "variants": [
            {"name": "Pure", "ex_showroom_price": 606000, "sort_order": 1},
            {"name": "Adventure", "ex_showroom_price": 750000, "sort_order": 2},
            {"name": "Accomplished", "ex_showroom_price": 900000, "sort_order": 3},
            {"name": "Creative", "ex_showroom_price": 1000000, "sort_order": 4},
        ]
    }),
    # ── Mahindra ───────────────────────────────────────────────────────────────
    ("Mahindra", {
        "model_name": "XUV700", "body_type": "suv", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1399000,
        "engine_cc": 1999, "horsepower": 200.0, "torque_nm": 380.0,
        "mileage_kmpl": 15.06, "seating_capacity": 7,
        "ground_clearance_mm": 200, "boot_space_litres": 480,
        "safety_rating": 5.0, "num_airbags": 7,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "adas_features": '["Auto Emergency Braking","Adaptive Cruise Control","Lane Keep Assist","Driver Drowsiness Detection"]',
        "has_apple_carplay": True, "has_android_auto": True,
        "has_360_camera": True, "has_wireless_charging": True,
        "has_ventilated_seats": True,
        "infotainment_screen_inches": 10.25,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2021,
        "tagline": "Game changer SUV",
        "popularity_score": 92.0,
        "images": ["/images/cars/xuv700.jpg"],
        "variants": [
            {"name": "MX", "ex_showroom_price": 1399000, "sort_order": 1},
            {"name": "AX3", "ex_showroom_price": 1699000, "sort_order": 2},
            {"name": "AX5", "ex_showroom_price": 2099000, "sort_order": 3},
            {"name": "AX7", "ex_showroom_price": 2599000, "sort_order": 4},
        ]
    }),
    ("Mahindra", {
        "model_name": "Scorpio N", "body_type": "suv", "fuel_type": "diesel",
        "transmission": "manual", "ex_showroom_price": 1399900,
        "engine_cc": 2184, "horsepower": 175.0, "torque_nm": 400.0,
        "mileage_kmpl": 15.0, "seating_capacity": 6,
        "ground_clearance_mm": 210, "boot_space_litres": 720,
        "safety_rating": 5.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": False,
        "has_apple_carplay": True, "has_android_auto": True,
        "infotainment_screen_inches": 8.0,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2022,
        "tagline": "Born tougher",
        "popularity_score": 86.0,
        "images": ["/images/cars/scorpio.jpg"],
        "variants": [
            {"name": "Z2", "ex_showroom_price": 1399900, "sort_order": 1},
            {"name": "Z4", "ex_showroom_price": 1600000, "sort_order": 2},
            {"name": "Z6", "ex_showroom_price": 1900000, "sort_order": 3},
            {"name": "Z8", "ex_showroom_price": 2300000, "sort_order": 4},
        ]
    }),
    # ── Honda ──────────────────────────────────────────────────────────────────
    ("Honda", {
        "model_name": "City", "body_type": "sedan", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1551900,
        "engine_cc": 1498, "horsepower": 121.0, "torque_nm": 145.0,
        "mileage_kmpl": 17.8, "seating_capacity": 5,
        "ground_clearance_mm": 165, "boot_space_litres": 506,
        "safety_rating": 3.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "adas_features": '["Honda Sensing","Collision Mitigation","Lane Keeping Assist"]',
        "has_apple_carplay": True, "has_android_auto": True,
        "has_wireless_charging": True,
        "infotainment_screen_inches": 8.0,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2023,
        "tagline": "Premium sedan for every road",
        "popularity_score": 70.0,
        "images": ["/images/cars/baleno.jpg"],
        "variants": [
            {"name": "V", "ex_showroom_price": 1161900, "sort_order": 1},
            {"name": "VX", "ex_showroom_price": 1426900, "sort_order": 2},
            {"name": "ZX", "ex_showroom_price": 1551900, "sort_order": 3},
        ]
    }),
    # ── Toyota ─────────────────────────────────────────────────────────────────
    ("Toyota", {
        "model_name": "Innova Crysta", "body_type": "muv", "fuel_type": "diesel",
        "transmission": "automatic", "ex_showroom_price": 1982900,
        "engine_cc": 2393, "horsepower": 150.0, "torque_nm": 360.0,
        "mileage_kmpl": 11.0, "seating_capacity": 7,
        "ground_clearance_mm": 183, "boot_space_litres": 300,
        "safety_rating": 4.0, "num_airbags": 7,
        "has_abs": True, "has_sunroof": False, "has_adas": False,
        "has_apple_carplay": True, "has_android_auto": True,
        "infotainment_screen_inches": 9.0,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2022,
        "tagline": "The ultimate family car",
        "popularity_score": 75.0,
        "images": ["/images/cars/innova-crysta.jpg"],
        "variants": [
            {"name": "GX", "ex_showroom_price": 1982900, "sort_order": 1},
            {"name": "VX", "ex_showroom_price": 2200000, "sort_order": 2},
            {"name": "ZX", "ex_showroom_price": 2600000, "sort_order": 3},
        ]
    }),
    ("Toyota", {
        "model_name": "Fortuner", "body_type": "suv", "fuel_type": "diesel",
        "transmission": "automatic", "ex_showroom_price": 3329900,
        "engine_cc": 2755, "horsepower": 204.0, "torque_nm": 500.0,
        "mileage_kmpl": 10.0, "seating_capacity": 7,
        "ground_clearance_mm": 221, "boot_space_litres": 296,
        "safety_rating": 5.0, "num_airbags": 7,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "has_apple_carplay": True, "has_android_auto": True,
        "has_360_camera": True, "has_ventilated_seats": True,
        "infotainment_screen_inches": 8.0,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2021,
        "tagline": "Rule every terrain",
        "popularity_score": 80.0,
        "images": ["/images/cars/fortuner.jpg"],
        "variants": [
            {"name": "4x2 AT", "ex_showroom_price": 3329900, "sort_order": 1},
            {"name": "4x4 AT", "ex_showroom_price": 3879900, "sort_order": 2},
            {"name": "Legender", "ex_showroom_price": 4260000, "sort_order": 3},
        ]
    }),
    # ── Kia ────────────────────────────────────────────────────────────────────
    ("Kia", {
        "model_name": "Seltos", "body_type": "suv", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1499000,
        "engine_cc": 1482, "horsepower": 115.0, "torque_nm": 144.0,
        "mileage_kmpl": 16.5, "seating_capacity": 5,
        "ground_clearance_mm": 190, "boot_space_litres": 433,
        "safety_rating": 5.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "adas_features": '["Forward Collision Warning","Lane Keep Assist","Driver Attention Warning"]',
        "has_apple_carplay": True, "has_android_auto": True,
        "has_360_camera": True, "has_wireless_charging": True,
        "infotainment_screen_inches": 10.25,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2023,
        "tagline": "Movement that inspires",
        "popularity_score": 88.0,
        "images": ["/images/cars/seltos.jpg"],
        "variants": [
            {"name": "HTE", "ex_showroom_price": 1099000, "sort_order": 1},
            {"name": "HTK", "ex_showroom_price": 1300000, "sort_order": 2},
            {"name": "HTX", "ex_showroom_price": 1499000, "sort_order": 3},
            {"name": "GTX+", "ex_showroom_price": 2000000, "sort_order": 4},
        ]
    }),
    ("Kia", {
        "model_name": "Carens", "body_type": "muv", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1099000,
        "engine_cc": 1482, "horsepower": 115.0, "torque_nm": 144.0,
        "mileage_kmpl": 16.0, "seating_capacity": 7,
        "ground_clearance_mm": 195, "boot_space_litres": 196,
        "safety_rating": 3.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": False,
        "has_apple_carplay": True, "has_android_auto": True,
        "infotainment_screen_inches": 10.25,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2022,
        "tagline": "Premium 7-seater MPV",
        "popularity_score": 72.0,
        "images": ["/images/cars/carens.jpg"],
        "variants": [
            {"name": "Premium", "ex_showroom_price": 1099000, "sort_order": 1},
            {"name": "Luxury", "ex_showroom_price": 1399000, "sort_order": 2},
        ]
    }),
    # ── MG Motors ─────────────────────────────────────────────────────────────
    ("MG Motors", {
        "model_name": "Hector", "body_type": "suv", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1400000,
        "engine_cc": 1451, "horsepower": 143.0, "torque_nm": 250.0,
        "mileage_kmpl": 15.0, "seating_capacity": 5,
        "ground_clearance_mm": 192, "boot_space_litres": 587,
        "safety_rating": 4.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "adas_features": '["Adaptive Cruise Control","Lane Departure Warning","Blind Spot Detection"]',
        "has_apple_carplay": True, "has_android_auto": True,
        "has_360_camera": True, "has_wireless_charging": True,
        "has_ventilated_seats": True,
        "infotainment_screen_inches": 14.0,
        "warranty_years": 5, "warranty_km": 100000, "launch_year": 2023,
        "tagline": "Limitless. Effortless. Hector.",
        "popularity_score": 68.0,
        "images": ["/images/cars/harrier.jpg"],
        "variants": [
            {"name": "Style", "ex_showroom_price": 1400000, "sort_order": 1},
            {"name": "Super", "ex_showroom_price": 1700000, "sort_order": 2},
            {"name": "Sharp", "ex_showroom_price": 1900000, "sort_order": 3},
        ]
    }),
    ("MG Motors", {
        "model_name": "ZS EV", "body_type": "suv", "fuel_type": "electric",
        "transmission": "automatic", "ex_showroom_price": 2199000,
        "horsepower": 174.0, "torque_nm": 280.0,
        "mileage_kmpl": None, "seating_capacity": 5,
        "battery_capacity_kwh": 50.3, "ev_range_km": 461,
        "charging_time_ac_hours": 8.5, "charging_time_dc_minutes": 60,
        "ground_clearance_mm": 172, "boot_space_litres": 448,
        "safety_rating": 4.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "has_apple_carplay": True, "has_android_auto": True,
        "has_360_camera": True, "has_wireless_charging": True,
        "infotainment_screen_inches": 10.1,
        "warranty_years": 5, "warranty_km": 100000, "launch_year": 2023,
        "tagline": "Electric SUV for the future",
        "popularity_score": 65.0,
        "images": ["/images/cars/punch-ev.jpg"],
        "variants": [
            {"name": "Excite", "ex_showroom_price": 2199000, "sort_order": 1},
            {"name": "Exclusive", "ex_showroom_price": 2499000, "sort_order": 2},
        ]
    }),
    # ── Volkswagen ─────────────────────────────────────────────────────────────
    ("Volkswagen", {
        "model_name": "Taigun", "body_type": "suv", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1174900,
        "engine_cc": 999, "horsepower": 115.0, "torque_nm": 178.0,
        "mileage_kmpl": 17.37, "seating_capacity": 5,
        "ground_clearance_mm": 188, "boot_space_litres": 385,
        "safety_rating": 5.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "adas_features": '["Front Assist","Side Assist","Rear Traffic Alert"]',
        "has_apple_carplay": True, "has_android_auto": True,
        "has_wireless_charging": True,
        "infotainment_screen_inches": 10.0,
        "warranty_years": 4, "warranty_km": 100000, "launch_year": 2021,
        "tagline": "German engineering meets Indian roads",
        "popularity_score": 72.0,
        "images": ["/images/cars/grand-i10.jpg"],
        "variants": [
            {"name": "Comfortline", "ex_showroom_price": 1174900, "sort_order": 1},
            {"name": "Highline", "ex_showroom_price": 1500000, "sort_order": 2},
            {"name": "Topline", "ex_showroom_price": 1699900, "sort_order": 3},
        ]
    }),
    # ── Skoda ──────────────────────────────────────────────────────────────────
    ("Skoda", {
        "model_name": "Slavia", "body_type": "sedan", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1099900,
        "engine_cc": 999, "horsepower": 115.0, "torque_nm": 178.0,
        "mileage_kmpl": 18.74, "seating_capacity": 5,
        "ground_clearance_mm": 165, "boot_space_litres": 521,
        "safety_rating": 5.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": False,
        "has_apple_carplay": True, "has_android_auto": True,
        "has_wireless_charging": True,
        "infotainment_screen_inches": 10.0,
        "warranty_years": 4, "warranty_km": 100000, "launch_year": 2022,
        "tagline": "Born for those who care",
        "popularity_score": 68.0,
        "images": ["/images/cars/dzire.jpg"],
        "variants": [
            {"name": "Active", "ex_showroom_price": 1099900, "sort_order": 1},
            {"name": "Ambition", "ex_showroom_price": 1350000, "sort_order": 2},
            {"name": "Style", "ex_showroom_price": 1699900, "sort_order": 3},
        ]
    }),
    ("Skoda", {
        "model_name": "Kushaq", "body_type": "suv", "fuel_type": "petrol",
        "transmission": "automatic", "ex_showroom_price": 1125900,
        "engine_cc": 999, "horsepower": 115.0, "torque_nm": 178.0,
        "mileage_kmpl": 17.86, "seating_capacity": 5,
        "ground_clearance_mm": 188, "boot_space_litres": 385,
        "safety_rating": 5.0, "num_airbags": 6,
        "has_abs": True, "has_sunroof": True, "has_adas": False,
        "has_apple_carplay": True, "has_android_auto": True,
        "infotainment_screen_inches": 10.0,
        "warranty_years": 4, "warranty_km": 100000, "launch_year": 2021,
        "tagline": "Explore. Experience. Excel.",
        "popularity_score": 66.0,
        "images": ["/images/cars/xuv300.jpg"],
        "variants": [
            {"name": "Active", "ex_showroom_price": 1125900, "sort_order": 1},
            {"name": "Ambition", "ex_showroom_price": 1399000, "sort_order": 2},
            {"name": "Style", "ex_showroom_price": 1699900, "sort_order": 3},
        ]
    }),
    # ── Renault ────────────────────────────────────────────────────────────────
    ("Renault", {
        "model_name": "Kwid", "body_type": "hatchback", "fuel_type": "petrol",
        "transmission": "manual", "ex_showroom_price": 467000,
        "engine_cc": 999, "horsepower": 67.0, "torque_nm": 91.0,
        "mileage_kmpl": 22.0, "seating_capacity": 5,
        "ground_clearance_mm": 180, "boot_space_litres": 279,
        "safety_rating": 0.0, "num_airbags": 2,
        "has_abs": True, "has_sunroof": False, "has_adas": False,
        "has_apple_carplay": False, "has_android_auto": False,
        "infotainment_screen_inches": 8.0,
        "warranty_years": 2, "warranty_km": 50000, "launch_year": 2022,
        "tagline": "Entry-level car with big features",
        "popularity_score": 60.0,
        "images": ["/images/cars/punch.png"],
        "variants": [
            {"name": "STD", "ex_showroom_price": 467000, "sort_order": 1},
            {"name": "RXT", "ex_showroom_price": 572000, "sort_order": 2},
        ]
    }),
    # ── Jeep ───────────────────────────────────────────────────────────────────
    ("Jeep", {
        "model_name": "Meridian", "body_type": "suv", "fuel_type": "diesel",
        "transmission": "automatic", "ex_showroom_price": 2999000,
        "engine_cc": 1956, "horsepower": 170.0, "torque_nm": 350.0,
        "mileage_kmpl": 12.7, "seating_capacity": 7,
        "ground_clearance_mm": 201, "boot_space_litres": 530,
        "safety_rating": 5.0, "num_airbags": 7,
        "has_abs": True, "has_sunroof": True, "has_adas": True,
        "adas_features": '["Adaptive Cruise Control","Blind-spot Monitoring","Rear Cross-Path Detection"]',
        "has_apple_carplay": True, "has_android_auto": True,
        "has_360_camera": True, "has_wireless_charging": True,
        "has_ventilated_seats": True,
        "infotainment_screen_inches": 10.1,
        "warranty_years": 3, "warranty_km": 100000, "launch_year": 2022,
        "tagline": "Adventure awaits. Always.",
        "popularity_score": 62.0,
        "images": ["/images/cars/thar.jpg"],
        "variants": [
            {"name": "Limited", "ex_showroom_price": 2999000, "sort_order": 1},
            {"name": "Limited O", "ex_showroom_price": 3299000, "sort_order": 2},
        ]
    }),
]


async def seed_all(db: AsyncSession) -> None:
    # ── Create tables if needed ───────────────────────────────────────────────
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tables verified/created")

    # ── Admin user ────────────────────────────────────────────────────────────
    result = await db.execute(select(User).where(User.email == "admin@cariq.in"))
    if not result.scalar_one_or_none():
        admin = User(
            id=uuid.uuid4(),
            email="admin@cariq.in",
            full_name="CarIQ Admin",
            hashed_password=hash_password("Admin@123456"),
            role="admin",
            is_active=True,
            is_email_verified=True,
        )
        db.add(admin)
        await db.commit()
        logger.info("✅ Admin user created: admin@cariq.in / Admin@123456")
    else:
        logger.info("ℹ️  Admin user already exists")

    # ── Demo customer ─────────────────────────────────────────────────────────
    result = await db.execute(select(User).where(User.email == "demo@cariq.in"))
    if not result.scalar_one_or_none():
        demo = User(
            id=uuid.uuid4(),
            email="demo@cariq.in",
            full_name="Demo Customer",
            hashed_password=hash_password("Demo@123456"),
            role="customer",
            is_active=True,
            is_email_verified=True,
            preferred_budget_max=1500000,
            preferred_fuel_types='["petrol"]',
            location_city="Mumbai",
            location_state="Maharashtra",
        )
        db.add(demo)
        await db.commit()
        logger.info("✅ Demo customer created: demo@cariq.in / Demo@123456")

    # ── Brands ────────────────────────────────────────────────────────────────
    brand_map: dict[str, Brand] = {}
    for b_data in BRANDS_DATA:
        result = await db.execute(select(Brand).where(Brand.name == b_data["name"]))
        existing = result.scalar_one_or_none()
        if existing:
            brand_map[b_data["name"]] = existing
            continue

        from slugify import slugify
        brand = Brand(
            id=uuid.uuid4(),
            name=b_data["name"],
            slug=slugify(b_data["name"]),
            country_of_origin=b_data.get("country_of_origin"),
            founded_year=b_data.get("founded_year"),
            logo_url=b_data.get("logo_url"),
            is_active=True,
        )
        db.add(brand)
        brand_map[b_data["name"]] = brand

    await db.commit()
    logger.info(f"✅ {len(brand_map)} brands seeded")

    # ── Vehicles ──────────────────────────────────────────────────────────────
    vehicle_count = 0
    for brand_name, v_data in VEHICLES_DATA:
        brand = brand_map.get(brand_name)
        if not brand:
            continue

        result = await db.execute(
            select(Vehicle).where(Vehicle.model_name == v_data["model_name"], Vehicle.brand_id == brand.id)
        )
        if result.scalar_one_or_none():
            continue

        from slugify import slugify
        slug = slugify(f"{brand_name}-{v_data['model_name']}")

        images_data = v_data.pop("images", [])
        variants_data = v_data.pop("variants", [])

        vehicle = Vehicle(
            id=uuid.uuid4(),
            brand_id=brand.id,
            slug=slug,
            is_active=True,
            **{k: v for k, v in v_data.items()},
        )
        db.add(vehicle)
        await db.flush()  # Get vehicle.id

        # Images
        for i, url in enumerate(images_data):
            img = VehicleImage(
                id=uuid.uuid4(),
                vehicle_id=vehicle.id,
                url=url,
                is_primary=(i == 0),
                sort_order=i,
            )
            db.add(img)

        # Variants
        for var_data in variants_data:
            clean_name = var_data["name"].replace("+", "-plus")
            var_slug = slugify(f"{slug}-{clean_name}")
            variant = Variant(
                id=uuid.uuid4(),
                vehicle_id=vehicle.id,
                slug=var_slug,
                **var_data,
            )
            db.add(variant)

        vehicle_count += 1

    await db.commit()
    logger.info(f"✅ {vehicle_count} vehicles seeded")


async def main() -> None:
    logger.info("🚀 Starting CarIQ database seed...")
    from app.core.database import init_db
    await init_db()
    async with AsyncSessionLocal() as db:
        await seed_all(db)
    logger.info("🎉 Database seed completed successfully!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
