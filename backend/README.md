# TubeRAG Backend API

A high-performance FastAPI server optimized for serverless deployments (such as FastAPI Cloud) running parallel video ingestion pipelines and chat RAG services.

---

## Technical Stack

* **API Engine:** FastAPI (Python 3.12+)
* **Database & Vector Engine:** Supabase (pgvector & RPC hybrid search matchers)
* **Message Queue & Hook Trigger:** Upstash QStash (Serverless HTTP Queue)
* **Transcription Fallback:** OpenAI Whisper API / Gemini Multimodal API

---

## Core Capabilities

1. **Auto-Routing local queues:**
   * Automatically bypasses external QStash loopback limits by detecting the local environment settings (`ENVIRONMENT=local`).
   * Fallbacks to FastAPI's async `BackgroundTasks` thread executor to run multi-stage transcribing and frame processing locally.
2. **Hybrid Search RPC (RRF):**
   * Uses Reciprocal Rank Fusion (RRF) to combine vector match scores (using Gemini embeddings) with Full-Text search queries inside Supabase.
3. **Optimized prompt engineering:**
   * Includes HyDE (Hypothetical Document Embeddings) to expand keyword queries.
   * Prompts enforce strict fact grounding and structured markdown syntax.

---

## Environment Variables

Create `.env` inside the `backend/` root folder:
```env
# Application Settings
ENVIRONMENT=local
BACKEND_URL=http://localhost:9000

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
DATABASE_URL=postgresql://postgres:password@db-host:5432/postgres

# Upstash QStash Serverless Credentials
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key
QSTASH_NEXT_SIGNING_KEY=your-signing-key

# Gemini API Key (Gemini 2.5 Flash / Embeddings)
GEMINI_API_KEY=your-gemini-key
```

---

## Getting Started

1. **Initialize virtual environment & install packages:**
   ```bash
   uv sync
   ```

2. **Run migrations:**
   ```bash
   uv run python scripts/run_migrations.py
   ```

3. **Start local API server:**
   ```bash
   uv run uvicorn app.main:app --host 127.0.0.1 --port 9000 --reload
   ```

4. **Verify unit test suite:**
   ```bash
   uv run pytest
   ```

5. **Format and lint checks:**
   ```bash
   uv run ruff check .
   uv run ruff format .
   ```
