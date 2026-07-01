# Mobile Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a responsive, accessible mobile layout with a workspace tab switcher using shadcn/ui.

**Architecture:** Refactor the top header actions to hide non-essential items on mobile screens, exposing them in the mobile Left Control Drawer. Replace vertical stacking in the mobile viewport with a shadcn/ui Tabs layout to toggle between the Video/Chat workspace and the StudyStudio workspace.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui Tabs (Base UI).

## Global Constraints
- **Biome Formatting:** Run Biome checks after modifications to ensure style compliance.
- **Git Commits:** Always stop at the commit phase. Never push commits automatically.
- **Relative Links:** Use relative paths for all markdown file links.

---

### Task 1: Add Mobile-Only Secondary Actions to Control Drawer

**Files:**
* Modify: [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx)

**Interfaces:**
* Consumes: Existing drawer props and settings.
* Produces: Appended mobile action footer links.

- [ ] **Step 1: Add mobile-only links to Control Drawer**

Modify [ControlDrawer.tsx](../../../frontend/src/components/ControlDrawer.tsx) by adding a mobile-only footer containing the Roadmap, Coffee Support, and Language toggle, rendered at the bottom of the drawer content. Find the closing scroll area tag `</ScrollArea>` around line 371:

```tsx
				{/* Existing scroll area content ending */}
				</ScrollArea>

				{/* NEW: Mobile-only Actions Footer (Visible only below lg screen width) */}
				<div className="lg:hidden p-4 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-950/20 backdrop-blur-md flex flex-col gap-3 shrink-0">
					{selectedVideoId && (
						<div className="flex items-center gap-2 text-xs bg-zinc-100/60 dark:bg-zinc-900/60 px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800/80">
							<Library className="w-3.5 h-3.5 text-accent-cyan" />
							<span className="font-mono text-zinc-600 dark:text-zinc-400">
								{t.activeYtId}: {selectedVideoId}
							</span>
						</div>
					)}
					<div className="grid grid-cols-2 gap-2">
						<Link
							href={`/${locale}/roadmap`}
							className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 transition"
						>
							<BrainCircuit className="w-3.5 h-3.5 text-accent-cyan" />
							<span>{locale === "ar" ? "خريطة الطريق" : "Roadmap"}</span>
						</Link>
						<Link
							href={locale === "en" ? "/ar" : "/en"}
							className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 transition"
						>
							{t.languageLabel}
						</Link>
					</div>
					<a
						href={process.env.NEXT_PUBLIC_COFFEE_URL || "https://sociabuzz.com/gabcares/support"}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center gap-2 text-xs font-semibold py-2 px-4 rounded-full border border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-950/40 transition-all duration-300"
					>
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
						</span>
						{t.buyMeCoffee}
					</a>
				</div>
```

- [ ] **Step 2: Run Biome format and lint**

Run:
```bash
pnpm format; pnpm lint
```
Expected: Files format successfully, no lint errors.

- [ ] **Step 3: Commit**

Run:
```bash
git add frontend/src/components/ControlDrawer.tsx
git commit -m "feat(mobile): add secondary action footer links to mobile control drawer"
```
Expected: Commit successfully created locally.

---

### Task 2: Refactor Top Header Layout

**Files:**
* Modify: [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)

**Interfaces:**
* Consumes: Existing header layout.
* Produces: Clean mobile header with essential buttons only.

- [ ] **Step 1: Apply responsive styling hidden classes to header**

Modify [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx) by adding responsive visibility modifiers to the secondary header links (lines 347 to 437). Update the elements to include `hidden lg:inline-flex` or `hidden lg:flex`, and wrap the "Active YT ID" badge in `hidden md:inline-flex`.

```tsx
					<div className="flex items-center gap-4">
						{selectedVideo && (
							<div className="hidden md:flex items-center gap-2 text-xs bg-zinc-100/60 dark:bg-zinc-900/60 px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800/80">
								<Library className="w-3.5 h-3.5 text-accent-cyan" />
								<span className="font-mono text-zinc-600 dark:text-zinc-400">
									{t.activeYtId}: {selectedVideo.youtube_id}
								</span>
							</div>
						)}
						{geminiApiKey ? (
							<div className="flex items-center gap-1.5 text-xs bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded border border-emerald-500/20">
								<Key className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">{t.customKeyActive}</span>
							</div>
						) : hasSavedKey ? (
							<div className="flex items-center gap-1.5 text-xs bg-amber-950/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded border border-amber-500/20">
								<Lock className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">{t.lockedKey}</span>
							</div>
						) : null}

						{/* Settings Trigger Icon */}
						<button
							type="button"
							onClick={() => setIsSettingsOpen(true)}
							className="p-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
							title={t.settingsTitle}
						>
							<SettingsIcon className="w-4 h-4" />
						</button>

						{/* Dark/Light mode toggle */}
						<ModeToggle />

						{/* Toggle StudyStudio Panel (Desktop Only) */}
						<button
							type="button"
							onClick={() => {
								if (isRightOpen) {
									rightPanelRef.current?.collapse();
								} else {
									rightPanelRef.current?.expand();
								}
							}}
							className={`hidden lg:inline-flex p-1.5 rounded-full border transition-all duration-300 ${
								isRightOpen
									? "border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-950/40"
									: "border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
							}`}
							title={
								locale === "ar" ? "تبديل استوديو الدراسة" : "Toggle StudyStudio"
							}
						>
							<BookOpen className="w-4 h-4" />
						</button>

						{/* Roadmap Link (Desktop Only) */}
						<Link
							href={`/${locale}/roadmap`}
							className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
							title={locale === "ar" ? "خريطة الطريق" : "Roadmap"}
						>
							<BrainCircuit className="w-3.5 h-3.5 text-accent-cyan" />
							<span>{locale === "ar" ? "خريطة الطريق" : "Roadmap"}</span>
						</Link>

						{/* Language Switch Toggle Component (Desktop Only) */}
						<Link
							href={locale === "en" ? "/ar" : "/en"}
							className="hidden lg:flex text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
						>
							{t.languageLabel}
						</Link>

						{/* Coffee Link (Desktop Only) */}
						<a
							href={
								process.env.NEXT_PUBLIC_COFFEE_URL ||
								"https://sociabuzz.com/gabcares/support"
							}
							target="_blank"
							rel="noopener noreferrer"
							className="hidden lg:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-950/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all duration-300"
						>
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
							</span>
							{t.buyMeCoffee}
						</a>
					</div>
```

