# Mobile Responsive Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the mobile layout by unifying top tab icons using Lucide vector icons, making StudyStudio sub-tabs horizontally scrollable on mobile, and hiding the StudyStudio close button on mobile viewports.

**Architecture:** Update the mobile workspace triggers in `DashboardClient.tsx` to use `Tv` and `Brain` icons from Lucide instead of emojis. Modify `StudyStudio.tsx` to add scrollable Tailwind utilities to `<TabsList>` and `shrink-0 min-w-[110px]` to `<TabsTrigger>` elements, and hide the X close button on mobile using responsive Tailwind classes.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui.

## Global Constraints
- **Biome Formatting:** Run Biome checks after modifications to ensure style compliance.
- **Git Commits:** Always stop at the commit phase. Never push commits automatically.
- **Relative Links:** Use relative paths for all markdown file links.

---

### Task 1: Unify Top Navigation Tab Icons

**Files:**
* Modify: [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)

- [ ] **Step 1: Import Tv and Brain icons**

Modify imports list in [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx) around line 3 to include `Brain` and `Tv` from `lucide-react`:

```typescript
import {
	AlertCircle,
	BookOpen,
	Brain,
	BrainCircuit,
	Eye,
	EyeOff,
	Key,
	Library,
	Lock,
	Menu,
	Settings as SettingsIcon,
	Trash2,
	Tv,
	Unlock,
	X,
} from "lucide-react";
```

- [ ] **Step 2: Update mobile tab triggers to use unified Lucide icons**

Modify the mobile `<TabsList>` triggers in [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx) around line 440 to render Lucide icons instead of emojis:

```tsx
								<TabsList className="grid w-full grid-cols-2 bg-zinc-900/30 border border-zinc-800/40 backdrop-blur-md rounded-lg">
									<TabsTrigger value="workspace" className="text-xs font-semibold py-2 flex items-center justify-center gap-1.5">
										<Tv className="w-4 h-4 text-cyan-400" />
										<span>{locale === "ar" ? "الدردشة والتشغيل" : "Play & Chat"}</span>
									</TabsTrigger>
									<TabsTrigger value="studystudio" className="text-xs font-semibold py-2 flex items-center justify-center gap-1.5">
										<Brain className="w-4 h-4 text-cyan-400" />
										<span>{locale === "ar" ? "استوديو الدراسة" : "StudyStudio"}</span>
									</TabsTrigger>
								</TabsList>
```

- [ ] **Step 3: Commit**

Run:
```bash
git add frontend/src/components/DashboardClient.tsx
git commit -m "chore(mobile): unify top workspace switcher icons using Lucide Tv and Brain"
```
Expected: Commit successfully created locally.

---

### Task 2: Implement Scrollable StudyStudio Sub-tabs & Hide Close Button

**Files:**
* Modify: [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)

- [ ] **Step 1: Import Radio and Network icons if missing**

Ensure `Radio` and `Network` icons are imported from `lucide-react` at the top of [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx).

- [ ] **Step 2: Hide StudyStudio Close Button on Mobile**

Modify [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx) close button around line 835 to add `hidden lg:flex` to its class:

```tsx
						{/* Close Panel Button */}
						<button
							type="button"
							onClick={onToggleOpen}
							className="hidden lg:flex p-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors duration-300"
							title={locale === "ar" ? "إغلاق" : "Close"}
						>
							<X className="w-4 h-4" />
						</button>
```

- [ ] **Step 3: Make Sub-tabs scrollable on mobile**

Modify [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx) tab list and tab triggers around line 857:

```tsx
					{/* Sub-tab selection */}
					<TabsList className="w-full flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-zinc-200 dark:border-zinc-800/40 p-1 bg-zinc-100/50 dark:bg-zinc-950/30 gap-1 shrink-0 rounded-none bg-transparent">
						<TabsTrigger
							value="outline"
							className="flex-1 shrink-0 min-w-[110px] md:min-w-0 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<BookOpen className="w-3.5 h-3.5" />
							{t.outlineTab}
						</TabsTrigger>
						<TabsTrigger
							value="podcast"
							className="flex-1 shrink-0 min-w-[110px] md:min-w-0 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<Radio className="w-3.5 h-3.5" />
							{t.podcastTab}
						</TabsTrigger>
						<TabsTrigger
							value="mindmap"
							className="flex-1 shrink-0 min-w-[110px] md:min-w-0 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<Network className="w-3.5 h-3.5" />
							{t.conceptMapTab}
						</TabsTrigger>
						<TabsTrigger
							value="notes"
							className="flex-1 shrink-0 min-w-[110px] md:min-w-0 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<PenTool className="w-3.5 h-3.5" />
							{t.notesTab}
						</TabsTrigger>
					</TabsList>
```

- [ ] **Step 4: Run format & lint**

Run:
```bash
pnpm format; pnpm lint
```
Expected: formatting completes cleanly.

- [ ] **Step 5: Commit**

Run:
```bash
git add frontend/src/components/StudyStudio.tsx
git commit -m "feat(mobile): make studystudio sub-tabs scrollable and hide close button"
```
Expected: Commit successfully created locally.
