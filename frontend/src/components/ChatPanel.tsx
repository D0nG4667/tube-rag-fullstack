"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Eye, Play } from "lucide-react";
import { motion } from "framer-motion";
import SpotlightPanel from "./SpotlightPanel";

interface SourceChunk {
	chunk_id: string;
	content: string;
	start_time: number;
	end_time: number;
	chunk_type: string;
	image_url?: string | null;
}

interface Message {
	role: "user" | "assistant";
	text: string;
	sources?: SourceChunk[];
}

interface ChatPanelProps {
	videoId: string;
	onSeek: (seconds: number) => void;
	onFocusChange?: (focused: boolean) => void;
}

export default function ChatPanel({
	videoId,
	onSeek,
	onFocusChange,
}: ChatPanelProps) {
	const [messages, setMessages] = useState<Message[]>([
		{
			role: "assistant",
			text: "Hello! I am TubeRAG, your creative AI video assistant. Ask me anything about the slide decks or transcript of this video, and I will search semantic nodes and answer with interactive playback citation badges.",
		},
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const chatEndRef = useRef<HTMLDivElement>(null);

	// State for hover slide preview
	const [hoveredSlideUrl, setHoveredSlideUrl] = useState<string | null>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	// biome-ignore lint/correctness/useExhaustiveDependencies: Scroll chat to bottom whenever messages list length or loading state changes
	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, loading]);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || !videoId || loading) return;

		const userMessage = input.trim();
		setInput("");
		setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
		setLoading(true);

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ video_id: videoId, message: userMessage }),
				},
			);

			if (!res.ok) {
				throw new Error(" RAG server error");
			}

			const data = await res.json();
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					text: data.response,
					sources: data.sources,
				},
			]);
		} catch {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					text: "⚠️ An error occurred while retrieving answer from the RAG engine. Please ensure the backend is running.",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	// Parses response text for citation markdown and returns React Nodes
	const renderMessageText = (text: string, sources: SourceChunk[] = []) => {
		const citationRegex =
			/\[(Transcript|Slide) @ (\d{1,2}:\d{2})\]\(cite:(transcript|slide):(\d+)\)/g;
		const matches = Array.from(text.matchAll(citationRegex));

		if (matches.length === 0) return text;

		const parts = [];
		let lastIndex = 0;

		for (const match of matches) {
			const matchIndex = match.index ?? 0;
			const [fullMatch, type, timeStr, citeType, secondsStr] = match;
			const seconds = parseInt(secondsStr, 10);

			// Add plain text before match
			if (matchIndex > lastIndex) {
				parts.push(text.substring(lastIndex, matchIndex));
			}

			// Find matching slide source image URL if it is a Slide citation
			let slideImageUrl: string | null = null;
			if (citeType === "slide") {
				const found = sources.find(
					(src) =>
						src.chunk_type === "frame" &&
						Math.abs(src.start_time - seconds) <= 15,
				);
				if (found?.image_url) {
					slideImageUrl = found.image_url;
				}
			}

			parts.push(
				<motion.button
					key={`${matchIndex}-${seconds}`}
					type="button"
					onClick={() => onSeek(seconds)}
					whileHover={{ scale: 1.08 }}
					whileTap={{ scale: 0.95 }}
					transition={{ type: "spring", stiffness: 400, damping: 10 }}
					onMouseEnter={(e) => {
						if (slideImageUrl) {
							setHoveredSlideUrl(slideImageUrl);
							setMousePos({ x: e.clientX + 10, y: e.clientY - 120 });
						}
					}}
					onMouseMove={(e) => {
						if (slideImageUrl) {
							setMousePos({ x: e.clientX + 10, y: e.clientY - 120 });
						}
					}}
					onMouseLeave={() => setHoveredSlideUrl(null)}
					className={`inline-flex items-center gap-1 px-2 py-0.5 mx-1 text-xs rounded border transition duration-150 select-none cursor-pointer ${
						citeType === "slide"
							? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30 hover:bg-accent-cyan/25"
							: "bg-accent-violet/15 text-accent-violet border-accent-violet/30 hover:bg-accent-violet/25"
					}`}
				>
					{citeType === "slide" ? (
						<Eye className="w-3 h-3" />
					) : (
						<Play className="w-3 h-3" />
					)}
					<span>
						{type} @ {timeStr}
					</span>
				</motion.button>,
			);

			lastIndex = matchIndex + fullMatch.length;
		}

		if (lastIndex < text.length) {
			parts.push(text.substring(lastIndex));
		}

		return parts;
	};

	return (
		<SpotlightPanel className="flex flex-col h-full rounded-2xl backdrop-blur-2xl bg-zinc-950/20 border border-zinc-800/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden relative">
			{/* Slide Image Hover Preview Overlay */}
			{hoveredSlideUrl && (
				<div
					style={{
						position: "fixed",
						left: mousePos.x,
						top: mousePos.y,
						zIndex: 999,
					}}
					className="w-48 aspect-video rounded-lg overflow-hidden border border-accent-cyan bg-zinc-950 shadow-2xl pointer-events-none transition-opacity duration-150"
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={hoveredSlideUrl}
						alt="Slide Preview"
						className="w-full h-full object-cover"
					/>
				</div>
			)}

			{/* Header */}
			<div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2">
				<Sparkles className="w-4 h-4 text-accent-cyan animate-pulse" />
				<span className="font-semibold text-sm text-zinc-200">
					TubeRAG Agentic Chat
				</span>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
				{messages.map((msg, idx) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: Order of chat messages list is strictly sequential and stable
						key={idx}
						className={`flex gap-3 max-w-[85%] ${
							msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
						}`}
					>
						<div
							className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
								msg.role === "user"
									? "bg-accent-violet/20 border border-accent-violet/40 text-accent-violet"
									: "bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan"
							}`}
						>
							{msg.role === "user" ? "U" : "AI"}
						</div>
						<div
							className={`p-3 rounded-xl border text-sm leading-relaxed ${
								msg.role === "user"
									? "bg-accent-violet/5 border-accent-violet/20 text-zinc-200"
									: "bg-zinc-900/35 border-zinc-800/35 text-zinc-300"
							}`}
						>
							{msg.role === "user"
								? msg.text
								: renderMessageText(msg.text, msg.sources || [])}
						</div>
					</div>
				))}
				{loading && (
					<div className="flex justify-start">
						<div className="bg-zinc-900/60 text-zinc-300 border border-zinc-800/50 rounded-2xl px-4 py-3 flex items-center gap-2">
							<Loader2 className="w-4 h-4 animate-spin text-accent-cyan" />
							<span className="text-xs font-semibold text-zinc-400">
								Retrieving segments & generating grounded answer...
							</span>
						</div>
					</div>
				)}
				<div ref={chatEndRef} />
			</div>

			{/* Input form */}
			<form
				onSubmit={handleSend}
				className="p-3 border-t border-zinc-800/50 flex gap-2"
			>
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onFocus={() => onFocusChange?.(true)}
					onBlur={() => onFocusChange?.(false)}
					placeholder={
						videoId
							? "Ask about slide decks or code screens..."
							: "Select a video to chat..."
					}
					disabled={!videoId || loading}
					className="flex-1 px-4 py-2 text-sm rounded-lg bg-zinc-900/80 border border-zinc-800 focus:outline-none focus:border-accent-cyan text-zinc-200 placeholder-zinc-500 disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={!videoId || loading}
					className="p-2 rounded-lg bg-accent-cyan hover:bg-accent-cyan/85 text-black flex items-center justify-center transition disabled:opacity-50"
				>
					<Send className="w-4 h-4" />
				</button>
			</form>
		</SpotlightPanel>
	);
}
