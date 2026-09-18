"""
CarIQ — Sync Real Images and Vehicles Dataset
"""
import asyncio
import uuid
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from slugify import slugify
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.vehicle import Vehicle, VehicleImage
from app.models.brand import Brand
from app.models.variant import Variant

CAR_IMAGE_MAP = {
    'Creta': '/images/cars/creta.png',
    'Grand i10 Nios': '/images/cars/grand-i10.jpg',
    'i20': '/images/cars/i20.jpg',
    'Alcazar': '/images/cars/alcazar.png',
    'Swift': '/images/cars/swift.jpg',
    'Dzire': '/images/cars/dzire.jpg',
    'Baleno': '/images/cars/baleno.jpg',
    'Brezza': '/images/cars/brezza.jpg',
    'XUV 3XO': '/images/cars/xuv300.jpg',
    'XUV700': '/images/cars/xuv700.jpg',
    'Scorpio N': '/images/cars/scorpio.jpg',
    'Nexon': '/images/cars/nexon.jpg',
    'Punch': '/images/cars/punch.png',
    'Nexon EV': '/images/cars/nexon-ev.png',
    'Punch EV': '/images/cars/punch-ev.jpg',
    'Seltos': '/images/cars/seltos.jpg',
    'Carens': '/images/cars/carens.jpg',
    'Fortuner': '/images/cars/fortuner.jpg',
    'Innova Crysta': '/images/cars/innova-crysta.jpg',
    'Thar': '/images/cars/thar.jpg',
    'Harrier': '/images/cars/harrier.jpg',
}

