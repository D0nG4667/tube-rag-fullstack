# TubeRAG Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete TubeRAG SaaS platform, from monorepo configuration and FastAPI/Supabase/QStash background pipelines to the Next.js frontend with 3D WebGL animations and timeline deep-linking.

**Architecture:** Monorepo containing `/frontend` and `/backend`. Frontend uses Next.js 16 (App Router), shadcn/ui, and React Three Fiber. Backend uses FastAPI, pgvector, and Upstash QStash to execute a cursor-based chunking state machine.

**Tech Stack:** Next.js 16, React Three Fiber, Tailwind CSS, Biome, FastAPI, Ruff, Supabase (pgvector), Upstash QStash, google-genai.

## Global Constraints
- Monorepo Architecture: Initialize a strict monorepo containing two distinct root directories: `/frontend` and `/backend`.
- UI Framework (in `/frontend`): Next.js 16 (App Router with Turbopack), Tailwind CSS, and shadcn/ui.
- WebGL & Animation: React Three Fiber, @react-three/drei, Framer Motion, and GSAP.
- Backend Architecture (in `/backend`): FastAPI (Python) optimized for FastAPI Cloud, Supabase (pgvector), and Upstash QStash.
- Serverless Compliance: Native FastAPI BackgroundTasks, Celery, and Redis are forbidden. Rely entirely on QStash.
- Dependency Isolation: pnpm for frontend (`package.json`, `pnpm-lock.yaml`, `biome.json`), uv for backend (`pyproject.toml`, `uv.lock`, `ruff.toml`).
- Formatters: Biome (frontend), Ruff (backend) configured via Husky & lint-staged pre-commit hooks.

---

### Task 1: Monorepo Project Setup & Tooling Configuration

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml` (root)
- Create: `frontend/package.json`
- Create: `frontend/biome.json`
- Create: `backend/pyproject.toml`
- Create: `backend/ruff.toml`
- Create: `.husky/pre-commit`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: Project root setup, husky workspace hooks, and unified formatting rules for frontend (Biome) and backend (Ruff).

- [ ] **Step 1: Write root package.json and pnpm-workspace.yaml**

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'frontend'
```

Create `package.json`:
```json
{
  "name": "tube-rag-root",
  "private": true,
  "scripts": {
    "prepare": "husky install",
    "lint:frontend": "pnpm --filter frontend lint",
    "format:frontend": "pnpm --filter frontend format",
    "lint:backend": "ruff check backend/",
    "format:backend": "ruff format backend/"
  },
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  }
}
```

- [ ] **Step 2: Initialize directories and Husky hooks**

Run commands:
```bash
mkdir frontend
mkdir backend
npx husky install
```

Create `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```
Ensure it has executable permissions.

Create `lint-staged.config.js` in root:
```javascript
module.exports = {
  'frontend/**/*.{js,ts,tsx,json}': [
    'pnpm --filter frontend biome check --write --no-errors-on-unmatched'
  ],
  'backend/**/*.py': [
    'ruff check --fix',
    'ruff format'
  ]
};
```

- [ ] **Step 3: Create frontend Biome configuration**

Create `frontend/biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

- [ ] **Step 4: Create backend Ruff configuration**

Create `backend/ruff.toml`:
```toml
line-length = 88
target-version = "py311"

[lint]
select = ["E", "F", "I", "N", "UP", "B", "C4"]
ignore = []

[format]
quote-style = "double"
indent-style = "space"
```

- [ ] **Step 5: Create Github Action CI Workflow**

Create `.github/workflows/ci.yml`:
```yaml
name: CI Suite

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9.0.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - name: Install Node packages
        run: pnpm install --frozen-lockfile
      - name: Lint Frontend
        run: pnpm lint:frontend
      - uses: astral-sh/setup-uv@v3
        with:
          python-version: "3.11"
      - name: Check Backend formatting
        run: |
          uv pip install ruff
          ruff check backend/
          ruff format --check backend/
