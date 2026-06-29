"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Folder,
	Film,
	Plus,
	ChevronLeft,
	ChevronRight,
	Loader2,
} from "lucide-react";

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
}

export default function ControlDrawer({
	videos,
	selectedVideoId,
	onSelectVideo,
	onIngestSuccess,
}: ControlDrawerProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [urlInput, setUrlInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

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
					headers: { "Content-Type": "application/json" },
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

	return (
		<div className="relative z-20 flex h-full">
			{/* Control Drawer Sidebar Panel */}
			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div
						initial={{ width: 0, opacity: 0 }}
						animate={{ width: 320, opacity: 1 }}
						exit={{ width: 0, opacity: 0 }}
						transition={{ type: "spring", damping: 20, stiffness: 100 }}
						className="h-full border-r border-zinc-800/40 bg-zinc-950/20 backdrop-blur-2xl flex flex-col overflow-hidden shadow-2xl"
					>
						{/* Header */}
						<div className="p-4 border-b border-zinc-800/50 flex items-center gap-2">
							<Folder className="w-5 h-5 text-accent-cyan" />
							<span className="font-semibold text-lg text-gradient">
								TubeRAG Engine
							</span>
						</div>

						{/* Ingestion Input Form */}
						<div className="p-4 border-b border-zinc-800/50">
							<form onSubmit={handleIngest} className="flex flex-col gap-2">
								<label
									htmlFor="url-input"
									className="text-xs text-zinc-400 font-medium"
								>
									INGEST YOUTUBE VIDEO
								</label>
								<div className="flex gap-2">
									<input
										id="url-input"
										type="text"
										value={urlInput}
										onChange={(e) => setUrlInput(e.target.value)}
										placeholder="https://youtube.com/watch?v=..."
										className="flex-1 px-3 py-1.5 text-sm rounded bg-zinc-900/80 border border-zinc-800 focus:outline-none focus:border-accent-cyan text-zinc-200 placeholder-zinc-500"
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
							<span className="text-xs text-zinc-400 font-medium tracking-wider">
								HISTORICAL VIDEO NODES
							</span>
							{videos.length === 0 ? (
								<div className="text-sm text-zinc-500 italic p-4 text-center">
									No videos ingested yet.
								</div>
							) : (
								<div className="flex flex-col gap-1.5">
									{videos.map((vid) => {
										const isSelected = vid.id === selectedVideoId;
										return (
											<button
												key={vid.id}
												type="button"
												onClick={() => onSelectVideo(vid)}
												className={`w-full text-left p-3 rounded-lg border text-sm transition flex flex-col gap-1.5 ${
													isSelected
														? "bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan"
														: "bg-zinc-900/20 border-zinc-800/40 text-zinc-300 hover:bg-zinc-900/60"
												}`}
											>
												<div className="flex items-center gap-2 font-medium truncate w-full">
													<Film className="w-4 h-4 shrink-0" />
													<span className="truncate">
														{vid.title || vid.youtube_id}
													</span>
												</div>
												<div className="flex justify-between items-center text-xs w-full">
													<span className="text-zinc-500">
														ID: {vid.youtube_id}
													</span>
													<span
														className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${
															vid.status === "completed"
																? "bg-green-500/10 text-green-400 border border-green-500/20"
																: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
														}`}
													>
														{vid.status}
													</span>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Collapse Toggle Handle Button */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="absolute top-1/2 -translate-y-1/2 -right-3 z-30 w-6 h-12 rounded-r-lg border border-l-0 border-zinc-800/50 bg-zinc-950/40 backdrop-blur-md flex items-center justify-center text-zinc-400 hover:text-white transition"
			>
				{isOpen ? (
					<ChevronLeft className="w-4 h-4" />
				) : (
					<ChevronRight className="w-4 h-4" />
				)}
			</button>
		</div>
	);
}
