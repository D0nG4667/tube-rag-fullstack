"use client";

import {
	AlertTriangle,
	BookOpen,
	Check,
	ChevronLeft,
	ChevronRight,
	Copy,
	Download,
	Linkedin,
	Loader2,
	Network,
	Pause,
	PenTool,
	Play,
	Radio,
	Share2,
	Twitter,
	Volume2,
	VolumeX,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Locale, translations } from "@/lib/translations";
import CustomMarkdown from "./CustomMarkdown";
import SpotlightPanel from "./SpotlightPanel";

const formatTime = (secs: number) => {
	const m = Math.floor(secs / 60);
	const s = secs % 60;
	return `${m}:${s < 10 ? "0" : ""}${s}`;
};

interface StudyStudioProps {
	videoId: string;
	videoTitle: string;
	onSeek: (seconds: number) => void;
	geminiApiKey?: string;
	isOpen: boolean;
	onToggleOpen: () => void;
	locale?: string;
	onApiKeyExpired?: () => void;
	onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

interface DialogueTurn {
	host: string;
	text: string;
}

interface MindmapLeaf {
	text: string;
	seconds: number;
}

interface MindmapBranch {
	title: string;
	leaves: MindmapLeaf[];
}

interface MindmapData {
	subject: string;
	branches: MindmapBranch[];
}

type TabType = "outline" | "podcast" | "mindmap" | "notes";

export default function StudyStudio({
	videoId,
	videoTitle,
	onSeek,
	geminiApiKey,
	isOpen,
	onToggleOpen,
	locale = "en",
	onApiKeyExpired,
	onShowToast,
}: StudyStudioProps) {
	const t = translations[locale as Locale] || translations.en;
	const isRtl = locale === "ar";
	const [activeTab, setActiveTab] = useState<TabType>("outline");

	// Outline State
	const [outline, setOutline] = useState<string>("");
	const [loadingOutline, setLoadingOutline] = useState(false);

	// Podcast State
	const [podcastScript, setPodcastScript] = useState<DialogueTurn[]>([]);
	const [loadingPodcast, setLoadingPodcast] = useState(false);
	const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
	const [currentPodcastIndex, setCurrentPodcastIndex] = useState<number>(-1);
	const [isMuted, setIsMuted] = useState(false);
	const [podcastAudioUrl, setPodcastAudioUrl] = useState<string | null>(null);
	const [loadingAudio, setLoadingAudio] = useState(false);
	const [audioError, setAudioError] = useState<string | null>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [podcastScriptError, setPodcastScriptError] = useState<string | null>(
		null,
	);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Handwritten Notes State
	const [notes, setNotes] = useState<string>("");
	const [loadingNotes, setLoadingNotes] = useState(false);

	// Mindmap State
	const [mindmap, setMindmap] = useState<MindmapData | null>(null);
	const [loadingMindmap, setLoadingMindmap] = useState(false);
	const [mindmapError, setMindmapError] = useState<string | null>(null);
	const [isFullscreenMindmap, setIsFullscreenMindmap] = useState(false);

	// Share CTA Dropdown State
	const [isShareOpen, setIsShareOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const [linkedinCopied, setLinkedinCopied] = useState(false);

	// Web Speech synthesis references
	const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

	// Fetch outline
	const generateOutline = async () => {
		if (!videoId) return;
		setLoadingOutline(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notebook/outline`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(geminiApiKey ? { "X-Gemini-API-Key": geminiApiKey } : {}),
					},
					body: JSON.stringify({ video_id: videoId }),
				},
			);
			if (!res.ok) {
				if (res.status === 429) {
					onApiKeyExpired?.();
				}
				throw new Error();
			}
			const data = await res.json();
			setOutline(data.outline);
		} catch {
			setOutline(
				isRtl
					? "⚠️ فشل في إنشاء المخطط التفصيلي للعرض."
					: "⚠️ Failed to generate presentation outline.",
			);
		} finally {
			setLoadingOutline(false);
		}
	};

	// Fetch handwritten study notes
	const generateNotes = async () => {
		if (!videoId) return;
		setLoadingNotes(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notebook/notes`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(geminiApiKey ? { "X-Gemini-API-Key": geminiApiKey } : {}),
					},
					body: JSON.stringify({ video_id: videoId }),
				},
			);
			if (!res.ok) {
				if (res.status === 429) {
					onApiKeyExpired?.();
				}
				throw new Error();
			}
			const data = await res.json();
			setNotes(data.notes);
		} catch {
			setNotes(
				isRtl
					? "⚠️ فشل في إنشاء الملاحظات الدراسية."
					: "⚠️ Failed to generate study notes.",
			);
		} finally {
			setLoadingNotes(false);
		}
	};

	// Fetch Podcast Script
	const generatePodcastScript = async () => {
		if (!videoId) return;
		setLoadingPodcast(true);
		setAudioError(null);
		setPodcastScriptError(null);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notebook/podcast`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(geminiApiKey ? { "X-Gemini-API-Key": geminiApiKey } : {}),
					},
					body: JSON.stringify({ video_id: videoId }),
				},
			);
			if (!res.ok) {
				if (res.status === 429) {
					onApiKeyExpired?.();
				}
				throw new Error();
			}
			const data = await res.json();
			setPodcastScript(data.script);
			setCurrentPodcastIndex(-1);
			setIsPlayingPodcast(false);
		} catch {
			setPodcastScriptError(
				isRtl
					? "⚠️ فشل في إنشاء سيناريو البودكاست. يرجى التحقق من إعدادات المفتاح والمحاولة لاحقاً."
					: "⚠️ Failed to generate Podcast Script. Please check your API key configuration and try again.",
			);
		} finally {
			setLoadingPodcast(false);
		}
	};

	// Generate natural podcast audio using Gemini
	const generatePodcastAudio = async () => {
		if (podcastScript.length === 0) return;
		setLoadingAudio(true);
		setAudioError(null);
		setCurrentTime(0);
		setDuration(0);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notebook/podcast-audio`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(geminiApiKey ? { "X-Gemini-API-Key": geminiApiKey } : {}),
					},
					body: JSON.stringify({ script: podcastScript }),
				},
			);
			if (!res.ok) {
				if (res.status === 429) {
					onApiKeyExpired?.();
					throw new Error("QUOTA_ERROR");
				}
				throw new Error("GENERAL_ERROR");
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			setPodcastAudioUrl(url);

			if (audioRef.current) {
				audioRef.current.src = url;
				audioRef.current.play().catch(() => {});
				setIsPlayingPodcast(true);
			}
		} catch (err) {
			const error = err as Error;
			if (error?.message === "QUOTA_ERROR") {
				setAudioError(
					isRtl
						? "⚠️ انتهت حصة Gemini المجانية. يرجى توفير مفتاح Gemini الخاص بك لتجاوز الحدود."
						: "⚠️ Gemini Free Tier quota exceeded. Please provide your own Gemini API Key to continue.",
				);
			} else {
				setAudioError(
					isRtl
						? "⚠️ فشل في توليد الصوت الطبيعي للبودكاست. يرجى التحقق من إعدادات المفتاح والمحاولة لاحقاً."
						: "⚠️ Failed to generate natural podcast audio. Please check your API key configuration and try again.",
				);
			}
		} finally {
			setLoadingAudio(false);
		}
	};

	const handlePlayPodcastAudio = () => {
		if (!podcastAudioUrl) {
			generatePodcastAudio();
			return;
		}
		if (audioRef.current) {
			if (isPlayingPodcast) {
				audioRef.current.pause();
				setIsPlayingPodcast(false);
			} else {
				audioRef.current.play().catch(() => {});
				setIsPlayingPodcast(true);
			}
		}
	};

	// Clean up podcast audio player on unmount
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
			}
		};
	}, []);

	// Handle Mute Toggle
	useEffect(() => {
		if (speechUtteranceRef.current) {
			speechUtteranceRef.current.volume = isMuted ? 0 : 1;
		}
	}, [isMuted]);

	// Fetch Mindmap
	const generateMindmap = async () => {
		if (!videoId) return;
		setLoadingMindmap(true);
		setMindmapError(null);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notebook/mindmap`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(geminiApiKey ? { "X-Gemini-API-Key": geminiApiKey } : {}),
					},
					body: JSON.stringify({ video_id: videoId }),
				},
			);
			if (!res.ok) {
				if (res.status === 429) {
					onApiKeyExpired?.();
				}
				throw new Error();
			}
			const data = await res.json();
			setMindmap(data);
		} catch {
			setMindmapError(
				isRtl
					? "⚠️ فشل في إنشاء خريطة المفاهيم. يرجى التحقق من إعدادات المفتاح والمحاولة لاحقاً."
					: "⚠️ Failed to generate Concept Map. Please check your API key configuration and try again.",
			);
		} finally {
			setLoadingMindmap(false);
		}
	};

	// Copy to clipboard helper
	const handleCopy = () => {
		let shareText = `StudyStudio Insights for: ${videoTitle}\n\n`;
		if (activeTab === "outline" && outline) {
			shareText += outline;
		} else if (activeTab === "podcast" && podcastScript.length > 0) {
			shareText += podcastScript
				.map((turn) => `${turn.host}: ${turn.text}`)
				.join("\n\n");
		} else if (activeTab === "mindmap" && mindmap) {
			shareText += `Subject: ${mindmap.subject}\n\n`;
			shareText += mindmap.branches
				.map(
					(b) =>
						`- ${b.title}\n` +
						b.leaves.map((l) => `  * ${l.text} (@ ${l.seconds}s)`).join("\n"),
				)
				.join("\n\n");
		} else if (activeTab === "notes" && notes) {
			shareText += notes;
		} else {
			shareText += "Insights and outlines prepared in StudyStudio.";
		}

		navigator.clipboard.writeText(shareText);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Download Outline as Markdown
	const downloadOutline = () => {
		if (!outline) return;
		const blob = new Blob([outline], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `outline-${videoId}.md`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		onShowToast?.(
			isRtl
				? "📥 تم تحميل المخطط التفصيلي!"
				: "📥 Outline downloaded successfully!",
			"success",
		);
	};

	// Download Podcast Audio
	const downloadPodcastAudio = () => {
		if (!podcastAudioUrl) return;
		const a = document.createElement("a");
		a.href = podcastAudioUrl;
		a.download = `podcast-${videoId}.wav`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		onShowToast?.(
			isRtl
				? "📥 تم تحميل الملف الصوتي للبودكاست!"
				: "📥 Podcast audio downloaded successfully!",
			"success",
		);
	};

	// Download Mindmap SVG
	const downloadMindmapSvg = () => {
		const svgEl =
			document.querySelector(".mindmap-viewport svg") ||
			document.querySelector("svg");
		if (!svgEl) return;
		const serializer = new XMLSerializer();
		const source = serializer.serializeToString(svgEl);
		const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
		const a = document.createElement("a");
		a.href = url;
		a.download = `mindmap-${videoId}.svg`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		onShowToast?.(
			isRtl
				? "📥 تم تحميل خريطة المفاهيم كملف SVG!"
				: "📥 Mindmap SVG downloaded successfully!",
			"success",
		);
	};

	// Download Notes as text
	const downloadNotesAsText = () => {
		if (!notes) return;
		const blob = new Blob([notes], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `notes-${videoId}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		onShowToast?.(
			isRtl
				? "📥 تم تحميل الملاحظات النصية!"
				: "📥 Text notes downloaded successfully!",
			"success",
		);
	};

	// Seek Audio track timeline position
	const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = Number(e.target.value);
		setCurrentTime(val);
		if (audioRef.current) {
			audioRef.current.currentTime = val;
		}
	};

	// Download Notes as PNG image drawn on dark ruled paper canvas
	const downloadNotesAsImage = () => {
		if (!notes) return;
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const lines = notes.split("\n");
		const lineHeight = 35;
		const padding = 50;
		canvas.width = 850;
		canvas.height = Math.max(600, lines.length * lineHeight + 120);

		// Style values matching dark mode theme
		ctx.fillStyle = "#09090b"; // Zinc 950
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw notebook title header
		ctx.fillStyle = "rgba(6, 182, 212, 0.4)"; // Cyan 500
		ctx.font = "bold 14px sans-serif";
		ctx.fillText("TubeRAG CALLIGRAPHY STUDY NOTES", padding + 50, 45);

		// Draw ruled horizontal lines
		ctx.strokeStyle = "rgba(63, 63, 70, 0.35)"; // Zinc 800
		ctx.lineWidth = 1;
		for (let y = 90; y < canvas.height - 30; y += lineHeight) {
			ctx.beginPath();
			ctx.moveTo(padding, y);
			ctx.lineTo(canvas.width - padding, y);
			ctx.stroke();
		}

		// Draw red notebook left/right margin line
		ctx.strokeStyle = "rgba(239, 68, 68, 0.25)"; // Red 500
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		if (isRtl) {
			ctx.moveTo(canvas.width - 90, 0);
			ctx.lineTo(canvas.width - 90, canvas.height);
		} else {
			ctx.moveTo(90, 0);
			ctx.lineTo(90, canvas.height);
		}
		ctx.stroke();

		// Set text styles
		ctx.fillStyle = isRtl
			? "rgba(6, 182, 212, 0.9)"
			: "rgba(124, 58, 237, 0.9)"; // Cyan or Violet
		ctx.font = "22px 'Caveat', cursive, sans-serif";
		if (isRtl) {
			ctx.font = "20px 'Aref Ruqaa', serif";
			ctx.textAlign = "right";
			for (let i = 0; i < lines.length; i++) {
				ctx.fillText(lines[i], canvas.width - 110, 80 + i * lineHeight);
			}
		} else {
			ctx.textAlign = "left";
			for (let i = 0; i < lines.length; i++) {
				ctx.fillText(lines[i], 110, 80 + i * lineHeight);
			}
		}

		const dataUrl = canvas.toDataURL("image/png");
		const a = document.createElement("a");
		a.href = dataUrl;
		a.download = `notes-${videoId}.png`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		onShowToast?.(
			isRtl
				? "📥 تم تحميل الملاحظات المصورة!"
				: "📥 Calligraphy notes image downloaded successfully!",
			"success",
		);
	};

	// Print active tab content directly into a clean template
	const printActiveTab = () => {
		onShowToast?.(
			isRtl ? "🖨️ فتح نافذة الطباعة..." : "🖨️ Opening print dialog...",
			"info",
		);
		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		let tabTitle = "";
		let contentHtml = "";

		if (activeTab === "outline") {
			tabTitle = locale === "ar" ? "المخطط التفصيلي" : "Study Outline";
			contentHtml = `
				<h1 style="color: #06b6d4; font-size: 24px;">${videoTitle}</h1>
				<h2 style="color: #4b5563; font-size: 16px;">${tabTitle}</h2>
				<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
				<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #374151;">${outline || "No outline available."}</div>
			`;
		} else if (activeTab === "podcast") {
			tabTitle = locale === "ar" ? "سيناريو البودكاست" : "Podcast Script";
			const turns = podcastScript
				.map(
					(turn) => `
				<div style="margin-bottom: 15px; font-size: 13px;">
					<strong style="color: #7c3aed; text-transform: uppercase;">🎙️ ${turn.host}:</strong>
					<p style="margin: 4px 0 0 0; line-height: 1.5; color: #374151;">${turn.text}</p>
				</div>
			`,
				)
				.join("");
			contentHtml = `
				<h1 style="color: #06b6d4; font-size: 24px;">${videoTitle}</h1>
				<h2 style="color: #4b5563; font-size: 16px;">${tabTitle}</h2>
				<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
				${turns || "<p>No podcast script available.</p>"}
			`;
		} else if (activeTab === "mindmap") {
			tabTitle = locale === "ar" ? "خريطة المفاهيم" : "Concept Map";
			const branches = mindmap
				? mindmap.branches
						.map(
							(b) => `
				<div style="margin-bottom: 20px;">
					<h3 style="color: #06b6d4; font-size: 16px; margin: 0 0 8px 0;">📂 ${b.title}</h3>
					<ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #374151;">
						${b.leaves.map((l) => `<li>${l.text} (seek: ${formatTime(l.seconds)})</li>`).join("")}
					</ul>
				</div>
			`,
						)
						.join("")
				: "<p>No concept map available.</p>";

			contentHtml = `
				<h1 style="color: #06b6d4; font-size: 24px;">${videoTitle}</h1>
				<h2 style="color: #4b5563; font-size: 16px;">${tabTitle}: ${mindmap?.subject || ""}</h2>
				<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
				${branches}
			`;
		} else if (activeTab === "notes") {
			tabTitle =
				locale === "ar" ? "الملاحظات الدراسية" : "Calligraphy Study Notes";
			contentHtml = `
				<h1 style="color: #7c3aed; font-size: 24px;">${videoTitle}</h1>
				<h2 style="color: #4b5563; font-size: 16px;">${tabTitle}</h2>
				<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
				<div style="font-family: serif; font-size: 18px; line-height: 1.8; color: #1e3a8a; white-space: pre-wrap;">${notes || "No notes available."}</div>
			`;
		}

		printWindow.document.write(`
			<html>
				<head>
					<title>${tabTitle} - TubeRAG</title>
					<style>
						body {
							font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
							padding: 40px;
							color: #111827;
							background: white;
							max-width: 800px;
							margin: 0 auto;
						}
						@media print {
							body { padding: 20px; }
							h1, h2, h3 { page-break-after: avoid; }
						}
					</style>
				</head>
				<body>
					${contentHtml}
					<script>
						window.onload = function() {
							window.print();
							setTimeout(function() { window.close(); }, 500);
						};
					</script>
				</body>
			</html>
		`);
		printWindow.document.close();
	};

	return (
		<div className="h-full w-full border-l border-zinc-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col relative min-w-0 z-40 overflow-hidden transition-colors duration-300">
			{/* Dynamic width Inner Container to prevent squishing text on width resize */}
			<div
				className="h-full w-full flex flex-col overflow-hidden"
				style={{
					opacity: isOpen ? 1 : 0,
					pointerEvents: isOpen ? "auto" : "none",
					transition: "opacity 0.2s ease-in-out",
				}}
			>
				{/* Header */}
				<div className="p-4 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<BookOpen className="w-5 h-5 text-accent-cyan" />
						<span className="font-semibold text-gradient text-sm uppercase tracking-wider">
							{t.studyStudio}
						</span>
					</div>

					<div className="flex items-center gap-2">
						{/* Share CTAs Dropdown */}
						<div className="relative">
							<button
								type="button"
								onClick={() => setIsShareOpen(!isShareOpen)}
								className="p-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors duration-300"
								title={t.shareInsights}
							>
								<Share2 className="w-4 h-4" />
							</button>

							{isShareOpen && (
								<div className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-1.5 flex flex-col gap-1 z-30 shadow-2xl transition-colors duration-300">
									<button
										type="button"
										onClick={handleCopy}
										className="w-full text-start px-3 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-between text-zinc-700 dark:text-zinc-300 transition"
									>
										<span className="flex items-center gap-2">
											<Copy className="w-3.5 h-3.5" />
											{t.copyToClipboard}
										</span>
										{copied && <Check className="w-3 h-3 text-green-400" />}
									</button>
									<button
										type="button"
										onClick={() => {
											const shareUrl =
												typeof window !== "undefined" &&
												!window.location.host.includes("localhost")
													? window.location.href
													: "https://tuberag.vercel.app";

											let shareContext = "a comprehensive study outline";
											if (activeTab === "podcast")
												shareContext = "an interactive audio podcast script";
											else if (activeTab === "mindmap")
												shareContext = "an interconnected concept mindmap";
											else if (activeTab === "notes")
												shareContext = "handwritten calligraphy study notes";

											const xText = `🧠 Synthesized ${shareContext} of "${videoTitle}" using TubeRAG!\n\nCheck it out here: ${shareUrl} 🚀\n\n#AI #SaaS #TubeRAG #NextJS #Gemini`;
											const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`;
											window.open(url, "_blank");
										}}
										className="w-full text-start px-3 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition"
									>
										<Twitter className="w-3.5 h-3.5 text-sky-400" />
										{t.shareOnX}
									</button>
									<button
										type="button"
										onClick={() => {
											const shareUrl =
												typeof window !== "undefined" &&
												!window.location.host.includes("localhost")
													? window.location.href
													: "https://tuberag.vercel.app";

											let shareContext = "a comprehensive study outline";
											if (activeTab === "podcast")
												shareContext = "an interactive audio podcast script";
											else if (activeTab === "mindmap")
												shareContext = "an interconnected concept mindmap";
											else if (activeTab === "notes")
												shareContext = "handwritten calligraphy study notes";

											const linkedinText = `🚀 Just generated ${shareContext} of "${videoTitle}" using TubeRAG!\n\nTubeRAG synthesizes complex lectures and playlists into structured learning assets:\n📝 Multi-document semantic outline\n🎙️ Interactive audio podcast dialogue\n🧠 Interconnected visual concept maps\n\nPowered by Gemini 2.5 Flash & Supabase pgvector.\n\nExplore the project: https://github.com/tuberag\n\n#ArtificialIntelligence #SaaS #Productivity #EdTech #RAG`;

											navigator.clipboard
												.writeText(linkedinText)
												.then(() => {
													setLinkedinCopied(true);
													setTimeout(() => setLinkedinCopied(false), 2000);
												})
												.catch(() => {});

											const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
											window.open(url, "_blank");
										}}
										className="w-full text-start px-3 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-between text-zinc-700 dark:text-zinc-300 transition"
									>
										<span className="flex items-center gap-2">
											<Linkedin className="w-3.5 h-3.5 text-blue-500" />
											{t.shareOnLinkedIn}
										</span>
										{linkedinCopied && (
											<Check className="w-3 h-3 text-green-400" />
										)}
									</button>

									{/* Dynamic Tab Download Options */}
									{activeTab === "outline" && outline && (
										<button
											type="button"
											onClick={downloadOutline}
											className="w-full text-start px-3 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition border-t border-zinc-200/10 mt-1 pt-1.5"
										>
											<Download className="w-3.5 h-3.5 text-cyan-400" />
											Download Markdown (.md)
										</button>
									)}
									{activeTab === "podcast" && podcastAudioUrl && (
										<button
											type="button"
											onClick={downloadPodcastAudio}
											className="w-full text-start px-3 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition border-t border-zinc-200/10 mt-1 pt-1.5"
										>
											<Download className="w-3.5 h-3.5 text-cyan-400" />
											Download Audio (.wav)
										</button>
									)}
									{activeTab === "mindmap" && mindmap && (
										<button
											type="button"
											onClick={downloadMindmapSvg}
											className="w-full text-start px-3 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition border-t border-zinc-200/10 mt-1 pt-1.5"
										>
											<Download className="w-3.5 h-3.5 text-cyan-400" />
											Download SVG Map (.svg)
										</button>
									)}
									{activeTab === "notes" && notes && (
										<>
											<button
												type="button"
												onClick={downloadNotesAsImage}
												className="w-full text-start px-3 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition border-t border-zinc-200/10 mt-1 pt-1.5"
											>
												<Download className="w-3.5 h-3.5 text-cyan-400" />
												Download Notes Image (.png)
											</button>
											<button
												type="button"
												onClick={downloadNotesAsText}
												className="w-full text-start px-3 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition"
											>
												<Download className="w-3.5 h-3.5 text-purple-400" />
												Download Notes Text (.txt)
											</button>
										</>
									)}

									<button
										type="button"
										onClick={() => {
											printActiveTab();
											setIsShareOpen(false);
										}}
										className="w-full text-start px-3 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition border-t border-zinc-200/10 mt-1 pt-1.5"
									>
										<PenTool className="w-3.5 h-3.5 text-emerald-400" />
										{t.downloadPdf}
									</button>
								</div>
							)}
						</div>

						{/* Close Panel Button */}
						<button
							type="button"
							onClick={onToggleOpen}
							className="hidden lg:flex p-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors duration-300"
							title={locale === "ar" ? "إغلاق" : "Close"}
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Tabs Root */}
				<Tabs
					value={activeTab}
					onValueChange={(val) => {
						setActiveTab(val as TabType);
						setIsShareOpen(false);
					}}
					className="flex-grow flex flex-col min-h-0"
				>
					{/* Sub-tab selection */}
					<TabsList className="w-full flex justify-start overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-zinc-200 dark:border-zinc-800/40 p-1 bg-zinc-100/50 dark:bg-zinc-950/30 gap-1 shrink-0 rounded-none bg-transparent">
						<TabsTrigger
							value="outline"
							className="flex-1 shrink-0 px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<BookOpen className="w-3.5 h-3.5" />
							{t.outlineTab}
						</TabsTrigger>
						<TabsTrigger
							value="podcast"
							className="flex-1 shrink-0 px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<Radio className="w-3.5 h-3.5" />
							{t.podcastTab}
						</TabsTrigger>
						<TabsTrigger
							value="mindmap"
							className="flex-1 shrink-0 px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<Network className="w-3.5 h-3.5" />
							{t.conceptMapTab}
						</TabsTrigger>
						<TabsTrigger
							value="notes"
							className="flex-1 shrink-0 px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition data-active:!bg-cyan-500/10 data-active:!text-cyan-700 dark:data-active:!text-cyan-400 data-active:!border data-active:!border-cyan-500/20 text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							<PenTool className="w-3.5 h-3.5" />
							{t.notesTab}
						</TabsTrigger>
					</TabsList>

					{/* View Area Content */}
					<div className="flex-1 min-h-0 flex flex-col relative">
						{/* Tab 1: Presentation Outline */}
						<TabsContent
							value="outline"
							className="absolute inset-0 flex flex-col outline-none"
						>
							<ScrollArea className="flex-grow min-h-0">
								<div className="p-4 flex flex-col gap-4">
									{!outline && !loadingOutline && (
										<div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
											<BookOpen className="w-8 h-8 text-zinc-600 mb-2" />
											<span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
												{t.noOutline}
											</span>
											<button
												type="button"
												onClick={generateOutline}
												className="px-4 py-2 rounded-lg bg-accent-cyan/90 hover:bg-accent-cyan text-zinc-950 text-xs font-bold transition shadow-lg"
											>
												{t.generateOutlineBtn}
											</button>
										</div>
									)}

									{loadingOutline && (
										<div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
											<Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
											<span className="text-xs text-zinc-500 font-medium">
												Synthesizing outline from transcript...
											</span>
										</div>
									)}

									{outline && !loadingOutline && (
										<SpotlightPanel className="flex-1 p-4 rounded-xl flex flex-col min-h-0">
											<span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-3 border-b border-zinc-800/60 pb-1.5 block">
												{t.outlineTab}
											</span>
											<div className="text-xs text-zinc-700 dark:text-zinc-300 font-sans">
												<CustomMarkdown
													content={outline}
													onSeek={onSeek}
													isRtl={isRtl}
												/>
											</div>
										</SpotlightPanel>
									)}
								</div>
							</ScrollArea>
						</TabsContent>

						{/* Tab 2: Podcast Script */}
						<TabsContent
							value="podcast"
							className="absolute inset-0 flex flex-col outline-none"
						>
							<ScrollArea className="flex-grow min-h-0">
								<div className="p-4 flex flex-col gap-4">
									{!podcastScript.length && !loadingPodcast && (
										<div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
											<Radio className="w-8 h-8 text-zinc-600 mb-2" />
											<span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
												{t.noPodcast}
											</span>
											{podcastScriptError && (
												<div className="p-3 rounded-lg border border-red-500/20 bg-red-950/15 text-red-400 text-xs font-semibold animate-fade-in shadow-[0_0_12px_rgba(239,68,68,0.15)] mb-4 flex items-start gap-2 max-w-sm text-start">
													<AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
													<span>{podcastScriptError}</span>
												</div>
											)}
											<button
												type="button"
												onClick={generatePodcastScript}
												className="px-4 py-2 rounded-lg bg-accent-cyan/90 hover:bg-accent-cyan text-zinc-950 text-xs font-bold transition shadow-lg"
											>
												{t.generatePodcastBtn}
											</button>
										</div>
									)}

									{loadingPodcast && (
										<div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
											<Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
											<span className="text-xs text-zinc-500 font-medium">
												Synthesizing dialogue scripts from topics...
											</span>
										</div>
									)}

									{podcastScript.length > 0 && !loadingPodcast && (
										<div className="flex flex-col gap-4 animate-fade-in">
											{/* biome-ignore lint/a11y/useMediaCaption: custom audio player without caption tracks */}
											<audio
												ref={audioRef}
												src={podcastAudioUrl || undefined}
												onPlay={() => setIsPlayingPodcast(true)}
												onPause={() => setIsPlayingPodcast(false)}
												onEnded={() => {
													setIsPlayingPodcast(false);
													setCurrentPodcastIndex(-1);
													setCurrentTime(0);
												}}
												onTimeUpdate={() => {
													if (audioRef.current) {
														setCurrentTime(audioRef.current.currentTime);
													}
												}}
												onDurationChange={() => {
													if (audioRef.current) {
														setDuration(audioRef.current.duration);
													}
												}}
												onLoadedMetadata={() => {
													if (audioRef.current) {
														setDuration(audioRef.current.duration);
													}
												}}
												className="hidden"
											/>
											<div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-zinc-100/60 dark:bg-zinc-950/40 flex flex-col gap-3 shrink-0">
												<div className="flex justify-between items-center">
													<span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
														{t.audioOverviewDiscussion}
													</span>
													<div className="flex items-center gap-1">
														<span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
														<span className="text-[9px] uppercase font-bold text-accent-cyan">
															Gemini TTS
														</span>
													</div>
												</div>

												{/* Native Audio Concatenation Player API UI wrapper */}
												{podcastAudioUrl && (
													<div className="flex items-center gap-2 bg-zinc-200/40 dark:bg-zinc-900/60 px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-850/60 shrink-0">
														<span className="text-[9px] font-mono text-zinc-500 w-8 select-none">
															{formatTime(Math.floor(currentTime))}
														</span>
														<input
															type="range"
															min={0}
															max={duration || 100}
															value={currentTime}
															onChange={handleAudioSeek}
															className="flex-1 h-1 bg-zinc-300 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent-cyan focus:outline-none"
														/>
														<span className="text-[9px] font-mono text-zinc-500 w-8 select-none">
															{formatTime(Math.floor(duration))}
														</span>
													</div>
												)}

												{/* Controls Row */}
												<div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-850/40">
													<div className="flex items-center gap-2">
														<button
															type="button"
															onClick={() => {
																setIsMuted(!isMuted);
																if (audioRef.current) {
																	audioRef.current.muted = !isMuted;
																}
															}}
															className="p-2 rounded bg-zinc-250 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700/80 transition text-zinc-650 dark:text-zinc-300"
															title={isMuted ? "Unmute" : "Mute"}
														>
															{isMuted ? (
																<VolumeX className="w-4 h-4" />
															) : (
																<Volume2 className="w-4 h-4" />
															)}
														</button>

														{podcastAudioUrl && (
															<button
																type="button"
																onClick={downloadPodcastAudio}
																className="p-2 rounded bg-zinc-250 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700/80 transition text-zinc-650 dark:text-zinc-300"
																title="Download Audio"
															>
																<Download className="w-4 h-4" />
															</button>
														)}
													</div>

													<button
														type="button"
														onClick={handlePlayPodcastAudio}
														disabled={loadingAudio}
														className="p-2.5 rounded-full bg-accent-cyan text-zinc-950 hover:scale-105 transition flex items-center justify-center disabled:opacity-50"
													>
														{loadingAudio ? (
															<Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
														) : isPlayingPodcast ? (
															<Pause className="w-4 h-4 fill-zinc-950" />
														) : (
															<Play className="w-4 h-4 fill-zinc-950" />
														)}
													</button>
												</div>
											</div>

											{audioError && (
												<div className="p-3 rounded-lg border border-red-500/20 bg-red-950/15 text-red-400 text-xs font-semibold animate-fade-in shadow-[0_0_12px_rgba(239,68,68,0.1)] flex items-start gap-2">
													<AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
													<span>{audioError}</span>
												</div>
											)}

											{/* Script List */}
											<div className="flex flex-col gap-3 pr-1">
												{podcastScript.map((turn, i) => {
													const isActivelySpoken = i === currentPodcastIndex;
													const isHostA = turn.host === "Host A";
													const keyVal = `${i}-${turn.host}`;
													return (
														<div
															key={keyVal}
															className={`p-3 rounded-lg border text-xs leading-relaxed transition-all duration-300 flex flex-col gap-1.5 ${
																isActivelySpoken
																	? "bg-accent-cyan/10 border-accent-cyan/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
																	: isHostA
																		? "bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300"
																		: "bg-zinc-50/40 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-900 text-zinc-650 dark:text-zinc-400"
															}`}
														>
															<span
																className={`text-[9px] uppercase tracking-wider font-bold ${
																	isActivelySpoken
																		? "text-accent-cyan"
																		: isHostA
																			? "text-cyan-400"
																			: "text-violet-400"
																}`}
															>
																🎙️ {turn.host}
															</span>
															<span>{turn.text}</span>
														</div>
													);
												})}
											</div>
										</div>
									)}
								</div>
							</ScrollArea>
						</TabsContent>

						{/* Tab 3: SVG Interactive Mindmap */}
						<TabsContent
							value="mindmap"
							className="absolute inset-0 flex flex-col outline-none"
						>
							<ScrollArea className="flex-grow min-h-0">
								<div className="p-4 flex flex-col gap-4">
									{!mindmap && !loadingMindmap && (
										<div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
											<Network className="w-8 h-8 text-zinc-600 mb-2" />
											<span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
												{t.noMindmap}
											</span>
											{mindmapError && (
												<div className="p-3 rounded-lg border border-red-500/20 bg-red-950/15 text-red-400 text-xs font-semibold animate-fade-in shadow-[0_0_12px_rgba(239,68,68,0.15)] mb-4 flex items-start gap-2 max-w-sm text-start">
													<AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
													<span>{mindmapError}</span>
												</div>
											)}
											<button
												type="button"
												onClick={generateMindmap}
												className="px-4 py-2 rounded-lg bg-accent-cyan/90 hover:bg-accent-cyan text-zinc-950 text-xs font-bold transition shadow-lg"
											>
												{t.generateMindmapBtn}
											</button>
										</div>
									)}

									{loadingMindmap && (
										<div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
											<Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
											<span className="text-xs text-zinc-500 font-medium">
												Mapping clusters and timestamp paths...
											</span>
										</div>
									)}

									{mindmap && !loadingMindmap && (
										<div className="flex-grow flex flex-col gap-4 min-h-0 relative animate-fade-in ps-6">
											<div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5 shrink-0">
												<span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
													{t.conceptMapTab}
												</span>
												<div className="flex items-center gap-1.5">
													<button
														type="button"
														onClick={downloadMindmapSvg}
														className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold transition flex items-center gap-1"
														title="Download SVG Map"
													>
														<Download className="w-3 h-3" />
														SVG
													</button>
													<button
														type="button"
														onClick={() => setIsFullscreenMindmap(true)}
														className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold transition flex items-center gap-1"
													>
														<Network className="w-3 h-3" />
														{t.fullscreenGraph}
													</button>
												</div>
											</div>

											{/* Directory style connector line */}
											<div className="absolute start-3 top-10 bottom-8 w-0.5 bg-zinc-800" />

											{/* Root Node */}
											<div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/15 text-cyan-300 text-xs font-bold shadow relative text-start">
												<div className="absolute start-[-16px] top-1/2 -translate-y-1/2 w-4 h-0.5 bg-zinc-800" />
												🧠 {mindmap.subject}
											</div>

											{/* Branch Nodes */}
											{mindmap.branches.map((branch) => (
												<div
													key={branch.title}
													className="flex flex-col gap-2 ps-4 relative text-start"
												>
													{/* Connect branch to parent line */}
													<div className="absolute start-[-12px] top-4 w-3.5 h-0.5 bg-zinc-800" />

													<div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200 text-xs font-semibold relative">
														📂 {branch.title}
													</div>

													{/* Leaf Nodes */}
													<div className="flex flex-col gap-1.5 ps-4 relative">
														<div className="absolute start-[-12px] top-0 bottom-4 w-0.5 bg-zinc-800" />

														{branch.leaves.map((leaf, li) => {
															const leafKey = `${li}-${leaf.text}`;
															return (
																<Badge
																	key={leafKey}
																	variant="outline"
																	className="w-full text-start p-2 rounded border border-zinc-200 dark:border-zinc-850/60 bg-zinc-50/40 dark:bg-zinc-950/40 text-zinc-650 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-700 text-[11px] transition flex items-start gap-2 relative group cursor-pointer"
																	render={
																		<button
																			type="button"
																			onClick={() => onSeek(leaf.seconds)}
																		/>
																	}
																>
																	<div className="absolute start-[-16px] top-1/2 -translate-y-1/2 w-4 h-0.5 bg-zinc-800" />
																	<span className="text-accent-cyan group-hover:scale-105 transition font-mono shrink-0">
																		🏷️
																	</span>
																	<div className="flex-1 flex flex-col gap-0.5">
																		<span>{leaf.text}</span>
																		<span className="text-[9px] text-zinc-500 font-mono">
																			{t.seekPlaybackTo}{" "}
																			{formatTime(leaf.seconds)}
																		</span>
																	</div>
																</Badge>
															);
														})}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</ScrollArea>
						</TabsContent>

						{/* Tab 4: Handwritten Notes */}
						<TabsContent
							value="notes"
							className="absolute inset-0 flex flex-col outline-none"
						>
							<ScrollArea className="flex-grow min-h-0">
								<div className="p-4 flex flex-col gap-4">
									{!notes && !loadingNotes && (
										<div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
											<PenTool className="w-8 h-8 text-zinc-600 mb-2" />
											<span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
												{t.noNotes}
											</span>
											<button
												type="button"
												onClick={generateNotes}
												className="px-4 py-2 rounded-lg bg-accent-cyan/90 hover:bg-accent-cyan text-zinc-950 text-xs font-bold transition shadow-lg"
											>
												{t.generateNotesBtn}
											</button>
										</div>
									)}

									{loadingNotes && (
										<div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
											<Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
											<span className="text-xs text-zinc-500 font-medium">
												Writing calligraphy study notes...
											</span>
										</div>
									)}

									{notes && !loadingNotes && (
										<div className="flex-grow flex flex-col min-h-0 relative animate-fade-in">
											<div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5 mb-2 shrink-0">
												<span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
													{t.notesTab}
												</span>
												<div className="flex items-center gap-1.5">
													<button
														type="button"
														onClick={downloadNotesAsImage}
														className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold transition flex items-center gap-1"
														title="Download Calligraphy Notes as PNG"
													>
														<Download className="w-3 h-3" />
														PNG Image
													</button>
												</div>
											</div>
											<div className="rounded-xl border border-zinc-200 dark:border-zinc-800/40 ruled-paper shadow-inner p-4 min-h-[300px]">
												<div
													className="py-4 select-text"
													style={{
														fontFamily: isRtl
															? "'Aref Ruqaa', serif"
															: "'Caveat', cursive",
														fontSize: isRtl ? "17px" : "20px",
														fontWeight: 500,
														color: isRtl
															? "rgba(6, 182, 212, 0.9)"
															: "rgba(124, 58, 237, 0.9)",
														textShadow: "0.5px 0.5px 0px rgba(0,0,0,0.1)",
														lineHeight: "28px",
														direction: isRtl ? "rtl" : "ltr",
													}}
												>
													{notes.split("\n").map((line, idx) => {
														const keyVal = `note-line-${idx}`;
														return (
															<div
																key={keyVal}
																className="min-h-[28px] overflow-hidden whitespace-pre-wrap"
															>
																{line}
															</div>
														);
													})}
												</div>
											</div>
										</div>
									)}
								</div>
							</ScrollArea>
						</TabsContent>
					</div>
				</Tabs>
			</div>

			{/* Expand/Collapse border toggle handle button */}
			<button
				type="button"
				onClick={onToggleOpen}
				className={`absolute top-1/2 -translate-y-1/2 z-50 w-5 h-10 rounded-full border border-zinc-800/80 bg-zinc-950/90 text-zinc-400 hover:text-white transition shadow-md flex items-center justify-center ${
					isRtl ? "right-[-10px]" : "left-[-10px]"
				}`}
			>
				{isOpen ? (
					isRtl ? (
						<ChevronLeft className="w-3.5 h-3.5" />
					) : (
						<ChevronRight className="w-3.5 h-3.5" />
					)
				) : isRtl ? (
					<ChevronRight className="w-3.5 h-3.5" />
				) : (
					<ChevronLeft className="w-3.5 h-3.5" />
				)}
			</button>

			{/* Interactive SVG Fullscreen Mindmap Modal Graph */}
			{isFullscreenMindmap && mindmap && (
				<div className="fixed inset-0 z-50 bg-zinc-950/98 backdrop-blur-xl flex flex-col p-6 overflow-hidden">
					{/* Modal Header */}
					<div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
						<div className="flex flex-col gap-1">
							<h3 className="text-sm font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
								<Network className="w-4 h-4 text-cyan-400 animate-pulse" />
								{t.conceptMapTab}
							</h3>
							<span className="text-xs text-zinc-400 font-sans truncate max-w-xl">
								{videoTitle}
							</span>
						</div>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => window.print()}
								className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800/80 text-xs font-semibold transition"
							>
								{t.downloadPdf}
							</button>
							<button
								type="button"
								onClick={() => setIsFullscreenMindmap(false)}
								className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 hover:text-red-300 text-xs font-semibold transition"
							>
								{t.closeFullscreen}
							</button>
						</div>
					</div>

					{/* SVG Graph Viewport Container */}
					<div className="flex-1 flex items-center justify-center bg-zinc-950/40 rounded-2xl border border-zinc-900 shadow-inner relative overflow-hidden select-none">
						{(() => {
							const {
								nodes,
								links,
								width: svgWidth,
								height: svgHeight,
							} = getMindmapSvgLayout(mindmap);
							return (
								<svg
									viewBox={`0 0 ${svgWidth} ${svgHeight}`}
									className="w-full h-full max-w-5xl max-h-[85vh]"
								>
									<title>{mindmap.subject}</title>
									<defs>
										{/* Glow effects and gradients */}
										<filter
											id="glow"
											x="-20%"
											y="-20%"
											width="140%"
											height="140%"
										>
											<feGaussianBlur stdDeviation="6" result="blur" />
											<feComposite
												in="SourceGraphic"
												in2="blur"
												operator="over"
											/>
										</filter>
										<linearGradient
											id="cyan-purple"
											x1="0%"
											y1="0%"
											x2="100%"
											y2="100%"
										>
											<stop offset="0%" stopColor="#06b6d4" />
											<stop offset="100%" stopColor="#7c3aed" />
										</linearGradient>
									</defs>

									{/* Render Connection Lines */}
									{links.map((link, idx) => (
										<line
											// biome-ignore lint/suspicious/noArrayIndexKey: lines order is static
											key={idx}
											x1={link.sourceX}
											y1={link.sourceY}
											x2={link.targetX}
											y2={link.targetY}
											stroke={
												link.type === "root-branch" ? "#06b6d4" : "#4b5563"
											}
											strokeWidth={link.type === "root-branch" ? 2.5 : 1.25}
											strokeDasharray={
												link.type === "branch-leaf" ? "4,4" : undefined
											}
											opacity={link.type === "root-branch" ? 0.7 : 0.4}
											className="transition-all duration-300"
										/>
									))}

									{/* Render Nodes */}
									{nodes.map((node) => {
										const isRoot = node.type === "root";
										const isBranch = node.type === "branch";
										const isLeaf = node.type === "leaf";

										return (
											// biome-ignore lint/a11y/noStaticElementInteractions: SVG group nodes interactive handles
											<g
												key={node.id}
												transform={`translate(${node.x}, ${node.y})`}
												onClick={() => {
													if (isLeaf && node.seconds !== undefined) {
														onSeek(node.seconds);
														setIsFullscreenMindmap(false);
													}
												}}
												className={`${isLeaf ? "cursor-pointer group" : ""}`}
											>
												{isRoot && (
													<>
														<circle
															r={65}
															fill="#08070b"
															stroke="url(#cyan-purple)"
															strokeWidth={3}
															filter="url(#glow)"
															opacity={0.8}
														/>
														<foreignObject
															x={-55}
															y={-45}
															width={110}
															height={90}
														>
															<div className="w-full h-full flex items-center justify-center text-center text-[11px] font-bold text-zinc-100 leading-normal px-1 overflow-hidden select-none">
																{node.label}
															</div>
														</foreignObject>
													</>
												)}

												{isBranch && (
													<>
														<rect
															x={-75}
															y={-22}
															width={150}
															height={44}
															rx={10}
															fill="#0c0a0f"
															stroke="#7c3aed"
															strokeWidth={2}
															opacity={0.9}
														/>
														<foreignObject
															x={-70}
															y={-18}
															width={140}
															height={36}
														>
															<div className="w-full h-full flex items-center justify-center text-center text-[10px] font-semibold text-purple-300 leading-tight px-1 overflow-hidden select-none">
																{node.label}
															</div>
														</foreignObject>
													</>
												)}

												{isLeaf && (
													<>
														<rect
															x={-70}
															y={-18}
															width={140}
															height={36}
															rx={8}
															fill="#09090b"
															stroke="#3f3f46"
															strokeWidth={1}
															className="group-hover:stroke-cyan-500 group-hover:fill-cyan-950/20 transition-all duration-300"
														/>
														<foreignObject
															x={-65}
															y={-14}
															width={130}
															height={28}
														>
															<div className="w-full h-full flex flex-col items-center justify-center text-center leading-none px-0.5 overflow-hidden select-none">
																<span className="text-[9px] text-zinc-300 group-hover:text-cyan-200 transition-colors font-medium truncate w-full">
																	{node.label}
																</span>
																{node.seconds !== undefined && (
																	<span className="text-[7.5px] text-zinc-500 group-hover:text-cyan-400 transition-colors font-mono mt-0.5">
																		{formatTime(node.seconds)}
																	</span>
																)}
															</div>
														</foreignObject>
													</>
												)}
											</g>
										);
									})}
								</svg>
							);
						})()}
					</div>
					<div className="text-[10px] text-zinc-500 text-center mt-3 font-medium select-none">
						{locale === "ar"
							? "💡 انقر على أي مفهوم ورقي فرعي لتوجيه مشغل الفيديو إلى موقعه الزمني المقتبس."
							: "💡 Click on any leaf node to seek the video player to that specific lecture timestamp."}
					</div>
				</div>
			)}

			{/* Hidden Printable PDF Report */}
			<div className="hidden print:block text-zinc-950 bg-white p-8 max-w-4xl mx-auto font-sans leading-relaxed">
				<div className="border-b-2 border-zinc-900 pb-6 mb-8 text-center">
					<h1 className="text-3xl font-black uppercase tracking-wider mb-2">
						TubeRAG Study Report
					</h1>
					<p className="text-sm font-semibold text-zinc-600">{videoTitle}</p>
					<p className="text-[10px] text-zinc-400 font-mono mt-1">
						Generated dynamically via TubeRAG
					</p>
				</div>

				{outline && (
					<div className="mb-10">
						<h2 className="text-xl font-bold border-b border-zinc-300 pb-2 mb-4 text-zinc-800 uppercase tracking-wide">
							I. Lecture Outline
						</h2>
						<div className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed font-sans">
							{outline}
						</div>
					</div>
				)}

				{podcastScript.length > 0 && (
					<div className="mb-10">
						<h2 className="text-xl font-bold border-b border-zinc-300 pb-2 mb-4 text-zinc-800 uppercase tracking-wide">
							II. Podcast Transcript
						</h2>
						<div className="flex flex-col gap-4">
							{podcastScript.map((turn, idx) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: order is static
								<div key={idx} className="text-sm">
									<strong className="text-zinc-900 uppercase tracking-wider text-xs block mb-1">
										{turn.host}:
									</strong>
									<p className="text-zinc-700 leading-relaxed italic">
										{turn.text}
									</p>
								</div>
							))}
						</div>
					</div>
				)}

				{notes && (
					<div className="mb-10">
						<h2 className="text-xl font-bold border-b border-zinc-300 pb-2 mb-4 text-zinc-800 uppercase tracking-wide">
							III. Calligraphy Study Notes
						</h2>
						<div className="text-base text-zinc-800 whitespace-pre-wrap leading-relaxed border border-zinc-200 p-6 rounded-xl bg-zinc-50/50">
							{notes}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// Fullscreen Mindmap SVG coordinates layout calculator
function getMindmapSvgLayout(data: MindmapData) {
	const width = 1000;
	const height = 700;
	const centerX = width / 2;
	const centerY = height / 2;
	const radius = 220;

	const branches = data.branches;
	const branchAngleStep = (2 * Math.PI) / Math.max(1, branches.length);

	const nodes: Array<{
		id: string;
		type: "root" | "branch" | "leaf";
		label: string;
		x: number;
		y: number;
		seconds?: number;
	}> = [];

	const links: Array<{
		sourceX: number;
		sourceY: number;
		targetX: number;
		targetY: number;
		type: "root-branch" | "branch-leaf";
	}> = [];

	// Add Root Node
	nodes.push({
		id: "root",
		type: "root",
		label: `🧠 ${data.subject}`,
		x: centerX,
		y: centerY,
	});

	branches.forEach((branch, bIdx) => {
		const angle = bIdx * branchAngleStep - Math.PI / 2; // Offset to start at top
		const branchX = centerX + Math.cos(angle) * radius;
		const branchY = centerY + Math.sin(angle) * radius;
		const branchId = `branch-${bIdx}`;

		// Add Branch Node
		nodes.push({
			id: branchId,
			type: "branch",
			label: `📂 ${branch.title}`,
			x: branchX,
			y: branchY,
		});

		// Link root to branch
		links.push({
			sourceX: centerX,
			sourceY: centerY,
			targetX: branchX,
			targetY: branchY,
			type: "root-branch",
		});

		// Add Leaf Nodes
		const leaves = branch.leaves;
		const leavesCount = leaves.length;

		leaves.forEach((leaf, lIdx) => {
			// Radiate leaves further outward around the branch angle
			const spreadAngle = 1.0; // total angle spread in radians
			const leafAngle =
				leavesCount <= 1
					? angle
					: angle - spreadAngle / 2 + (lIdx * spreadAngle) / (leavesCount - 1);

			const leafRadius = radius + 110;
			const leafX = centerX + Math.cos(leafAngle) * leafRadius;
			const leafY = centerY + Math.sin(leafAngle) * leafRadius;
			const leafId = `leaf-${bIdx}-${lIdx}`;

			nodes.push({
				id: leafId,
				type: "leaf",
				label: leaf.text,
				x: leafX,
				y: leafY,
				seconds: leaf.seconds,
			});

			// Link branch to leaf
			links.push({
				sourceX: branchX,
				sourceY: branchY,
				targetX: leafX,
				targetY: leafY,
				type: "branch-leaf",
			});
		});
	});

	return { nodes, links, width, height };
}
