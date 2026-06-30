"use client";

import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) => (
	<ResizablePrimitive.Group
		className={cn(
			"flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
			className,
		)}
		{...props}
	/>
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
	withHandle?: boolean;
}) => (
	<ResizablePrimitive.Separator
		className={cn(
			"relative flex w-1 items-center justify-center bg-zinc-200 dark:bg-zinc-800/40 hover:bg-zinc-300 dark:hover:bg-zinc-700/60 transition-all after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-1 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-2 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:translate-y-[-50%] [&[data-panel-group-state=active]]:bg-cyan-500",
			className,
		)}
		{...props}
	>
		{withHandle && (
			<div className="z-10 flex h-8 w-4 items-center justify-center rounded border border-zinc-350 dark:border-zinc-850/80 bg-zinc-100 dark:bg-zinc-950/90 gap-0.5">
				<GripVertical className="h-3 w-3 text-zinc-400 dark:text-zinc-600" />
			</div>
		)}
	</ResizablePrimitive.Separator>
);

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
