# Mobile Responsive Layout Refinement V4 Design Spec

## Goal Description
Resolve the StudyStudio border collapse pill toggle button (black pill with chevron) appearing visible on mobile screens when the StudyStudio tab is active.

## Proposed Changes

### Hide StudyStudio Pill Toggle on Mobile
* **Target File:** [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)
  * StudyStudio has a desktop-only side panel collapse handle button at the bottom of the component render (around line 1354).
  * Update its classes to include `hidden lg:flex` so that it is only visible on desktop resizable viewports and completely hidden on mobile:
    ```diff
    - className={`absolute top-1/2 -translate-y-1/2 z-50 w-5 h-10 rounded-full border border-zinc-800/80 bg-zinc-950/90 text-zinc-400 hover:text-white transition shadow-md flex items-center justify-center ${
    + className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-50 w-5 h-10 rounded-full border border-zinc-800/80 bg-zinc-950/90 text-zinc-400 hover:text-white transition shadow-md items-center justify-center ${
    ```

---

## Verification Plan

### Manual Verification
* **StudyStudio Mobile Tab:** Emulate mobile screen, navigate to the StudyStudio tab, and verify that the black pill toggle button is completely hidden from the left viewport edge.
* **Desktop StudyStudio Panel:** Verify that the collapse toggle pill handle is still visible and functional on desktop viewports.
