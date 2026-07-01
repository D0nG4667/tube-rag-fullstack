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
					"fixed top-0 bottom-0 z-50 h-full w-[320px] bg-white dark:bg-zinc-950 p-0 shadow-2xl transition ease-in-out duration-300 data-open:animate-in data-closed:animate-out outline-none",
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
							className="absolute top-4 end-4 z-50"
							size="icon-sm"
						/>
					}
				>
					<XIcon className="w-4 h-4 text-zinc-400 hover:text-white" />
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
