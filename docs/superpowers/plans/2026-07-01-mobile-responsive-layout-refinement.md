# Mobile Responsive Layout Refinement Implementation Plan (Phase 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the mobile layout overlay, backdrop interactions, and fix desktop StudyStudio tabs overlapping.

**Architecture:** Add a fixed overlay backdrop in `DashboardClient.tsx` that dismisses the left drawer on click. Set the left drawer background color to solid opaque in `ControlDrawer.tsx` on mobile. Refactor `StudyStudio.tsx` to remove `md:min-w-0` and set tabs triggers to `shrink-0 flex-1 px-3` to prevent overlapping on desktop viewports.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui.

## Global Constraints
- **Biome Formatting:** Run Biome checks after modifications to ensure style compliance.
- **Git Commits:** Always stop at the commit phase. Never push commits automatically.
- **Relative Links:** Use relative paths for all markdown file links.

---

### Task 1: Mobile Left Drawer Backdrop & Opacity

**Files:**
* Modify: [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)
* Modify: [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx)

- [x] **Step 1: Add overlay backdrop to DashboardClient**
- [x] **Step 2: Set ControlDrawer mobile background to opaque**
- [x] **Step 3: Commit**

---

### Task 2: Fix StudyStudio Tabs Desktop Overlapping

**Files:**
* Modify: [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)

- [x] **Step 1: Remove md:min-w-0 and configure triggers**
- [x] **Step 2: Run Biome format and lint**
- [x] **Step 3: Commit**
