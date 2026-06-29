# Design Spec: Bring Your Own Key & Workspace UX Improvements

This specification details Phase 2.0 UX and API capabilities for **TubeRAG**, supporting custom Gemini API keys, historical node deletion, search filters, full mobile responsiveness, and an interactive StudyStudio featuring mindmaps.

---

## Proposed Changes

### 1. Bring Your Own Gemini API Key with AES Encryption
* **Client-Side AES Cryptography:**
  * Implement browser-native Web Crypto API (`window.crypto.subtle`) for encryption.
  * When a user inputs their Gemini API key, prompt them for a custom local password/passphrase.
  * Derive a 256-bit AES-GCM key from the passphrase using PBKDF2 (100,000 iterations, SHA-256).
  * Encrypt the raw API key and save the resulting JSON envelope `{ salt, iv, ciphertext }` encoded in base64 inside `localStorage` under `tuberag_encrypted_gemini_key`.
  * *Security benefit:* An attacker gaining access via XSS only retrieves cipher-text. They cannot decrypt it without the user's password, which is never saved in storage.
* **Session Lifecycle:**
  * Keep the decrypted key strictly **in-memory** (in React state).
  * Upon page reload, if `tuberag_encrypted_gemini_key` exists, present a dialogue prompting the user to enter their password. Once entered, decrypt the key into memory.
  * Pass the raw key in HTTP request headers (`X-Gemini-API-Key`) for active requests.
* **Backend:**
  * In the RAG pipeline (`run_chat_rag`), extract `X-Gemini-API-Key` from headers.
  * If present, instantiate `genai.Client(api_key=...)` using this key instead of `settings.GEMINI_API_KEY`.
  * In the Ingest pipeline (`ingest_video`), extract `X-Gemini-API-Key` from headers and pass it recursively to `process_video_task` parameters.

### 2. Video Deletion Route & UI Controls
* **Backend:**
  * Add `DELETE /api/v1/videos/{video_id}` in `backend/app/api/v1/ingest.py`.
  * Deleting a video relies on Supabase schema `on delete cascade` triggers to automatically delete associated chunks and joins.
* **Frontend:**
  * Render a trash/delete icon button next to each video in the list.
  * Trigger a confirm dialog and fetch `DELETE /api/v1/videos/{id}`. On success, remove the video node from the sidebar and fetch the active list.

### 3. StudyStudio (Sources, Chat, Studio Panels) & Interactive Mindmap
* **StudyStudio 3-Column Layout:**
  * **Column 1:** Sources (ControlDrawer list).
  * **Column 2:** Chat RAG Console & Video Viewport.
  * **Column 3:** Studio Drawer presenting dynamic learning guides (Outlines, Podcasts, and Mindmaps).
* **Interactive Mindmap Feature:**
  * Build a custom mindmap node graph inside the Studio view.
  * The backend returns a hierarchical JSON mindmap cluster of key concepts.
  * The frontend renders floating glassmorphic cards connected by SVG bezier curves (path connectors).
  * Clicking a concept leaf node seeks the client-side video player directly to its source timestamp.
* **Podcast Audio Overview:**
  * Uses `window.speechSynthesis` to speak podcast scripts with alternating male/female voices, highlighting active host cards in real-time.

### 4. Historical Video Node Search & Statuses
* **Sidebar Filter:** Add a search input at the top of the sidebar. Filter the list of videos in real-time as the user types.
* **Status Badges:** Display corresponding visual indicators for ingestion state (Ready: green, Processing: yellow/pulse, Failed: red) in the list nodes.

### 5. Mobile Responsiveness & Hamburger Drawer
* **Mobile Stack Layout:** Responsive Tailwind grids stack panels vertically on mobile screens:
  * Left and Right widths adapt to `w-full` instead of draggable split percentage when viewport is small.
  * Toggle/Disable resizer handle bar drag listener on mobile touch screens.
* **Drawer Hamburger:** Implement a hamburger button in the mobile toolbar header to slide toggle the Control Drawer overlay, preventing drawer clipping.

---

## Verification Plan

### Automated Tests
- Run `uv run pytest` to ensure endpoint signature updates compile and match expectations.

### Manual Verification
- **AES Key Test:** Configure a key and passphrase; reload page. Verify key is decrypted only when entering correct password. Verify RAG fails with wrong password.
- **Mindmap Graph Test:** Open the Mindmap view; verify floating node cards render and are linked by SVG curves. Verify clicking a node seeks the video player to the correct timestamp.
- **Search Test:** Type video titles in the filter search box; verify the sidebar list narrows down correctly.
- **Delete Test:** Delete a video; verify it disappears from the list and all chunks are removed from the DB.
- **Responsive Test:** View the app on a mobile emulation window; verify panels stack vertically and the hamburger drawer slides open cleanly.
