"""
CarIQ Backend — FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.database import init_db, close_db

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    await init_db()
    yield
    await close_db()
    logger.info("Application shutdown complete")


# ── App Factory ────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## CarIQ Backend API

**AI-powered car discovery and purchasing platform for the Indian market.**

### Key Features
- 🔐 JWT Authentication with role-based access
- 🚗 Comprehensive vehicle database with 30+ cars
- 🤖 AI recommendations (Gemini / OpenAI / Mock)
- 💬 AI Chat Assistant
- ⚖️ Side-by-side car comparisons
- 💰 EMI calculator with amortization schedule
- ❤️ Wishlist management
- 📋 Complete purchase workflow
- 💳 Payment abstraction (Mock / Razorpay / Stripe)
- 🔔 Notification system

### Authentication
Use `POST /api/v1/auth/login` to obtain a JWT token.
Then use `Authorization: Bearer <token>` header.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception Handlers ─────────────────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        errors.append({
            "field": ".".join(str(l) for l in err["loc"][1:]),
            "message": err["msg"],
            "type": err["type"],
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error",
            "error_code": "VALIDATION_ERROR",
            "detail": errors,
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {exc}", exc_info=not settings.is_production)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "A database error occurred",
            "error_code": "DATABASE_ERROR",
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=not settings.is_production)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred" if settings.is_production else str(exc),
            "error_code": "INTERNAL_ERROR",
        },
    )


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"], summary="Health check")
async def health_check():
    from sqlalchemy import text
    from app.core.database import AsyncSessionLocal
    from app.core.dependencies import get_redis

    db_status = "ok"
    redis_status = "unavailable"

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {e}"

    try:
        redis = await get_redis()
        if redis:
            await redis.ping()
            redis_status = "ok"
    except Exception:
        pass

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "redis": redis_status,
        "ai_provider": settings.AI_PROVIDER,
        "payment_provider": settings.PAYMENT_PROVIDER,
    }


# ── Routers ────────────────────────────────────────────────────────────────────
API_V1_PREFIX = "/api/v1"

from app.api import auth, users, vehicles, brands, search  # noqa: E402
from app.api import recommendations, comparisons, wishlist  # noqa: E402
from app.api import finance, purchases, payments  # noqa: E402
from app.api import notifications, admin, ai, locations  # noqa: E402

app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(users.router, prefix=API_V1_PREFIX)
app.include_router(vehicles.router, prefix=API_V1_PREFIX)
app.include_router(brands.router, prefix=API_V1_PREFIX)
app.include_router(search.router, prefix=API_V1_PREFIX)
app.include_router(recommendations.router, prefix=API_V1_PREFIX)
app.include_router(comparisons.router, prefix=API_V1_PREFIX)
app.include_router(wishlist.router, prefix=API_V1_PREFIX)
app.include_router(finance.router, prefix=API_V1_PREFIX)
app.include_router(purchases.router, prefix=API_V1_PREFIX)
app.include_router(payments.router, prefix=API_V1_PREFIX)
app.include_router(notifications.router, prefix=API_V1_PREFIX)
app.include_router(admin.router, prefix=API_V1_PREFIX)
app.include_router(ai.router, prefix=API_V1_PREFIX)
app.include_router(locations.router, prefix=API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
        "api": API_V1_PREFIX,
    }
