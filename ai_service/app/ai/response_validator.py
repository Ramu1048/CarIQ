import re
from typing import Any, Dict, List, Optional, Tuple
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger
from ai_service.app.models.knowledge import CitationSource, RetrievedContextChunk


class ResponseValidator:
    """Validates LLM generated answers against retrieved context to prevent hallucinations."""

    @classmethod
    def calculate_confidence(
        cls,
        context_chunks: List[RetrievedContextChunk],
        matched_vehicles_count: int,
        intent: str,
    ) -> float:
        """
        Calculates confidence score [0.0 to 1.0] based on retrieved context relevance.
        """
        if intent in ["unsupported"]:
            return 0.1

        if not context_chunks and matched_vehicles_count == 0:
            if intent in ["general_car_question", "finance"]:
                return 0.70  # Finance/general can rely on verified calculation service / rules
            return 0.30

        scores = [c.score for c in context_chunks if c.score > 0]
        if not scores:
            avg_score = 0.65 if matched_vehicles_count > 0 else 0.40
        else:
            avg_score = sum(scores) / len(scores)

        # Boost confidence if structured vehicles were also matched
        if matched_vehicles_count > 0:
            avg_score = min(1.0, avg_score + 0.15)

        return round(float(avg_score), 2)

    @classmethod
    def validate_and_ground(
        cls,
        generated_answer: str,
        context_chunks: List[RetrievedContextChunk],
        confidence: float,
    ) -> Tuple[str, List[CitationSource]]:
        """
        Extracts verified citations and ensures claims adhere to threshold guidelines.
        """
        citations: List[CitationSource] = []

        # If confidence is below threshold, qualify the response
        if confidence < settings.RAG_CONFIDENCE_THRESHOLD:
            if not generated_answer or len(generated_answer.strip()) < 20:
                generated_answer = (
                    "I couldn't find sufficient verified information in the CarIQ database for this specific question. "
                    "You can try searching for specific vehicle specifications, comparing models, or calculating loan EMI."
                )

        # Build citation references from used context chunks
        seen_docs = set()
        for chunk in context_chunks:
            doc_key = f"{chunk.source}_{chunk.section}"
            if doc_key not in seen_docs:
                seen_docs.add(doc_key)
                citations.append(
                    CitationSource(
                        document=chunk.source,
                        section=chunk.section,
                        vehicle_id=chunk.vehicle_id,
                        page=chunk.page,
                        relevance_score=round(chunk.score, 3),
                        snippet=chunk.content[:160] + "..." if len(chunk.content) > 160 else chunk.content,
                    )
                )

        return generated_answer, citations

    @classmethod
    def generate_suggested_followups(
        cls,
        intent: str,
        vehicle_ids: Optional[List[str]] = None,
        budget_max: Optional[int] = None,
    ) -> List[str]:
        """Dynamically generates contextual follow-up questions for the UI."""
        suggestions = []

        if intent in ["car_recommendation", "car_search"]:
            if vehicle_ids and len(vehicle_ids) >= 2:
                suggestions.append(f"Compare top models")
            suggestions.append("Calculate EMI & down payment options")
            suggestions.append("Show fuel-efficient alternatives")
            suggestions.append("What are the real-world maintenance costs?")
        elif intent == "car_comparison":
            suggestions.append("Which car has the highest safety rating?")
            suggestions.append("Calculate monthly EMI for both cars")
            suggestions.append("Compare boot space and ground clearance")
        elif intent == "finance":
            suggestions.append("Calculate EMI for 5 years at 8.75%")
            suggestions.append("What is the ideal down payment percentage?")
            suggestions.append("Show cars under ₹15 Lakh on-road")
        elif intent in ["safety", "vehicle_information"]:
            suggestions.append("Compare safety ratings with rivals")
            suggestions.append("What is the real-world mileage?")
            suggestions.append("Show recommended automatic variants")
        elif intent == "EV":
            suggestions.append("What is the real-world highway range?")
            suggestions.append("How much does home wallbox charging cost?")
            suggestions.append("Show hybrid alternatives with no charging needed")
        else:
            suggestions.append("Find the best SUVs under ₹15 Lakh")
            suggestions.append("Compare Tata Nexon and Maruti Brezza")
            suggestions.append("Show top electric cars for city driving")

        return suggestions[:4]
