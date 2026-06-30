import type React from "react";

interface FooterProps {
	locale?: string;
	minimal?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
	locale = "en",
	minimal = false,
}) => {
	const creationYear = 2026;
	const currentYear = new Date().getFullYear();
	const isRtl = locale === "ar";

	if (minimal) {
		return (
			<footer className="w-full mt-auto py-3 px-4 border-t border-zinc-200 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-950/30 backdrop-blur-md text-[10px] text-zinc-500 dark:text-zinc-400 flex flex-col items-center gap-1 shrink-0 select-none">
				<div>
					{isRtl ? "صنع بـ 💖 بواسطة " : "Made with 💖 by "}{" "}
					<a
						href="https://linkedin.com/in/dr-gabriel-okundaye"
						target="_blank"
						rel="noreferrer"
						className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
					>
						Gabriel Okundaye
					</a>
				</div>
				<div>
					© {creationYear}
					{currentYear !== creationYear ? ` - ${currentYear}` : ""}{" "}
					{isRtl ? "جميع الحقوق محفوظة." : "TubeRAG. All rights reserved."}
				</div>
			</footer>
		);
	}

	return (
		<footer className="w-full mt-auto py-8 border-t border-zinc-200 dark:border-zinc-900 bg-white/40 dark:bg-[#09090b]/40 backdrop-blur-lg text-center z-10 relative">
			<div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
				<div>
					{isRtl ? "صنع بـ 💖 بواسطة " : "Made with 💖 by "}{" "}
					<a
						href="https://linkedin.com/in/dr-gabriel-okundaye"
						target="_blank"
						rel="noreferrer"
						className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
					>
						Gabriel Okundaye
					</a>
				</div>
				<div className="flex items-center gap-1">
					<span>© {creationYear}</span>
					<span>{currentYear !== creationYear ? ` - ${currentYear}` : ""}</span>
					<span>•</span>
					<span>
						{isRtl ? "جميع الحقوق محفوظة." : "TubeRAG. All rights reserved."}
					</span>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
