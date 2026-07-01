# Mobile Responsive Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the mobile layout by implementing `justify-start` flex layout on StudyStudio `<TabsList>` to prevent clipping the first tab trigger ("Outline") on mobile screens.

**Architecture:** Add the `justify-start` class to the sub-tabs selection bar in `StudyStudio.tsx` to override the default `justify-center` from the shadcn/ui variants list.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui.

## Global Constraints
- **Biome Formatting:** Run Biome checks after modifications to ensure style compliance.
- **Git Commits:** Always stop at the commit phase. Never push commits automatically.
- **Relative Links:** Use relative paths for all markdown file links.

---

### Task 1: Align Sub-tabs List to Start

**Files:**
* Modify: [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)

- [ ] **Step 1: Add justify-start to TabsList className**

Modify [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx) around line 857 to include `justify-start`:

```tsx
					{/* Sub-tab selection */}
					<TabsList className="w-full flex justify-start overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-zinc-200 dark:border-zinc-800/40 p-1 bg-zinc-100/50 dark:bg-zinc-950/30 gap-1 shrink-0 rounded-none bg-transparent">
```

- [ ] **Step 2: Run format and lint**

Run:
```bash
pnpm format; pnpm lint
```
Expected: formatting and linting completed successfully.

- [ ] **Step 3: Commit**

Run:
```bash
git add frontend/src/components/StudyStudio.tsx
git commit -m "fix(mobile): align StudyStudio sub-tabs to start to prevent first tab clipping"
```
Expected: Commit successfully created locally.