NEW_CARS = [
    ('Maruti Suzuki', {
        'model_name': 'Dzire', 'body_type': 'sedan', 'fuel_type': 'petrol',
        'transmission': 'automatic', 'ex_showroom_price': 1014000,
        'engine_cc': 1197, 'horsepower': 80.5, 'torque_nm': 112.0,
        'mileage_kmpl': 25.71, 'seating_capacity': 5,
        'ground_clearance_mm': 163, 'boot_space_litres': 382,
        'safety_rating': 5.0, 'num_airbags': 6,
        'has_abs': True, 'has_sunroof': True, 'has_adas': False,
        'has_apple_carplay': True, 'has_android_auto': True,
        'has_360_camera': True, 'infotainment_screen_inches': 9.0,
        'warranty_years': 3, 'warranty_km': 100000, 'launch_year': 2024,
        'tagline': '5-Star Safety Compact Sedan', 'popularity_score': 97.0,
        'image': '/images/cars/dzire.jpg',
        'variants': [
            {'name': 'LXi', 'ex_showroom_price': 679000, 'sort_order': 1},
            {'name': 'ZXi', 'ex_showroom_price': 889000, 'sort_order': 2},
            {'name': 'ZXi Plus AGS', 'ex_showroom_price': 1014000, 'sort_order': 3},
        ]
    }),
    ('Hyundai', {
        'model_name': 'Grand i10 Nios', 'body_type': 'hatchback', 'fuel_type': 'petrol',
        'transmission': 'manual', 'ex_showroom_price': 795000,
        'engine_cc': 1197, 'horsepower': 82.0, 'torque_nm': 114.0,
        'mileage_kmpl': 20.7, 'seating_capacity': 5,
        'ground_clearance_mm': 165, 'boot_space_litres': 260,
        'safety_rating': 3.0, 'num_airbags': 6,
        'has_abs': True, 'has_sunroof': False, 'has_adas': False,
        'has_apple_carplay': True, 'has_android_auto': True,
        'infotainment_screen_inches': 8.0,
        'warranty_years': 3, 'warranty_km': 100000, 'launch_year': 2024,
        'tagline': 'Chic urban city hatchback', 'popularity_score': 87.0,
        'image': '/images/cars/grand-i10.jpg',
        'variants': [
            {'name': 'Era', 'ex_showroom_price': 592000, 'sort_order': 1},
            {'name': 'Magna', 'ex_showroom_price': 678000, 'sort_order': 2},
            {'name': 'Asta AMT', 'ex_showroom_price': 856000, 'sort_order': 3},
        ]
    }),
    ('Mahindra', {
        'model_name': 'XUV 3XO', 'body_type': 'suv', 'fuel_type': 'petrol',
        'transmission': 'automatic', 'ex_showroom_price': 1549000,
        'engine_cc': 1197, 'horsepower': 130.0, 'torque_nm': 230.0,
        'mileage_kmpl': 20.1, 'seating_capacity': 5,
        'ground_clearance_mm': 201, 'boot_space_litres': 295,
        'safety_rating': 5.0, 'num_airbags': 6,
        'has_abs': True, 'has_sunroof': True, 'has_adas': True,
        'has_apple_carplay': True, 'has_android_auto': True,
        'has_360_camera': True, 'infotainment_screen_inches': 10.25,
        'warranty_years': 3, 'warranty_km': 100000, 'launch_year': 2024,
        'tagline': 'Segment-first Skyroof and Level 2 ADAS', 'popularity_score': 95.0,
        'image': '/images/cars/xuv300.jpg',
        'variants': [
            {'name': 'MX1', 'ex_showroom_price': 749000, 'sort_order': 1},
            {'name': 'AX5', 'ex_showroom_price': 1219000, 'sort_order': 2},
            {'name': 'AX7 Luxury', 'ex_showroom_price': 1549000, 'sort_order': 3},
        ]
    }),
    ('Tata Motors', {
        'model_name': 'Punch EV', 'body_type': 'suv', 'fuel_type': 'electric',
        'transmission': 'automatic', 'ex_showroom_price': 1549000,
        'horsepower': 120.7, 'torque_nm': 190.0,
        'mileage_kmpl': None, 'seating_capacity': 5,
        'battery_capacity_kwh': 35.0, 'ev_range_km': 421,
        'ground_clearance_mm': 190, 'boot_space_litres': 366,
        'safety_rating': 5.0, 'num_airbags': 6,
        'has_abs': True, 'has_sunroof': True, 'has_adas': False,
        'has_apple_carplay': True, 'has_android_auto': True,
        'has_360_camera': True, 'has_ventilated_seats': True,
        'infotainment_screen_inches': 10.25,
        'warranty_years': 8, 'warranty_km': 160000, 'launch_year': 2024,
        'tagline': 'Pure Electric SUV on acti.ev', 'popularity_score': 95.0,
        'image': '/images/cars/punch-ev.jpg',
        'variants': [
            {'name': 'Smart MR', 'ex_showroom_price': 1099000, 'sort_order': 1},
            {'name': 'Adventure LR', 'ex_showroom_price': 1299000, 'sort_order': 2},
            {'name': 'Empowered Plus LR', 'ex_showroom_price': 1549000, 'sort_order': 3},
        ]
    }),
    ('Mahindra', {
        'model_name': 'Thar', 'body_type': 'suv', 'fuel_type': 'diesel',
        'transmission': 'automatic', 'ex_showroom_price': 1760000,
        'engine_cc': 2184, 'horsepower': 130.0, 'torque_nm': 300.0,
        'mileage_kmpl': 15.2, 'seating_capacity': 4,
        'ground_clearance_mm': 226, 'boot_space_litres': 600,
        'safety_rating': 4.0, 'num_airbags': 2,
        'has_abs': True, 'has_sunroof': False, 'has_adas': False,
        'has_apple_carplay': True, 'has_android_auto': True,
        'infotainment_screen_inches': 7.0,
        'warranty_years': 3, 'warranty_km': 100000, 'launch_year': 2024,
        'tagline': 'Explore the impossible', 'popularity_score': 98.0,
        'image': '/images/cars/thar.jpg',
        'variants': [
            {'name': 'AX Opt RWD', 'ex_showroom_price': 1135000, 'sort_order': 1},
            {'name': 'LX 4x4 MT', 'ex_showroom_price': 1600000, 'sort_order': 2},
            {'name': 'LX 4x4 AT', 'ex_showroom_price': 1760000, 'sort_order': 3},
        ]
    }),
    ('Tata Motors', {
        'model_name': 'Harrier', 'body_type': 'suv', 'fuel_type': 'diesel',
        'transmission': 'automatic', 'ex_showroom_price': 2644000,
        'engine_cc': 1956, 'horsepower': 170.0, 'torque_nm': 350.0,
        'mileage_kmpl': 16.8, 'seating_capacity': 5,
        'ground_clearance_mm': 205, 'boot_space_litres': 445,
        'safety_rating': 5.0, 'num_airbags': 7,
        'has_abs': True, 'has_sunroof': True, 'has_adas': True,
        'has_apple_carplay': True, 'has_android_auto': True,
        'has_360_camera': True, 'has_ventilated_seats': True,
        'infotainment_screen_inches': 12.3,
        'warranty_years': 3, 'warranty_km': 100000, 'launch_year': 2024,
        'tagline': 'Flagship 5-Star SUV', 'popularity_score': 97.0,
        'image': '/images/cars/harrier.jpg',
        'variants': [
            {'name': 'Smart MT', 'ex_showroom_price': 1549000, 'sort_order': 1},
            {'name': 'Adventure Plus AT', 'ex_showroom_price': 2199000, 'sort_order': 2},
            {'name': 'Fearless Plus Dark AT', 'ex_showroom_price': 2644000, 'sort_order': 3},
        ]
    }),
]

