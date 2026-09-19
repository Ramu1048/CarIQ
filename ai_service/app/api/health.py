from typing import Any, Dict
from fastapi import APIRouter
from ai_service.app.ai.llm_provider import get_llm_provider
from ai_service.app.core.config import settings
from ai_service.app.rag.vector_store import vector_store
from ai_service.app.services.vehicle_db_service import vehicle_db

router = APIRouter(tags=["Health & Status"])


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check status for AI Providers, Vector Store, and Structured Vehicle DB.
    """
    llm = get_llm_provider()
    llm_health = await llm.health_check()

    return {
        "status": "healthy",
        "service": "CarIQ RAG + AI Intelligence Layer",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "components": {
            "llm": llm_health,
            "vector_store": {
                "type": "chroma_cloud" if getattr(vector_store, "is_cloud", False) else settings.VECTOR_STORE_TYPE,
                "mode": "cloud" if getattr(vector_store, "is_cloud", False) else "local_disk",
                "host": settings.CHROMA_HOST if getattr(vector_store, "is_cloud", False) else "local_disk",
                "tenant": settings.CHROMA_TENANT if getattr(vector_store, "is_cloud", False) else None,
                "database": settings.CHROMA_DATABASE if getattr(vector_store, "is_cloud", False) else None,
                "total_chunks_indexed": vector_store.count(),
                "embedding_provider": settings.EMBEDDING_PROVIDER,
            },
            "vehicle_database": {
                "total_vehicles": len(vehicle_db.get_all()),
            },
            "redis_cache": {
                "enabled": settings.REDIS_ENABLED,
            },
        },
    }
