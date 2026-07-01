# Mobile Responsive Layout Refinement Design Spec (Phase 2)

## Goal Description
Resolve left drawer mobile backdrop overlay styling, fix mobile drawer transparency, and address StudyStudio tabs squishing/overlapping on desktop viewports.

## Proposed Changes

### Left Drawer Mobile Overlay & Backdrop
* **Target File:** [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)
  * Add a dark backdrop overlay that appears when the mobile drawer is open to block clicks and visually isolate the drawer:
    ```tsx
    {isMobile && isLeftOpen && (
        <div
            onClick={() => setIsLeftOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        />
    )}
    ```
* **Target File:** [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx)
  * Change the background color on mobile screens to a solid, fully opaque color to prevent the main viewport content from showing through. Maintain the glassmorphic backdrop filter only on desktop:
    ```diff
    - className="h-full border-r border-zinc-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col absolute lg:relative top-0 bottom-0 left-0 lg:top-auto lg:bottom-auto lg:left-auto shrink-0 z-45 lg:z-40 overflow-visible transition-colors duration-300 shadow-2xl lg:shadow-none"
    + className="h-full border-r border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-950 lg:bg-white/80 lg:dark:bg-zinc-950/40 lg:backdrop-blur-2xl flex flex-col absolute lg:relative top-0 bottom-0 left-0 lg:top-auto lg:bottom-auto lg:left-auto shrink-0 z-45 lg:z-40 overflow-visible transition-colors duration-300 shadow-2xl lg:shadow-none"
    ```

### StudyStudio Tabs Overlapping Fix (Desktop & Mobile)
* **Target File:** [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)
  * Remove `md:min-w-0` from `<TabsTrigger>` elements. Using `shrink-0 px-3 flex-1` on all screens lets flexbox auto-size tabs triggers to their content widths and prevents them from shrinking below their legible limits.
  * When the desktop side panel or mobile viewport is resized narrow, the tab list will naturally scroll horizontally instead of squishing and overlapping text.

---

## Verification Plan

### Manual Verification
* **Mobile Drawer Backdrop:** Open the left drawer in mobile view, verify the dark overlay covers the screen and clicking it closes the drawer.
* **Mobile Drawer Opacity:** Verify the drawer background is solid and does not show viewport contents behind it.
* **StudyStudio Resize:** Verify that resizing StudyStudio panel on desktop activates horizontal scrolling instead of squishing tabs.