- [ ] **Step 2: Commit**

Run:
```bash
git add frontend/src/components/DashboardClient.tsx
git commit -m "chore(header): hide desktop secondary actions from header on mobile viewports"
```
Expected: Commit successfully created locally.

---

### Task 3: Implement Mobile Workspace Tab Switcher

**Files:**
* Modify: [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)

**Interfaces:**
* Consumes: shadcn/ui Tabs components, mobile viewport layout.
* Produces: Tabbed mobile view replacing vertically stacked list layout.

- [ ] **Step 1: Import Tabs components**

Add imports at the top of [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx):

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

- [ ] **Step 2: Implement tabbed layout in mobile view**

Locate the `isMobile` ternary block inside [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx) (around line 440):

```tsx
				{/* Viewport & chat splits + StudyStudio */}
				<div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
					{isMobile ? (
						<Tabs defaultValue="workspace" className="flex-grow flex flex-col min-h-0 w-full">
							<div className="px-4 shrink-0">
								<TabsList className="grid w-full grid-cols-2 bg-zinc-900/30 border border-zinc-800/40 backdrop-blur-md rounded-lg">
									<TabsTrigger value="workspace" className="text-xs font-semibold py-2">
										{locale === "ar" ? "📺 الدردشة والتشغيل" : "📺 Play & Chat"}
									</TabsTrigger>
									<TabsTrigger value="studystudio" className="text-xs font-semibold py-2">
										{locale === "ar" ? "🧠 استوديو الدراسة" : "🧠 StudyStudio"}
									</TabsTrigger>
								</TabsList>
							</div>

							<div className="flex-1 min-h-0 p-4 relative">
								{/* Tab 1: Video Player & Chat Panel */}
								<TabsContent value="workspace" className="absolute inset-0 flex flex-col gap-4 overflow-y-auto px-4 pb-4">
									{/* Video player container */}
									<div className="flex flex-col gap-4 min-h-[250px] sm:min-h-[300px] shrink-0">
										<div className="glass-panel p-4 rounded-xl flex-1 flex flex-col justify-center min-h-0">
											<span className="text-xs text-zinc-500 font-semibold tracking-widest mb-3 block">
												{t.videoPlayerEngine}
											</span>
											<VideoPlayer
												ref={playerRef}
												youtubeId={selectedVideo?.youtube_id || ""}
											/>
										</div>
									</div>

									{/* Agentic chat module */}
									<div className="flex-1 flex flex-col min-h-[350px]">
										<ChatPanel
											videoId={selectedVideo?.id || ""}
											onSeek={handleSeek}
											onFocusChange={setIsChatFocused}
											geminiApiKey={geminiApiKey}
											locale={locale}
											onApiKeyExpired={() => setIsSettingsOpen(true)}
										/>
									</div>
								</TabsContent>

								{/* Tab 2: StudyStudio Panel */}
								<TabsContent value="studystudio" className="absolute inset-0 flex flex-col px-4 pb-4">
									<div className="flex-1 flex flex-col min-h-0">
										<StudyStudio
											videoId={selectedVideo?.id || ""}
											videoTitle={selectedVideo?.title || ""}
											onSeek={handleSeek}
											geminiApiKey={geminiApiKey}
											isOpen={true}
											onToggleOpen={() => {}}
											locale={locale}
											onApiKeyExpired={() => setIsSettingsOpen(true)}
											onShowToast={showToast}
										/>
									</div>
								</TabsContent>
							</div>
						</Tabs>
					) : (
```

- [ ] **Step 3: Run Biome format and lint**

Run:
```bash
pnpm format; pnpm lint
```
Expected: Code clean-up completes successfully.

- [ ] **Step 4: Commit**

Run:
```bash
git add frontend/src/components/DashboardClient.tsx
git commit -m "feat(mobile): integrate shadcn tabs for workspace vs studystudio mobile layout"
```
Expected: Commit successfully created locally.
