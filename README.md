# TubeRAG Monorepo

TubeRAG is a production-ready, slide-aware AI video search and chat copilot application. It combines a high-fidelity 3D visual interface (inspired by Emergent.sh and Apple's premium interactive shells) with an advanced serverless FastAPI retrieval-augmented generation (RAG) backend utilizing Supabase pgvector and Upstash QStash.

---

## Workspace Architecture

```mermaid
graph TD
    User["Client Browser"]
    FE["/frontend (Next.js 16 App Router)"]
    BE["/backend (FastAPI Cloud)"]
    DB["Supabase pgvector DB"]
    QS["Upstash QStash (Serverless Queue)"]

    User <-->|WebGL / HTML UI| FE
    FE <-->|REST / Chat RAG APIs| BE
    BE <-->|pgvector retrieval & storage| DB
    BE <-->|QStash Webhooks (Production)| QS
    BE <-->|Local BackgroundTasks (Local Dev)| BE
```

The codebase is organized as a monorepo containing two distinct root packages:
* **`/frontend`**: Implements the premium WebGL and DOM layering client app. Powered by React Three Fiber, GSAP, Tailwind CSS, and shadcn/ui.
* **`/backend`**: Implements the serverless API layer. Powered by FastAPI, Supabase pgvector, and Upstash QStash.

---

## Core Features

1. **Apple-Style 3D Parallax Canvas:** The background renders a 3D semantic node matrix that tilts and orbits dynamically in response to mouse movement and performs smooth GSAP focus zoom transitions when selecting video items.
2. **Auto-Routing Ingestion Queue:** Locally bypasses external QStash loopback limits by falling back to FastAPI's asynchronous `BackgroundTasks` thread executor, while executing standard serverless queued webhooks in production.
3. **Advanced Retrieval-Augmented Generation (RAG):**
   * Generates a hypothetical technical answer (HyDE query expansion) using Gemini.
   * Performs hybrid semantic/full-text search against pgvector.
   * Feeds matching transcript contexts and slide frame images to Gemini to generate answers with interactive playback citation badges.

---

## Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [pnpm](https://pnpm.io/)
* [Python 3.12](https://www.python.org/)
* [uv](https://github.com/astral-sh/uv) (recommended Python package installer)
* [FFmpeg](https://ffmpeg.org/) (required on PATH for local audio extraction fallback, if `yt-dlp` is used)

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd tube-rag-fullstack
   ```

2. **Setup Backend Environment:**
   Refer to [backend/README.md](backend/README.md) for details.
   ```bash
   cd backend
   uv venv
   # Install dependencies
   uv sync
   # Copy environment variables
   cp .env.example .env
   ```

3. **Setup Frontend Environment:**
   Refer to [frontend/README.md](frontend/README.md) for details.
   ```bash
   cd ../frontend
   pnpm install
   # Copy environment variables
   cp .env.example .env.local
   ```

---

## License
Licensed under the [MIT License](LICENSE).
