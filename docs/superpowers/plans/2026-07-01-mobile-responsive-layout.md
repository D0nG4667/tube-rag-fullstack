# Mobile Responsive Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the mobile layout by implementing absolute overlay positioning for the left control drawer, hiding its border pill toggle handle on mobile screens, and ensuring visual consistency.

**Architecture:** Update the container of `ControlDrawer.tsx` to slide *over* the main layout absolutely on mobile viewports using `absolute lg:relative`. Hide the pill border toggle button on mobile using Tailwind's responsive visibility classes.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui.

## Global Constraints
- **Biome Formatting:** Run Biome checks after modifications to ensure style compliance.
- **Git Commits:** Always stop at the commit phase. Never push commits automatically.
- **Relative Links:** Use relative paths for all markdown file links.

---

### Task 1: Absolute Overlay Left Control Drawer

**Files:**
* Modify: [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx)

- [ ] **Step 1: Set drawer motion container to absolute on mobile**

Modify [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx) around line 189 to set absolute positioning on mobile viewports:

```tsx
		<motion.div
			animate={{ width: isOpen ? 320 : 0 }}
			transition={{ type: "spring", stiffness: 220, damping: 26 }}
			className="h-full border-r border-zinc-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col absolute lg:relative top-0 bottom-0 left-0 lg:top-auto lg:bottom-auto lg:left-auto shrink-0 z-45 lg:z-40 overflow-visible transition-colors duration-300 shadow-2xl lg:shadow-none"
		>
```

- [ ] **Step 2: Hide the drag border pill toggle handle on mobile**

Modify the collapse pill button at the bottom of [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx) (around line 422) to hide it on screens below `lg`:

```tsx
			{/* Expand/Collapse border toggle handle button */}
			<button
				type="button"
				onClick={onToggleOpen}
				className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-50 w-5 h-10 rounded-full border border-zinc-800/80 bg-zinc-950/90 text-zinc-400 hover:text-white transition shadow-md items-center justify-center ${
					isRtl ? "left-[-10px]" : "right-[-10px]"
				}`}
			>
```

- [ ] **Step 3: Run Biome format and lint**

Run:
```bash
pnpm format; pnpm lint
```
Expected: formatting and linting completed successfully.

- [ ] **Step 4: Commit**

Run:
```bash
git add frontend/src/components/ControlDrawer.tsx
git commit -m "feat(mobile): set left drawer to absolute overlay and hide border pill toggle handle on mobile"
```
Expected: Commit successfully created locally.
