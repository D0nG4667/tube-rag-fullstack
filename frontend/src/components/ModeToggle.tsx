"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900/50" />
		);
	}

	const currentTheme = theme === "system" ? "dark" : theme;

	return (
		<button
			type="button"
			onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
			className="p-2 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all duration-300 flex items-center justify-center"
			title={
				currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
			}
		>
			{currentTheme === "dark" ? (
				<Sun className="w-4 h-4 text-amber-400" />
			) : (
				<Moon className="w-4 h-4 text-violet-400" />
			)}
		</button>
	);
}
