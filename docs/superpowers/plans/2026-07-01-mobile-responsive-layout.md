# Mobile Responsive Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a premium, responsive mobile layout with a workspace tab switcher, clean navigation icons, swipeable sub-tabs, and absolute drawer overlay positioning.

**Architecture:** Hide secondary actions from the header on mobile, rendering them in the left control drawer. Implement a mobile tab switcher to toggle between the Video/Chat workspace and the StudyStudio workspace. Update triggers to use Lucide vector icons. Set the left drawer to absolute positioning on mobile to overlay the screen, and align StudyStudio sub-tabs to the start.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui.

## Global Constraints
- **Biome Formatting:** Run Biome checks after modifications to ensure style compliance.
- **Git Commits:** Always stop at the commit phase. Never push commits automatically.
- **Relative Links:** Use relative paths for all markdown file links.

---

### Task 1: Add Mobile-Only Secondary Actions to Control Drawer

**Files:**
* Modify: [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx)

- [x] **Step 1: Add mobile-only links to Control Drawer**
- [x] **Step 2: Run Biome format and lint**
- [x] **Step 3: Commit**

---

### Task 2: Refactor Top Header Layout

**Files:**
* Modify: [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)

- [x] **Step 1: Apply responsive styling hidden classes to header**
- [x] **Step 2: Commit**

---

### Task 3: Implement Mobile Workspace Tab Switcher with Unified Lucide Icons

**Files:**
* Modify: [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)

- [x] **Step 1: Import Tv and Brain icons**
- [x] **Step 2: Implement tabs switcher using shadcn/ui and Lucide icons**
- [x] **Step 3: Run Biome format and lint**
- [x] **Step 4: Commit**

---

### Task 4: Set Left Control Drawer to Absolute Overlay

**Files:**
* Modify: [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx)

- [x] **Step 1: Set drawer motion container to absolute positioning on mobile**
- [x] **Step 2: Hide border collapse pill toggle handle on mobile**
- [x] **Step 3: Run Biome format and lint**
- [x] **Step 4: Commit**

---

### Task 5: Align StudyStudio Sub-tabs to Start & Hide Close Button

**Files:**
* Modify: [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)

- [x] **Step 1: Hide close panel X button on mobile**
- [x] **Step 2: Make sub-tabs scrollable and add justify-start to align them to the start**
- [x] **Step 3: Run Biome format and lint**
- [x] **Step 4: Commit**
