import re
from typing import List
from ai_service.app.models.knowledge import RetrievedContextChunk


class ModularReranker:
    """
    Cross-evaluates candidate chunks against specific query terms (e.g. mileage, price,
    safety, automatic, ground clearance, ev, battery) to elevate precise factual snippets.
    """

    def rerank(
        self,
        query: str,
        candidates: List[RetrievedContextChunk],
        top_k: int = 5,
    ) -> List[RetrievedContextChunk]:
        if not candidates:
            return []

        query_terms = set(re.findall(r"\b[a-zA-Z0-9]{3,}\b", query.lower()))

        scored_candidates = []
        for item in candidates:
            content_lower = item.content.lower()
            section_lower = (item.section or "").lower()

            # Base vector score
            combined_score = item.score * 0.6

            # Exact keyword overlap bonus
            matched_terms = [t for t in query_terms if t in content_lower]
            term_overlap_ratio = len(matched_terms) / max(1, len(query_terms))
            combined_score += term_overlap_ratio * 0.3

            # Section header relevance bonus
            if any(t in section_lower for t in query_terms):
                combined_score += 0.1

            # Bonus for numerical spec mentions if query asked for numbers
            if any(num_kw in query.lower() for num_kw in ["price", "lakh", "mileage", "kmpl", "bhp", "ground clearance", "boot", "star", "safety"]):
                if re.search(r"\d+(\.\d+)?\s*(lakh|km/l|kmpl|bhp|nm|mm|litres|stars?|star)", content_lower):
                    combined_score += 0.1

            scored_candidates.append((combined_score, item))

        # Sort descending by reranked score
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        # Update scores on the items and return top_k
        top_items = []
        for score, item in scored_candidates[:top_k]:
            item.score = round(min(1.0, score), 4)
            top_items.append(item)

        return top_items


reranker = ModularReranker()
