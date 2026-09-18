from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from ai_service.app.models.knowledge import RetrievedContextChunk


class RagSearchRequest(BaseModel):
    query: str = Field(..., description="Query to perform vector and hybrid search on")
    top_k: int = Field(default=5, ge=1, le=20)
    vehicle_id_filter: Optional[str] = None
    section_filter: Optional[str] = None


class RagSearchResponseData(BaseModel):
    query: str
    chunks: List[RetrievedContextChunk]
    confidence_score: float
    retrieval_count: int


class RagSearchResponse(BaseModel):
    success: bool = True
    data: RagSearchResponseData
    meta: Dict[str, Any] = Field(default_factory=dict)


class IngestionRequest(BaseModel):
    force_reindex: bool = False


class IngestionResponse(BaseModel):
    success: bool = True
    documents_indexed: int
    chunks_created: int
    message: str
