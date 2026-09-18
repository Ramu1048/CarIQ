from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DocumentMetadata(BaseModel):
    document_id: str
    source: str
    vehicle_id: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    section: Optional[str] = "General"
    page: int = 1
    doc_type: str = "spec_guide"  # spec_guide, faq, finance, guide


class DocumentChunk(BaseModel):
    chunk_id: str
    content: str
    metadata: DocumentMetadata
    embedding: Optional[List[float]] = None


class RetrievedContextChunk(BaseModel):
    chunk_id: str
    content: str
    source: str
    section: Optional[str] = None
    vehicle_id: Optional[str] = None
    page: int = 1
    score: float = 0.0
    document_id: Optional[str] = None


class CitationSource(BaseModel):
    document: str
    section: Optional[str] = None
    vehicle_id: Optional[str] = None
    page: int = 1
    relevance_score: float = 0.0
    snippet: Optional[str] = None
