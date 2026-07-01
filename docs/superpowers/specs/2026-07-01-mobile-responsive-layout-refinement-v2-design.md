# Mobile Responsive Layout Refinement V2 Design Spec

## Goal Description
Introduce a Radix UI `@base-ui/react/dialog` based `Sheet` component to handle the mobile left sidebar navigation elegantly, and fix the StudyStudio sub-tab horizontal scrolling on desktop resizable viewports.

## Proposed Changes

### 1. Radix/Base-UI Based Sheet Component
* **Target File:** [NEW] [sheet.tsx](../../../frontend/src/components/ui/sheet.tsx)
  * Implement a standard Sheet sheet-drawer component using the React 19 native `@base-ui/react/dialog` primitives.
  * Provide native overlay backdrops, left/right slide animations, and close buttons:
    ```tsx
    "use client";
    import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
    // Sheet, SheetContent, SheetOverlay, SheetTrigger, SheetClose definitions...
    ```

### 2. Isolate Mobile Control Drawer inside Sheet Container
* **Target File:** [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)
  * Remove the manual backdrop overlay button we introduced in Phase 1.
  * On mobile screens (`isMobile`), render `ControlDrawer` wrapped in the new `<Sheet>` and `<SheetContent side="left">` containers:
    ```tsx
    {isMobile && (
        <Sheet open={isLeftOpen} onOpenChange={setIsLeftOpen}>
            <SheetContent side="left" className="p-0 border-r border-zinc-800/40 bg-zinc-950 w-[320px]">
                <ControlDrawer ... isOpen={true} />
            </SheetContent>
        </Sheet>
    )}
    ```
  * On desktop screens (`!isMobile`), render `ControlDrawer` inline as a side-by-side collapsible container matching original specifications.

### 3. StudyStudio Desktop Panel Horizontal Scroll Overflow
* **Target File:** [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)
  * The StudyStudio panel container currently has `shrink-0 overflow-visible` which prevents the parent resizable panel container from shrinking the StudyStudio panel boundaries and disables horizontal overflow scrolling for the sub-tabs.
  * Update the container styling of StudyStudio to enforce bounding limits (`min-w-0 overflow-hidden` instead of `shrink-0 overflow-visible`):
    ```diff
    - className="h-full w-full border-l border-zinc-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col relative shrink-0 z-40 overflow-visible transition-colors duration-300"
    + className="h-full w-full border-l border-zinc-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col relative min-w-0 z-40 overflow-hidden transition-colors duration-300"
    ```

---

## Verification Plan

### Manual Verification
* **Mobile Sidebar Integration:** Open Chrome DevTools in mobile viewport mode. Click the top hamburger menu. Verify the drawer slides out smoothly from the left, body scrolling is locked, and clicking outside/backdrop closes the drawer.
* **Desktop StudyStudio Tabs Scroll:** On desktop, drag the resizable splitter handle to narrow the StudyStudio panel. Verify that the StudyStudio panel shrinks cleanly, its layout stays intact, and the tab list scrolls horizontally when tab triggers overflow the narrow panel width.
