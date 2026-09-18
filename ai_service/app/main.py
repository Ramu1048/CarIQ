from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai_service.app.api.chat import router as chat_router
from ai_service.app.api.compare import router as compare_router
from ai_service.app.api.extract import router as extract_router
from ai_service.app.api.health import router as health_router
from ai_service.app.api.rag import router as rag_router
from ai_service.app.api.recommendations import router as recommendations_router
from ai_service.app.api.search import router as search_router
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger
from ai_service.app.core.redis_cache import cache
from ai_service.app.rag.ingestion import ingestion_pipeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect cache & ingest initial documents
    logger.info(f"Starting {settings.PROJECT_NAME}...")
    await cache.connect()

    # Ingest documents if vector store is empty
    stats = ingestion_pipeline.ingest_directory()
    logger.info(f"Initial ingestion complete: {stats}")

    yield

    # Shutdown
    logger.info("Shutting down CarIQ AI Service...")
    await cache.close()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="Production RAG + AI Intelligence Layer for CarIQ Smart Car Purchasing Platform.",
        lifespan=lifespan,
    )

    # CORS Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routers
    api_prefix = settings.API_V1_STR
    app.include_router(health_router, prefix=api_prefix)
    app.include_router(chat_router, prefix=f"{api_prefix}/ai")
    app.include_router(recommendations_router, prefix=f"{api_prefix}/ai")
    app.include_router(search_router, prefix=f"{api_prefix}/ai")
    app.include_router(compare_router, prefix=f"{api_prefix}/ai")
    app.include_router(extract_router, prefix=f"{api_prefix}/ai")
    app.include_router(rag_router, prefix=api_prefix)

    @app.get("/")
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": "1.0.0",
            "docs": "/docs",
            "status": "online",
        }

    return app


app = create_application()
