import os
import glob
import hashlib
import json
from typing import Dict, List, Tuple
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger
from ai_service.app.models.knowledge import DocumentChunk
from ai_service.app.rag.chunking import SemanticVehicleChunker
from ai_service.app.rag.embeddings import embedding_engine
from ai_service.app.rag.vector_store import vector_store

# Tracks MD5 hashes of ingested files to prevent redundant re-indexing
_INGESTED_DOC_HASHES: Dict[str, str] = {}


class DocumentIngestionPipeline:
    """Ingests Markdown, TXT, and JSON documents, computes embeddings, and stores in vector DB."""

    def __init__(self):
        self.chunker = SemanticVehicleChunker()
        self.embedding_engine = embedding_engine
        self.vector_store = vector_store

    def _calculate_file_hash(self, filepath: str) -> str:
        with open(filepath, "rb") as f:
            return hashlib.md5(f.read()).hexdigest()

    def _infer_metadata_from_filename(self, filepath: str) -> Tuple[str, str, str, str]:
        filename = os.path.basename(filepath)
        name_no_ext = os.path.splitext(filename)[0]

        vehicle_id = None
        brand = None
        model = None
        doc_type = "guide"

        if "nexon" in name_no_ext:
            vehicle_id = "tata_nexon"
            brand = "Tata"
            model = "Nexon"
            doc_type = "spec_guide"
        elif "brezza" in name_no_ext:
            vehicle_id = "maruti_brezza"
            brand = "Maruti Suzuki"
            model = "Brezza"
            doc_type = "spec_guide"
        elif "creta" in name_no_ext:
            vehicle_id = "hyundai_creta"
            brand = "Hyundai"
            model = "Creta"
            doc_type = "spec_guide"
        elif "punch_ev" in name_no_ext:
            vehicle_id = "tata_punch_ev"
            brand = "Tata"
            model = "Punch EV"
            doc_type = "spec_guide"
        elif "grand_vitara" in name_no_ext:
            vehicle_id = "maruti_grand_vitara_hybrid"
            brand = "Maruti Suzuki"
            model = "Grand Vitara"
            doc_type = "spec_guide"
        elif "loan" in name_no_ext or "emi" in name_no_ext:
            doc_type = "finance"
        elif "safety" in name_no_ext:
            doc_type = "safety"
        elif "faq" in name_no_ext:
            doc_type = "faq"

        return name_no_ext, vehicle_id, brand, doc_type

    def ingest_directory(self, dir_path: str = None, force_reindex: bool = False) -> Dict[str, int]:
        target_dir = dir_path or settings.DOCUMENTS_DIR
        guides_dir = os.path.join(settings.DATA_DIR, "guides")

        doc_files = glob.glob(os.path.join(target_dir, "*.md")) + glob.glob(os.path.join(target_dir, "*.txt"))
        if os.path.exists(guides_dir):
            doc_files += glob.glob(os.path.join(guides_dir, "*.md"))

        total_docs = 0
        total_chunks = 0

        for fpath in doc_files:
            file_hash = self._calculate_file_hash(fpath)
            doc_id, vehicle_id, brand, doc_type = self._infer_metadata_from_filename(fpath)

            if not force_reindex and _INGESTED_DOC_HASHES.get(doc_id) == file_hash:
                logger.info(f"Skipping unchanged document: {doc_id}")
                continue

            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()

                # Clean text
                clean_content = content.strip()

                # Chunk document
                chunks = self.chunker.chunk_document(
                    doc_id=doc_id,
                    source_name=os.path.basename(fpath),
                    text=clean_content,
                    vehicle_id=vehicle_id,
                    brand=brand,
                    doc_type=doc_type,
                )

                # Generate embeddings for chunks
                for chunk in chunks:
                    chunk.embedding = self.embedding_engine.embed_text(chunk.content)

                # Delete old chunks if re-indexing
                self.vector_store.delete_by_document_id(doc_id)

                # Insert into vector store
                self.vector_store.insert_batch(chunks)
                _INGESTED_DOC_HASHES[doc_id] = file_hash

                total_docs += 1
                total_chunks += len(chunks)
                logger.info(f"Ingested {os.path.basename(fpath)} -> {len(chunks)} chunks")

            except Exception as e:
                logger.error(f"Failed to ingest {fpath}: {e}")

        return {"documents_indexed": total_docs, "chunks_created": total_chunks}


ingestion_pipeline = DocumentIngestionPipeline()
