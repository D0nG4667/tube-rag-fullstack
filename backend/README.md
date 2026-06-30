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

# Supadata API Key (Platform fallback for reliable transcript extraction)
# SUPADATA_API_KEY=your-supadata-api-key

# Optional YouTube Proxy (Residential / Scraper proxy to bypass blocks)
# YOUTUBE_PROXY=http://user:pass@proxy.example.com:8080
```

---

## The Ingestion Pipeline & Fallbacks

To bypass YouTube's aggressive IP blocks in serverless cloud environments (like FastAPI Cloud), TubeRAG implements a **three-tiered ingestion strategy** for transcription:

1. **Tier 1 (Native Scraper):** Tries to fetch transcripts directly from YouTube for free. Supports configuring `YOUTUBE_PROXY` to route requests through residential proxies.
2. **Tier 2 (Supadata API Fallback):** If Tier 1 fails and `SUPADATA_API_KEY` is configured, it queries the Supadata API to scrape the transcript.
3. **Tier 3 (Local Audio Extraction):** If both fail, it fallback to extracting 10-minute audio chunks using `yt-dlp` (respecting `YOUTUBE_PROXY` if set) and transcribing them via the Gemini Multimodal API.

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
