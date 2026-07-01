# Mobile Responsive Layout Refinement V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Radix UI/Base-UI based `<Sheet>` component for mobile Left Sidebar navigation and resolve StudyStudio tab container bounding limits for horizontal scroll on desktop resizable viewports.

**Architecture:** Create [sheet.tsx](../../../frontend/src/components/ui/sheet.tsx) using `@base-ui/react/dialog`. Use `<Sheet>` inside `DashboardClient.tsx` to wrap `ControlDrawer` on mobile. Modify `StudyStudio.tsx` to use `min-w-0 overflow-hidden` instead of `shrink-0 overflow-visible` on the main container.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui.

## Global Constraints
- **Biome Formatting:** Run Biome checks after modifications to ensure style compliance.
- **Git Commits:** Always stop at the commit phase. Never push commits automatically.
- **Relative Links:** Use relative paths for all markdown file links.

---

### Task 1: Create Radix Base-UI Sheet Component

**Files:**
* New: [sheet.tsx](../../../frontend/src/components/ui/sheet.tsx)

- [ ] **Step 1: Write sheet component code**

Create `frontend/src/components/ui/sheet.tsx` with the following content:

```tsx
"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
	return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetOverlay({
	className,
	...props
}: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			data-slot="sheet-overlay"
			className={cn(
				"fixed inset-0 z-50 bg-black/60 backdrop-blur-xs duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
				className,
			)}
			{...props}
		/>
	);
}

function SheetContent({
	className,
	children,
	side = "left",
	...props
}: DialogPrimitive.Popup.Props & {
	side?: "left" | "right";
}) {
	return (
		<SheetPortal>
			<SheetOverlay />
			<DialogPrimitive.Popup
				data-slot="sheet-content"
				className={cn(
					"fixed top-0 bottom-0 z-50 h-full w-[320px] bg-white dark:bg-zinc-950 p-6 shadow-2xl transition ease-in-out duration-300 data-open:animate-in data-closed:animate-out outline-none",
					side === "left" &&
						"start-0 data-open:slide-in-from-left data-closed:slide-out-to-left",
					side === "right" &&
						"end-0 data-open:slide-in-from-right data-closed:slide-out-to-right",
					className,
				)}
				{...props}
			>
				{children}
				<DialogPrimitive.Close
					data-slot="sheet-close"
					render={
						<Button
							variant="ghost"
							className="absolute top-4 end-4"
							size="icon-sm"
						/>
					}
				>
					<XIcon className="w-4 h-4" />
					<span className="sr-only">Close</span>
				</DialogPrimitive.Close>
			</DialogPrimitive.Popup>
		</SheetPortal>
	);
}

export {
	Sheet,
	SheetTrigger,
	SheetClose,
	SheetContent,
	SheetOverlay,
	SheetPortal,
};
```

- [ ] **Step 2: Format and Lint**
- [ ] **Step 3: Commit**

---

### Task 2: Integrate Mobile Sheet in DashboardClient

**Files:**
* Modify: [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx)

- [ ] **Step 1: Import Sheet components & separate Mobile vs Desktop ControlDrawer**

Modify [DashboardClient.tsx](../../../frontend/src/components/DashboardClient.tsx) to import Sheet components, remove manual backdrop button, and render isolated Mobile vs Desktop `ControlDrawer`.

- [ ] **Step 2: Format and Lint**
- [ ] **Step 3: Commit**

---

### Task 3: Bounding Limits for StudyStudio Desktop Overflow

**Files:**
* Modify: [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx)

- [ ] **Step 1: Modify StudyStudio container class list**

Update container of [StudyStudio.tsx](../../../frontend/src/components/StudyStudio.tsx) (around line 841) from `shrink-0 overflow-visible` to `min-w-0 overflow-hidden`:

```diff
- className="h-full w-full border-l border-zinc-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col relative shrink-0 z-40 overflow-visible transition-colors duration-300"
+ className="h-full w-full border-l border-zinc-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col relative min-w-0 z-40 overflow-hidden transition-colors duration-300"
```

- [ ] **Step 2: Format and Lint**
- [ ] **Step 3: Commit**