async def sync():
    async with AsyncSessionLocal() as db:
        # 1. Update existing vehicles with real images
        for model, img_url in CAR_IMAGE_MAP.items():
            res = await db.execute(select(Vehicle).where(Vehicle.model_name == model))
            v = res.scalar_one_or_none()
            if v:
                img_res = await db.execute(select(VehicleImage).where(VehicleImage.vehicle_id == v.id))
                imgs = img_res.scalars().all()
                if imgs:
                    for img in imgs:
                        img.url = img_url
                else:
                    db.add(VehicleImage(id=uuid.uuid4(), vehicle_id=v.id, url=img_url, is_primary=True, sort_order=0))
                print(f"Updated image for {model} -> {img_url}")
        
        # 2. Add new missing cars
        for brand_name, car_data in NEW_CARS:
            res_b = await db.execute(select(Brand).where(Brand.name == brand_name))
            brand = res_b.scalar_one_or_none()
            if not brand:
                continue
            
            res_v = await db.execute(select(Vehicle).where(Vehicle.model_name == car_data['model_name'], Vehicle.brand_id == brand.id))
            if res_v.scalar_one_or_none():
                print(f"{car_data['model_name']} already exists")
                continue
            
            img_url = car_data.pop('image')
            variants = car_data.pop('variants', [])
            slug = slugify(f"{brand_name}-{car_data['model_name']}")
            
            v = Vehicle(
                id=uuid.uuid4(),
                brand_id=brand.id,
                slug=slug,
                is_active=True,
                **car_data
            )
            db.add(v)
            await db.flush()
            
            db.add(VehicleImage(id=uuid.uuid4(), vehicle_id=v.id, url=img_url, is_primary=True, sort_order=0))
            for var in variants:
                clean_name = var['name'].replace('+', '-plus')
                var_slug = slugify(f"{slug}-{clean_name}")
                db.add(Variant(id=uuid.uuid4(), vehicle_id=v.id, slug=var_slug, **var))
            print(f"Added {car_data['model_name']} with image {img_url}")
            
        await db.commit()
        print("Database sync completed successfully!")

if __name__ == "__main__":
    asyncio.run(sync())
