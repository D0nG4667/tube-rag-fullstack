You are a world-class Full-Stack Solutions Architect and Elite Creative Technologist operating within the Antigravity Superpowers framework. Build a production-ready application called "TubeRAG", designed with the high-fidelity 3D visual language of Emergent.sh integrated into a hyper-clean, professional SaaS structure.

CRITICAL STACK, MONOREPO & ENVIRONMENT SPECIFICATIONS:
- Monorepo Architecture: Initialize a strict monorepo containing two distinct root directories: `/frontend` and `/backend`.
- UI Framework (in `/frontend`): Next.js 16 (App Router with Turbopack), Tailwind CSS, and shadcn/ui.
- WebGL & Animation: React Three Fiber, @react-three/drei (React 19 compatible), Framer Motion, and GSAP.
- Backend Architecture (in `/backend`): FastAPI (Python) optimized for FastAPI Cloud, Supabase (pgvector), and Upstash QStash (Serverless HTTP Message Queue).
- Agentic Tooling: 
  1. Use Context 7 MCP to mount local environment data, read architectural specs, and analyze semantic datasets. 
  2. Use Stitch MCP to inject optimized UI component definitions.

VISUAL ART DIRECTION & 3D ENVIRONMENT LAYER (The Emergent.sh Vibe):
1. Background Spatial Layer: Implement a fixed, full-screen background Three.js <Canvas> spanning behind all UI elements. It must render an abstract, floating 3D matrix composed of interconnected particle nodes representing semantic video data fragments.
2. WebGL Lighting: Use a high-contrast palette with soft point lights that shift subtly when an ingestion job transitions from the QStash queue to active state.
3. DOM Layering: All structural panels must float above the canvas using glassmorphism. Apply 'backdrop-blur-md bg-zinc-950/40 border border-zinc-800/50' globally across all generated shadcn/ui components.

COMPLEX WORKSPACE LAYOUT (3-Column Desktop Console):
- Column A (Left Control Drawer): Collapsible panel presenting workspace folders, playlist aggregations, search filters, and individual historical video nodes with status rings and confirm-to-delete flows.
- Column B (Center Viewport): Split into a video viewport container utilizing `react-player` and a persistent, agentic chat module. Includes fullscreen drag overlay interceptors to enable smooth panel resizing next to iframes.
- Column C (Right StudyStudio): Collapsible panel containing presentation outlines, alternating voice podcasts, and concept mindmaps.
- Deep-Link Experience: LLM results must extract precise `start_time` metadata. Citations must render as interactive shadcn Badges. Clicking a badge must directly trigger the `seekTo()` method on the browser player instance to adjust playback position instantly.

SECURITY & BYOK CLIENT CRYPTOGRAPHY:
- Enforce client-side API key protection using Web Crypto APIs (AES-GCM, PBKDF2) to encrypt user Gemini API keys with passphrases.
- Encrypted keys are persisted in `localStorage` and decrypted in-memory only.
- Unlocked keys are propagated to backend services via custom `X-Gemini-API-Key` headers on demand.

STUDIO PODCASTS & SVG CONCEPT MINDMAPS:
1. Podcast Player: Alternates TTS speakers utilizing Gemini 3.1 Flash TTS Preview script synthesis (`gemini-3.1-flash-tts-preview`) with a stabilized fallback to Gemini 2.5 Flash TTS Preview (`gemini-2.5-flash-preview-tts`), supported by client-side SpeechSynthesis voice mapping.
2. SVG Concept Mindmap: Generates and connects topics dynamically using glassmorphic node blocks linked via SVG bezier path connections. Clicking concepts adjusts the video player playback position instantly.

ADVANCED AGENTIC MULTI-DOCUMENT RESEARCH & Q&A ASSISTANT:
Implement an advanced, multi-agent orchestrator powered by Gemini 2.5 Flash capable of multi-document/cross-video synthesis:
1. Workspace Level Analysis: Users can ask complex synthesis questions spanning an entire folder/playlist of up to 10 embedded videos (e.g., "Compare the conflicting engineering trade-offs of microservices discussed across all these tech lectures").
2. Agentic Research Planner: When a cross-video research query is initiated, the agent must systematically break down the user request into multiple search vectors, execute parallel semantic retrievals against Supabase pgvector filtering by workspace_id, evaluate conflicts, and format an organized markdown research report.
3. Multi-Document Grounding & Citation: Every synthesized response must support multi-document cross-referencing. Citations must clearly display the unique source video identity AND its exact timestamp badge (e.g., [VideoA @ 12:40], [VideoB @ 04:15]). Clicking any badge syncs the client-side browser video player to that video asset and seeks playback.

CORE FEATURES & INGESTION PIPELINE (The Serverless FastAPI Cloud Blueprint):
1. The 3-Stage Ingestion Flow:
   - Stage 1 (Public Endpoint `/api/ingest`): Receives the YouTube URL, publishes a message to Upstash QStash, and immediately returns a 202 Accepted response to the frontend.
   - Stage 2 (Internal Webhook Endpoint `/api/internal/process-video`): Receives the webhook payload from QStash. It attempts to fetch native transcripts using `youtube-transcript-api`. If none exist, it runs `yt-dlp` to extract `.m4a` audio and transcribes via OpenAI Whisper API. (Execute this in a non-blocking thread so the QStash HTTP connection remains open).
   - Stage 3: Chunk the text and embed it into Supabase pgvector. CRITICAL: Every vector chunk MUST include metadata for `video_id`, `workspace_id`, `channel_name`, `start_time`, and `end_time`.
2. Visual-Aware (Frame Sampling): Include a QStash queued placeholder function that uses a vision model to sample frames every 10 seconds to extract text from slide decks or code screens.

SUPERPOWERS WORKFLOW & CODE ARCHITECTURE CONSTRAINTS:
- Dependency Isolation: Ensure `pnpm` is used for all dependency management, with `package.json`, `pnpm-lock.yaml`, and `biome.json` (frontend). `pyproject.toml`, `uv.lock`, and `ruff` (backend) strictly isolated in their respective folders.
- Github ci workflows, Husky & lint-staged in Frontend Package running Biome formatting and lint checks on staged files.
- Github ci workflows, Husky & lint-staged in Backend Package running Ruff formatting and lint checks on staged files.
- WebGL Optimization: Keep the WebGL canvas component isolated inside a separate Client Component wrapper to maximize main thread performance and avoid component refresh thrashing.
- Serverless Compliance: Deploying to FastAPI Cloud means native FastAPI BackgroundTasks, Celery, and Redis are strictly FORBIDDEN. Rely entirely on QStash for asynchronous queuing.
- End-to-End Typing: Set up clean data validation typing across all Next.js server actions and matching FastAPI endpoints.