import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_service.app.rag.embeddings import embedding_engine
from ai_service.app.rag.ingestion import ingestion_pipeline
from ai_service.app.rag.vector_store import vector_store


def main():
    print("=" * 60)
    print("CarIQ Pre-building Vector Embeddings")
    print("=" * 60)
    stats = ingestion_pipeline.ingest_directory(force_reindex=True)
    print(f"Computed embeddings for {stats['chunks_created']} chunks using provider '{embedding_engine.__class__.__name__}'.")
    print(f"Total chunks in vector store index: {vector_store.count()}")
    print("=" * 60)


if __name__ == "__main__":
    main()
