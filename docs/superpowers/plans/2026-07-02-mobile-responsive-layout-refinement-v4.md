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

- [ ] **Step 1: Update class list in StudyStudio**

Modify [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx) around line 1358 to include `hidden lg:flex`:

```tsx
			{/* Expand/Collapse border toggle handle button */}
			<button
				type="button"
				onClick={onToggleOpen}
				className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-50 w-5 h-10 rounded-full border border-zinc-800/80 bg-zinc-950/90 text-zinc-400 hover:text-white transition shadow-md items-center justify-center ${
					isRtl ? "right-[-10px]" : "left-[-10px]"
				}`}
			>
```

- [ ] **Step 2: Run Biome format and lint**

Run:
```bash
pnpm format; pnpm lint
```
Expected: formatting and linting completed successfully.

- [ ] **Step 3: Commit**

Run:
```bash
git add frontend/src/components/StudyStudio.tsx
git commit -m "fix(mobile): hide StudyStudio border collapse toggle pill on mobile screens"
```
Expected: Commit successfully created locally.
