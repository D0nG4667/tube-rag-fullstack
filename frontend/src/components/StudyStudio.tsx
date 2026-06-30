"use client";

import { motion } from "framer-motion";
import {
	BookOpen,
	Check,
	ChevronLeft,
	ChevronRight,
	Copy,
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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type Locale, translations } from "@/lib/translations";
import SpotlightPanel from "./SpotlightPanel";
import CustomMarkdown from "./CustomMarkdown";

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
	width?: number;
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
	width = 480,
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
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Handwritten Notes State
	const [notes, setNotes] = useState<string>("");
	const [loadingNotes, setLoadingNotes] = useState(false);

	// Mindmap State
	const [mindmap, setMindmap] = useState<MindmapData | null>(null);
	const [loadingMindmap, setLoadingMindmap] = useState(false);
	const [isFullscreenMindmap, setIsFullscreenMindmap] = useState(false);

	// Share CTA Dropdown State
	const [isShareOpen, setIsShareOpen] = useState(false);
	const [copied, setCopied] = useState(false);

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
			alert(
				isRtl
					? "⚠️ فشل في إنشاء سيناريو البودكاست."
					: "⚠️ Failed to generate Podcast Script.",
			);
		} finally {
			setLoadingPodcast(false);
		}
	};

	// Generate natural podcast audio using Gemini
	const generatePodcastAudio = async () => {
		if (podcastScript.length === 0) return;
		setLoadingAudio(true);
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
				}
				throw new Error();
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			setPodcastAudioUrl(url);

			if (audioRef.current) {
				audioRef.current.src = url;
				audioRef.current.play().catch(() => {});
				setIsPlayingPodcast(true);
			}
		} catch {
			alert(
				isRtl
					? "⚠️ فشل في توليد الصوت الطبيعي للبودكاست."
					: "⚠️ Failed to generate natural podcast audio.",
			);
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
			alert(
				isRtl
					? "⚠️ فشل في إنشاء خريطة المفاهيم."
					: "⚠️ Failed to generate Concept Map.",
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
		} else {
			shareText += "Insights and outlines prepared in StudyStudio.";
		}

		navigator.clipboard.writeText(shareText);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<motion.div
			animate={{ width: isOpen ? width : 0 }}
			transition={{ type: "spring", stiffness: 220, damping: 26 }}
			className="h-full border-l border-zinc-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col relative shrink-0 z-40 overflow-visible transition-colors duration-300"
		>
			{/* Dynamic width Inner Container to prevent squishing text on width resize */}
			<div
				className="h-full flex flex-col overflow-hidden"
				style={{
					width: `${width}px`,
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
										const xText = `🧠 Synthesized a technical deep dive of "${videoTitle}" using TubeRAG!\n\n✨ Instant semantic outlines, interactive concept maps, and audio discussion scripts.\n\nTry the workspace: ${shareUrl} 🚀\n\n#AI #SaaS #TubeRAG #NextJS #Gemini`;
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
										const linkedinText = `🚀 Just generated a multi-agent technical breakdown of "${videoTitle}" using TubeRAG!\n\nTubeRAG synthesizes complex lectures and playlists into structured learning assets:\n📝 Multi-document semantic outline\n🎙️ Interactive audio podcast dialogue\n🧠 Interconnected visual concept maps\n\nPowered by Gemini 2.5 Flash & Supabase pgvector.\n\nExplore the project: https://github.com/tuberag\n\n#ArtificialIntelligence #SaaS #Productivity #EdTech #RAG`;

										navigator.clipboard
											.writeText(linkedinText)
											.then(() => {
												alert(
													isRtl
														? "📋 تم نسخ نموذج منشور LinkedIn الاحترافي إلى الحافظة! يمكنك لصقه مباشرة في LinkedIn لسهولة المشاركة."
														: "📋 Professional LinkedIn post template copied to clipboard! You can paste it directly into your post.",
												);
											})
											.catch(() => {});

										const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
										window.open(url, "_blank");
									}}
									className="w-full text-start px-3 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition"
								>
									<Linkedin className="w-3.5 h-3.5 text-blue-500" />
									{t.shareOnLinkedIn}
								</button>
								<button
									type="button"
									onClick={() => {
										window.print();
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
				</div>

				{/* Sub-tab selection */}
				<div className="flex border-b border-zinc-200 dark:border-zinc-800/40 p-1 bg-zinc-100/50 dark:bg-zinc-950/30 gap-1 shrink-0">
					<button
						type="button"
						onClick={() => {
							setActiveTab("outline");
							setIsShareOpen(false);
						}}
						className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
							activeTab === "outline"
								? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
								: "text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						}`}
					>
						<BookOpen className="w-3.5 h-3.5" />
						{t.outlineTab}
					</button>
					<button
						type="button"
						onClick={() => {
							setActiveTab("podcast");
							setIsShareOpen(false);
						}}
						className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
							activeTab === "podcast"
								? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
								: "text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						}`}
					>
						<Radio className="w-3.5 h-3.5" />
						{t.podcastTab}
					</button>
					<button
						type="button"
						onClick={() => {
							setActiveTab("mindmap");
							setIsShareOpen(false);
						}}
						className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
							activeTab === "mindmap"
								? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
								: "text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						}`}
					>
						<Network className="w-3.5 h-3.5" />
						{t.conceptMapTab}
					</button>
					<button
						type="button"
						onClick={() => {
							setActiveTab("notes");
							setIsShareOpen(false);
						}}
						className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
							activeTab === "notes"
								? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
								: "text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-200"
						}`}
					>
						<PenTool className="w-3.5 h-3.5" />
						{t.notesTab}
					</button>
				</div>

				{/* Scrollable View Area */}
				<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
					{/* Tab 1: Presentation Outline */}
					{activeTab === "outline" && (
						<div className="flex flex-col gap-4 h-full">
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
								<div className="flex-1 flex flex-col items-center justify-center gap-2">
									<Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
									<span className="text-xs text-zinc-500 font-medium">
										Synthesizing outline from transcript...
									</span>
								</div>
							)}

							{outline && !loadingOutline && (
								<SpotlightPanel className="flex-1 p-4 rounded-xl flex flex-col min-h-0 overflow-y-auto">
									<span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-3 border-b border-zinc-800/60 pb-1.5 block">
										{t.outlineTab}
									</span>
									<div className="text-xs text-zinc-700 dark:text-zinc-300 font-sans scrollbar-thin">
										<CustomMarkdown
											content={outline}
											onSeek={onSeek}
											isRtl={isRtl}
										/>
									</div>
								</SpotlightPanel>
							)}
						</div>
					)}

					{/* Tab 2: Audio overview podcast script */}
					{activeTab === "podcast" && (
						<div className="flex flex-col gap-4 h-full">
							{podcastScript.length === 0 && !loadingPodcast && (
								<div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
									<Radio className="w-8 h-8 text-zinc-600 mb-2" />
									<span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
										{t.noPodcast}
									</span>
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
								<div className="flex-1 flex flex-col items-center justify-center gap-2">
									<Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
									<span className="text-xs text-zinc-500 font-medium">
										Drafting host discussion...
									</span>
								</div>
							)}

							{podcastScript.length > 0 && !loadingPodcast && (
								<div className="flex-1 flex flex-col gap-4 min-h-0">
									{/* biome-ignore lint/a11y/useMediaCaption: custom audio player without caption tracks */}
									<audio
										ref={audioRef}
										src={podcastAudioUrl || undefined}
										onPlay={() => setIsPlayingPodcast(true)}
										onPause={() => setIsPlayingPodcast(false)}
										onEnded={() => {
											setIsPlayingPodcast(false);
											setCurrentPodcastIndex(-1);
										}}
										className="hidden"
									/>

									{/* Mini player interface */}
									<div className="p-3.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0 shadow-lg">
										<div className="flex flex-col">
											<span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
												{t.audioOverviewDiscussion}
												{isPlayingPodcast && (
													<span className="flex items-center gap-0.5 h-2.5">
														<span className="w-0.5 h-1.5 bg-accent-cyan rounded animate-bounce [animation-delay:0.1s]" />
														<span className="w-0.5 h-2.5 bg-accent-cyan rounded animate-bounce [animation-delay:0.2s]" />
														<span className="w-0.5 h-2 bg-accent-cyan rounded animate-bounce [animation-delay:0.3s]" />
														<span className="w-0.5 h-1 bg-accent-cyan rounded animate-bounce [animation-delay:0.4s]" />
													</span>
												)}
											</span>
											<span className="text-[10px] text-zinc-500 font-mono">
												{loadingAudio
													? locale === "ar"
														? "جاري توليد الصوت الطبيعي..."
														: "Generating natural audio..."
													: isPlayingPodcast
														? locale === "ar"
															? "جاري تشغيل الصوت الطبيعي"
															: "Playing natural Gemini voiceover"
														: podcastAudioUrl
															? locale === "ar"
																? "الصوت جاهز للتشغيل"
																: "Audio generated & ready"
															: t.audioPlayerReady}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => {
													setIsMuted(!isMuted);
													if (audioRef.current) {
														audioRef.current.muted = !isMuted;
													}
												}}
												className="p-2 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700/80 transition text-zinc-650 dark:text-zinc-300"
											>
												{isMuted ? (
													<VolumeX className="w-4 h-4" />
												) : (
													<Volume2 className="w-4 h-4" />
												)}
											</button>
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

									{/* Script Scrollable Area */}
									<div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 scrollbar-thin">
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
					)}

					{/* Tab 3: SVG Interactive Mindmap */}
					{activeTab === "mindmap" && (
						<div className="flex flex-col gap-4 h-full">
							{!mindmap && !loadingMindmap && (
								<div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
									<Network className="w-8 h-8 text-zinc-600 mb-2" />
									<span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
										{t.noMindmap}
									</span>
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
								<div className="flex-1 flex flex-col items-center justify-center gap-2">
									<Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
									<span className="text-xs text-zinc-500 font-medium">
										Mapping clusters and timestamp paths...
									</span>
								</div>
							)}

							{mindmap && !loadingMindmap && (
								<div className="flex-1 flex flex-col gap-4 min-h-0 relative animate-fade-in">
									<div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5 shrink-0">
										<span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
											{t.conceptMapTab}
										</span>
										<button
											type="button"
											onClick={() => setIsFullscreenMindmap(true)}
											className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold transition flex items-center gap-1"
										>
											<Network className="w-3 h-3" />
											{t.fullscreenGraph}
										</button>
									</div>

									<div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 relative ps-6 scrollbar-thin">
										{/* Directory style connector line */}
										<div className="absolute start-3 top-4 bottom-8 w-0.5 bg-zinc-800" />

										{/* Root Node */}
										<div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/15 text-cyan-300 text-xs font-bold shadow relative">
											<div className="absolute start-[-16px] top-1/2 -translate-y-1/2 w-4 h-0.5 bg-zinc-800" />
											🧠 {mindmap.subject}
										</div>

										{/* Branch Nodes */}
										{mindmap.branches.map((branch) => (
											<div
												key={branch.title}
												className="flex flex-col gap-2 ps-4 relative"
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
															<button
																key={leafKey}
																type="button"
																onClick={() => onSeek(leaf.seconds)}
																className="w-full text-start p-2 rounded border border-zinc-200 dark:border-zinc-850/60 bg-zinc-50/40 dark:bg-zinc-950/40 text-zinc-650 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-700 text-[11px] transition flex items-start gap-2 relative group"
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
															</button>
														);
													})}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Tab 4: Handwritten Notes */}
					{activeTab === "notes" && (
						<div className="flex flex-col gap-4 h-full">
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
								<div className="flex-1 flex flex-col items-center justify-center gap-2">
									<Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
									<span className="text-xs text-zinc-500 font-medium">
										Writing calligraphy study notes...
									</span>
								</div>
							)}

							{notes && !loadingNotes && (
								<div className="flex-1 flex flex-col min-h-0 relative animate-fade-in">
									<span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold border-b border-zinc-800/60 pb-1.5 mb-2 block shrink-0">
										{t.notesTab}
									</span>
									<div className="flex-1 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800/40 ruled-paper shadow-inner scrollbar-thin">
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
					)}
				</div>
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
		</motion.div>
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
