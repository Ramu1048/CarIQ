import json
import hashlib
from typing import Any, Optional
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger

# In-memory dictionary fallback when Redis is not running or disabled
_in_memory_cache = {}


class CacheManager:
    """Handles query caching with Redis or memory fallback."""

    def __init__(self):
        self.redis_client = None
        self.enabled = settings.REDIS_ENABLED

    async def connect(self):
        if self.enabled:
            try:
                import redis.asyncio as aioredis
                self.redis_client = aioredis.from_url(
                    settings.REDIS_URL, decode_responses=True, socket_timeout=2.0
                )
                await self.redis_client.ping()
                logger.info("Connected to Redis cache successfully.")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis ({e}), using in-memory cache fallback.")
                self.redis_client = None

    def _make_key(self, prefix: str, data: Any) -> str:
        serialized = json.dumps(data, sort_keys=True, default=str)
        digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]
        return f"cariq:{prefix}:{digest}"

    async def get(self, prefix: str, key_data: Any) -> Optional[Any]:
        key = self._make_key(prefix, key_data)
        if self.redis_client:
            try:
                val = await self.redis_client.get(key)
                if val:
                    return json.loads(val)
            except Exception as e:
                logger.debug(f"Redis get error: {e}")

        # In-memory fallback
        return _in_memory_cache.get(key)

    async def set(self, prefix: str, key_data: Any, value: Any, ttl: Optional[int] = None) -> None:
        key = self._make_key(prefix, key_data)
        ttl = ttl or settings.CACHE_TTL_SECONDS
        serialized = json.dumps(value, default=str)

        if self.redis_client:
            try:
                await self.redis_client.setex(key, ttl, serialized)
            except Exception as e:
                logger.debug(f"Redis set error: {e}")

        _in_memory_cache[key] = value

    async def close(self):
        if self.redis_client:
            await self.redis_client.close()


cache = CacheManager()
