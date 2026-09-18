import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_service.app.rag.ingestion import ingestion_pipeline


def main():
    print("=" * 60)
    print("CarIQ RAG Ingestion Pipeline")
    print("=" * 60)
    print("Scanning and ingesting knowledge base documents...")
    stats = ingestion_pipeline.ingest_directory(force_reindex=True)
    print(f"Ingestion Finished:")
    print(f" - Documents Indexed: {stats['documents_indexed']}")
    print(f" - Chunks Created:    {stats['chunks_created']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