```

- [ ] **Step 6: Commit**

Run:
```bash
git add .
git commit -m "chore: setup monorepo structure, husky, biome, ruff, and CI workflow"
```

---

### Task 2: Database Schema & Supabase Vector Index Migration

**Files:**
- Create: `backend/migrations/01_init_schema.sql`
- Create: `backend/scripts/run_migrations.py`

**Interfaces:**
- Produces: SQLite/Postgres schemas and dynamic helper function `hybrid_search` in the database.

- [ ] **Step 1: Write migration SQL file**

Create `backend/migrations/01_init_schema.sql` containing the PostgreSQL table schema from the spec. (Must execute exactly the migration shown in Section 2 of `2026-06-29-tuberag-design.md`, including `pgvector` activation and `hybrid_search` RRF function).

- [ ] **Step 2: Write Python migration runner**

Create `backend/scripts/run_migrations.py`:
```python
import os
import psycopg2

def run():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL is not set.")
        return
    conn = psycopg2.connect(db_url)
    with conn.cursor() as cur:
        with open("migrations/01_init_schema.sql", "r") as f:
            cur.execute(f.read())
    conn.commit()
    conn.close()
    print("Migration executed successfully.")

if __name__ == "__main__":
    run()
```

- [ ] **Step 3: Test and run migrations**

Set `DATABASE_URL` environment variable to your Supabase connection string and execute:
Run: `python scripts/run_migrations.py`
Expected: Output "Migration executed successfully."

- [ ] **Step 4: Commit**

Run:
```bash
git add backend/migrations/ backend/scripts/
git commit -m "db: create tables, vector schemas, and rrf hybrid search function"
```

---

### Task 3: Backend Ingestion Stage 1 (URL Ingest & QStash Routing)

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/api/v1/ingest.py`
- Create: `backend/app/core/config.py`
- Create: `backend/tests/test_ingest.py`

**Interfaces:**
- Consumes: Database schema from Task 2.
- Produces: API route `POST /api/v1/ingest` and config values.

- [ ] **Step 1: Write backend configurations**

Create `backend/app/core/config.py`:
```python
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    QSTASH_TOKEN: str = os.getenv("QSTASH_TOKEN", "")
    QSTASH_CURRENT_SIGNING_KEY: str = os.getenv("QSTASH_CURRENT_SIGNING_KEY", "")
    QSTASH_NEXT_SIGNING_KEY: str = os.getenv("QSTASH_NEXT_SIGNING_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

settings = Settings()
```

- [ ] **Step 2: Write main FastAPI router and Ingest API endpoint**

Create `backend/app/api/v1/ingest.py`:
```python
import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from qstash import Client as QStashClient
from supabase import create_client, Client as SupabaseClient
from app.core.config import settings

router = APIRouter()

class IngestRequest(BaseModel):
    url: str

def get_supabase() -> SupabaseClient:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def extract_youtube_id(url: str) -> str:
    pattern = r"(?:v=|\/embed\/|\/10\/|\/vi\/|youtu\.be\/|\/v\/|\/e\/|watch\?v=)([^#\&\?]*)"
    match = re.search(pattern, url)
    if match and len(match.group(1)) == 11:
        return match.group(1)
    raise ValueError("Invalid YouTube URL")

@router.post("/api/v1/ingest", status_code=202)
def ingest_video(req: IngestRequest, db: SupabaseClient = Depends(get_supabase)):
    try:
        yt_id = extract_youtube_id(req.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Store video record
    res = db.table("videos").select("*").eq("youtube_id", yt_id).execute()
    if res.data:
        video = res.data[0]
    else:
        video_data = {
            "youtube_id": yt_id,
            "title": f"YouTube Video {yt_id}",
            "status": "pending",
            "current_offset": 0.0
        }
        ins_res = db.table("videos").insert(video_data).execute()
        video = ins_res.data[0]

    # Publish to QStash
    if settings.QSTASH_TOKEN:
        q_client = QStashClient(token=settings.QSTASH_TOKEN)
        q_client.publish_json(
            url=f"{settings.BACKEND_URL}/api/v1/internal/process-video",
            body={
                "video_id": video["id"],
                "step": "transcribe",
                "offset": 0.0
            }
        )
    return {"video_id": video["id"], "status": video["status"]}
```

Initialize `backend/app/main.py`:
```python
from fastapi import FastAPI
from app.api.v1.ingest import router as ingest_router

app = FastAPI(title="TubeRAG Backend")
app.include_router(ingest_router)
```

- [ ] **Step 3: Write tests for URL Ingestion**

Create `backend/tests/test_ingest.py`:
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_extract_youtube_id():
    from app.api.v1.ingest import extract_youtube_id
    assert extract_youtube_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ") == "dQw4w9WgXcQ"

