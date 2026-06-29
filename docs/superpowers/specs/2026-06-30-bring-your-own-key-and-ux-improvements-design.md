# Design Spec: Bring Your Own Key & Workspace UX Improvements

This specification details Phase 2.0 UX and API capabilities for **TubeRAG**, supporting custom Gemini API keys, historical node deletion, search filters, and full mobile responsiveness.

---

## Proposed Changes

### 1. Bring Your Own Gemini API Key
* **Frontend:**
  * Add a gear icon settings dialog or collapsible header input field where users can input their own Gemini API key.
  * Persist the key locally in `localStorage` (`tuberag_gemini_api_key`).
  * Pass the key in all request payloads under the parameter `gemini_api_key` for `/api/v1/chat` and `/api/v1/ingest`.
* **Backend:**
  * Add `gemini_api_key: str | None = None` to `ChatRequest` and `IngestRequest` bodies.
  * In the RAG pipeline (`run_chat_rag`), if `gemini_api_key` is provided in the request body, pass it to `generate_hyde_paragraph`, `get_embedding`, and `generate_rag_response` to initialize the `genai.Client` client dynamically.
  * In the Ingest pipeline (`ingest_video`), propagate the key to QStash/BackgroundTasks webhooks:
    * Save it temporarily in the webhook payload, passing it recursively to `process_video_task` parameters.
    * Use the custom key for Whisper transcription fallbacks and slide extraction points.

### 2. Video Deletion Route & UI Controls
* **Backend:**
  * Add `DELETE /api/v1/videos/{video_id}` in `backend/app/api/v1/ingest.py`.
  * Deleting a video relies on Supabase schema `on delete cascade` triggers to automatically delete associated chunks and joins.
* **Frontend:**
  * Render a trash/delete icon button next to each video in the list.
  * Trigger a confirm dialog and fetch `DELETE /api/v1/videos/{id}`. On success, remove the video node from the sidebar and fetch the active list.

### 3. Historical Video Node Search & Statuses
* **Sidebar Filter:** Add a search input at the top of the sidebar. Filter the list of videos in real-time as the user types.
* **Status Badges:** Display corresponding visual indicators for ingestion state (Ready: green, Processing: yellow/pulse, Failed: red) in the list nodes.

### 4. Mobile Responsiveness & Hamburger Drawer
* **Mobile Stack Layout:** Responsive Tailwind grids stack panels vertically on mobile screens:
  * Left and Right widths adapt to `w-full` instead of draggable split percentage when viewport is small.
  * Toggle/Disable resizer handle bar drag listener on mobile touch screens.
* **Drawer Hamburger:** Implement a hamburger button in the mobile toolbar header to slide toggle the Control Drawer overlay, preventing drawer clipping.

---

## Verification Plan

### Automated Tests
- Run `uv run pytest` to ensure endpoint signature updates compile and match expectations.

### Manual Verification
- **API Key Test:** Configure an invalid API key; verify that the search query fails. Configure a valid key; verify RAG works.
- **Search Test:** Type video titles in the filter search box; verify the sidebar list narrows down correctly.
- **Delete Test:** Delete a video; verify it disappears from the list and all chunks are removed from the DB.
- **Responsive Test:** View the app on a mobile emulation window; verify panels stack vertically and the hamburger drawer slides open cleanly.
