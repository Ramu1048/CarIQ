import asyncio
import os
import sys
import time

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from ai_service.app.rag.ingestion import ingestion_pipeline
from ai_service.app.schemas.chat import ChatRequest
from ai_service.app.services.ai_service import ai_service_orchestrator

EVALUATION_QUESTIONS = [
    {
        "id": "EVAL-01",
        "category": "car_recommendation",
        "query": "Best SUV under 15 lakh with good safety and automatic transmission",
        "expected_intent": "car_recommendation",
        "expected_vehicles": ["tata_nexon", "maruti_brezza", "tata_punch_ev"],
        "expected_facts": ["safety", "nexon", "automatic", "lakh"],
    },
    {
        "id": "EVAL-02",
        "category": "car_comparison",
        "query": "Compare Nexon and Brezza",
        "expected_intent": "car_comparison",
        "expected_vehicles": ["tata_nexon", "maruti_brezza"],
        "expected_facts": ["mileage", "safety", "ground clearance"],
    },
    {
        "id": "EVAL-03",
        "category": "vehicle_information",
        "query": "What is the mileage and boot space of Tata Nexon?",
        "expected_intent": "vehicle_information",
        "expected_vehicles": ["tata_nexon"],
        "expected_facts": ["382", "17.01", "km/l", "boot"],
    },
    {
        "id": "EVAL-04",
        "category": "EV / City usage",
        "query": "Which car is suitable for city driving with low running cost?",
        "expected_intent": "car_recommendation",
        "expected_vehicles": ["tata_punch_ev", "tata_tiago_ev", "maruti_brezza"],
        "expected_facts": ["electric", "ev", "running cost", "city"],
    },
    {
        "id": "EVAL-05",
        "category": "unsupported / hallucination test",
        "query": "What is the top speed of a Tesla Model Y spaceship edition on Mars?",
        "expected_intent": "unsupported",
        "expected_vehicles": [],
        "expected_facts": ["couldn't find", "not found", "database", "reliable information"],
    },
]


async def run_evaluation():
    print("=" * 80)
    print("CarIQ RAG + AI Intelligence Layer - Automated Evaluation Suite")
    print("=" * 80)

    # Ingest knowledge documents
    ingestion_pipeline.ingest_directory(force_reindex=True)

    results = []
    total_latency = 0.0

    for item in EVALUATION_QUESTIONS:
        t0 = time.time()
        req = ChatRequest(message=item["query"])
        resp = await ai_service_orchestrator.chat(req)
        latency = (time.time() - t0) * 1000
        total_latency += latency

        data = resp.data
        meta = resp.meta

        # Check retrieval accuracy
        rec_ids = [r.vehicle_id for r in data.recommendations]
        matched_expected = any(v in rec_ids for v in item["expected_vehicles"]) if item["expected_vehicles"] else True

        # Check fact groundedness
        answer_lower = data.answer.lower()
        facts_matched = sum(1 for f in item["expected_facts"] if f.lower() in answer_lower)
        fact_coverage = (facts_matched / len(item["expected_facts"])) if item["expected_facts"] else 1.0

        # Check hallucination control
        hallucination_flag = False
        if item["id"] == "EVAL-05":
            # For unknown Martian car, confidence must be low or answer must acknowledge lack of info
            if "couldn't find" in answer_lower or "reliable information" in answer_lower or meta.get("confidence", 1.0) < 0.65:
                hallucination_flag = False
            else:
                hallucination_flag = True

        eval_record = {
            "id": item["id"],
            "query": item["query"],
            "intent_detected": data.intent,
            "confidence": meta.get("confidence", 0.0),
            "recommendation_count": len(data.recommendations),
            "sources_count": len(data.sources),
            "fact_coverage": round(fact_coverage * 100, 1),
            "hallucination": "NO" if not hallucination_flag else "YES (FAILED)",
            "latency_ms": round(latency, 2),
            "status": "PASS" if (not hallucination_flag and (matched_expected or fact_coverage >= 0.5)) else "WARN",
        }
        results.append(eval_record)

        print(f"\n[{eval_record['id']}] {item['query']}")
        print(f"  -> Intent: {eval_record['intent_detected']} | Confidence: {eval_record['confidence']} | Status: {eval_record['status']}")
        print(f"  -> Sources: {eval_record['sources_count']} | Recommendations: {eval_record['recommendation_count']} | Fact Coverage: {eval_record['fact_coverage']}%")
        print(f"  -> Response Snippet: {data.answer[:140]}...")

    print("\n" + "=" * 80)
    print("EVALUATION SUMMARY")
    print("=" * 80)
    passed_count = sum(1 for r in results if r["status"] == "PASS")
    avg_latency = total_latency / len(results)
    avg_coverage = sum(r["fact_coverage"] for r in results) / len(results)

    print(f"Total Test Cases:       {len(results)}")
    print(f"Tests Passed:           {passed_count} / {len(results)}")
    print(f"Average Fact Coverage:  {avg_coverage:.1f}%")
    print(f"Average Turn Latency:   {avg_latency:.2f} ms")
    print(f"Overall Evaluation:     {'SUCCESS' if passed_count == len(results) else 'COMPLETED WITH WARNINGS'}")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_evaluation())
