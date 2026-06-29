# TubeRAG Frontend Client

A high-fidelity Next.js client workspace built with an Apple-style interactive 3D WebGL background and glassmorphic HUD controls.

---

## Technical Stack

* **Core Framework:** Next.js 16 (App Router with Turbopack compilation)
* **Styling & Theme:** Tailwind CSS & shadcn/ui custom glassmorphism utilities
* **WebGL & Graphics:** React Three Fiber (R3F), `@react-three/drei`, and Three.js
* **Animations:** GSAP & Framer Motion for smooth component transitions

---

## Core Capabilities

1. **Matrix Parallax Orbit:**
   * Tracks cursor movements and translates coordinate vectors to orbit and tilt coordinates.
   * Interpolates (`lerps`) camera position smoothly inside R3F `useFrame` frame rate ticks.
2. **GSAP Selected Zoom:**
   * GSAP timelines trigger camera focal coordinate zoom transitions whenever the active workspace video node is changed.
3. **Interactive Playback Badges:**
   * Chat citations (e.g. `[Transcript @ 01:15]`) are parsed into interactive click badges.
   * Clicking a badge seeks the player instance directly to the timestamp. Hovering or clicking a slide citation displays a custom preview overlay of the slide frame.
4. **Buy Me a Coffee Pill:**
   * Displays a Sleek glassmorphic button in the header referencing `NEXT_PUBLIC_COFFEE_URL` with a dynamic pulse indicator.

---

## Environment Variables

Copy `.env.example` to create `.env.local` inside the `frontend/` root folder:
```env
# API endpoint matching FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:9000

# Client-side Supabase client config
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-key

# Optional Buy Me a Coffee pill support link
NEXT_PUBLIC_COFFEE_URL=https://sociabuzz.com/gabcares/support
```

---

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run local dev server:**
   ```bash
   pnpm dev
   ```

3. **Verify compilation & typecheck:**
   ```bash
   pnpm build
   ```

4. **Lint and Format checks:**
   ```bash
   pnpm run lint
   pnpm run format
   ```
