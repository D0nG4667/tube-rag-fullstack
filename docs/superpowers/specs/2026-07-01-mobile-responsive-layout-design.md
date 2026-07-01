# Mobile Responsive Layout & Header Design Spec

## Goal Description
Provide a premium, responsive mobile layout for the TubeRAG Workspace Console, resolving header overcrowding, optimizing top navigation tab styles, and making the StudyStudio panel accessible, clean, and swipeable on mobile devices.

## Proposed Changes

### Header Layout Refactoring
* **Target File:** [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)
* **Description:** Hide non-essential console actions on mobile viewports (below `lg`) to prevent header clipping.
* **Responsive visibility rules:**
  * **Roadmap, Language switcher, and "Buy me a coffee"** -> Hide on mobile/tablet (`hidden lg:inline-flex` or `hidden lg:flex`).
  * **StudyStudio toggle button** -> Hide on mobile (`hidden lg:inline-flex`).
  * **Active YT ID Badge** -> Hide on mobile/tablet (`hidden md:inline-flex`).
  * **Essential Header:** Only `[Hamburger Menu] Workspace Console` (left) and `[Settings] [Theme]` (right) remain visible on mobile.

### Mobile Drawer Navigation Actions
* **Target File:** [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx)
* **Description:** Append the hidden secondary action links and active video metadata to the bottom of the Left Control Drawer, visible **only** on mobile viewports (`block lg:hidden`).
* **Elements added:**
  * Active video YouTube ID indicator.
  * Roadmap link.
  * Language selector switcher.
  * Buy me a coffee support button.

### Mobile Workspace Tab Switcher & Unified Icons
* **Target File:** [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)
* **Description:** Replace the vertical stacking of Video Player, Chat, and StudyStudio on mobile with a clean, glassmorphic tab switcher using the **shadcn/ui Tabs component** and Lucide vector icons for a consistent visual style.
* **Icon updates:**
  * Import `Tv` and `Brain` icons from `lucide-react` to replace the emojis in the top tab row.
* **Structure:**
  * Render `<Tabs defaultValue="workspace" className="flex-grow flex flex-col min-h-0 w-full">`.
  * Render a sticky `<TabsList className="grid w-full grid-cols-2 bg-zinc-900/30 border border-zinc-800/40 backdrop-blur-md rounded-lg">` at the top of the mobile viewport.
  * **Tab 1: Play & Chat** (`value="workspace"`)
    * Renders the VideoPlayer container and ChatPanel container.
    * Uses `<Tv className="w-4 h-4 text-cyan-400" />` next to text.
  * **Tab 2: StudyStudio** (`value="studystudio"`)
    * Renders the StudyStudio component container.
    * Uses `<Brain className="w-4 h-4 text-cyan-400" />` next to text.

### StudyStudio Tabs Mobile Scroll & Cleanup
* **Target File:** [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)
* **Description:** Enable horizontal swiping/scrolling on the sub-tabs list on mobile viewports while keeping them fully legible, and hide the close button since StudyStudio is rendered inline on mobile.
* **Sub-tabs Scrolling:**
  * Update `<TabsList>`: Add `overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]` to support overflow scroll and hide the scrollbar natively.
  * Update each `<TabsTrigger>`: Add `shrink-0 min-w-[110px] md:min-w-0` to prevent squeezing on mobile viewports.
* **Close Panel Button:**
  * Update StudyStudio close `<button onClick={onToggleOpen} ...>`: Add `hidden lg:flex` to hide it on mobile since panel collapsing is a desktop-only feature.

---

## Verification Plan

### Manual Verification
* **Device emulation:** Verify header layout, top tabs unified icons, close button visibility, and sub-tabs swipe/scroll behavior in Chrome DevTools using mobile responsive presets down to `360px` width.
* **Component scrolling:** Verify that both the Chat Panel and StudyStudio tabs scroll properly inside their mobile tab views.
