import math
from typing import Any, Dict, List, Optional
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger
from ai_service.app.models.knowledge import DocumentChunk, RetrievedContextChunk


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class InMemoryVectorStore:
    """Fast, in-memory vector database with metadata filtering and cosine similarity."""

    def __init__(self):
        self.chunks: Dict[str, DocumentChunk] = {}

    def insert_chunk(self, chunk: DocumentChunk) -> None:
        self.chunks[chunk.chunk_id] = chunk

    def insert_batch(self, chunks: List[DocumentChunk]) -> int:
        for chunk in chunks:
            self.chunks[chunk.chunk_id] = chunk
        return len(chunks)

    def delete_by_document_id(self, document_id: str) -> int:
        keys_to_del = [
            cid for cid, c in self.chunks.items() if c.metadata.document_id == document_id
        ]
        for k in keys_to_del:
            del self.chunks[k]
        return len(keys_to_del)

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedContextChunk]:
        results: List[RetrievedContextChunk] = []

        for cid, chunk in self.chunks.items():
            if not chunk.embedding:
                continue

            # Apply metadata filters if provided
            if filters:
                match = True
                if "vehicle_id" in filters and filters["vehicle_id"]:
                    if chunk.metadata.vehicle_id != filters["vehicle_id"]:
                        match = False
                if "brand" in filters and filters["brand"]:
                    if chunk.metadata.brand and chunk.metadata.brand.lower() != filters["brand"].lower():
                        match = False
                if "doc_type" in filters and filters["doc_type"]:
                    if chunk.metadata.doc_type != filters["doc_type"]:
                        match = False
                if not match:
                    continue

            sim = cosine_similarity(query_embedding, chunk.embedding)

            results.append(
                RetrievedContextChunk(
                    chunk_id=chunk.chunk_id,
                    content=chunk.content,
                    source=chunk.metadata.source,
                    section=chunk.metadata.section,
                    vehicle_id=chunk.metadata.vehicle_id,
                    page=chunk.metadata.page,
                    score=round(sim, 4),
                    document_id=chunk.metadata.document_id,
                )
            )

        # Sort descending by cosine similarity score
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def count(self) -> int:
        return len(self.chunks)

    def clear(self) -> None:
        self.chunks.clear()


# Global shared vector store instance
vector_store = InMemoryVectorStore()
