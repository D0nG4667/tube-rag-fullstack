# Phase 2.0: Bring Your Own Key & StudyStudio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement client-side AES key encryption, StudyStudio 3-column workspace architecture (Sources left, Chat & Video center, Studio right with outline, podcast audio overview, and interactive SVG mindmap), historical video management (search & delete), and mobile responsiveness.

---

## 3-Column Workspace Mapping

```
┌─────────────────┬──────────────────────────────────┬─────────────────┐
│                 │                                  │                 │
│  COLUMN 1:      │  COLUMN 2:                       │  COLUMN 3:      │
│  SOURCES        │  CHAT & VIEWPORT                 │  STUDIO         │
│  - Video List   │  - Video Player                  │  - Outlines     │
│  - Search Filter│  - RAG Chat Console              │  - Podcast Play │
│  - Status Rings │  - Custom Key Settings           │  - SVG Mindmap  │
│                 │                                  │                 │
└─────────────────┴──────────────────────────────────┴─────────────────┘
```

---

### Task 1: Client-Side AES Cryptography & API Interceptor

**Files:**
- Create: `frontend/src/lib/crypto.ts`
- Modify: `frontend/src/components/ChatPanel.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Write client-side crypto.ts using browser Web Crypto API**
  Create [crypto.ts](../../../frontend/src/lib/crypto.ts) to encrypt/decrypt strings locally using AES-GCM and PBKDF2:
  ```typescript
  'use client'

  function arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = "";
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return window.btoa(binary);
  }

  function base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  export async function encryptApiKey(apiKey: string, passphrase: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const passwordKey = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      encoder.encode(apiKey)
    );

    const envelope = {
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(new Uint8Array(ciphertext)),
    };

    return window.btoa(JSON.stringify(envelope));
  }

  export async function decryptApiKey(encodedEnvelope: string, passphrase: string): Promise<string> {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const envelope = JSON.parse(window.atob(encodedEnvelope));
    const salt = base64ToArrayBuffer(envelope.salt);
    const iv = base64ToArrayBuffer(envelope.iv);
    const ciphertext = base64ToArrayBuffer(envelope.ciphertext);

    const passwordKey = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      ciphertext
    );

    return decoder.decode(decrypted);
  }
  ```

- [ ] **Step 2: Build the key settings modal/card in Dashboard header**
  In [page.tsx](../../../frontend/src/app/page.tsx), add status states for custom API keys:
  * Raw Key state (stored in-memory only).
  * Check if an encrypted key exists in `localStorage`. If it does, show a settings badge prompting for decryption.
  * Render a settings cog icon to let users input a key and passphrase to lock it.
  * Pass `geminiApiKey` to `ChatPanel` and `ControlDrawer`.

- [ ] **Step 3: Modify frontend fetch triggers to append header**
  In [ChatPanel.tsx](../../../frontend/src/components/ChatPanel.tsx), retrieve the key and pass it in all requests:
  ```typescript
  headers: {
    "Content-Type": "application/json",
    ...(geminiApiKey ? { "X-Gemini-API-Key": geminiApiKey } : {})
  }
  ```

---

### Task 2: Backend Isolated Local API Key Scope & Endpoints

**Files:**
- Modify: `backend/app/services/transcription.py`
- Modify: `backend/app/services/frame_extractor.py`
- Modify: `backend/app/api/v1/chat.py`
- Modify: `backend/app/api/v1/webhook.py`
- Modify: `backend/app/api/v1/ingest.py`

- [ ] **Step 1: Accept local API key argument in services**
  * Update `get_embedding(text: str, api_key: str | None = None)` in [transcription.py](../../../backend/app/services/transcription.py).
  * Update `transcribe_audio_with_gemini(audio_path: str, api_key: str | None = None)` in [transcription.py](../../../backend/app/services/transcription.py).
  * Update `analyze_frame_with_gemini(frame_bytes: bytes, api_key: str | None = None)` in [frame_extractor.py](../../../backend/app/services/frame_extractor.py).

- [ ] **Step 2: Read headers in chat.py RAG queries**
  Update `run_chat_rag` in [chat.py](../../../backend/app/api/v1/chat.py) to read request headers:
  ```python
  x_gemini_api_key: str | None = Header(None)
  ```
  Pass the header token strictly as a local argument without modifying global singletons.

- [ ] **Step 3: Propagate API Key across Ingestion queue boundaries**
  * In [ingest.py](../../../backend/app/api/v1/ingest.py), extract `X-Gemini-API-Key` and publish it in the QStash or local BackgroundTasks payload.
  * Update [webhook.py](../../../backend/app/api/v1/webhook.py) to extract the key from webhook triggers and pass it to all transcription/frame extraction jobs.

---

### Task 3: StudyStudio outline, Audio Podcast, & Mindmap

**Files:**
- Create: `backend/app/api/v1/notebook.py`
- Modify: `backend/app/main.py`
- Modify: `frontend/src/components/ChatPanel.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Write outline, podcast & mindmap generation endpoints**
  Create [notebook.py](../../../backend/app/api/v1/notebook.py) containing:
  * `POST /api/v1/notebook/outline`: Retrieves video chunks and generates a structured educational outline.
  * `POST /api/v1/notebook/podcast`: Retrieves video chunks and generates a conversational multi-host script (e.g. `[{"host": "Host A", "text": "..."}, ...]`).
  * `POST /api/v1/notebook/mindmap`: Clusters transcript topics into a JSON hierarchy: `{ subject: str, branches: [{ title: str, leaves: [{ text: str, seconds: number }] }] }`.

