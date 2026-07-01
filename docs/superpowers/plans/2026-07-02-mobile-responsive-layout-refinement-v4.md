# Mobile Responsive Layout Refinement V4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the border collapse pill toggle handle button inside `StudyStudio.tsx` on mobile screen sizes.

**Architecture:** Add `hidden lg:flex` to the collapse handle button in `StudyStudio.tsx` around line 1354.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui.

## Global Constraints
- **Biome Formatting:** Run Biome checks after modifications to ensure style compliance.
- **Git Commits:** Always stop at the commit phase. Never push commits automatically.
- **Relative Links:** Use relative paths for all markdown file links.

---

### Task 1: Hide StudyStudio border collapse pill handle on mobile

**Files:**
* Modify: [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)

- [x] **Step 1: Update class list in StudyStudio**
- [x] **Step 2: Run Biome format and lint**
- [x] **Step 3: Commit**
