"use client";

import { motion } from "framer-motion";
import {
	AlertTriangle,
	BrainCircuit,
	ChevronLeft,
	ChevronRight,
	Film,
	Folder,
	Library,
	Loader2,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
	onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
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
	onShowToast,
}: ControlDrawerProps) {
	const t = translations[locale as Locale] || translations.en;
	const isRtl = locale === "ar";

	const [urlInput, setUrlInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [videoToDelete, setVideoToDelete] = useState<VideoNode | null>(null);

	const [manualPasteVideo, setManualPasteVideo] = useState<VideoNode | null>(
		null,
	);
	const [transcriptInput, setTranscriptInput] = useState("");
	const [isSubmittingManual, setIsSubmittingManual] = useState(false);
	const [manualError, setManualError] = useState("");

	const handleManualSubmit = async () => {
		if (!manualPasteVideo || !transcriptInput.trim()) return;

		setIsSubmittingManual(true);
		setManualError("");

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ingest/manual`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(geminiApiKey ? { "X-Gemini-API-Key": geminiApiKey } : {}),
					},
					body: JSON.stringify({
						video_id: manualPasteVideo.id,
						transcript_text: transcriptInput,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.detail || "Failed to submit transcript");
			}

			setManualPasteVideo(null);
			setTranscriptInput("");
			onIngestSuccess();
			onShowToast?.(
				isRtl
					? "تم إدخال النص وتفعيل المتجهات بنجاح!"
					: "Transcript submitted and embedded successfully!",
				"success",
			);
		} catch (err) {
			const error = err as Error;
			setManualError(error.message || "Submission error");
		} finally {
			setIsSubmittingManual(false);
		}
	};

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
			onShowToast?.(error.message, "error");
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
			className="h-full border-r border-zinc-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col absolute lg:relative top-0 bottom-0 left-0 lg:top-auto lg:bottom-auto lg:left-auto shrink-0 z-45 lg:z-40 overflow-visible transition-colors duration-300 shadow-2xl lg:shadow-none"
		>
			{/* Fixed-width Inner Container to prevent squishing text on width resize */}
			<div
				className="w-[320px] flex-grow flex flex-col overflow-hidden"
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
				<ScrollArea className="flex-1 min-h-0">
					<div className="p-4 flex flex-col gap-3">
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
											{vid.status === "failed" && (
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														setManualPasteVideo(vid);
													}}
													className="mt-2 text-[10px] w-full py-1.5 rounded bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-accent-cyan hover:text-white dark:hover:bg-accent-cyan dark:hover:text-white hover:border-accent-cyan transition flex items-center justify-center font-medium gap-1"
												>
													<Plus className="w-3 h-3" />
													<span>
														{isRtl ? "إدخال نص يدوي" : "Paste Transcript"}
													</span>
												</button>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</ScrollArea>

				{/* Mobile-only Actions Footer (Visible only below lg screen width) */}
				<div className="lg:hidden p-4 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-950/20 backdrop-blur-md flex flex-col gap-3 shrink-0">
					{selectedVideoId && (
						<div className="flex items-center gap-2 text-xs bg-zinc-100/60 dark:bg-zinc-900/60 px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800/80">
							<Library className="w-3.5 h-3.5 text-accent-cyan" />
							<span className="font-mono text-zinc-600 dark:text-zinc-400">
								{t.activeYtId}:{" "}
								{videos.find((v) => v.id === selectedVideoId)?.youtube_id || ""}
							</span>
						</div>
					)}
					<div className="grid grid-cols-2 gap-2">
						<Link
							href={`/${locale}/roadmap`}
							className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 transition"
						>
							<BrainCircuit className="w-3.5 h-3.5 text-accent-cyan" />
							<span>{locale === "ar" ? "خريطة الطريق" : "Roadmap"}</span>
						</Link>
						<Link
							href={locale === "en" ? "/ar" : "/en"}
							className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 transition"
						>
							{t.languageLabel}
						</Link>
					</div>
					<a
						href={
							process.env.NEXT_PUBLIC_COFFEE_URL ||
							"https://sociabuzz.com/gabcares/support"
						}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center gap-2 text-xs font-semibold py-2 px-4 rounded-full border border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-950/40 transition-all duration-300"
					>
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
						</span>
						{t.buyMeCoffee}
					</a>
				</div>

				<Footer locale={locale} minimal />
			</div>

			{/* Expand/Collapse border toggle handle button */}
			<button
				type="button"
				onClick={onToggleOpen}
				className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-50 w-5 h-10 rounded-full border border-zinc-800/80 bg-zinc-950/90 text-zinc-400 hover:text-white transition shadow-md items-center justify-center ${
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
			<Dialog
				open={videoToDelete !== null}
				onOpenChange={(open) => !open && setVideoToDelete(null)}
			>
				<DialogContent
					showCloseButton={false}
					className="max-w-md p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl flex flex-col gap-4"
				>
					{videoToDelete && (
						<>
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

							<div className="text-xs text-zinc-700 dark:text-zinc-350 leading-relaxed flex flex-col gap-2 text-start">
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
						</>
					)}
				</DialogContent>
			</Dialog>

			{/* Custom Manual Ingestion Modal */}
			<Dialog
				open={manualPasteVideo !== null}
				onOpenChange={(open) => {
					if (!open) {
						setManualPasteVideo(null);
						setTranscriptInput("");
						setManualError("");
					}
				}}
			>
				<DialogContent
					showCloseButton={false}
					className="max-w-xl p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl flex flex-col gap-4 text-start"
				>
					{manualPasteVideo && (
						<>
							<div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
								<div className="flex items-center gap-2 text-accent-cyan font-sans">
									<Plus className="w-5 h-5 animate-pulse" />
									<h2 className="text-md font-semibold text-zinc-800 dark:text-zinc-100">
										{isRtl
											? "إدخال نص تفريغ يدوي"
											: "Manual Transcript Ingestion"}
									</h2>
								</div>
								<button
									type="button"
									onClick={() => {
										setManualPasteVideo(null);
										setTranscriptInput("");
										setManualError("");
									}}
									className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							<div className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed flex flex-col gap-2 font-sans">
								<p>
									{isRtl
										? "واجهت خوادمنا صعوبة في جلب تفريغ الفيديو تلقائيًا من YouTube. يمكنك المتابعة بنسخ تفريغ الفيديو يدويًا من YouTube ولصقه أدناه:"
										: "Our servers were rate-limited or blocked by YouTube. You can bypass this by copying and pasting the transcript manually:"}
								</p>
								<div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-850 flex flex-col gap-1">
									<span className="font-semibold text-zinc-750 dark:text-zinc-300">
										{isRtl ? "كيفية الحصول على النص:" : "Instructions:"}
									</span>
									<ul className="list-disc list-inside space-y-1 mt-1 text-[11px] text-zinc-650 dark:text-zinc-450">
										<li>
											<a
												href={`https://www.youtube.com/watch?v=${manualPasteVideo.youtube_id}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-accent-cyan hover:underline font-semibold"
											>
												{isRtl
													? "افتح الفيديو على YouTube ↗"
													: "Open video on YouTube ↗"}
											</a>
										</li>
										<li>
											{isRtl
												? "من تفاصيل الفيديو، انقر على 'عرض التفريغ' (Show Transcript)."
												: "In the description section, click 'Show transcript'."}
										</li>
										<li>
											{isRtl
												? "انسخ النص بأكمله (سواء كان يحتوي على طوابع زمنية أم لا) والصقه أدناه."
												: "Copy the entire text (both with/without timestamps) and paste it below."}
										</li>
									</ul>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<label
									htmlFor="transcript-paste"
									className="text-xs text-zinc-400 font-medium"
								>
									{isRtl ? "نص التفريغ الملصق:" : "Pasted Transcript Text:"}
								</label>
								<textarea
									id="transcript-paste"
									rows={8}
									value={transcriptInput}
									onChange={(e) => setTranscriptInput(e.target.value)}
									placeholder={
										isRtl
											? "0:00\nمرحباً بكم في هذا الفيديو...\n0:05\nاليوم سنتحدث عن..."
											: "0:00\nNever gonna give you up\n0:02\nNever gonna let you down"
									}
									className="w-full px-3 py-2 text-xs rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-accent-cyan text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 font-mono leading-normal resize-none"
									disabled={isSubmittingManual}
								/>
							</div>

							{manualError && (
								<p className="text-xs text-red-400 mt-1">{manualError}</p>
							)}

							<div className="flex gap-3 mt-2">
								<button
									type="button"
									onClick={() => {
										setManualPasteVideo(null);
										setTranscriptInput("");
										setManualError("");
									}}
									className="flex-grow py-2 text-sm rounded-lg font-semibold border border-zinc-350 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
									disabled={isSubmittingManual}
								>
									{isRtl ? "إلغاء" : "Cancel"}
								</button>
								<button
									type="button"
									onClick={handleManualSubmit}
									className="flex-grow py-2 text-sm rounded-lg font-semibold bg-accent-cyan hover:bg-accent-cyan/85 text-white transition flex items-center justify-center gap-1.5 disabled:opacity-50"
									disabled={isSubmittingManual || !transcriptInput.trim()}
								>
									{isSubmittingManual ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											<span>{isRtl ? "جاري الإدخال..." : "Ingesting..."}</span>
										</>
									) : (
										<span>
											{isRtl ? "حفظ النص وتفعيل المتجهات" : "Submit & Embed"}
										</span>
									)}
								</button>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</motion.div>
	);
}
