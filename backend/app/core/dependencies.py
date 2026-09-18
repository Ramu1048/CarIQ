"""
CarIQ Backend — FastAPI Dependencies
Reusable dependency injection for auth, DB, Redis, roles
"""
import logging
from typing import Optional
from uuid import UUID

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login", auto_error=False
)

# ── Redis Client (optional) ───────────────────────────────────────────────────
_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> Optional[aioredis.Redis]:
    """Return Redis client or None if unavailable."""
    global _redis_client
    if _redis_client is None and settings.REDIS_ENABLED:
        try:
            _redis_client = aioredis.from_url(
                settings.REDIS_URL,
                password=settings.REDIS_PASSWORD or None,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
            )
            await _redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis unavailable, caching disabled: {e}")
            _redis_client = None
    return _redis_client


# ── Current User ──────────────────────────────────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Decode JWT and return the authenticated User ORM object."""
    from app.models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type", "")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(User).where(
            User.id == UUID(user_id),
            User.is_deleted == False,  # noqa: E712
        )
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: AsyncSession = Depends(get_db),
):
    """Return current user or None if not authenticated."""
    if token is None:
        return None
    try:
        return await get_current_user(token=token, db=db)
    except HTTPException:
        return None


# ── Role Guards ───────────────────────────────────────────────────────────────
async def require_admin(current_user=Depends(get_current_user)):
    """Dependency that enforces admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return current_user


async def require_customer(current_user=Depends(get_current_user)):
    """Dependency that enforces customer role (or admin)."""
    if current_user.role not in ("customer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required",
        )
    return current_user


async def require_verified(current_user=Depends(get_current_user)):
    """Dependency that enforces email verification."""
    if not current_user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required",
        )
    return current_user


# ── Rate Limiting ─────────────────────────────────────────────────────────────
async def rate_limit(
    request: Request,
    redis: Optional[aioredis.Redis] = Depends(get_redis),
):
    """Sliding-window rate limiter. Skips if Redis is unavailable."""
    if not redis or not settings.RATE_LIMIT_ENABLED:
        return

    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{client_ip}"

    try:
        import time
        now = time.time()
        window = settings.RATE_LIMIT_WINDOW_SECONDS
        limit = settings.RATE_LIMIT_REQUESTS

        pipe = redis.pipeline()
        pipe.zremrangebyscore(key, 0, now - window)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window)
        results = await pipe.execute()
        count = results[2]

        if count > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {window} seconds.",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Rate limiter error (skipping): {e}")
