import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="allow")

    # Application & Environment
    PROJECT_NAME: str = "CarIQ AI Intelligence Service"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*",
    ]

    # AI Provider Configuration (gemini, openai, ollama, mock)
    AI_PROVIDER: str = Field(default="gemini", validation_alias="AI_PROVIDER")
    AI_MODEL: str = Field(default="gemini-1.5-flash", validation_alias="AI_MODEL")
    AI_API_KEY: Optional[str] = Field(default=None, validation_alias="AI_API_KEY")
    AI_TEMPERATURE: float = 0.2
    AI_MAX_TOKENS: int = 1024

    # Ollama Provider (local LLM)
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", validation_alias="OLLAMA_BASE_URL")
    OLLAMA_MODEL: str = Field(default="llama3:8b", validation_alias="OLLAMA_MODEL")

    # OpenAI compatible settings (optional alternative provider)
    OPENAI_BASE_URL: Optional[str] = Field(default=None, validation_alias="OPENAI_BASE_URL")
    OPENAI_API_KEY: Optional[str] = Field(default=None, validation_alias="OPENAI_API_KEY")

    # Database & Vector DB
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/cariq_db",
        validation_alias="DATABASE_URL",
    )
    VECTOR_DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/cariq_vectors",
        validation_alias="VECTOR_DATABASE_URL",
    )
    VECTOR_STORE_TYPE: str = Field(default="memory", validation_alias="VECTOR_STORE_TYPE")  # memory, pgvector, chromadb

    # Redis Caching
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    REDIS_ENABLED: bool = Field(default=False, validation_alias="REDIS_ENABLED")
    CACHE_TTL_SECONDS: int = 3600

    # Embeddings & RAG
    EMBEDDING_PROVIDER: str = Field(default="tfidf_fast", validation_alias="EMBEDDING_PROVIDER")  # sentence_transformers, tfidf_fast
    EMBEDDING_MODEL: str = Field(default="all-MiniLM-L6-v2", validation_alias="EMBEDDING_MODEL")
    RAG_TOP_K: int = Field(default=5, validation_alias="RAG_TOP_K")
    RAG_CONFIDENCE_THRESHOLD: float = Field(default=0.60, validation_alias="RAG_CONFIDENCE_THRESHOLD")
    RAG_MAX_CONTEXT_TOKENS: int = 2500
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 80

    # Paths
    CORE_DIR: str = os.path.dirname(os.path.abspath(__file__))
    APP_DIR: str = os.path.dirname(CORE_DIR)
    AI_SERVICE_DIR: str = os.path.dirname(APP_DIR)
    BASE_DIR: str = os.path.dirname(AI_SERVICE_DIR)
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    DOCUMENTS_DIR: str = os.path.join(DATA_DIR, "documents")
    VEHICLES_FILE: str = os.path.join(DATA_DIR, "vehicles", "vehicles_catalog.json")

    # Security
    API_KEY_ENABLED: bool = Field(default=False, validation_alias="API_KEY_ENABLED")
    SERVICE_API_KEY: str = Field(default="cariq_secret_ai_service_key_2026", validation_alias="SERVICE_API_KEY")
    RATE_LIMIT_PER_MINUTE: int = 100


settings = Settings()
