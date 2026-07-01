# Mobile Responsive Layout Refinement V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `<SheetTrigger>` wrapper on the hamburger menu button and add a `mounted` state hydration guard in `DashboardClient.tsx`.

**Architecture:** Use `<SheetTrigger>` around the mobile menu button and nest `<SheetContent>` inside the header. Add a `mounted` state to `DashboardClient.tsx` that blocks layout rendering until the client has hydrated.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui.

## Global Constraints
- **Biome Formatting:** Run Biome checks after modifications to ensure style compliance.
- **Git Commits:** Always stop at the commit phase. Never push commits automatically.
- **Relative Links:** Use relative paths for all markdown file links.

---

### Task 1: SheetTrigger and Hydration Guard Implementation

**Files:**
* Modify: [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)

- [ ] **Step 1: Update Sheet import**

Import `SheetTrigger` along with `Sheet` and `SheetContent`:

```tsx
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
```

- [ ] **Step 2: Add mounted state and early return**

Add `mounted` state inside `DashboardClient` function, set it `true` in a `useEffect` hook, and return a clean loader when `!mounted`:

```tsx
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// ... other code ...

	if (!mounted) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-background text-zinc-400">
				<Loader2 className="w-6 h-6 animate-spin text-accent-cyan" />
			</div>
		);
	}

	return (
```

- [ ] **Step 3: Relocate Mobile Sheet to Header and Wrap in SheetTrigger**

Remove the standalone mobile `<Sheet>` around line 328. Modify the hamburger button in the header (around line 364) to be wrapped by `<Sheet>` and `<SheetTrigger>`:

```tsx
					<div className="flex items-center gap-2">
						{isMobile ? (
							<Sheet open={isLeftOpen} onOpenChange={setIsLeftOpen}>
								<SheetTrigger
									render={
										<button
											type="button"
											className="p-2 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition"
											title="Toggle Sources"
										>
											<Menu className="w-4 h-4" />
										</button>
									}
								/>
								<SheetContent
									side="left"
									className="p-0 border-r border-zinc-200 dark:border-zinc-800/40 bg-zinc-950 w-[320px] h-full"
								>
									<ControlDrawer
										videos={videos}
										selectedVideoId={selectedVideo?.id || ""}
										onSelectVideo={(video) => {
											setSelectedVideo(video);
											setIsLeftOpen(false);
										}}
										onIngestSuccess={fetchVideos}
										geminiApiKey={geminiApiKey}
										isOpen={true} // Always open within the sheet modal overlay
										onToggleOpen={() => setIsLeftOpen(false)}
										locale={locale}
										onShowToast={showToast}
									/>
								</SheetContent>
							</Sheet>
						) : (
							<BrainCircuit className="w-5 h-5 text-accent-cyan" />
						)}
						<h1 className="text-xs lg:text-sm font-semibold tracking-wider uppercase text-zinc-800 dark:text-zinc-200">
							{t.headerTitle}
						</h1>
					</div>
```

- [ ] **Step 4: Run Biome format and lint**

Run:
```bash
pnpm format; pnpm lint
```
Expected: formatting and linting completed successfully.

- [ ] **Step 5: Commit**

Run:
```bash
git add frontend/src/components/DashboardClient.tsx
git commit -m "feat(mobile): use SheetTrigger and client hydration guard in DashboardClient"
```
Expected: Commit successfully created locally.
