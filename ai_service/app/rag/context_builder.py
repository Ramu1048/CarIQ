from typing import List, Optional
from ai_service.app.core.security import isolate_retrieved_context
from ai_service.app.models.knowledge import RetrievedContextChunk
from ai_service.app.models.vehicle import Vehicle


class ContextBuilder:
    """Builds secure, structured, token-bounded context for LLM generation."""

    @classmethod
    def format_rag_context(
        cls,
        context_chunks: List[RetrievedContextChunk],
        matched_vehicles: Optional[List[Vehicle]] = None,
        max_chars: int = 4000,
    ) -> str:
        parts = []

        if matched_vehicles:
            parts.append("VERIFIED VEHICLE DATABASE SPECIFICATIONS:")
            for v in matched_vehicles:
                v_desc = (
                    f"• {v.brand} {v.model} ({v.variant or 'Standard'}): "
                    f"Price: ₹{v.price_min/100000:.2f}L - ₹{v.price_max/100000:.2f}L (Ex-Showroom: ₹{v.ex_showroom_price/100000:.2f}L) | "
                    f"Fuel: {v.fuel_type} | Gearbox: {v.transmission} | Mileage: {v.mileage_kmpl} km/l | "
                    f"Power: {v.power_bhp} bhp | Boot: {v.boot_space_litres}L | Ground Clearance: {v.ground_clearance_mm}mm | "
                    f"NCAP Safety: {v.safety_rating_ncap} Stars ({v.airbags_count} Airbags) | "
                    f"Annual Maint: ₹{v.maintenance_cost_annual_inr} | "
                    f"Top Features: {', '.join(v.features[:5])}"
                )
                parts.append(v_desc)
            parts.append("")

        if context_chunks:
            parts.append("KNOWLEDGE BASE EXCERPTS:")
            running_len = 0
            for i, chunk in enumerate(context_chunks, 1):
                chunk_repr = (
                    f"[{i}] Source: {chunk.source} | Section: {chunk.section or 'Specs'} | (DocID: {chunk.document_id or 'N/A'})\n"
                    f"{chunk.content}\n"
                )
                if running_len + len(chunk_repr) > max_chars:
                    break
                parts.append(chunk_repr)
                running_len += len(chunk_repr)

        combined_raw = "\n".join(parts)
        # Apply prompt-injection defense boundary isolation
        return isolate_retrieved_context(combined_raw)
