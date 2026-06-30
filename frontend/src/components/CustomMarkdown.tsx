import { motion } from "framer-motion";
import type React from "react";
import { Badge } from "@/components/ui/badge";

interface SourceChunk {
	chunk_id: string;
	content: string;
	start_time: number;
	end_time: number;
	chunk_type: string;
	image_url?: string | null;
}

interface CustomMarkdownProps {
	content: string;
	onSeek: (seconds: number) => void;
	sources?: SourceChunk[];
	onHoverSlide?: (url: string | null, x: number, y: number) => void;
	isRtl?: boolean;
}

export default function CustomMarkdown({
	content,
	onSeek,
	sources = [],
	onHoverSlide,
	isRtl = false,
}: CustomMarkdownProps) {
	if (!content) return null;

	const formatTime = (secs: number) => {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m}:${s < 10 ? "0" : ""}${s}`;
	};

	// Helper to parse inline bold and citations
	const parseInlineElements = (text: string) => {
		let nodes: React.ReactNode[] = [text];

		// Parse Citations: [Transcript @ 01:25](cite:transcript:85)
		const citationRegex =
			/\[(Transcript|Slide)\s+@\s+([\d:]+)\]\(cite:(transcript|slide):(\d+)\)/gi;
		nodes = nodes.flatMap((node) => {
			if (typeof node !== "string") return node;
			const parts = [];
			let lastIdx = 0;
			let match: RegExpExecArray | null;
			citationRegex.lastIndex = 0;

			// biome-ignore lint/suspicious/noAssignInExpressions: sequential regex parsing
			while ((match = citationRegex.exec(node)) !== null) {
				if (match.index > lastIdx) {
					parts.push(node.substring(lastIdx, match.index));
				}
				const label = match[1];
				const timeStr = match[2];
				const type = match[3];
				const seconds = parseInt(match[4], 10);

				const matchingSource = sources.find(
					(s) =>
						Math.abs(s.start_time - seconds) < 2 && s.chunk_type === "frame",
				);
				const imageUrl = matchingSource?.image_url;

				const handleMouseEnter = (e: React.MouseEvent) => {
					if (imageUrl && onHoverSlide) {
						onHoverSlide(imageUrl, e.clientX, e.clientY - 160);
					}
				};

				const handleMouseMove = (e: React.MouseEvent) => {
					if (imageUrl && onHoverSlide) {
						onHoverSlide(imageUrl, e.clientX, e.clientY - 160);
					}
				};

				const handleMouseLeave = () => {
					if (onHoverSlide) onHoverSlide(null, 0, 0);
				};

				const isSlide = type.toLowerCase() === "slide";

				parts.push(
					<Badge
						key={`cite-${match.index}`}
						variant="outline"
						className={`align-middle transition mx-0.5 cursor-pointer ${
							isSlide
								? "bg-violet-100 dark:bg-violet-950/40 border-violet-300 dark:border-violet-800/40 text-violet-850 dark:text-violet-400 hover:bg-violet-250 dark:hover:bg-violet-900/60"
								: "bg-cyan-100 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800/40 text-cyan-850 dark:text-cyan-400 hover:bg-cyan-250 dark:hover:bg-cyan-900/60"
						}`}
						render={
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								transition={{ type: "spring", stiffness: 400, damping: 15 }}
								onClick={() => onSeek(seconds)}
								onMouseEnter={handleMouseEnter}
								onMouseMove={handleMouseMove}
								onMouseLeave={handleMouseLeave}
								type="button"
							/>
						}
					>
						{isSlide ? "🖼️" : "🎙️"} {isRtl ? (isSlide ? "شريحة" : "نص") : label} @{" "}
						{timeStr}
					</Badge>,
				);
				lastIdx = citationRegex.lastIndex;
			}
			if (lastIdx < node.length) {
				parts.push(node.substring(lastIdx));
			}
			return parts.length > 0 ? parts : node;
		});

		// Parse Simple Timestamps: [120s]
		const timestampRegex = /\[(\d+)s\]/gi;
		nodes = nodes.flatMap((node) => {
			if (typeof node !== "string") return node;
			const parts = [];
			let lastIdx = 0;
			let match: RegExpExecArray | null;
			timestampRegex.lastIndex = 0;

			// biome-ignore lint/suspicious/noAssignInExpressions: sequential regex parsing
			while ((match = timestampRegex.exec(node)) !== null) {
				if (match.index > lastIdx) {
					parts.push(node.substring(lastIdx, match.index));
				}
				const seconds = parseInt(match[1], 10);
				parts.push(
					<button
						key={`ts-${match.index}`}
						type="button"
						onClick={() => onSeek(seconds)}
						className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/40 text-cyan-850 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/50 text-[10px] font-mono hover:bg-cyan-200 dark:hover:bg-cyan-900/60 transition inline-block mx-0.5 align-middle"
					>
						{formatTime(seconds)}
					</button>,
				);
				lastIdx = timestampRegex.lastIndex;
			}
			if (lastIdx < node.length) {
				parts.push(node.substring(lastIdx));
			}
			return parts.length > 0 ? parts : node;
		});

		// Parse Bold Text: **text**
		const boldRegex = /\*\*(.*?)\*\*/g;
		nodes = nodes.flatMap((node) => {
			if (typeof node !== "string") return node;
			const parts = [];
			let lastIdx = 0;
			let match: RegExpExecArray | null;
			boldRegex.lastIndex = 0;

			// biome-ignore lint/suspicious/noAssignInExpressions: sequential regex parsing
			while ((match = boldRegex.exec(node)) !== null) {
				if (match.index > lastIdx) {
					parts.push(node.substring(lastIdx, match.index));
				}
				const content = match[1];
				parts.push(
					<strong
						key={`bold-${match.index}`}
						className="font-semibold text-zinc-950 dark:text-white"
					>
						{content}
					</strong>,
				);
				lastIdx = boldRegex.lastIndex;
			}
			if (lastIdx < node.length) {
				parts.push(node.substring(lastIdx));
			}
			return parts.length > 0 ? parts : node;
		});

		return nodes;
	};

	// Split by newline and process blocks
	const lines = content.split(/\r?\n/);
	const renderedBlocks: React.ReactNode[] = [];

	let currentListItems: React.ReactNode[] = [];
	let listKey = 0;

	const flushList = () => {
		if (currentListItems.length > 0) {
			renderedBlocks.push(
				<ul
					key={`list-${listKey++}`}
					className="list-disc pl-5 my-2 flex flex-col gap-1 text-zinc-900 dark:text-zinc-200"
				>
					{currentListItems}
				</ul>,
			);
			currentListItems = [];
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		// Handle empty lines
		if (!trimmed) {
			flushList();
			renderedBlocks.push(<div key={`space-${i}`} className="h-2" />);
			continue;
		}

		// Handle Horizontal Rule
		if (trimmed === "---") {
			flushList();
			renderedBlocks.push(
				<hr
					key={`hr-${i}`}
					className="my-4 border-zinc-200 dark:border-zinc-800"
				/>,
			);
			continue;
		}

		// Handle Headings
		if (trimmed.startsWith("# ")) {
			flushList();
			renderedBlocks.push(
				<h1
					key={`h1-${i}`}
					className="text-lg font-bold text-zinc-950 dark:text-white mt-4 mb-2 tracking-tight"
				>
					{parseInlineElements(trimmed.slice(2))}
				</h1>,
			);
			continue;
		}
		if (trimmed.startsWith("## ")) {
			flushList();
			renderedBlocks.push(
				<h2
					key={`h2-${i}`}
					className="text-base font-semibold text-zinc-900 dark:text-white mt-3.5 mb-1.5"
				>
					{parseInlineElements(trimmed.slice(3))}
				</h2>,
			);
			continue;
		}
		if (trimmed.startsWith("### ")) {
			flushList();
			renderedBlocks.push(
				<h3
					key={`h3-${i}`}
					className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-3 mb-1"
				>
					{parseInlineElements(trimmed.slice(4))}
				</h3>,
			);
			continue;
		}

		// Handle List Items (e.g. * Item or - Item)
		const listMatch = line.match(/^(\s*)([*+-])\s+(.*)$/);
		if (listMatch) {
			const indent = listMatch[1].length;
			const bulletContent = listMatch[3];

			currentListItems.push(
				<li
					key={`li-${i}`}
					className={`text-zinc-850 dark:text-zinc-200 text-xs leading-relaxed ${
						indent > 0 ? "ml-4 list-[circle]" : ""
					}`}
				>
					{parseInlineElements(bulletContent)}
				</li>,
			);
			continue;
		}

		// If it's not a list item, flush any active list first
		flushList();

		// Default Paragraph block
		renderedBlocks.push(
			<p
				key={`p-${i}`}
				className="text-zinc-850 dark:text-zinc-250 text-xs leading-relaxed my-1.5 font-normal"
			>
				{parseInlineElements(line)}
			</p>,
		);
	}

	// Flush any remaining list items at the end
	flushList();

	return <div className="flex flex-col select-text">{renderedBlocks}</div>;
}
