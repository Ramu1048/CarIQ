from fastapi import APIRouter, Depends
from ai_service.app.core.security import check_rate_limit, verify_api_key
from ai_service.app.rag.ingestion import ingestion_pipeline
from ai_service.app.rag.retriever import hybrid_retriever
from ai_service.app.schemas.rag import (
    IngestionRequest,
    IngestionResponse,
    RagSearchRequest,
    RagSearchResponse,
    RagSearchResponseData,
)

router = APIRouter(tags=["RAG & Knowledge"])


@router.post("/rag/search", response_model=RagSearchResponse)
async def rag_search_endpoint(
    request: RagSearchRequest,
    _rate: bool = Depends(check_rate_limit),
    _auth: bool = Depends(verify_api_key),
):
    """
    Direct semantic & hybrid search endpoint against the CarIQ RAG knowledge base.
    """
    filters = {}
    if request.vehicle_id_filter:
        filters["vehicle_id"] = request.vehicle_id_filter

    chunks = hybrid_retriever.retrieve(query=request.query, top_k=request.top_k, filters=filters)
    avg_conf = (sum(c.score for c in chunks) / len(chunks)) if chunks else 0.0

    return RagSearchResponse(
        success=True,
        data=RagSearchResponseData(
            query=request.query,
            chunks=chunks,
            confidence_score=round(avg_conf, 3),
            retrieval_count=len(chunks),
        ),
    )


@router.post("/rag/ingest", response_model=IngestionResponse)
async def rag_ingest_endpoint(
    request: IngestionRequest,
    _rate: bool = Depends(check_rate_limit),
    _auth: bool = Depends(verify_api_key),
):
    """
    Triggers document ingestion, chunking, and embedding generation into the vector index.
    """
    stats = ingestion_pipeline.ingest_directory(force_reindex=request.force_reindex)
    return IngestionResponse(
        success=True,
        documents_indexed=stats["documents_indexed"],
        chunks_created=stats["chunks_created"],
        message=f"Successfully indexed {stats['documents_indexed']} documents into {stats['chunks_created']} semantic chunks.",
    )
