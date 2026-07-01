# Mobile Responsive Layout & Header Design Spec

## Goal Description
Provide a premium, responsive mobile layout for the TubeRAG Workspace Console, resolving header overcrowding and making the StudyStudio panel accessible and usable on mobile devices.

## Proposed Changes

### Header Layout Refactoring
* **Target File:** [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)
* **Description:** Hide non-essential console actions on mobile viewports (below `lg`) to prevent header clipping and layout breakage.
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

### Mobile Workspace Tab Switcher
* **Target File:** [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)
* **Description:** Replace the vertical stacking of Video Player, Chat, and StudyStudio on mobile with a clean, glassmorphic tab switcher using the **shadcn/ui Tabs component**.
* **Structure:**
  * Render `<Tabs defaultValue="workspace" className="w-full flex-grow flex flex-col min-h-0">`.
  * Render a sticky `<TabsList className="grid w-full grid-cols-2 bg-zinc-950/40 border border-zinc-800/50 backdrop-blur-md">` at the top of the mobile viewport.
  * **Tab 1: 📺 Video & Chat** (`value="workspace"`)
    * Renders the VideoPlayer container and ChatPanel container.
  * **Tab 2: 🧠 StudyStudio** (`value="studystudio"`)
    * Renders the StudyStudio component container.

---

## Verification Plan

### Manual Verification
* **Device emulation:** Verify header layout and tab switching behavior in Chrome DevTools using mobile responsive presets (iPhone SE, iPhone 12 Pro, Pixel 7) down to `360px` width.
* **Component scrolling:** Verify that both the Chat Panel and StudyStudio tabs scroll properly inside their mobile tab views.