def test_ingest_bad_url():
    response = client.post("/api/v1/ingest", json={"url": "bad_url"})
    assert response.status_code == 400
```

- [ ] **Step 4: Execute tests**

Run: `pytest backend/tests/test_ingest.py`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add backend/app/ backend/tests/
git commit -m "feat: implement public ingestion route and tests"
```

---

### Task 4: Backend Ingestion Stage 2 (Transcription Process & Fallbacks)

**Files:**
- Create: `backend/app/services/transcription.py`
- Create: `backend/app/api/v1/webhook.py`
- Create: `backend/tests/test_transcription.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: QStash payload webhook calls from Task 3.
- Produces: Internal process API and transcription worker utilities.

- [ ] **Step 1: Write transcript buffer chunker and transcription service**

Create `backend/app/services/transcription.py`:
```python
import os
import subprocess
from youtube_transcript_api import YouTubeTranscriptApi
from google import genai
from google.genai import types
from app.core.config import settings

def time_aware_chunker(transcript_items, max_chars=800, max_gap=3.0):
    chunks = []
    current_chunk = []
    current_length = 0

    for i, item in enumerate(transcript_items):
        text = item["text"]
        start = item["start"]
        duration = item.get("duration", 0.0)
        end = start + duration

        if not current_chunk:
            current_chunk.append(item)
            current_length = len(text)
            continue

        prev_item = current_chunk[-1]
        prev_end = prev_item["start"] + prev_item.get("duration", 0.0)
        gap = start - prev_end

        if current_length + len(text) > max_chars or gap > max_gap:
            # Emit chunk
            chunk_text = " ".join([x["text"] for x in current_chunk])
            chunks.append({
                "content": chunk_text,
                "start_time": current_chunk[0]["start"],
                "end_time": current_chunk[-1]["start"] + current_chunk[-1].get("duration", 0.0)
            })
            current_chunk = [item]
            current_length = len(text)
        else:
            current_chunk.append(item)
            current_length += len(text)

    if current_chunk:
        chunk_text = " ".join([x["text"] for x in current_chunk])
        chunks.append({
            "content": chunk_text,
            "start_time": current_chunk[0]["start"],
            "end_time": current_chunk[-1]["start"] + current_chunk[-1].get("duration", 0.0)
        })
    return chunks

def download_audio_segment(url: str, start_sec: float, end_sec: float, out_path: str):
    start_str = f"{int(start_sec)//3600:02d}:{int(start_sec)%3600//60:02d}:{int(start_sec)%60:02d}"
    end_str = f"{int(end_sec)//3600:02d}:{int(end_sec)%3600//60:02d}:{int(end_sec)%60:02d}"
    cmd = [
        "yt-dlp",
        "-f", "bestaudio[ext=m4a]",
        "--download-sections", f"*{start_str}-{end_str}",
        "-o", out_path,
        url
    ]
    subprocess.run(cmd, check=True)

def transcribe_audio_with_gemini(audio_path: str) -> str:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    file_ref = client.files.upload(file=audio_path)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=["Transcribe this audio block with timestamps in format [MM:SS] text", file_ref]
    )
    client.files.delete(name=file_ref.name)
    return response.text
```

- [ ] **Step 2: Implement QStash webhook endpoint**

Create `backend/app/api/v1/webhook.py`:
```python
from fastapi import APIRouter, Header, HTTPException, Request, Depends
from supabase import create_client, Client as SupabaseClient
from google import genai
from qstash.receiver import Receiver
from app.core.config import settings
from app.services.transcription import time_aware_chunker, download_audio_segment, transcribe_audio_with_gemini

router = APIRouter()
db = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
receiver = Receiver(
    current_signing_key=settings.QSTASH_CURRENT_SIGNING_KEY,
    next_signing_key=settings.QSTASH_NEXT_SIGNING_KEY
)

async def verify_qstash_signature(request: Request, signature: str = Header(None)):
    if not signature:
        raise HTTPException(status_code=401, detail="Signature missing")
    body = await request.body()
    is_valid = receiver.verify(
        signature=signature,
        body=body.decode("utf-8")
    )
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid signature")

