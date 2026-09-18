# CarIQ Backend 🚗

**AI-powered car discovery and purchasing platform backend — production-ready FastAPI application.**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Folder Structure](#folder-structure)
5. [Environment Setup](#environment-setup)
6. [PostgreSQL Setup](#postgresql-setup)
7. [Redis Setup](#redis-setup)
8. [Migration Commands](#migration-commands)
9. [Seed Commands](#seed-commands)
10. [Run Commands](#run-commands)
11. [Docker Commands](#docker-commands)
12. [API Documentation](#api-documentation)
13. [Authentication Flow](#authentication-flow)
14. [AI Architecture](#ai-architecture)
15. [Database Architecture](#database-architecture)
16. [Testing](#testing)
17. [Frontend Integration](#frontend-integration)
18. [Production Deployment](#production-deployment)

---

## Project Overview

CarIQ is a comprehensive car discovery and purchasing platform for the Indian market. The backend provides:

- 🔐 JWT-based authentication with role-based access control
- 🚗 Complete vehicle database (brands, models, variants, images)
- 🤖 AI-powered car recommendations (Gemini / OpenAI / Mock)
- 💬 AI chat assistant for car buying advice
- ⚖️ Side-by-side vehicle comparisons
- 💰 EMI calculator with full amortization schedule
- ❤️ Wishlist / saved cars management
- 📋 Complete purchase workflow (9-stage status machine)
- 💳 Payment abstraction (Mock / Razorpay / Stripe ready)
- 🔔 In-app notification system
- 📊 Admin dashboard with platform statistics

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React + MUI Frontend                  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST (CORS enabled)
┌─────────────────────▼───────────────────────────────────┐
│                   FastAPI Application                    │
│  ┌────────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │   Routers  │  │ Services │  │   AI Abstraction     │ │
│  │  (14 APIs) │  │ (9 svcs) │  │  Gemini/OpenAI/Mock  │ │
│  └─────┬──────┘  └────┬─────┘  └──────────────────────┘ │
│        │              │                                   │
│  ┌─────▼──────────────▼─────────────────────────────┐   │
│  │         SQLAlchemy 2.x (async)                   │   │
│  └─────┬──────────────────────────────────────┬─────┘   │
└────────┼──────────────────────────────────────┼─────────┘
         │                                      │
┌────────▼───────┐                    ┌─────────▼──────┐
│   PostgreSQL   │                    │     Redis      │
│  (Primary DB)  │                    │  (Cache/Rate)  │
└────────────────┘                    └────────────────┘
```

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | FastAPI 0.111 |
| Language | Python 3.11+ |
| Database | PostgreSQL 15 |
| ORM | SQLAlchemy 2.x (async) |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Auth | JWT (python-jose) |
| Password | bcrypt (passlib) |
| Cache | Redis (optional) |
| AI | Gemini / OpenAI / Mock |
| HTTP Client | httpx |
| Server | Uvicorn |
| Testing | pytest + pytest-asyncio |
| Docker | Docker Compose |

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app, routers, middleware
│   ├── core/
│   │   ├── config.py              # pydantic-settings configuration
│   │   ├── database.py            # Async SQLAlchemy engine + session
│   │   ├── security.py            # JWT tokens, password hashing
│   │   └── dependencies.py        # Dependency injection (auth, Redis, rate limit)
│   ├── models/                    # SQLAlchemy ORM models (12 files)
│   ├── schemas/                   # Pydantic schemas (9 files)
│   ├── api/                       # FastAPI routers (14 files)
│   ├── services/                  # Business logic (9 services)
│   ├── utils/                     # Helpers, pagination, validators
│   └── seed/                      # Database seed script
├── migrations/                    # Alembic migrations
├── tests/                         # pytest test suite
├── .env.example                   # Environment template
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── alembic.ini
└── pyproject.toml
```

---

## Environment Setup

```bash
# 1. Clone and enter the backend directory
cd backend

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment file
copy .env.example .env       # Windows
cp .env.example .env         # Linux/Mac

# 5. Edit .env with your settings
```

---

## PostgreSQL Setup

### Using Docker (Recommended)
```bash
docker run -d \
  --name cariq_postgres \
  -e POSTGRES_DB=cariq_db \
  -e POSTGRES_USER=cariq_user \
  -e POSTGRES_PASSWORD=cariq_password \
  -p 5432:5432 \
  postgres:15-alpine
```

### Manual Setup
```sql
CREATE DATABASE cariq_db;
CREATE USER cariq_user WITH PASSWORD 'cariq_password';
GRANT ALL PRIVILEGES ON DATABASE cariq_db TO cariq_user;
```

---

## Redis Setup

```bash
# Using Docker
docker run -d --name cariq_redis -p 6379:6379 redis:7-alpine

# Redis is optional — the app starts without it (with degraded caching)
```

---

## Migration Commands

```bash
# Generate initial migration (first time only)
alembic revision --autogenerate -m "initial_schema"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1

# View migration history
alembic history
```

---

## Seed Commands

```bash
# Seed the database (idempotent — safe to run multiple times)
python -m app.seed.seed_database
```

**Created by seed:**
- 12 car brands (Maruti, Hyundai, Tata, Mahindra, Honda, Toyota, Kia, MG, VW, Skoda, Renault, Jeep)
- 22+ vehicles with variants and images
- Admin account: `admin@cariq.in` / `Admin@123456`
- Demo customer: `demo@cariq.in` / `Demo@123456`

---

## Run Commands

```bash
# Development server (with auto-reload)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Production server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Full setup in one shot:
alembic upgrade head && python -m app.seed.seed_database && uvicorn app.main:app --reload
```

---

## Docker Commands

```bash
# Start all services (PostgreSQL + Redis + Backend)
docker compose up --build

# Start in background
docker compose up -d --build

# View logs
docker compose logs -f backend

# Stop all services
docker compose down

# Reset database
docker compose down -v  # removes volumes
docker compose up --build
```

The Docker setup automatically:
1. Starts PostgreSQL and Redis
2. Runs `alembic upgrade head`
3. Runs seed script
4. Starts the backend server

---

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### API Endpoints Summary

| Module | Endpoint | Method | Auth |
|--------|----------|--------|------|
| Auth | `/api/v1/auth/register` | POST | No |
| Auth | `/api/v1/auth/login` | POST | No |
| Auth | `/api/v1/auth/refresh` | POST | No |
| Auth | `/api/v1/auth/me` | GET | Yes |
| Users | `/api/v1/users/me` | GET/PUT/DELETE | Yes |
| Vehicles | `/api/v1/vehicles` | GET | No |
| Vehicles | `/api/v1/vehicles/{id}` | GET | No |
| Brands | `/api/v1/brands` | GET | No |
| Search | `/api/v1/search?q=...` | GET | No |
| Recommendations | `/api/v1/recommendations` | POST | Optional |
| AI Chat | `/api/v1/ai/chat` | POST | Optional |
| Comparisons | `/api/v1/comparisons` | POST | Optional |
| Wishlist | `/api/v1/wishlist` | GET/POST/DELETE | Yes |
| Finance | `/api/v1/finance/emi` | POST | No |
| Finance | `/api/v1/finance/affordability` | POST | No |
| Purchases | `/api/v1/purchases` | POST/GET | Yes |
| Payments | `/api/v1/payments/create` | POST | Yes |
| Notifications | `/api/v1/notifications` | GET | Yes |
| Admin | `/api/v1/admin/dashboard` | GET | Admin |

---

## Authentication Flow

```
1. Register: POST /api/v1/auth/register
   → Returns: User profile

2. Login: POST /api/v1/auth/login (form data: username, password)
   → Returns: { access_token, refresh_token, token_type: "bearer" }

3. Use token: Authorization: Bearer <access_token>

4. Refresh: POST /api/v1/auth/refresh { refresh_token: "..." }
   → Returns: new access_token + refresh_token

5. Password Reset:
   POST /api/v1/auth/forgot-password { email }
   POST /api/v1/auth/reset-password { token, new_password }

6. Email Verification:
   POST /api/v1/auth/verify-email { token }
```

---

## AI Architecture

The AI system uses a provider abstraction pattern:

```python
BaseAIProvider
├── GeminiAIProvider   # Google Gemini (set GEMINI_API_KEY)
├── OpenAIProvider     # OpenAI / compatible (set OPENAI_API_KEY)
└── MockAIProvider     # No key required — database-driven responses
```

**Configuration:**
```env
AI_PROVIDER=mock        # or: gemini, openai
GEMINI_API_KEY=AIza...  # auto-activates Gemini
OPENAI_API_KEY=sk-...   # auto-activates OpenAI
```

**AI Safety Rules:**
- AI never invents vehicle prices, specs, or availability
- All AI explanations are generated from structured database data
- Missing data is explicitly stated as "data not available"

**Recommendation Engine:**
1. NLP preference extraction (budget, fuel, body type, etc.)
2. Database candidate retrieval (with pre-filters)
3. Multi-factor weighted scoring (0-100)
4. Optional LLM explanation per vehicle
5. Results stored in recommendation history

---

## Database Architecture

### Key Models

| Model | Table | Description |
|-------|-------|-------------|
| User | users | Customers and admins with preferences |
| Brand | brands | Car manufacturers |
| Vehicle | vehicles | Car models with all specifications |
| VehicleImage | vehicle_images | Multiple images per vehicle |
| Variant | variants | Trim levels per vehicle |
| Wishlist | wishlists | User saved vehicles (unique constraint) |
| Comparison | comparisons | Saved vehicle comparisons |
| Recommendation | recommendations | AI recommendation history |
| Purchase | purchases | 9-stage purchase workflow |
| Payment | payments | Payment records (no sensitive data) |
| FinanceCalculation | finance_calculations | EMI calculation history |
| Notification | notifications | In-app notifications |
| AuditLog | audit_logs | Action audit trail |

### Important Indexes
- `vehicles.ex_showroom_price` — price range filtering
- `vehicles.fuel_type` — fuel type filtering
- `vehicles.body_type` — body type filtering
- `vehicles.transmission` — transmission filtering
- `users.email` — login lookup (unique)
- `wishlists (user_id, vehicle_id)` — unique constraint

---

## Testing

```bash
# Install test dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run with verbose output
pytest -v --tb=short
```

**Test Coverage:**
- Authentication (register, login, JWT, refresh, edge cases)
- Vehicle listing, filtering, pagination, authorization
- Finance calculations (EMI, amortization, affordability, tenure comparison)
- Recommendations (NLP extraction, scoring, field validation)
- Purchases (create, list, auth isolation)
- Admin (dashboard, role enforcement, user management)

---

## Frontend Integration

The backend is ready to connect with React + MUI frontend:

### CORS Configuration
```env
# .env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Pagination Format
All list endpoints return:
```json
{
  "items": [...],
  "page": 1,
  "page_size": 20,
  "total": 100,
  "pages": 5
}
```

### Error Format
All errors return:
```json
{
  "success": false,
  "message": "Vehicle not found",
  "error_code": "VEHICLE_NOT_FOUND"
}
```

### Authentication
```javascript
// Login
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'username=email@example.com&password=yourpassword'
});
const { access_token } = await response.json();

// Use token
const vehicles = await fetch('/api/v1/vehicles', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

---

## Production Deployment

### Environment Variables to Change
```env
DEBUG=false
ENVIRONMENT=production
JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
DATABASE_URL=postgresql+asyncpg://user:pass@your-db-host:5432/cariq_db
REDIS_URL=redis://:password@your-redis-host:6379/0
CORS_ORIGINS=https://yourfrontend.com
```

### Gunicorn + Uvicorn Workers
```bash
gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

### Checklist
- [ ] Change `JWT_SECRET_KEY` to a random 64-char secret
- [ ] Set `DEBUG=false`
- [ ] Configure production `DATABASE_URL`
- [ ] Configure production `REDIS_URL`
- [ ] Set `CORS_ORIGINS` to your frontend domain
- [ ] Configure AI provider (Gemini/OpenAI API key)
- [ ] Configure payment provider (Razorpay/Stripe keys)
- [ ] Run `alembic upgrade head` before starting
- [ ] Set up SSL termination (nginx/load balancer)
- [ ] Configure log aggregation

---

## Default Accounts (After Seeding)

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@cariq.in | Admin@123456 | admin |
| Demo Customer | demo@cariq.in | Demo@123456 | customer |

> ⚠️ **Change these passwords immediately in production!**
