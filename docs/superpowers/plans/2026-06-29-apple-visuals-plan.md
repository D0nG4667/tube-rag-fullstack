# Phase 1: Apple-Style 3D Shell & Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate TubeRAG's workspace UI into a world-class Apple-style 3D interactive HUD with frosted glassmorphism, camera parallax, GSAP select transitions, and a support link.

**Architecture:** Use client-side event listeners to track mouse coords and dynamically lerp the three.js camera target inside a dedicated canvas frame loop. Leverage GSAP to animate zoom-in sequences when the active video node changes. Update Tailwind utility rules and components for frosted glassmorphic styles.

**Tech Stack:** Next.js (App Router), Tailwind CSS, React Three Fiber, GSAP.

## Global Constraints

- Keep the WebGL canvas component isolated inside a separate Client Component wrapper.
- All structural panels must float using frosted glass style: `backdrop-blur-2xl bg-zinc-950/25 border border-zinc-800/40`.

---

### Task 1: Environment Variables & Buy Me a Coffee Pill

**Files:**
- Create: `frontend/.env.local`
- Modify: `frontend/src/app/page.tsx`

**Interfaces:**
- Consumes: Environment variables
- Produces: Visual Coffee Pill element in Header

- [ ] **Step 1: Declare COFFEE_URL in local environment configuration**
  Create or edit `frontend/.env.local` and add the custom coffee support link:
  ```env
  NEXT_PUBLIC_COFFEE_URL=https://sociabuzz.com/gabcares/support
  ```

- [ ] **Step 2: Render the premium Coffee pill button in Page Header**
  Modify [page.tsx](file:///c:/Users/hp/Desktop/gab/git%20projects/tube-rag-fullstack/frontend/src/app/page.tsx) to read `NEXT_PUBLIC_COFFEE_URL` and render a minimalist neon glow Coffee Pill button inside the header bar next to the active video tag:
  ```tsx
  const coffeeUrl = process.env.NEXT_PUBLIC_COFFEE_URL || "https://sociabuzz.com/gabcares/support";
  ```
  Add the markup:
  ```tsx
  <a
    href={coffeeUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-950/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all duration-300"
  >
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
    </span>
    Buy me a coffee
  </a>
  ```

- [ ] **Step 3: Run build to verify correct imports and types**
  Run: `pnpm build` in the `frontend` folder
  Expected: Successful compilation without warnings.

- [ ] **Step 4: Commit changes**
  ```bash
  git add frontend/.env.local frontend/src/app/page.tsx
  git commit -m "feat: add environment-configured Buy Me a Coffee button"
  ```

---

### Task 2: R3F Mouse Parallax & GSAP Selection Zoom

**Files:**
- Modify: `frontend/src/components/MatrixCanvas.tsx`
- Modify: `frontend/src/app/page.tsx`

**Interfaces:**
- Consumes: `selectedVideoId` from page wrapper
- Produces: Cursor parallax camera lerp and GSAP video selection tween

- [ ] **Step 1: Implement global mouse listener inside MatrixCanvas**
  Modify [MatrixCanvas.tsx](file:///c:/Users/hp/Desktop/gab/git%20projects/tube-rag-fullstack/frontend/src/components/MatrixCanvas.tsx) to declare cursor offset coordinates ref:
  ```tsx
  const mouseRef = useRef({ x: 0, y: 0 })
  const zoomOffsetRef = useRef({ z: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  ```

- [ ] **Step 2: Add GSAP Transition zoom trigger on active video changes**
  Import GSAP at the top of `MatrixCanvas.tsx` and watch the `selectedVideoId` prop. When it changes, trigger a temporary camera focus zoom using GSAP:
  ```tsx
  import { gsap } from 'gsap'
  // inside MatrixCanvas
  useEffect(() => {
    if (!selectedVideoId) return
    gsap.fromTo(
      zoomOffsetRef.current,
      { z: -2 },
      { z: 0, duration: 1.5, ease: 'power2.out' }
    )
  }, [selectedVideoId])
  ```

- [ ] **Step 3: Integrate lerped camera vectors inside useFrame**
  Update the `useFrame` hook to lerp the camera position and rotation towards the mouse target offsets:
  ```tsx
  useFrame((state) => {
    if (!pointsRef.current) return
    const time = state.clock.getElapsedTime()
    
    // Slow rotational drift
    pointsRef.current.rotation.y = time * 0.01
    
    // Lerp camera target offsets
    const targetX = mouseRef.current.x * 1.5
    const targetY = mouseRef.current.y * 1.2
    const targetZ = 5 + zoomOffsetRef.current.z

    state.camera.position.x += (targetX - state.camera.position.x) * 0.05
    state.camera.position.y += (targetY - state.camera.position.y) * 0.05
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.05
    state.camera.lookAt(0, 0, 0)
  })
  ```

- [ ] **Step 4: Update page.tsx to pass selectedVideoId**
  Modify [page.tsx](file:///c:/Users/hp/Desktop/gab/git%20projects/tube-rag-fullstack/frontend/src/app/page.tsx)'s `MatrixCanvas` invocation:
  ```tsx
  <MatrixCanvas active={hasActiveJob} selectedVideoId={selectedVideo?.id || ''} />
  ```

- [ ] **Step 5: Verify build compiles cleanly**
  Run: `pnpm build`
  Expected: Successful compilation.

- [ ] **Step 6: Commit changes**
  ```bash
  git add frontend/src/components/MatrixCanvas.tsx frontend/src/app/page.tsx
  git commit -m "feat: implement mouse parallax camera tracking and GSAP select zoom transition"
  ```

---

### Task 3: Frosted Glass HUD Styles

**Files:**
- Modify: `frontend/src/components/ChatPanel.tsx`
- Modify: `frontend/src/components/ControlDrawer.tsx`

- [ ] **Step 1: Refactor ChatPanel glass styles**
  Modify [ChatPanel.tsx](file:///c:/Users/hp/Desktop/gab/git%20projects/tube-rag-fullstack/frontend/src/components/ChatPanel.tsx)'s main shell to float using:
  ```className
  "flex flex-col h-full rounded-2xl backdrop-blur-2xl bg-zinc-950/20 border border-zinc-800/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden"
  ```

- [ ] **Step 2: Refactor ControlDrawer styling**
  Modify [ControlDrawer.tsx](file:///c:/Users/hp/Desktop/gab/git%20projects/tube-rag-fullstack/frontend/src/components/ControlDrawer.tsx)'s main wrapper to support absolute overlay position:
  ```className
  "relative z-20 flex flex-col h-screen backdrop-blur-2xl bg-zinc-950/20 border-r border-zinc-800/40 shadow-2xl transition-all duration-300"
  ```

- [ ] **Step 3: Run linting & format checks**
  Run: `pnpm run lint` and `pnpm run format`
  Expected: All Biome formatting checks pass.

- [ ] **Step 4: Commit changes**
  ```bash
  git add frontend/src/components/ChatPanel.tsx frontend/src/components/ControlDrawer.tsx
  git commit -m "style: apply ultra-frosted glassmorphism to panels and navigation drawer"
  ```
