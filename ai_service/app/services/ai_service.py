import time
from typing import Any, Dict, List, Optional
from ai_service.app.ai.llm_provider import get_llm_provider
from ai_service.app.ai.prompt_manager import PromptManager
from ai_service.app.ai.response_validator import ResponseValidator
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger, LogContext
from ai_service.app.core.redis_cache import cache
from ai_service.app.core.security import sanitize_user_input
from ai_service.app.memory.conversation import conversation_memory
from ai_service.app.memory.user_preferences import user_preference_store
from ai_service.app.models.knowledge import CitationSource
from ai_service.app.models.vehicle import Vehicle, VehicleFilter
from ai_service.app.rag.context_builder import ContextBuilder
from ai_service.app.rag.retriever import hybrid_retriever
from ai_service.app.recommendation.explanation import recommendation_explainer
from ai_service.app.recommendation.preference_extractor import preference_extractor
from ai_service.app.recommendation.ranking import vehicle_ranker
from ai_service.app.recommendation.scoring import scoring_engine
from ai_service.app.schemas.chat import ChatRequest, ChatResponse, ChatResponseData
from ai_service.app.schemas.compare import CompareRequest, CompareResponse, CompareResponseData, ComparisonDimension
from ai_service.app.schemas.preference import UserPreferences
from ai_service.app.schemas.recommendation import (
    ExplainRecommendationRequest,
    ExplainRecommendationResponse,
    RecommendationRequest,
    RecommendationResponse,
    RecommendationResponseData,
    VehicleRecommendationItem,
)
from ai_service.app.schemas.search import (
    SemanticSearchRequest,
    SemanticSearchResponse,
    SemanticSearchResponseData,
    SemanticSearchResultItem,
)
from ai_service.app.services.finance_service import finance_service
from ai_service.app.services.vehicle_db_service import vehicle_db


