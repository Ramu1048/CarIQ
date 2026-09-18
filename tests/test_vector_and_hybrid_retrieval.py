import pytest
from ai_service.app.rag.retriever import hybrid_retriever
from ai_service.app.rag.vector_store import vector_store


def test_vector_store_populated():
    assert vector_store.count() > 10


def test_hybrid_retrieval_nexon():
    chunks = hybrid_retriever.retrieve("What is the safety rating and ground clearance of Tata Nexon?", top_k=3)
    assert len(chunks) > 0
    # Top chunk should mention safety or nexon or ground clearance
    combined = " ".join(c.content.lower() for c in chunks)
    assert "nexon" in combined or "safety" in combined or "clearance" in combined


def test_hybrid_retrieval_emi():
    chunks = hybrid_retriever.retrieve("How is car loan EMI calculated and what is down payment?", top_k=3)
    assert len(chunks) > 0
    combined = " ".join(c.content.lower() for c in chunks)
    assert "emi" in combined or "loan" in combined or "interest" in combined
