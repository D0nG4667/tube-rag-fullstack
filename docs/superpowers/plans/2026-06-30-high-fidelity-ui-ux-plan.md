# Phase 1.5: High-Fidelity UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement world-class Apple-Google-Youtube-Uber inspired UI/UX layouts, resizers, hover reflections, and input-focus lighting effects.

**Architecture:** Create a spotlight hover wrapper for cards. Replace rigid grid splits with a custom interactive draggable workspace split state handler. Track focus/blur states of the chat input to tween PointLight and camera zooms via GSAP. Apply Framer Motion physics to chat citation badges.

**Tech Stack:** Next.js (App Router), Tailwind CSS, Framer Motion, GSAP.

## Global Constraints

- Avoid rigid desktop-only CSS columns splits; use fluid resizing handles.
- Maintain dark-mode, high-fidelity frosted glass look.

---

### Task 1: Cursor-Tracking Spotlight Panel Card

**Files:**
- Create: `frontend/src/components/SpotlightPanel.tsx`
- Modify: `frontend/src/components/ChatPanel.tsx`

**Interfaces:**
- Consumes: React children, custom classNames
- Produces: Frosted spotlight container with cursor border glow

- [ ] **Step 1: Create the SpotlightPanel wrapper component**
  Create [SpotlightPanel.tsx](../../../frontend/src/components/SpotlightPanel.tsx) to track cursor positions and render a moving radial gradient glow:
  ```tsx
  'use client'

  import React, { useRef, useState } from 'react'

  interface SpotlightPanelProps {
    children: React.ReactNode
    className?: string
  }

  export default function SpotlightPanel({ children, className = '' }: SpotlightPanelProps) {
    const divRef = useRef<HTMLDivElement>(null)
    const [coords, setCoords] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!divRef.current) return
      const rect = divRef.current.getBoundingClientRect()
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    return (
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative overflow-hidden transition-all duration-300 ${className}`}
      >
        {isHovered && (
          <div
            className="pointer-events-none absolute -inset-px transition duration-300 z-0"
            style={{
              background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, rgba(6, 182, 212, 0.12), transparent 80%)`,
            }}
          />
        )}
        <div className="relative z-10 h-full flex flex-col">{children}</div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Replace ChatPanel outer container**
  Modify [ChatPanel.tsx](../../../frontend/src/components/ChatPanel.tsx) to import `SpotlightPanel` and replace the outer `div` wrapper (around lines 157-158):
  ```tsx
  import SpotlightPanel from '@/components/SpotlightPanel'
  // inside render:
  return (
    <SpotlightPanel className="flex flex-col h-full rounded-2xl backdrop-blur-2xl bg-zinc-950/20 border border-zinc-800/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden relative">
      ...
    </SpotlightPanel>
  )
  ```

- [ ] **Step 3: Compile and verify build success**
  Run: `pnpm build` in the `frontend` folder
  Expected: Successful compilation.

- [ ] **Step 4: Commit changes**
  ```bash
  git add frontend/src/components/SpotlightPanel.tsx frontend/src/components/ChatPanel.tsx
  git commit -m "feat: add SpotlightPanel component for cursor-tracking border glow"
  ```

---

### Task 2: Custom Draggable Split-Pane Workspace

**Files:**
- Modify: `frontend/src/app/page.tsx`

**Interfaces:**
- Produces: Draggable vertical resizer bar to scale video and chat widths dynamically

- [ ] **Step 1: Implement drag handler hooks inside Dashboard page**
  Modify [page.tsx](../../../frontend/src/app/page.tsx) to declare pane sizing states and mouse events:
  ```tsx
  const [splitWidth, setSplitWidth] = useState(50) // default 50% split width
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const percentage = (e.clientX / window.innerWidth) * 100
      // Clamp split pane limits between 30% and 70%
      setSplitWidth(Math.max(30, Math.min(70, percentage)))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])
  ```

- [ ] **Step 2: Replace standard grid cols with custom resizable split widths**
  Update the main viewport container markup in [page.tsx](../../../frontend/src/app/page.tsx):
  ```tsx
  {/* Viewport & chat splits */}
  <div 
    className="flex-1 flex gap-6 min-h-0 overflow-hidden relative"
    style={{ userSelect: isDragging ? 'none' : 'auto' }}
  >
    {/* Left Panel: Video Player container */}
    <div 
      className="flex flex-col gap-4 min-h-0"
      style={{ width: `${splitWidth}%` }}
    >
      <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col justify-center min-h-0">
        <span className="text-xs text-zinc-500 font-semibold tracking-widest mb-3 block">
          VIDEO PLAYER ENGINE
        </span>
        <VideoPlayer
          ref={playerRef}
          youtubeId={selectedVideo?.youtube_id || ''}
        />
      </div>
    </div>

    {/* Resizer Handle Bar */}
    <div
      onMouseDown={handleMouseDown}
      className={`w-1 cursor-col-resize h-full rounded transition-all duration-150 relative self-stretch flex items-center justify-center ${
        isDragging ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-zinc-800/40 hover:bg-zinc-700/60'
      }`}
    >
      <div className="w-4 h-8 rounded border border-zinc-800/80 bg-zinc-950/90 flex items-center justify-center gap-0.5">
        <div className="w-0.5 h-3 bg-zinc-600" />
        <div className="w-0.5 h-3 bg-zinc-600" />
      </div>
    </div>

    {/* Right Panel: Agentic chat module */}
    <div 
      className="flex flex-col min-h-0 flex-1"
    >
      <ChatPanel
        videoId={selectedVideo?.id || ''}
        onSeek={handleSeek}
      />
    </div>
  </div>
  ```

- [ ] **Step 3: Verify build compiles cleanly**
  Run: `pnpm build`
  Expected: Successful compilation.

- [ ] **Step 4: Commit changes**
  ```bash
  git add frontend/src/app/page.tsx
  git commit -m "feat: implement custom draggable split pane workspace layout"
  ```

---

### Task 3: Input Focus WebGL Lighting & Zoom Tween

**Files:**
- Modify: `frontend/src/components/ChatPanel.tsx`
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/components/MatrixCanvas.tsx`

**Interfaces:**
- Propagates focus boolean state changes down to MatrixCanvas R3F wrapper

- [ ] **Step 1: Bubble chat input focus states**
  Update [ChatPanel.tsx](../../../frontend/src/components/ChatPanel.tsx) to support `onFocusChange` callback:
  ```tsx
  interface ChatPanelProps {
    videoId: string
    onSeek: (seconds: number) => void
    onFocusChange?: (focused: boolean) => void
  }
  ```
  Attach to the input tag:
  ```tsx
  <input
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onFocus={() => onFocusChange?.(true)}
    onBlur={() => onFocusChange?.(false)}
    placeholder={videoId ? "Ask about slide decks or code screens..." : "Select a video to chat..."}
    disabled={!videoId || loading}
    className="flex-1 px-4 py-2 text-sm rounded-lg bg-zinc-900/80 border border-zinc-800 focus:outline-none focus:border-accent-cyan text-zinc-200 placeholder-zinc-500 disabled:opacity-50"
  />
  ```

- [ ] **Step 2: Pass focus state inside page.tsx**
  Modify [page.tsx](../../../frontend/src/app/page.tsx) to hold `isChatFocused` state and pass it down:
  ```tsx
  const [isChatFocused, setIsChatFocused] = useState(false)
  ```
  Pass state to canvas and input component hooks:
  ```tsx
  <MatrixCanvas active={hasActiveJob} selectedVideoId={selectedVideo?.id || ''} isFocused={isChatFocused} />
  ...
  <ChatPanel
    videoId={selectedVideo?.id || ''}
    onSeek={handleSeek}
    onFocusChange={setIsChatFocused}
  />
  ```

- [ ] **Step 3: Update MatrixCanvas.tsx lighting and zoom animations**
  Update [MatrixCanvas.tsx](../../../frontend/src/components/MatrixCanvas.tsx) to consume `isFocused` and trigger GSAP tweens:
  ```tsx
  interface MatrixCanvasProps {
    active?: boolean
    selectedVideoId?: string
    isFocused?: boolean
  }
  ```
  Add lighting props tracking to child `ParticleField`:
  ```tsx
  function ParticleField({ selectedVideoId, isFocused }: { selectedVideoId?: string; isFocused?: boolean }) {
  ```
  Trigger GSAP lighting and camera zooms when `isFocused` changes:
  ```tsx
  const focusIntensityRef = useRef({ val: 1.0 })

  useEffect(() => {
    gsap.to(focusIntensityRef.current, {
      val: isFocused ? 2.5 : 1.0,
      duration: 1.0,
      ease: 'power2.out'
    })
  }, [isFocused])
  ```
  Read target vectors in `useFrame`:
  ```tsx
  // Interpolate camera coordinates based on mouse target, zoomOffset, and focus states
  const targetX = mouseRef.current.x * (isFocused ? 0.8 : 1.5)
  const targetY = mouseRef.current.y * (isFocused ? 0.6 : 1.2)
  const targetZ = (isFocused ? 3.5 : 5.0) + zoomOffsetRef.current.z

  state.camera.position.x += (targetX - state.camera.position.x) * 0.05
  state.camera.position.y += (targetY - state.camera.position.y) * 0.05
  state.camera.position.z += (targetZ - state.camera.position.z) * 0.05
  ```
  And inside the `pointLight` definition:
  ```tsx
  <pointLight
    position={[2, 3, 2]}
    intensity={(active ? 3.5 : 1.5) * focusIntensityRef.current.val}
    color={active ? '#06b6d4' : '#7c3aed'}
  />
  ```
  *(Make sure to pass `isFocused` from MatrixCanvas down to `<ParticleField isFocused={isFocused} />`)*

- [ ] **Step 4: Verify build compiles cleanly**
  Run: `pnpm build`
  Expected: Successful compilation.

- [ ] **Step 5: Commit changes**
  ```bash
  git add frontend/src/components/ChatPanel.tsx frontend/src/components/MatrixCanvas.tsx frontend/src/app/page.tsx
  git commit -m "feat: implement input focus tracking and GSAP particle zoom/lighting transition"
  ```

---

### Task 4: Framer Motion Spring Badges

**Files:**
- Modify: `frontend/src/components/ChatPanel.tsx`

- [ ] **Step 1: Refactor citation badges to use kinetic motion elements**
  Modify [ChatPanel.tsx](../../../frontend/src/components/ChatPanel.tsx) to import `motion` from `framer-motion` and convert citation badges:
  Replace the standard citation button tags (around the citation badges mapping section inside the helper block) with `<motion.button>` featuring elastic springs:
  ```tsx
  import { motion } from 'framer-motion'
  ```
  In `renderMessageText` helper citation badges:
  ```tsx
  parts.push(
    <motion.button
      key={`cite-${idx}`}
      onClick={() => onSeek(seconds)}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold select-none border transition-colors cursor-pointer mx-0.5 ${
        citeType === 'slide'
          ? 'bg-accent-violet/20 hover:bg-accent-violet/30 border-accent-violet/30 text-accent-violet'
          : 'bg-accent-cyan/20 hover:bg-accent-cyan/30 border-accent-cyan/30 text-accent-cyan'
      }`}
      onMouseEnter={(e) => {
        if (citeType === 'slide' && imgUrl) {
          setHoveredSlideUrl(imgUrl)
          setMousePos({ x: e.clientX + 10, y: e.clientY + 10 })
        }
      }}
      onMouseLeave={() => setHoveredSlideUrl(null)}
      onMouseMove={(e) => {
        if (citeType === 'slide') {
          setMousePos({ x: e.clientX + 10, y: e.clientY + 10 })
        }
      }}
    >
      ...
    </motion.button>
  )
  ```

- [ ] **Step 2: Run build to verify compilation**
  Run: `pnpm build`
  Expected: Successful compilation.

- [ ] **Step 3: Run Biome lint & format checks**
  Run: `pnpm run lint` and `pnpm run format`
  Expected: All formatting checks pass.

- [ ] **Step 4: Commit changes**
  ```bash
  git add frontend/src/components/ChatPanel.tsx
  git commit -m "style: convert citation badges to kinetic spring bounce buttons"
  ```
