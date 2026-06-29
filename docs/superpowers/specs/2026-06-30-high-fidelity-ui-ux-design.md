# Design Spec: High-Fidelity UI/UX Enhancements

This specification details Phase 1.5 of the front-end layout redesign, elevating the workspace into an elite, highly interactive cockpit inspired by Youtube, Apple, and Uber dashboard design languages.

---

## Proposed Changes

### 1. Cursor-Tracking Spotlight Panels
* **Utility Hook:** Create a client-side hook `useSpotlight` or inline tracking to calculate relative cursor offset `(x, y)` coordinates on the panel wrapper.
* **Refracted Border Glow:** Update panels to apply a radial gradient border mask overlay on mouse movement:
  ```css
  background: radial-gradient(400px circle at var(--x) var(--y), rgba(6, 182, 212, 0.15), transparent 80%)
  ```

### 2. WebGL Canvas Focus States & Interactive Light Physics
* **Focus State Binding:** Pass `isChatFocused` boolean states from the chat panel input up to the main dashboard container and down to [MatrixCanvas.tsx](../../../frontend/src/components/MatrixCanvas.tsx).
* **GSAP Light Physics:** When `isChatFocused` transitions to true:
  * Tween the point light intensity from `1.5` to `4.5` using GSAP.
  * Increase the camera zoom speed and pull the focal distance closer to create a high-contrast focus mode.

### 3. Custom Draggable Split-Pane Workspace
* **Draggable Divider:** Build a custom horizontal/vertical resize handle using React state mouse handlers.
* **Spring Easing:** Lerp panel width adjustments during resize to ensure visual transitions are smooth.

### 4. Kinetic Citation Badges
* **Bounce Physics:** Convert citation badges to Framer Motion components with elastic spring settings (`type: "spring", stiffness: 400, damping: 10`).

---

## Verification Plan

### Manual Verification
* **Spotlight Test:** Sweep the mouse over the chat panel; verify that a subtle cyan glow follows the cursor along the border.
* **Focus Transition Test:** Click inside the chat message input box; verify the background 3D canvas point light intensifies and the camera zooms in smoothly.
* **Draggable Split Test:** Drag the panel divider handle; verify that the player and chat layouts resize responsively without layout clipping.
* **Badge Bounce Test:** Hover over the citation badges and click; verify they bounce with elastic kinetic weighting.
