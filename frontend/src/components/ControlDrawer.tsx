"use client";

import { motion } from "framer-motion";
import {
	AlertTriangle,
	ChevronLeft,
	ChevronRight,
	Film,
	Folder,
	Loader2,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { type Locale, translations } from "@/lib/translations";

interface VideoNode {
	id: string;
	youtube_id: string;
	title: string;
	status: string;
}

interface ControlDrawerProps {
	videos: VideoNode[];
	selectedVideoId: string;
	onSelectVideo: (video: VideoNode) => void;
	onIngestSuccess: () => void;
	geminiApiKey?: string;
	isOpen: boolean;
	onToggleOpen: () => void;
	locale?: string;
}

export default function ControlDrawer({
	videos,
	selectedVideoId,
	onSelectVideo,
	onIngestSuccess,
	geminiApiKey,
	isOpen,
	onToggleOpen,
	locale = "en",
}: ControlDrawerProps) {
	const t = translations[locale as Locale] || translations.en;
	const isRtl = locale === "ar";

	const [urlInput, setUrlInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [videoToDelete, setVideoToDelete] = useState<VideoNode | null>(null);

	const handleIngest = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!urlInput.trim()) return;

		setIsSubmitting(true);
		setErrorMsg("");

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ingest`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(geminiApiKey ? { "X-Gemini-API-Key": geminiApiKey } : {}),
					},
					body: JSON.stringify({ url: urlInput }),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.detail || "Failed to submit URL");
			}

			setUrlInput("");
			onIngestSuccess();
		} catch (err) {
			const error = err as Error;
			setErrorMsg(error.message || "Network submission error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const confirmDeleteVideo = async () => {
		if (!videoToDelete) return;
		const targetId = videoToDelete.id;
		setVideoToDelete(null);

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/${targetId}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				throw new Error("Failed to delete video node");
			}

			onIngestSuccess();
		} catch (err) {
			const error = err as Error;
			alert(error.message);
		}
	};

	// Filter video list dynamically as user types
	const filteredVideos = videos.filter((vid) => {
		const titleMatch = vid.title
			?.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const idMatch = vid.youtube_id
			?.toLowerCase()
			.includes(searchQuery.toLowerCase());
		return titleMatch || idMatch;
	});

	return (
		<motion.div
			animate={{ width: isOpen ? 320 : 0 }}
			transition={{ type: "spring", stiffness: 220, damping: 26 }}
			className="h-full border-r border-zinc-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col relative shrink-0 z-40 overflow-visible transition-colors duration-300"
		>
			{/* Fixed-width Inner Container to prevent squishing text on width resize */}
			<div
				className="w-[320px] h-full flex flex-col overflow-hidden"
				style={{
					opacity: isOpen ? 1 : 0,
					pointerEvents: isOpen ? "auto" : "none",
					transition: "opacity 0.2s ease-in-out",
				}}
			>
				{/* Header */}
				<div className="p-4 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center gap-2">
					<Folder className="w-5 h-5 text-accent-cyan" />
					<span className="font-semibold text-lg text-gradient">
						{t.sourcesTitle}
					</span>
				</div>

				{/* Ingestion Input Form */}
				<div className="p-4 border-b border-zinc-200 dark:border-zinc-800/50">
					<form onSubmit={handleIngest} className="flex flex-col gap-2">
						<label
							htmlFor="url-input"
							className="text-xs text-zinc-400 font-medium"
						>
							{t.ingestYoutubeVideo}
						</label>
						<div className="flex gap-2">
							<input
								id="url-input"
								type="text"
								value={urlInput}
								onChange={(e) => setUrlInput(e.target.value)}
								placeholder="https://youtube.com/watch?v=..."
								className="flex-1 px-3 py-1.5 text-sm rounded bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-accent-cyan text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 transition-colors duration-300"
								disabled={isSubmitting}
							/>
							<button
								type="submit"
								className="p-2 rounded bg-accent-violet hover:bg-accent-violet/85 text-white flex items-center justify-center transition disabled:opacity-50"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Plus className="w-4 h-4" />
								)}
							</button>
						</div>
						{errorMsg && (
							<p className="text-xs text-red-400 mt-1">{errorMsg}</p>
						)}
					</form>
				</div>

				{/* Videos List */}
				<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
					<div className="flex flex-col gap-2 shrink-0">
						<span className="text-xs text-zinc-400 font-medium tracking-wider">
							{t.historicalVideoNodes}
						</span>

						{/* Search Filter Bar */}
						<div className="relative">
							<Search className="w-3.5 h-3.5 text-zinc-500 absolute start-2.5 top-1/2 -translate-y-1/2" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={t.searchPlaceholder}
								className="w-full ps-8 pe-3 py-1.5 text-xs rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800/80 focus:outline-none focus:border-accent-cyan text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 transition-colors duration-300"
							/>
						</div>
					</div>

					{filteredVideos.length === 0 ? (
						<div className="text-sm text-zinc-500 italic p-4 text-center">
							{searchQuery ? t.noMatchingVideos : t.noVideosIngested}
						</div>
					) : (
						<div className="flex flex-col gap-1.5">
							{filteredVideos.map((vid) => {
								const isSelected = vid.id === selectedVideoId;
								const isProcessing =
									vid.status !== "completed" && vid.status !== "failed";

								return (
									// biome-ignore lint/a11y/useSemanticElements: custom interactive card component
									<div
										key={vid.id}
										role="button"
										tabIndex={0}
										onClick={() => onSelectVideo(vid)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												onSelectVideo(vid);
											}
										}}
										className={`w-full text-start p-3 rounded-lg border text-sm transition flex flex-col gap-1.5 group/card cursor-pointer relative ${
											isSelected
												? "bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan"
												: "bg-zinc-100/50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800/40 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-900/60"
										}`}
									>
										<div className="flex items-center justify-between gap-2 w-full">
											<div className="flex items-center gap-2 font-medium truncate flex-1 min-w-0">
												<Film className="w-4 h-4 shrink-0 text-zinc-400 group-hover/card:text-accent-cyan transition" />
												<span className="truncate">
													{vid.title || vid.youtube_id}
												</span>
											</div>

											{/* Delete Button (Only for non-default videos) */}
											{!["dQw4w9WgXcQ", "-9bo8HlSxwQ"].includes(
												vid.youtube_id,
											) && (
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														setVideoToDelete(vid);
													}}
													className="opacity-0 group-hover/card:opacity-100 p-1 rounded hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition"
													title="Delete video node"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											)}
										</div>
										<div className="flex justify-between items-center text-xs w-full">
											<span className="text-zinc-500 font-mono text-[10px]">
												ID: {vid.youtube_id}
											</span>

											{/* Status Indicator */}
											<div className="flex items-center gap-1.5">
												<span
													className={`relative flex h-2 w-2 ${isProcessing ? "animate-pulse" : ""}`}
												>
													<span
														className={`relative inline-flex rounded-full h-2 w-2 ${
															vid.status === "completed"
																? "bg-emerald-500"
																: vid.status === "failed"
																	? "bg-rose-500"
																	: "bg-amber-500"
														}`}
													/>
												</span>
												<span
													className={`text-[9px] uppercase font-bold tracking-wider ${
														vid.status === "completed"
															? "text-emerald-400"
															: vid.status === "failed"
																? "text-rose-400"
																: "text-amber-400"
													}`}
												>
													{vid.status}
												</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Expand/Collapse border toggle handle button */}
			<button
				type="button"
				onClick={onToggleOpen}
				className={`absolute top-1/2 -translate-y-1/2 z-50 w-5 h-10 rounded-full border border-zinc-800/80 bg-zinc-950/90 text-zinc-400 hover:text-white transition shadow-md flex items-center justify-center ${
					isRtl ? "left-[-10px]" : "right-[-10px]"
				}`}
			>
				{isOpen ? (
					isRtl ? (
						<ChevronRight className="w-3.5 h-3.5" />
					) : (
						<ChevronLeft className="w-3.5 h-3.5" />
					)
				) : isRtl ? (
					<ChevronLeft className="w-3.5 h-3.5" />
				) : (
					<ChevronRight className="w-3.5 h-3.5" />
				)}
			</button>

			{/* Custom Delete Confirmation Modal */}
			{videoToDelete && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
					<div className="p-6 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col gap-4 shadow-2xl transition-colors duration-300">
						<div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
							<div className="flex items-center gap-2 text-red-500 font-sans">
								<AlertTriangle className="w-5 h-5" />
								<h2 className="text-md font-semibold text-zinc-800 dark:text-zinc-100">
									{isRtl ? "حذف عقدة الفيديو" : "Delete Video Node"}
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setVideoToDelete(null)}
								className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="text-xs text-zinc-700 dark:text-zinc-350 leading-relaxed flex flex-col gap-2">
							<p>
								{isRtl
									? "هل أنت متأكد من حذف عقدة هذا الفيديو وجميع المتجهات الدلالية الخاصة بها؟"
									: "Are you sure you want to delete this historical video node and all its semantic vectors?"}
							</p>
							<p className="font-mono bg-zinc-100 dark:bg-zinc-900 p-2 rounded text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800/60 truncate">
								{videoToDelete.title || videoToDelete.youtube_id}
							</p>
						</div>

						<div className="flex gap-3 mt-2">
							<button
								type="button"
								onClick={() => setVideoToDelete(null)}
								className="flex-1 py-2 text-sm rounded-lg font-semibold border border-zinc-300 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
							>
								{isRtl ? "إلغاء" : "Cancel"}
							</button>
							<button
								type="button"
								onClick={confirmDeleteVideo}
								className="flex-1 py-2 text-sm rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition"
							>
								{isRtl ? "حذف" : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</motion.div>
	);
}
