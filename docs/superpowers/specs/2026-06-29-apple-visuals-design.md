# Phase 1 Design: Apple-Style 3D Shell & Visuals

## Overview
This specification details Phase 1 of the front-end redesign for the **TubeRAG** workspace. The goal is to elevate the dashboard into a world-class 3D interactive HUD matching the design aesthetics of premium 3D web applications (e.g., Apple's visual campaigns).

---

## Proposed Changes

### 1. 3D Camera Parallax & Node Select Zoom
* **Component:** [MatrixCanvas.tsx](../../../frontend/src/components/MatrixCanvas.tsx)
* **Parallax Orbit:**
  * Track user cursor coordinates client-side (normalized from `-1` to `1`).
  * In the R3F `<Canvas>` frame loop (`useFrame`), interpolate (lerp) the camera's position towards the cursor coordinate offset.
* **GSAP Zoom Transition:**
  * When the selected video changes, trigger a GSAP tween that moves the camera forward into the particle cloud, simulating a "data dive" or zoom-in focus transition, then ease it back to the active tracking state.

### 2. Frosted Glass HUD layout
* **Tailwind & Utilities:**
  * Style the panels and drawer components using extra-frosted glass values:
    ```tailwind
    backdrop-blur-2xl bg-zinc-950/25 border border-zinc-800/40 shadow-2xl hover:border-zinc-700/50 transition-all duration-500
    ```
  * Inject custom glowing animations and metallic border-image accents using CSS variables inside `globals.css` or Tailwind configuration.
* **Layout Structure:**
  * Maintain the functional two-pane split (Video Player on left, Copilot Chat on right, Control Drawer on left) but let them float elegantly over the full-screen canvas.

### 3. "Buy Me a Coffee" Action
* **Configurable Link:**
  * Load support URL from `process.env.NEXT_PUBLIC_COFFEE_URL` with a fallback to `https://sociabuzz.com/gabcares/support`.
* **Visual Component:**
  * Render a sleek, minimalist frosted glass pill button in the top-right header toolbar with a coffee cup icon and dynamic halo glow animations on hover.

---

## Verification Plan

### Manual Verification
* **Cursor Follow Test:** Verify the 3D particle matrix tilts and pans smoothly as the mouse moves across different sections of the screen.
* **Video Change Test:** Click a different video card in the Control Drawer; verify the GSAP camera zoom animation triggers cleanly with no stuttering or Canvas resets.
* **Buy Me a Coffee Link:** Verify that clicking the button opens the expected support URL in a new tab.
* **Responsive Design:** Validate frosted panels display correctly on mobile and desktop layout splits.
