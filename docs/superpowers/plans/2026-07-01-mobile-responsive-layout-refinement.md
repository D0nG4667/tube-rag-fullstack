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

- [ ] **Step 1: Add overlay backdrop to DashboardClient**

Modify [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx) around line 328 to render a backdrop:

```tsx
			{/* Collapsible Left drawer control */}
			<ControlDrawer
				videos={videos}
				selectedVideoId={selectedVideo?.id || ""}
				onSelectVideo={(video) => {
					setSelectedVideo(video);
					if (isMobile) setIsLeftOpen(false);
				}}
				onIngestSuccess={fetchVideos}
				geminiApiKey={geminiApiKey}
				isOpen={isLeftOpen}
				onToggleOpen={() => setIsLeftOpen(!isLeftOpen)}
				locale={locale}
				onShowToast={showToast}
			/>

			{/* Mobile Backdrop Overlay */}
			{isMobile && isLeftOpen && (
				<button
					type="button"
					onClick={() => setIsLeftOpen(false)}
					className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 w-full h-full cursor-default"
					aria-label="Close menu"
				/>
			)}
```

- [ ] **Step 2: Set ControlDrawer mobile background to opaque**

Modify [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx) around line 189 to set solid background on mobile:

```tsx
		<motion.div
			animate={{ width: isOpen ? 320 : 0 }}
			transition={{ type: "spring", stiffness: 220, damping: 26 }}
			className="h-full border-r border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-950 lg:bg-white/80 lg:dark:bg-zinc-950/40 lg:backdrop-blur-2xl flex flex-col absolute lg:relative top-0 bottom-0 left-0 lg:top-auto lg:bottom-auto lg:left-auto shrink-0 z-45 lg:z-40 overflow-visible transition-colors duration-300 shadow-2xl lg:shadow-none"
		>
```

- [ ] **Step 3: Commit**

Run:
```bash
git add frontend/src/components/ControlDrawer.tsx frontend/src/components/DashboardClient.tsx
git commit -m "feat(mobile): add click-to-dismiss backdrop and solid background overlay for mobile drawer"
```
Expected: Commit successfully created locally.

---

### Task 2: Fix StudyStudio Tabs Desktop Overlapping

**Files:**
* Modify: [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)

- [ ] **Step 1: Remove md:min-w-0 and configure triggers**

Modify [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx) triggers around line 859 to remove `md:min-w-0`:

```tsx
					{/* Sub-tab selection */}
					<TabsList className="w-full flex justify-start overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-zinc-200 dark:border-zinc-800/40 p-1 bg-zinc-100/50 dark:bg-zinc-950/30 gap-1 shrink-0 rounded-none bg-transparent">
						<TabsTrigger
							value="outline"
							className="flex-1 shrink-0 px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<BookOpen className="w-3.5 h-3.5" />
							{t.outlineTab}
						</TabsTrigger>
						<TabsTrigger
							value="podcast"
							className="flex-1 shrink-0 px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<Radio className="w-3.5 h-3.5" />
							{t.podcastTab}
						</TabsTrigger>
						<TabsTrigger
							value="mindmap"
							className="flex-1 shrink-0 px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<Network className="w-3.5 h-3.5" />
							{t.conceptMapTab}
						</TabsTrigger>
						<TabsTrigger
							value="notes"
							className="flex-1 shrink-0 px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<PenTool className="w-3.5 h-3.5" />
							{t.notesTab}
						</TabsTrigger>
					</TabsList>
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
git commit -m "fix(desktop): fix StudyStudio tabs overlapping on narrow desktop resizes"
```
Expected: Commit successfully created locally.
