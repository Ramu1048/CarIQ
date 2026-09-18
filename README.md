# CarIQ — RAG + AI Intelligence Layer

Production-grade **RAG + AI Intelligence Layer** for **CarIQ**, an AI-powered smart car purchasing platform.

The system combines Retrieval-Augmented Generation (RAG), verified vehicle database retrieval, deterministic multi-factor recommendation scoring, semantic search, AI car comparison, conversation memory, hallucination safeguards, source citation tracking, and multi-provider LLM support.

---

## 1. System Architecture

```
User / Frontend (React + MUI)
             ↓
    FastAPI Backend (/api/v1)
             ↓
┌────────────────────────────────────────────────────────┐
│               AI ORCHESTRATION LAYER                   │
│                                                        │
│  [Prompt Injection & Input Sanitizer]                  │
│                        ↓                               │
│  [Conversation & Preference Memory]                    │
│                        ↓                               │
│  [Intent Classifier & Slot Extractor]                  │
│                        ↓                               │
│  [Hybrid Retrieval Engine]                             │
│   ├── Structured Catalog (PostgreSQL / In-memory)      │
│   ├── Vector Store (pgvector / ChromaDB / In-memory)   │
│   └── Keyword / BM25 Matcher                           │
│                        ↓                               │
│  [Modular Relevance Reranker (Top-K Context)]          │
│                        ↓                               │
│  [Deterministic Recommendation Scoring Engine]         │
│   (Budget, Safety, Mileage, Usage, Body/Trans, Tech)   │
│                        ↓                               │
│  [Context Builder & System Grounding Safeguard]        │
│                        ↓                               │
│  [Multi-Provider LLM Abstraction]                      │
│   (Gemini ↔ OpenAI-compatible ↔ Ollama ↔ Fallback)     │
│                        ↓                               │
│  [Response Validator, Citation Mapper & Suggestions]   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Key Capabilities & Features

1. **Hybrid RAG Retrieval**: Combines semantic vector similarity search with structured database queries and modular reranking.
2. **Deterministic Recommendation Engine**: The LLM does *not* invent recommendations. A mathematical multi-factor scoring algorithm evaluates budget, safety ratings, fuel efficiency/EV economics, transmission, seating, and user priorities with configurable weights.
3. **Multi-Provider LLM Abstraction**:
   - **Google Gemini** (`gemini-1.5-flash`, `gemini-1.5-pro`)
   - **OpenAI-Compatible** (`gpt-4o-mini`, custom endpoints)
   - **Local Ollama** (`llama3:8b`, `mistral`)
   - **Zero-Downtime Deterministic Fallback** if LLMs are unreachable.
4. **Source Citations & Grounding**: Tracks document metadata (`document_id`, `source`, `vehicle_id`, `section`, `page`, `relevance_score`) for complete verification.
5. **Anti-Hallucination & Confidence Scoring**: Calculates quantitative retrieval confidence (`0.0` to `1.0`). If confidence falls below threshold, the system flags the uncertainty and suggests alternative actions.
6. **Multi-Turn Conversation Memory**: Retains and merges user preferences across dialogue turns (e.g., family car → ₹15 Lakh → Petrol).
7. **Prompt Injection & Jailbreak Defense**: Sanitizes malicious directives (`ignore previous instructions`, `system override`) and wraps retrieved documents in strict passive data tokens to prevent indirect injection.
8. **Deterministic Finance Engine**: Exact EMI calculations (loan amount, interest rate, tenure, down payment, total repayment) performed by verified math algorithms, eliminating LLM arithmetic errors.

---

## 3. Project Structure

```
CarIQ/
├── ai_service/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & lifecycle
│   │   ├── api/                        # API route controllers
│   │   │   ├── chat.py                 # POST /api/v1/ai/chat
│   │   │   ├── recommendations.py      # POST /api/v1/ai/recommend, /explain-recommendation
│   │   │   ├── search.py               # POST /api/v1/ai/search
│   │   │   ├── compare.py              # POST /api/v1/ai/compare
│   │   │   ├── extract.py              # POST /api/v1/ai/extract-preferences
│   │   │   ├── rag.py                  # POST /api/v1/rag/search, /rag/ingest
│   │   │   └── health.py               # GET /api/v1/health
│   │   ├── core/                       # Settings, logging, security, cache
│   │   ├── ai/                         # LLM abstractions & prompt manager
│   │   ├── rag/                        # Chunking, embeddings, vector store, retriever
│   │   ├── recommendation/             # Scoring, ranking, candidate retrieval
│   │   ├── memory/                     # Multi-turn conversation & user profile memory
│   │   ├── models/                     # Pydantic domain models
│   │   ├── schemas/                    # Request/Response contracts
│   │   └── services/                   # AI Orchestrator & Finance calculation
├── data/
│   ├── documents/                      # Markdown technical guides & vehicle specs
│   ├── vehicles/                       # vehicles_catalog.json (15 detailed car models)
│   └── guides/                         # Buying guides & checklists
├── scripts/
│   ├── ingest_documents.py             # Knowledge ingestion script
│   ├── build_embeddings.py             # Vector embedding builder
│   └── evaluate_rag.py                 # Automated RAG evaluation benchmark
├── tests/                              # Comprehensive Pytest test suite
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 4. Quick Start & Setup