class AIServiceOrchestrator:
    """Central AI orchestrator coordinating RAG retrieval, recommendations, chat, and comparisons."""

    def __init__(self):
        self.llm = get_llm_provider()
        self.db = vehicle_db
        self.retriever = hybrid_retriever
        self.extractor = preference_extractor
        self.ranker = vehicle_ranker
        self.scoring = scoring_engine
        self.explainer = recommendation_explainer
        self.memory = conversation_memory
        self.user_prefs = user_preference_store

    async def chat(self, request: ChatRequest) -> ChatResponse:
        with LogContext("chat_query"):
            # 1. Input Sanitization & Prompt Injection Check
            clean_message, is_injection = sanitize_user_input(request.message)

            # 2. Conversation Memory Contextualization
            session = self.memory.get_or_create(request.conversation_id, request.user_id)
            session.add_message("user", clean_message)

            # 3. Preference & Intent Extraction
            extracted_pref, detected_intent, intent_conf = await self.extractor.extract_preferences(
                clean_message, session.get_history_dict()
            )
            session.merge_preferences(extracted_pref)
            active_prefs = session.active_preferences

            # 4. Hybrid Retrieval (Vector + Structured Database)
            context_chunks = self.retriever.retrieve(query=clean_message, top_k=settings.RAG_TOP_K)

            # If user has budget or vehicle intent, filter matching structured vehicles
            matched_vehicles = self.db.filter_vehicles(
                VehicleFilter(
                    budget_max=active_prefs.budget_max,
                    body_type=active_prefs.body_type,
                    fuel_type=active_prefs.fuel_type,
                    transmission=active_prefs.transmission,
                )
            )[:3]

            # 5. Recommendation Engine integration for recommendation queries
            recommendation_items: List[VehicleRecommendationItem] = []
            if detected_intent in ["car_recommendation", "car_search"] or active_prefs.budget_max or active_prefs.body_type:
                ranked_vehicles = self.ranker.rank_vehicles(active_prefs, top_k=3)
                for veh, score, factors in ranked_vehicles:
                    reason = await self.explainer.explain(veh, active_prefs, score, factors)
                    recommendation_items.append(
                        VehicleRecommendationItem(
                            vehicle_id=veh.id,
                            brand=veh.brand,
                            model=veh.model,
                            variant=veh.variant,
                            price_min=veh.price_min,
                            price_max=veh.price_max,
                            match_score=score,
                            factors=factors,
                            key_highlights=veh.pros[:3],
                            reason=reason,
                            potential_tradeoffs=veh.cons[:2],
                            specs_summary={
                                "mileage": f"{veh.mileage_kmpl} km/l" if veh.mileage_kmpl else f"{veh.claimed_range_km} km range",
                                "power": f"{veh.power_bhp} bhp",
                                "safety": f"{veh.safety_rating_ncap}-Star NCAP",
                                "transmission": veh.transmission,
                                "fuel": veh.fuel_type,
                            },
                        )
                    )

            # 6. LLM Prompt Construction with Strict Grounding
            chat_prompt = PromptManager.build_chat_prompt(
                user_message=clean_message,
                context_chunks=context_chunks,
                matched_vehicles=matched_vehicles if matched_vehicles else [v for v, _, _ in self.ranker.rank_vehicles(active_prefs, top_k=2)],
                preferences=active_prefs,
                conversation_history=session.get_history_dict(),
            )

            # 7. LLM Generation
            raw_answer = await self.llm.generate_text(
                prompt=chat_prompt,
                system_instruction=PromptManager.SYSTEM_PROMPT,
                temperature=0.2,
                max_tokens=600,
            )

            # 8. Confidence Calculation & Output Grounding Validation
            confidence = ResponseValidator.calculate_confidence(
                context_chunks=context_chunks,
                matched_vehicles_count=len(matched_vehicles) or len(recommendation_items),
                intent=detected_intent,
            )

            final_answer, citations = ResponseValidator.validate_and_ground(
                generated_answer=raw_answer,
                context_chunks=context_chunks,
                confidence=confidence,
            )

            # 9. Follow-up Suggestions
            suggested_qs = ResponseValidator.generate_suggested_followups(
                intent=detected_intent,
                vehicle_ids=[r.vehicle_id for r in recommendation_items],
                budget_max=active_prefs.budget_max,
            )

            session.add_message("assistant", final_answer)

            return ChatResponse(
                success=True,
                data=ChatResponseData(
                    answer=final_answer,
                    intent=detected_intent,
                    recommendations=recommendation_items,
                    sources=citations,
                    suggested_questions=suggested_qs,
                    active_preferences=active_prefs,
                    conversation_id=session.conversation_id,
                ),
                meta={
                    "intent": detected_intent,
                    "confidence": confidence,
                    "provider": settings.AI_PROVIDER,
                    "model": settings.AI_MODEL,
                },
            )

    async def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        with LogContext("recommend_query"):
            # If natural language query provided, extract preferences first
            if request.natural_language_query:
                extracted_pref, _, _ = await self.extractor.extract_preferences(request.natural_language_query)
                prefs = extracted_pref
            else:
                prefs = request.preferences or UserPreferences()

            # Merge persistent user preferences if user_id given
            if request.user_id:
                user_saved = self.user_prefs.get_user_preferences(request.user_id)
                # Combine
                if not prefs.brand and user_saved.brand:
                    prefs.brand = user_saved.brand
                if not prefs.fuel_type and user_saved.fuel_type:
                    prefs.fuel_type = user_saved.fuel_type

            # Rank candidates using deterministic engine
            ranked = self.ranker.rank_vehicles(prefs, top_k=request.top_k)

            items = []
            for veh, score, factors in ranked:
                reason = await self.explainer.explain(veh, prefs, score, factors)
                items.append(
                    VehicleRecommendationItem(
                        vehicle_id=veh.id,
                        brand=veh.brand,
                        model=veh.model,
                        variant=veh.variant,
                        price_min=veh.price_min,
                        price_max=veh.price_max,
                        match_score=score,
                        factors=factors,
                        key_highlights=veh.pros[:3],
                        reason=reason,
                        potential_tradeoffs=veh.cons[:2],
                        specs_summary={
                            "mileage": f"{veh.mileage_kmpl} km/l" if veh.mileage_kmpl else f"{veh.claimed_range_km} km range",
                            "power": f"{veh.power_bhp} bhp",
                            "safety": f"{veh.safety_rating_ncap}-Star NCAP",
                            "transmission": veh.transmission,
                            "fuel": veh.fuel_type,
                        },
                    )
                )

            # Retrieve citations
            context_chunks = self.retriever.retrieve(
                query=f"{prefs.body_type or 'car'} {prefs.fuel_type or ''} {prefs.budget_max or ''}",
                top_k=3,
            )
            citations = [
                CitationSource(
                    document=c.source,
                    section=c.section,
                    vehicle_id=c.vehicle_id,
                    page=c.page,
                    relevance_score=c.score,
                    snippet=c.content[:140] + "...",
                )
                for c in context_chunks
            ]

            summary = (
                f"We evaluated the CarIQ vehicle database based on your criteria. "
                f"Top matches are selected using our multi-factor scoring algorithm."
            )

            suggested = [
                "Compare these recommended models",
                "Calculate monthly EMI",
                "Show more fuel-efficient options",
            ]

            return RecommendationResponse(
                success=True,
                data=RecommendationResponseData(
                    recommendations=items,
                    summary_explanation=summary,
                    interpreted_preferences=prefs,
                    suggested_questions=suggested,
                    sources=citations,
                ),
                meta={"total_candidates_evaluated": len(self.db.get_all())},
            )

    async def explain_recommendation(self, request: ExplainRecommendationRequest) -> ExplainRecommendationResponse:
        veh = self.db.get_by_id(request.vehicle_id)
        if not veh:
            return ExplainRecommendationResponse(
                success=False,
                data={"error": f"Vehicle with ID '{request.vehicle_id}' not found."},
                meta={},
            )

        score, factors = self.scoring.calculate_match(veh, request.preferences)
        explanation = await self.explainer.explain(veh, request.preferences, score, factors)

        # Context citations
        chunks = self.retriever.retrieve(query=f"{veh.brand} {veh.model}", top_k=2, filters={"vehicle_id": veh.id})
        citations = [
            CitationSource(
                document=c.source,
                section=c.section,
                vehicle_id=c.vehicle_id,
                page=c.page,
                relevance_score=c.score,
                snippet=c.content[:150] + "...",
            )
            for c in chunks
        ]

        return ExplainRecommendationResponse(
            success=True,
            data={
                "vehicle_id": veh.id,
                "vehicle_name": f"{veh.brand} {veh.model}",
                "match_score": score,
                "factors": factors,
                "explanation": explanation,
                "matching_requirements": [
                    f"Fits budget limit of ₹{request.preferences.budget_max/100000:.1f}L" if request.preferences.budget_max else "Budget compatible",
                    f"Matches {veh.transmission} transmission requirement",
                    f"{veh.safety_rating_ncap}-Star NCAP crash safety rating",
                ],
                "potential_compromises": veh.cons,
                "sources": citations,
            },
            meta={},
        )

    async def compare(self, request: CompareRequest) -> CompareResponse:
        vehicles: List[Vehicle] = []
        for vid in request.vehicle_ids:
            v = self.db.get_by_id(vid)
            if v:
                vehicles.append(v)

        if len(vehicles) < 2:
            return CompareResponse(
                success=False,
                data=CompareResponseData(
                    vehicles=[],
                    comparison_table=[],
                    ai_verdict="Please provide at least 2 valid vehicle IDs to compare.",
                    pros_and_cons={},
                    recommendation_scenario={},
                    suggested_questions=[],
                ),
            )

        # Build structured comparison dimensions
        table: List[ComparisonDimension] = [
            ComparisonDimension(
                name="Ex-Showroom Price",
                values={v.id: f"₹{v.ex_showroom_price/100000:.2f} Lakh" for v in vehicles},
                winner_id=min(vehicles, key=lambda x: x.ex_showroom_price).id,
                verdict=f"{min(vehicles, key=lambda x: x.ex_showroom_price).brand} {min(vehicles, key=lambda x: x.ex_showroom_price).model} is more budget friendly.",
            ),
            ComparisonDimension(
                name="Fuel Economy / Mileage",
                values={v.id: f"{v.mileage_kmpl} km/l" if v.mileage_kmpl else f"{v.claimed_range_km} km range" for v in vehicles},
                winner_id=max(vehicles, key=lambda x: x.mileage_kmpl).id,
                verdict=f"{max(vehicles, key=lambda x: x.mileage_kmpl).model} offers superior fuel efficiency.",
            ),
            ComparisonDimension(
                name="Power Output",
                values={v.id: f"{v.power_bhp} bhp" for v in vehicles},
                winner_id=max(vehicles, key=lambda x: x.power_bhp).id,
                verdict=f"{max(vehicles, key=lambda x: x.power_bhp).model} delivers higher engine power.",
            ),
            ComparisonDimension(
                name="Safety Rating",
                values={v.id: f"{v.safety_rating_ncap}-Star NCAP ({v.airbags_count} Airbags)" for v in vehicles},
                winner_id=max(vehicles, key=lambda x: (x.safety_rating_ncap, x.airbags_count)).id,
                verdict="Higher NCAP safety rating ensures better passenger protection.",
            ),
            ComparisonDimension(
                name="Boot Space",
                values={v.id: f"{v.boot_space_litres} Litres" for v in vehicles},
                winner_id=max(vehicles, key=lambda x: x.boot_space_litres).id,
                verdict=f"{max(vehicles, key=lambda x: x.boot_space_litres).model} offers more luggage space.",
            ),
            ComparisonDimension(
                name="Ground Clearance",
                values={v.id: f"{v.ground_clearance_mm} mm" for v in vehicles},
                winner_id=max(vehicles, key=lambda x: x.ground_clearance_mm).id,
                verdict=f"{max(vehicles, key=lambda x: x.ground_clearance_mm).model} clears rough obstacles more easily.",
            ),
        ]

        # AI Verdict generation
        comp_prompt = PromptManager.build_comparison_prompt(vehicles=vehicles, context_chunks=[])
        verdict = await self.llm.generate_text(
            prompt=comp_prompt,
            system_instruction=PromptManager.SYSTEM_PROMPT,
            temperature=0.2,
            max_tokens=500,
        )

        scenarios = {
            v.id: f"Best choice if your top priority is {v.pros[0].lower()}."
            for v in vehicles
        }

        pros_cons = {
            v.id: {"pros": v.pros, "cons": v.cons}
            for v in vehicles
        }

        return CompareResponse(
            success=True,
            data=CompareResponseData(
                vehicles=vehicles,
                comparison_table=table,
                ai_verdict=verdict,
                pros_and_cons=pros_cons,
                recommendation_scenario=scenarios,
                suggested_questions=[
                    f"Calculate EMI for {vehicles[0].model}",
                    f"Calculate EMI for {vehicles[1].model}",
                    "What are the maintenance costs?",
                ],
            ),
        )

    async def semantic_search(self, request: SemanticSearchRequest) -> SemanticSearchResponse:
        with LogContext("semantic_search"):
            # 1. Extract preferences from natural query
            clean_q, _ = sanitize_user_input(request.query)
            prefs, _, _ = await self.extractor.extract_preferences(clean_q)

            # 2. Retrieve candidates matching criteria
            ranked = self.ranker.rank_vehicles(prefs, top_k=request.top_k)

            results: List[SemanticSearchResultItem] = []
            for veh, score, factors in ranked:
                reasons = []
                if prefs.budget_max and veh.ex_showroom_price <= prefs.budget_max:
                    reasons.append(f"Within budget ₹{prefs.budget_max/100000:.1f} Lakh")
                if veh.safety_rating_ncap >= 4:
                    reasons.append(f"{veh.safety_rating_ncap}-Star NCAP Safety")
                if veh.mileage_kmpl >= 19.0 or veh.fuel_type == "Electric":
                    reasons.append("High efficiency / Low running cost")
                reasons.extend(veh.pros[:2])

                results.append(
                    SemanticSearchResultItem(
                        vehicle=veh,
                        relevance_score=round(score / 100.0, 2),
                        match_reasons=reasons[:4],
                    )
                )

            return SemanticSearchResponse(
                success=True,
                data=SemanticSearchResponseData(
                    query=clean_q,
                    interpreted_preferences=prefs,
                    results=results,
                    total=len(results),
                    explanation=f"Found {len(results)} vehicles matching '{clean_q}' based on semantic attributes and verified specifications.",
                ),
            )


ai_service_orchestrator = AIServiceOrchestrator()
