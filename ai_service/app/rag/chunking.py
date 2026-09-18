import re
from typing import List
from ai_service.app.core.config import settings
from ai_service.app.models.knowledge import DocumentChunk, DocumentMetadata


class SemanticVehicleChunker:
    """
    Intelligently chunks vehicle technical documentation based on semantic markdown headers
    and logical specification sections without splitting spec blocks mid-table.
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 80):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    def chunk_document(
        self,
        doc_id: str,
        source_name: str,
        text: str,
        vehicle_id: str = None,
        brand: str = None,
        model: str = None,
        doc_type: str = "spec_guide",
    ) -> List[DocumentChunk]:
        chunks: List[DocumentChunk] = []

        # Split by markdown H2 / H3 headers to keep semantic sections intact
        sections = re.split(r"\n(?=##\s+)", text)

        for sec_idx, section in enumerate(sections):
            section_clean = section.strip()
            if not section_clean:
                continue

            # Extract section title
            first_line = section_clean.split("\n")[0]
            section_name = re.sub(r"^#+\s*", "", first_line).strip()
            if not section_name:
                section_name = f"Section_{sec_idx+1}"

            # If the section is small enough, keep as single chunk
            if len(section_clean) <= self.chunk_size + 100:
                meta = DocumentMetadata(
                    document_id=doc_id,
                    source=source_name,
                    vehicle_id=vehicle_id,
                    brand=brand,
                    model=model,
                    section=section_name,
                    page=1,
                    doc_type=doc_type,
                )
                chunk_id = f"{doc_id}_{sec_idx+1}_0"
                chunks.append(DocumentChunk(chunk_id=chunk_id, content=section_clean, metadata=meta))
            else:
                # Sub-chunk larger sections using paragraph/line boundaries
                paragraphs = section_clean.split("\n\n")
                current_chunk_text = ""
                sub_idx = 0

                for para in paragraphs:
                    if len(current_chunk_text) + len(para) < self.chunk_size:
                        current_chunk_text += ("\n\n" if current_chunk_text else "") + para
                    else:
                        if current_chunk_text:
                            meta = DocumentMetadata(
                                document_id=doc_id,
                                source=source_name,
                                vehicle_id=vehicle_id,
                                brand=brand,
                                model=model,
                                section=section_name,
                                page=1,
                                doc_type=doc_type,
                            )
                            chunk_id = f"{doc_id}_{sec_idx+1}_{sub_idx}"
                            chunks.append(
                                DocumentChunk(
                                    chunk_id=chunk_id,
                                    content=current_chunk_text.strip(),
                                    metadata=meta,
                                )
                            )
                            sub_idx += 1
                        # Retain overlap from end of previous chunk
                        current_chunk_text = para

                if current_chunk_text.strip():
                    meta = DocumentMetadata(
                        document_id=doc_id,
                        source=source_name,
                        vehicle_id=vehicle_id,
                        brand=brand,
                        model=model,
                        section=section_name,
                        page=1,
                        doc_type=doc_type,
                    )
                    chunk_id = f"{doc_id}_{sec_idx+1}_{sub_idx}"
                    chunks.append(
                        DocumentChunk(
                            chunk_id=chunk_id,
                            content=current_chunk_text.strip(),
                            metadata=meta,
                        )
                    )

        return chunks