@router.post("/api/v1/internal/process-video")
async def process_video_webhook(req_data: dict, request: Request, sig_verify = Depends(verify_qstash_signature)):
    video_id = req_data.get("video_id")
    step = req_data.get("step")
    offset = req_data.get("offset", 0.0)

    # Fetch video record
    res = db.table("videos").select("*").eq("id", video_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Video not found")
    video = res.data[0]
    yt_url = f"https://www.youtube.com/watch?v={video['youtube_id']}"

    if step == "transcribe":
        # Check native transcript
        try:
            raw_items = YouTubeTranscriptApi.get_transcript(video["youtube_id"])
            chunks = time_aware_chunker(raw_items)
            
            # Embed & store
            gem_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            for ch in chunks:
                emb_res = gem_client.models.embed_content(
                    model="text-embedding-004",
                    contents=ch["content"]
                )
                embedding = emb_res.embeddings[0].values
                db.table("video_chunks").insert({
                    "video_id": video_id,
                    "content": ch["content"],
                    "embedding": embedding,
                    "start_time": ch["start_time"],
                    "end_time": ch["end_time"],
                    "chunk_type": "transcript"
                }).execute()
            
            db.table("videos").update({"status": "processing_frames", "current_offset": 0.0}).eq("id", video_id).execute()
        except Exception:
            # Fallback to Gemini transcription
            # Process current 10 min window
            tmp_audio = f"/tmp/audio_{video_id}_{offset}.m4a"
            download_audio_segment(yt_url, offset, offset + 600.0, tmp_audio)
            transcript_text = transcribe_audio_with_gemini(tmp_audio)
            
            # Generate Embedding
            gem_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            emb_res = gem_client.models.embed_content(
                model="text-embedding-004",
                contents=transcript_text
            )
            embedding = emb_res.embeddings[0].values
            db.table("video_chunks").insert({
                "video_id": video_id,
                "content": transcript_text,
                "embedding": embedding,
                "start_time": offset,
                "end_time": offset + 600.0,
                "chunk_type": "transcript"
            }).execute()
            
            # Clean local files
            if os.path.exists(tmp_audio):
                os.remove(tmp_audio)
            
            # Schedule next or move to frames
            # Assume 3600 seconds as threshold for testing - in production check duration
            duration = video.get("duration", 3600.0) 
            if offset + 600.0 < duration:
                # Next segment
                # Call QStash client to publish next transcribe segment
                pass
            else:
                db.table("videos").update({"status": "processing_frames", "current_offset": 0.0}).eq("id", video_id).execute()
                
    return {"status": "ok"}
```

Include it in `backend/app/main.py`:
```python
from app.api.v1.webhook import router as webhook_router
app.include_router(webhook_router)
```

- [ ] **Step 3: Test chunker logic**

Create `backend/tests/test_transcription.py`:
```python
from app.services.transcription import time_aware_chunker

def test_time_aware_chunker():
    items = [
        {"text": "Hello world", "start": 0.0, "duration": 1.0},
        {"text": "This is a sentence", "start": 2.0, "duration": 1.5},
        {"text": "A delayed text", "start": 10.0, "duration": 2.0} # Gap of 6.5s
    ]
    chunks = time_aware_chunker(items, max_chars=800, max_gap=3.0)
    assert len(chunks) == 2
    assert chunks[0]["content"] == "Hello world This is a sentence"
    assert chunks[1]["content"] == "A delayed text"
```

- [ ] **Step 4: Execute tests**

Run: `pytest backend/tests/test_transcription.py`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add backend/app/ backend/tests/
git commit -m "feat: implement transcription parser and QStash webhook endpoints"
```

---

### Task 5: Backend Ingestion Stage 3 (Frame Extraction, Deduplication & Vision)

**Files:**
- Create: `backend/app/services/frame_extractor.py`
- Modify: `backend/app/api/v1/webhook.py`
- Create: `backend/tests/test_frames.py`

**Interfaces:**
- Consumes: Database schema and files bucket configs.
- Produces: OpenCV deduplication functions and Pydantic JSON vision analyzer.

- [ ] **Step 1: Write Frame Extractor and SSIM Deduplicator**

Create `backend/app/services/frame_extractor.py`:
```python
import cv2
import numpy as np
from PIL import Image
from pydantic import BaseModel, Field
from typing import List, Optional
from google import genai
from google.genai import types
from app.core.config import settings

class SlideAnalysis(BaseModel):
    slide_title: Optional[str] = Field(None, description="The main title or header visible on the slide")
    ocr_text: str = Field(..., description="All text visible on the slide, transcribed exactly")
    code_snippets: List[str] = Field(..., description="Any programming code blocks extracted from the screen")
    visual_description: str = Field(..., description="Detailed description of any charts, diagrams, or images shown")
    contains_new_content: bool = Field(..., description="True if this contains a new slide template or distinct layout")

def calculate_ssim(img1: np.ndarray, img2: np.ndarray) -> float:
    # Quick structural similarity metric via mean square delta
    # Downsample and gray scale
    g1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    g2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
    g1 = cv2.resize(g1, (64, 64))
    g2 = cv2.resize(g2, (64, 64))
    err = np.sum((g1.astype("float") - g2.astype("float")) ** 2)
    err /= float(g1.shape[0] * g1.shape[1])
    # Convert error to a similarity score (0.0 to 1.0)
    sim = 1.0 / (1.0 + err / 1000.0)
    return sim

def analyze_frame_with_gemini(frame_bytes: bytes) -> SlideAnalysis:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=frame_bytes, mime_type="image/webp"),
            "Analyze this video frame and extract slide metrics."
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=SlideAnalysis,
        ),
    )
    return SlideAnalysis.model_validate_json(response.text)
```

- [ ] **Step 2: Update webhook processing logic to handle `frame_sampling`**

Modify `backend/app/api/v1/webhook.py` to add frame extraction, SSIM deduplication, WebP compression, Supabase Storage uploads, and vector inserts in the `frame_sampling` branch of the webhook handler.

- [ ] **Step 3: Write tests for SSIM calculation**

Create `backend/tests/test_frames.py`:
```python
import numpy as np
from app.services.frame_extractor import calculate_ssim

def test_calculate_ssim():
    img1 = np.ones((100, 100, 3), dtype=np.uint8) * 255
    img2 = np.ones((100, 100, 3), dtype=np.uint8) * 255
    img3 = np.zeros((100, 100, 3), dtype=np.uint8)
    
    assert calculate_ssim(img1, img2) == 1.0
    assert calculate_ssim(img1, img3) < 0.5
```

- [ ] **Step 4: Execute tests**

Run: `pytest backend/tests/test_frames.py`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add backend/app/services/frame_extractor.py backend/tests/test_frames.py
git commit -m "feat: implement frame sampling, SSIM deduplication, and structured slide analyser"
```

---

### Task 6: Backend RAG Chat & Retrieval API

**Files:**
- Create: `backend/app/api/v1/chat.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_chat.py`

**Interfaces:**
- Consumes: Database schema and query models.
- Produces: API route `POST /api/v1/chat`.

- [ ] **Step 1: Write HyDE query expansion and Hybrid Search caller**

Create `backend/app/api/v1/chat.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from google import genai
from supabase import create_client, Client as SupabaseClient
from app.core.config import settings

router = APIRouter()
db = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class ChatRequest(BaseModel):
    video_id: str
    message: str

def generate_hyde_paragraph(query: str) -> str:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    res = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[f"Write a short paragraph answering this question based on technical programming slides: {query}"]
    )
    return res.text

