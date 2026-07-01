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
2. **Hybrid Search RPC (RRF with Materialized CTEs):**
   * Uses Reciprocal Rank Fusion (RRF) to combine vector match scores (using Gemini embeddings) with keyword-based Full-Text Search (FTS) queries inside Supabase.
   * **Recall Optimization:** The database function utilizes a `MATERIALIZED` CTE to filter down to the target video's chunks *before* sorting by cosine distance. This bypasses pgvector's HNSW pre-filtering recall trap, guaranteeing 100% search recall (perfect timestamp citations) while maintaining sub-millisecond query latencies.
3. **Optimized prompt engineering:**
   * Includes HyDE (Hypothetical Document Embeddings) to expand keyword queries.
   * Prompts enforce strict fact grounding and structured markdown syntax.

---

## Database Migrations & Boot Execution

To ensure seamless serverless deployments (such as FastAPI Cloud), the database schema is managed via **Alembic in Raw SQL mode** and updated automatically on boot:

1. **Lifespan Boot Executor:** During FastAPI startup, the `lifespan` handler executes [run_migrations.py](file:///c:/Users/hp/Desktop/gab/git%20projects/tube-rag-fullstack/backend/scripts/run_migrations.py).
2. **Programmatic Alembic Upgrade:** The migration runner calls Alembic's programmatic API `command.upgrade(alembic_cfg, "head")` to apply any new versioned python migration scripts under `alembic_migrations/versions/`.
3. **Database Tracking:** Alembic automatically tracks executed migrations in an `alembic_version` table inside Supabase, preventing duplicate runs and supporting standard database rollbacks.
4. **Automatic Safety Backups:** Before any migration is run online (both upgrade and downgrade), Alembic automatically dumps the current state of `videos`, `playlists`, `playlist_videos`, and `video_chunks` into a timestamped JSON file located under `backend/migrations_backups/`.
5. **Restoring from Backups:** To restore the database tables and computed embeddings from the latest JSON backup file:
   ```bash
   uv run python -m scripts.restore_from_backup
   ```
   Or restore a specific backup file:
   ```bash
   uv run python -m scripts.restore_from_backup --file migrations_backups/backup_20260701_053000.json
   ```
6. **Creating new migrations:** To create a new incremental database change:
   ```bash
   uv run alembic revision -m "add_my_new_column"
   ```
   Open the generated python file under `alembic_migrations/versions/` and add your raw DDL statements inside `op.execute()` in the `upgrade()` and `downgrade()` functions.

---

## Environment Variables

Create `.env` inside the `backend/` root folder:
```env
# Application Settings
ENVIRONMENT=local
BACKEND_URL=http://localhost:9000
ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://tube-rag.gabcares.xyz

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

## Hybrid Search (RRF) Formulation

Reciprocal Rank Fusion (RRF) combines rankings from different search systems without requiring raw score normalization:

$$RRF\_Score(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$

Where:
* $M$ is the set of retrieval modules (Vector distance and GIN Full-Text Search).
* $r_m(d)$ is the 1-indexed rank of chunk $d$ in the retrieval module $m$.
* $k$ is a constant (set to $60$) that prevents top-ranked items from overly dominating the final fusion order.

---

## Getting Started

1. **Initialize virtual environment & install packages:**
   ```bash
   uv sync
   ```

2. **Run migrations (Manual):**
   ```bash
   uv run python -m scripts.run_migrations
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