- [ ] **Step 2: Register notebook router in app main**
  Modify [main.py](../../../backend/app/main.py) to register the new `/api/v1/notebook` router.

- [ ] **Step 3: Build the 3rd column "StudyStudio" panel**
  * Modify [page.tsx](../../../frontend/src/app/page.tsx) to turn the workspace layout into a 3-column setup:
    1. **Column 1 (Left ControlDrawer):** Sources list.
    2. **Column 2 (Center Viewport & Chat):** Video player and RAG Chat Console.
    3. **Column 3 (Right Studio Drawer):** Collapsible panel displaying the Studio outline summaries, Podcast player, and Mindmap.
  * For **Podcast Mode**, render cards of Host dialogs. Use `window.speechSynthesis` to speak text with alternating male/female voices, highlighting the active host card in real-time.
  * For **Mindmap Mode**, render an interactive SVG-connected node chart. Create floating glassmorphic node divs linked by SVG bezier path connections. Clicking leaf nodes seeks the video player dynamically to the concept timestamp.

---

### Task 4: Video Deletion & Real-time Sidebar Search Filters

**Files:**
- Modify: `backend/app/api/v1/ingest.py`
- Modify: `frontend/src/components/ControlDrawer.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Add DELETE video endpoint**
  Modify [ingest.py](../../../backend/app/api/v1/ingest.py) to register:
  ```python
  @router.delete("/api/v1/videos/{video_id}")
  ```
  Deletes the matching video record. Supabase cascading rules automatically remove associated data.

- [ ] **Step 2: Implement Sidebar filters & status badges**
  * In [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx), add a search text input at the top of the video list to filter by title.
  * Render visual ring badges (Green/Ready, Yellow-Pulse/Processing, Red/Failed) beside items.
  * Render a trash/delete icon next to completed/failed items. Verify confirmation, fetch DELETE, and trigger list refresh.

---

### Task 5: Responsive Mobile Hamburger Layouts

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/components/ControlDrawer.tsx`

- [ ] **Step 1: Support layout stacking & hamburgers on mobile viewports**
  * Update the main dashboard grid inside [page.tsx](../../../frontend/src/app/page.tsx). If the screen is smaller than `lg`, panels must stack vertically and resizers must hide.
  * Add mobile header bar hamburger triggers. Toggle the Control Drawer overlay dynamically on mobile viewports.