### Prerequisites
- Python 3.9+ (Python 3.11 recommended)
- Optional: Docker & Docker Compose

### 1. Installation
```bash
# Clone or navigate to the directory
cd c:/Users/POOJITHA/Desktop/CarIQ

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your API keys:
```bash
cp .env.example .env
```

Example `.env` configuration:
```ini
# AI Provider: gemini, openai, ollama, or mock
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
AI_API_KEY=your_gemini_api_key_here

# Local Ollama fallback (optional)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b

# Embedding & Vector Store
EMBEDDING_PROVIDER=tfidf_fast
VECTOR_STORE_TYPE=memory
RAG_TOP_K=5
RAG_CONFIDENCE_THRESHOLD=0.60
```

### 3. Ingest Documents & Build Knowledge Base
```bash
python scripts/ingest_documents.py
python scripts/build_embeddings.py
```

### 4. Run the AI Service
```bash
uvicorn ai_service.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API documentation will be available at: `http://localhost:8000/docs`

---

## 5. Running with Docker Compose

To start the AI service with PostgreSQL (pgvector) and Redis:
```bash
docker compose up --build
```

---

## 6. API Endpoints Reference

### 1. Conversational AI Assistant
**`POST /api/v1/ai/chat`**
```json
{
  "message": "I need an automatic SUV under 15 lakh with high safety.",
  "conversation_id": "optional-session-id"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "CarIQ recommends the Tata Nexon (Fearless Plus DCA) and Maruti Brezza (ZXi Plus AT)...",
    "intent": "car_recommendation",
    "recommendations": [
      {
        "vehicle_id": "tata_nexon",
        "brand": "Tata",
        "model": "Nexon",
        "match_score": 92,
        "reason": "CarIQ recommends the Tata Nexon because it fits your budget of ₹15.0 Lakh, offers the desired DCA automatic gearbox, and features a 5-Star NCAP safety rating.",
        "key_highlights": ["5-star Global NCAP safety rating", "Segment-leading 208mm ground clearance"],
        "potential_tradeoffs": ["3-cylinder engine sound at high RPMs"],
        "specs_summary": {
          "mileage": "17.01 km/l",
          "power": "118 bhp",
          "safety": "5-Star NCAP",
          "transmission": "DCA",
          "fuel": "Petrol"
        }
      }
    ],
    "sources": [
      {
        "document": "nexon_specs_guide.md",
        "section": "Safety & Crash Test Rating",
        "page": 1,
        "relevance_score": 0.88,
        "snippet": "Global NCAP Rating: 5 Stars for Adult Occupant Protection..."
      }
    ],
    "suggested_questions": [
      "Compare top models",
      "Calculate EMI & down payment options",
      "Show fuel-efficient alternatives"
    ],
    "conversation_id": "session-id"
  },
  "meta": {
    "intent": "car_recommendation",
    "confidence": 0.88,
    "provider": "gemini",
    "model": "gemini-1.5-flash"
  }
}
```

### 2. Deterministic Car Recommendations
**`POST /api/v1/ai/recommend`**
```json
{
  "natural_language_query": "Safe family car under 18 lakh with automatic transmission",
  "top_k": 3
}
```

### 3. Car Comparison
**`POST /api/v1/ai/compare`**
```json
{
  "vehicle_ids": ["tata_nexon", "maruti_brezza"]
}
```

### 4. "Why This Car?" AI Explanation
**`POST /api/v1/ai/explain-recommendation`**
```json
{
  "vehicle_id": "tata_nexon",
  "preferences": {
    "budget_max": 1500000,
    "body_type": "SUV",
    "priorities": ["safety", "comfort"]
  }
}
```

### 5. Semantic Car Search
**`POST /api/v1/ai/search`**
```json
{
  "query": "Best fuel efficient hybrid car for daily highway commuting",
  "top_k": 5
}
```

### 6. Slot & Preference Extraction
**`POST /api/v1/ai/extract-preferences`**
```json
{
  "text": "Looking for a 7-seater diesel car under 25 lakh"
}
```

### 7. RAG Knowledge Search & Ingestion
**`POST /api/v1/rag/search`**
```json
{
  "query": "What is the battery warranty on electric vehicles?",
  "top_k": 3
}
```

**`POST /api/v1/rag/ingest`**
```json
{
  "force_reindex": true
}
```

### 8. System Health
**`GET /api/v1/health`**

---

## 7. Running Tests & Automated Evaluation

### Run Pytest Test Suite
```bash
pytest -v tests/
```

### Run RAG Automated Benchmark
```bash
python scripts/evaluate_rag.py
```

---

## 8. Frontend Integration (React + MUI)

The structured JSON response is optimized for direct consumption by React + MUI components:
- **`data.answer`** → AI Chat Bubble (`Typography`, Markdown renderer)
- **`data.recommendations`** → Recommended Vehicle Cards (`Card`, `Chip` for Match Score, `LinearProgress` for factor bars)
- **`data.sources`** → Citations Accordion (`Accordion`, `Chip` for source document)
- **`data.suggested_questions`** → Follow-up Action Chips (`Chip` with `onClick`)
