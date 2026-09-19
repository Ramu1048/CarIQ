import os
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


class ChromaVectorStore:
    """Persistent ChromaDB vector store supporting local on-disk or Hosted Chroma Cloud."""

    def __init__(self, persist_directory: Optional[str] = None):
        import chromadb

        self.is_cloud = False
        self.client = None
        self.collection = None

        # Check if Chroma Cloud or remote host is specified
        host = (settings.CHROMA_HOST or "").strip()
        tenant = (settings.CHROMA_TENANT or "").strip()
        database = (settings.CHROMA_DATABASE or "").strip()
        api_key = (settings.CHROMA_API_KEY or "").strip()

        is_cloud_target = bool(
            host
            and (
                "trychroma.com" in host.lower()
                or host.startswith("http://")
                or host.startswith("https://")
                or tenant
            )
        )

        if is_cloud_target:
            if not api_key or api_key == "YOUR_API_KEY":
                logger.warning(
                    "CHROMA_HOST is set to cloud, but CHROMA_API_KEY is still the placeholder 'YOUR_API_KEY'. "
                    "Falling back to local persistent ChromaDB until an active API key is provided."
                )
            else:
                try:
                    clean_host = (
                        host.replace("https://", "").replace("http://", "").split(":")[0]
                        if host
                        else "api.trychroma.com"
                    )
                    logger.info(
                        f"Connecting to Chroma Cloud at {clean_host} (tenant={tenant or 'default'}, database={database or 'default'})..."
                    )
                    if hasattr(chromadb, "CloudClient"):
                        self.client = chromadb.CloudClient(
                            tenant=tenant or None,
                            database=database or None,
                            api_key=api_key,
                            cloud_host=clean_host,
                        )
                    else:
                        self.client = chromadb.HttpClient(
                            host=clean_host,
                            port=settings.CHROMA_PORT or (443 if settings.CHROMA_SSL else 8000),
                            ssl=settings.CHROMA_SSL,
                            tenant=tenant or "default_tenant",
                            database=database or "default_database",
                            headers={"x-chroma-token": api_key} if api_key else None,
                        )

                    self.collection = self.client.get_or_create_collection(
                        name="cariq_knowledge",
                        metadata={"hnsw:space": "cosine"},
                    )
                    self.is_cloud = True
                    logger.info(
                        f"Connected successfully to Chroma Cloud! Collection: cariq_knowledge (items: {self.collection.count()})"
                    )
                except Exception as e:
                    logger.warning(
                        f"Unable to connect to Chroma Cloud ({e}). Falling back to local PersistentClient on disk."
                    )

        if not self.collection:
            # Local on-disk persistent client fallback
            self.persist_directory = persist_directory or os.path.join(settings.DATA_DIR, "chroma_db")
            os.makedirs(self.persist_directory, exist_ok=True)
            self.client = chromadb.PersistentClient(path=self.persist_directory)
            self.collection = self.client.get_or_create_collection(
                name="cariq_knowledge",
                metadata={"hnsw:space": "cosine"},
            )
            logger.info(
                f"Initialized local ChromaVectorStore at {self.persist_directory} (existing items: {self.collection.count()})"
            )

    def insert_chunk(self, chunk: DocumentChunk) -> None:
        if not chunk.embedding:
            return
        meta = {
            "document_id": chunk.metadata.document_id or "",
            "source": chunk.metadata.source or "",
            "vehicle_id": chunk.metadata.vehicle_id or "",
            "brand": chunk.metadata.brand or "",
            "model": chunk.metadata.model or "",
            "section": chunk.metadata.section or "General",
            "page": chunk.metadata.page or 1,
            "doc_type": chunk.metadata.doc_type or "spec_guide",
        }
        self.collection.upsert(
            ids=[chunk.chunk_id],
            documents=[chunk.content],
            embeddings=[chunk.embedding],
            metadatas=[meta],
        )

    def insert_batch(self, chunks: List[DocumentChunk]) -> int:
        valid_chunks = [c for c in chunks if c.embedding]
        if not valid_chunks:
            return 0

        ids = [c.chunk_id for c in valid_chunks]
        documents = [c.content for c in valid_chunks]
        embeddings = [c.embedding for c in valid_chunks]
        metadatas = [
            {
                "document_id": c.metadata.document_id or "",
                "source": c.metadata.source or "",
                "vehicle_id": c.metadata.vehicle_id or "",
                "brand": c.metadata.brand or "",
                "model": c.metadata.model or "",
                "section": c.metadata.section or "General",
                "page": c.metadata.page or 1,
                "doc_type": c.metadata.doc_type or "spec_guide",
            }
            for c in valid_chunks
        ]

        self.collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        return len(valid_chunks)

    def delete_by_document_id(self, document_id: str) -> int:
        try:
            existing = self.collection.get(where={"document_id": document_id})
            if existing and existing.get("ids"):
                count = len(existing["ids"])
                self.collection.delete(ids=existing["ids"])
                return count
            return 0
        except Exception as e:
            logger.warning(f"Error deleting by document_id in ChromaDB: {e}")
            return 0

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedContextChunk]:
        total_items = self.collection.count()
        if total_items == 0:
            return []

        conditions = []
        if filters:
            if filters.get("vehicle_id"):
                conditions.append({"vehicle_id": filters["vehicle_id"]})
            if filters.get("brand"):
                conditions.append({"brand": filters["brand"]})
            if filters.get("doc_type"):
                conditions.append({"doc_type": filters["doc_type"]})

        where_filter = None
        if len(conditions) == 1:
            where_filter = conditions[0]
        elif len(conditions) > 1:
            where_filter = {"$and": conditions}

        n_results = min(top_k, total_items)
        try:
            query_kwargs = {
                "query_embeddings": [query_embedding],
                "n_results": n_results,
            }
            if where_filter:
                query_kwargs["where"] = where_filter

            res = self.collection.query(**query_kwargs)
        except Exception as e:
            logger.error(f"ChromaDB search query failed: {e}")
            return []

        results: List[RetrievedContextChunk] = []
        if not res or not res.get("ids") or not res["ids"][0]:
            return results

        ids = res["ids"][0]
        documents = res["documents"][0] if res.get("documents") else [""] * len(ids)
        distances = res["distances"][0] if res.get("distances") else [0.0] * len(ids)
        metas = res["metadatas"][0] if res.get("metadatas") else [{}] * len(ids)

        for chunk_id, doc, dist, meta in zip(ids, documents, distances, metas):
            score = max(0.0, min(1.0, 1.0 - dist))
            results.append(
                RetrievedContextChunk(
                    chunk_id=chunk_id,
                    content=doc,
                    source=meta.get("source", "knowledge_base"),
                    section=meta.get("section", "General"),
                    vehicle_id=meta.get("vehicle_id") or None,
                    page=int(meta.get("page", 1)),
                    score=round(score, 4),
                    document_id=meta.get("document_id") or None,
                )
            )

        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def count(self) -> int:
        return self.collection.count()

    def clear(self) -> None:
        try:
            self.client.delete_collection("cariq_knowledge")
            self.collection = self.client.get_or_create_collection(
                name="cariq_knowledge",
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            logger.error(f"Failed to clear ChromaDB collection: {e}")


def get_vector_store():
    store_type = (settings.VECTOR_STORE_TYPE or "memory").strip().lower()
    if store_type == "chromadb":
        try:
            return ChromaVectorStore()
        except Exception as e:
            logger.error(f"Failed to initialize ChromaVectorStore, falling back to InMemoryVectorStore: {e}")
            return InMemoryVectorStore()
    return InMemoryVectorStore()


# Global shared vector store instance
vector_store = get_vector_store()

