"use client";

import { Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type Locale, translations } from "@/lib/translations";
import CustomMarkdown from "./CustomMarkdown";
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
	id: string;
	role: "user" | "assistant";
	text: string;
	sources?: SourceChunk[];
}

interface ChatPanelProps {
	videoId: string;
	onSeek: (seconds: number) => void;
	onFocusChange?: (focused: boolean) => void;
	geminiApiKey?: string;
	locale?: string;
	onApiKeyExpired?: () => void;
}

export default function ChatPanel({
	videoId,
	onSeek,
	onFocusChange,
	geminiApiKey,
	locale = "en",
	onApiKeyExpired,
}: ChatPanelProps) {
	const t = translations[locale as Locale] || translations.en;
	const isRtl = locale === "ar";

	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const chatEndRef = useRef<HTMLDivElement>(null);

	// State for hover slide preview
	const [hoveredSlideUrl, setHoveredSlideUrl] = useState<string | null>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	// Initialize localized welcome message
	useEffect(() => {
		setMessages([
			{
				id: "welcome-msg",
				role: "assistant",
				text: isRtl
					? "مرحباً! أنا TubeRAG، مساعد الفيديو الإبداعي بالذكاء الاصطناعي. اسألني أي شيء عن الشرائح أو النص التلقائي لهذا الفيديو، وسأقوم بالبحث في العقد الدلالية والإجابة بشارات اقتباس تفاعلية."
					: "Hello! I am TubeRAG, your creative AI video assistant. Ask me anything about the slide decks or transcript of this video, and I will search semantic nodes and answer with interactive playback citation badges.",
			},
		]);
	}, [isRtl]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Scroll chat to bottom whenever messages list length or loading state changes
	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length, loading]);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || !videoId || loading) return;

		const userMsg: Message = {
			id: `user-${Date.now()}`,
			role: "user",
			text: input.trim(),
		};
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setLoading(true);

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/query`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(geminiApiKey ? { "X-Gemini-API-Key": geminiApiKey } : {}),
					},
					body: JSON.stringify({
						video_id: videoId,
						message: userMsg.text,
					}),
				},
			);

			if (!res.ok) {
				if (res.status === 429) {
					onApiKeyExpired?.();
					setMessages((prev) => [
						...prev,
						{
							id: `ai-429-${Date.now()}`,
							role: "assistant",
							text: isRtl
								? "⚠️ تم استهلاك حصة المفتاح الافتراضي لـ Gemini. يرجى إدخال مفتاح Gemini الخاص بك لتخطي هذا الحد."
								: "⚠️ Gemini API free tier quota exceeded. Please configure your own Gemini API Key in settings to bypass this limit.",
						},
					]);
					return;
				}
				throw new Error();
			}
			const data = await res.json();

			setMessages((prev) => [
				...prev,
				{
					id: `ai-res-${Date.now()}`,
					role: "assistant",
					text: data.response,
					sources: data.sources,
				},
			]);
		} catch {
			setMessages((prev) => [
				...prev,
				{
					id: `ai-err-${Date.now()}`,
					role: "assistant",
					text: isRtl
						? "⚠️ عذراً، فشل وكيل TubeRAG في معالجة طلبك حالياً."
						: "⚠️ Apologies, the TubeRAG agent failed to process your request at this time.",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<SpotlightPanel className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-950/20 flex flex-col min-h-0 overflow-hidden relative shadow-inner transition-colors duration-300">
			{/* Hover slide visual preview overlay */}
			{hoveredSlideUrl && (
				<div
					className="fixed z-50 w-64 h-36 rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden pointer-events-none transition-transform"
					style={{
						left: isRtl ? mousePos.x - 270 : mousePos.x + 15,
						top: mousePos.y,
					}}
				>
					<img
						src={hoveredSlideUrl}
						alt="Slide Preview"
						className="w-full h-full object-cover"
					/>
				</div>
			)}

			{/* Header */}
			<div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center gap-2">
				<Sparkles className="w-4 h-4 text-accent-cyan animate-pulse" />
				<span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
					{t.chatEngine}
				</span>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
				{messages.length === 0 ? (
					<div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
						<Loader2 className="w-5 h-5 text-accent-cyan animate-spin" />
					</div>
				) : (
					messages.map((msg) => {
						const cardEl = (
							<div
								key={msg.id}
								className={`flex gap-3 max-w-[85%] ${
									msg.role === "user"
										? "self-end flex-row-reverse"
										: "self-start"
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
									className={`p-3 rounded-xl border text-sm leading-relaxed transition-all duration-300 ${
										msg.role === "user"
											? "bg-accent-violet/5 border-accent-violet/20 text-zinc-800 dark:text-zinc-200"
											: "bg-zinc-100/60 dark:bg-zinc-900/35 border-zinc-200 dark:border-zinc-800/35 text-zinc-700 dark:text-zinc-300"
									}`}
								>
									{msg.role === "user" ? (
										msg.text
									) : (
										<CustomMarkdown
											content={msg.text}
											onSeek={onSeek}
											sources={msg.sources || []}
											onHoverSlide={(url, x, y) => {
												setHoveredSlideUrl(url);
												setMousePos({ x, y });
											}}
											isRtl={isRtl}
										/>
									)}
								</div>
							</div>
						);
						return cardEl;
					})
				)}
				{loading && (
					<div className="flex justify-start">
						<div className="bg-zinc-100/80 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl px-4 py-3 flex items-center gap-2">
							<Loader2 className="w-4 h-4 animate-spin text-accent-cyan" />
							<span className="text-xs font-semibold text-zinc-400">
								{isRtl
									? "جاري البحث عن المقاطع وصياغة الإجابة..."
									: "Retrieving segments & generating grounded answer..."}
							</span>
						</div>
					</div>
				)}
				<div ref={chatEndRef} />
			</div>

			{/* Input form */}
			<form
				onSubmit={handleSend}
				className="p-3 border-t border-zinc-200 dark:border-zinc-800/50 flex gap-2"
			>
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onFocus={() => onFocusChange?.(true)}
					onBlur={() => onFocusChange?.(false)}
					placeholder={
						videoId
							? t.chatInputPlaceholder
							: isRtl
								? "اختر فيديو لبدء الدردشة..."
								: "Select a video to chat..."
					}
					disabled={!videoId || loading}
					className="flex-1 px-4 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-accent-cyan text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 disabled:opacity-50 transition-colors duration-300"
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
