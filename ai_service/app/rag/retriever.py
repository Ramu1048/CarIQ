from typing import Any, Dict, List, Optional
from ai_service.app.core.config import settings
from ai_service.app.models.knowledge import RetrievedContextChunk
from ai_service.app.rag.embeddings import embedding_engine
from ai_service.app.rag.reranker import reranker
from ai_service.app.rag.vector_store import vector_store


class HybridRetriever:
    """
    Combines Vector Similarity Search + Metadata Filtering + Keyword Scoring + Reranking.
    """

    def __init__(self):
        self.vector_store = vector_store
        self.embedding_engine = embedding_engine
        self.reranker = reranker

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedContextChunk]:
        top_k = top_k or settings.RAG_TOP_K

        # Step 1: Generate query embedding
        query_emb = self.embedding_engine.embed_text(query)

        # Step 2: Retrieve top 20 candidate chunks from vector store
        candidates = self.vector_store.search(
            query_embedding=query_emb,
            top_k=max(20, top_k * 3),
            filters=filters,
        )

        if not candidates:
            return []

        # Step 3: Rerank candidates and select top_k
        reranked = self.reranker.rerank(query=query, candidates=candidates, top_k=top_k)

        return reranked


hybrid_retriever = HybridRetriever()
