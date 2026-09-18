import os
import sys
import pytest

# Ensure root directory is in sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ai_service.app.rag.ingestion import ingestion_pipeline


@pytest.fixture(scope="session", autouse=True)
def setup_test_knowledge_base():
    """Initializes and indexes the knowledge base before tests run."""
    ingestion_pipeline.ingest_directory(force_reindex=True)
