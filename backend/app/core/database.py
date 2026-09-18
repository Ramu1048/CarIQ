"""
CarIQ Backend — Database Configuration
Async SQLAlchemy engine + session factory
"""
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Naming Convention for Alembic ─────────────────────────────────────────────
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)


class Base(DeclarativeBase):
    metadata = metadata


# ── Engine ────────────────────────────────────────────────────────────────────
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=not _is_sqlite,
    **({} if _is_sqlite else {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    })
)

# ── Session Factory ───────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ── Dependency ────────────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Startup / Shutdown ────────────────────────────────────────────────────────
async def init_db() -> None:
    """Create all tables — used in development. Production uses Alembic."""
    try:
        async with engine.begin() as conn:
            from app.models import (  # noqa: F401
                user, brand, vehicle, variant,
                comparison, wishlist, recommendation,
                purchase, payment, finance, notification, audit,
            )
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables verified.")
    except Exception as e:
        logger.warning(f"Database connection unavailable during startup: {e}")


async def close_db() -> None:
    await engine.dispose()
    logger.info("Database connection closed.")