@router.post("/api/v1/chat")
def run_chat_rag(req: ChatRequest):
    # 1. Generate HyDE
    hyde_text = generate_hyde_paragraph(req.message)
    
    # 2. Embed HyDE
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    emb_res = client.models.embed_content(
        model="text-embedding-004",
        contents=hyde_text
    )
    query_embedding = emb_res.embeddings[0].values

    # 3. Query Hybrid Search RRF function
    res = db.rpc("hybrid_search", {
        "query_text": req.message,
        "query_embedding": query_embedding,
        "target_video_id": req.video_id,
        "match_count": 5
    }).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="No matching video segments found")

    # Format context
    formatted_context = ""
    for idx, item in enumerate(res.data):
        formatted_context += f"Chunk [{idx}]: type={item['chunk_type']}, start={item['start_time']}, end={item['end_time']}\nContent: {item['content']}\n\n"

    # 4. Generate grounded response with citations
    rag_prompt = f"""You are TubeRAG, an elite technical assistant. Answer the user's query using only the provided video contexts.
For each statement, you MUST cite your source by appending a markdown citation link.

Context Chunks:
{formatted_context}

User Query: {req.message}

Formatting Rules:
- If citing transcript: use `[Transcript @ MM:SS](cite:transcript:seconds)` (replace seconds with integer value)
- If citing a visual frame: use `[Slide @ MM:SS](cite:slide:seconds)` (replace seconds with integer value)
- Do not make statements not directly supported by the context chunks.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[rag_prompt]
    )

    return {"response": response.text, "sources": res.data}
```

Include it in `backend/app/main.py`:
```python
from app.api.v1.chat import router as chat_router
app.include_router(chat_router)
```

- [ ] **Step 2: Test API Chat Route**

Create `backend/tests/test_chat.py` to verify request/response bindings and mock Gemini LLM responses.

- [ ] **Step 3: Execute tests**

Run: `pytest backend/tests/test_chat.py`
Expected: PASS

- [ ] **Step 4: Commit**

Run:
```bash
git add backend/app/api/v1/chat.py
git commit -m "feat: implement HyDE vector lookup, RRF retrieval, and citation RAG endpoint"
```

---

### Task 7: Frontend Page Layout & Control Drawer Component

**Files:**
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/components/ControlDrawer.tsx`
- Modify: `frontend/src/app/layout.tsx`

**Interfaces:**
- Consumes: Tailwind theme and Biome configurations.
- Produces: Layout, folder tree navigation, and video item listings.

- [ ] **Step 1: Write control drawer component**

Create `frontend/src/components/ControlDrawer.tsx` rendering collapsible playlist accordion items, search input for video nodes, and buttons to toggle folders.

- [ ] **Step 2: Scaffold main dashboard structure**

Update `frontend/src/app/page.tsx` to mount the layout containing:
- Collapsible `ControlDrawer` on the left.
- Main core area split into player container and chat container.
- Glassmorphic style classes (`backdrop-blur-md bg-zinc-950/40 border border-zinc-800/50`).

- [ ] **Step 3: Run Biome formatter checks**

Run: `pnpm --filter frontend biome check --write src/`
Expected: Formatting completed without errors.

- [ ] **Step 4: Commit**

Run:
```bash
git add frontend/src/
git commit -m "feat: create collapsible dashboard panel layouts and drawer components"
```

---

### Task 8: Frontend WebGL Matrix Canvas & Realtime Lighting

**Files:**
- Create: `frontend/src/components/MatrixCanvas.tsx`
- Modify: `frontend/src/app/page.tsx`

**Interfaces:**
- Consumes: Supabase client listener events.
- Produces: Canvas backdrop mapping neon particles.

- [ ] **Step 1: Create React Three Fiber particle component**

Create `frontend/src/components/MatrixCanvas.tsx` rendering an isolated Three.js canvas utilizing `frameloop="demand"`. Initialize a floating particles geometry representing semantic data nodes. Include dynamic color values that interpolates from neon-purple (`#7c3aed`) to active cyan (`#06b6d4`).

- [ ] **Step 2: Bind Supabase Realtime update event**

Add a `useEffect` Hook inside the parent workspace listener subscribing to Supabase changes on the `videos` table and modifying the state parameters of the WebGL mesh.

- [ ] **Step 3: Commit**

Run:
```bash
git add frontend/src/components/MatrixCanvas.tsx
git commit -m "feat: implement isolated R3F WebGL particle canvas and Supabase Realtime connection"
```

---

### Task 9: Frontend Video Player & Interactive Citation Badges

**Files:**
- Create: `frontend/src/components/VideoPlayer.tsx`
- Create: `frontend/src/components/ChatPanel.tsx`

**Interfaces:**
- Consumes: Chat API response data from Task 6.
- Produces: Unified deep-linking experience.

- [ ] **Step 1: Implement VideoPlayer with react-player**

Create `frontend/src/components/VideoPlayer.tsx` exporting a forwarded reference ref exposing `seekTo` parameters.

- [ ] **Step 2: Implement ChatPanel and citation badge actions**

Create `frontend/src/components/ChatPanel.tsx` receiving LLM text and parsing citation patterns (`cite:transcript:sec`, `cite:slide:sec`). Format these matches into custom interactive Badges. Clicking standard badges invokes player seeks. Clicking slide-based badges triggers a hover overlay containing the slide WebP thumbnail path.

- [ ] **Step 3: Verify the entire app build**

Run: `pnpm build`
Expected: Successful compile.

- [ ] **Step 4: Commit**

Run:
```bash
git add frontend/src/components/
git commit -m "feat: implement react-player viewport, deep-linked citation badges, and build validations"
```
