"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import MatrixCanvas from "@/components/MatrixCanvas";
import ControlDrawer from "@/components/ControlDrawer";
import { VideoPlayer, type VideoPlayerRef } from "@/components/VideoPlayer";
import ChatPanel from "@/components/ChatPanel";
import { supabase } from "@/lib/supabase";
import { Sparkles, Library } from "lucide-react";

interface VideoNode {
	id: string;
	youtube_id: string;
	title: string;
	status: string;
}

export default function Dashboard() {
	const [videos, setVideos] = useState<VideoNode[]>([]);
	const [selectedVideo, setSelectedVideo] = useState<VideoNode | null>(null);
	const playerRef = useRef<VideoPlayerRef>(null);

	const [splitWidth, setSplitWidth] = useState(50); // default 50% split width
	const [isDragging, setIsDragging] = useState(false);
	const [isChatFocused, setIsChatFocused] = useState(false);

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const percentage = (e.clientX / window.innerWidth) * 100;
			// Clamp split pane limits between 30% and 70%
			setSplitWidth(Math.max(30, Math.min(70, percentage)));
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging]);

	// Fetch ingested videos list
	const fetchVideos = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from("videos")
				.select("id, youtube_id, title, status")
				.order("created_at", { ascending: false });

			if (error) throw error;
			if (data && data.length > 0) {
				setVideos(data);
				// Auto-select first video if none selected
				setSelectedVideo((current) => {
					if (!current) {
						return data[0];
					}
					return current;
				});
			} else {
				// Use default catalog list if database is empty
				const CATALOG_VIDEOS = [
					{
						id: "00000000-0000-0000-0000-000000000001",
						youtube_id: "dQw4w9WgXcQ",
						title:
							"Rick Astley - Never Gonna Give You Up (Official Music Video)",
						status: "completed",
					},
					{
						id: "00000000-0000-0000-0000-000000000002",
						youtube_id: "-9bo8HlSxwQ",
						title: "CS50's Introduction to Programming with Python - Lecture 0",
						status: "completed",
					},
				];
				setVideos(CATALOG_VIDEOS);
				setSelectedVideo((current) => current || CATALOG_VIDEOS[0]);
			}
		} catch (err) {
			console.error("Error fetching videos:", err);
			// Fallback to default catalog list if Supabase connection fails
			const CATALOG_VIDEOS = [
				{
					id: "00000000-0000-0000-0000-000000000001",
					youtube_id: "dQw4w9WgXcQ",
					title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
					status: "completed",
				},
				{
					id: "00000000-0000-0000-0000-000000000002",
					youtube_id: "-9bo8HlSxwQ",
					title: "CS50's Introduction to Programming with Python - Lecture 0",
					status: "completed",
				},
			];
			setVideos(CATALOG_VIDEOS);
			setSelectedVideo((current) => current || CATALOG_VIDEOS[0]);
		}
	}, []);

	useEffect(() => {
		fetchVideos();

		// Subscribe to supabase database real-time pipeline changes
		const channel = supabase
			.channel("video_changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "videos" },
				() => {
					fetchVideos();
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [fetchVideos]);

	const handleSeek = (seconds: number) => {
		if (playerRef.current) {
			playerRef.current.seekTo(seconds);
		}
	};

	// Active state switches on if any ingestion is in progress
	const hasActiveJob = videos.some(
		(vid) => vid.status !== "completed" && vid.status !== "failed",
	);

	return (
		<main className="relative min-h-screen w-screen flex text-zinc-100 overflow-hidden">
			{/* 3D background canvas layer */}
			<MatrixCanvas
				active={hasActiveJob}
				selectedVideoId={selectedVideo?.id || ""}
				isFocused={isChatFocused}
			/>

			{/* Collapsible Left drawer control */}
			<ControlDrawer
				videos={videos}
				selectedVideoId={selectedVideo?.id || ""}
				onSelectVideo={(video) => setSelectedVideo(video)}
				onIngestSuccess={fetchVideos}
			/>

			{/* Main Core Viewport Split Grid */}
			<div className="flex-1 flex flex-col p-6 overflow-hidden h-screen gap-6">
				{/* Header toolbar */}
				<header className="flex justify-between items-center glass-panel p-4 rounded-xl shrink-0">
					<div className="flex items-center gap-2">
						<Sparkles className="w-5 h-5 text-accent-cyan" />
						<h1 className="text-sm font-semibold tracking-wider uppercase text-zinc-200">
							TubeRAG / RAG Viewport Workspace
						</h1>
					</div>
					<div className="flex items-center gap-4">
						{selectedVideo && (
							<div className="flex items-center gap-2 text-xs bg-zinc-900/60 px-3 py-1 rounded border border-zinc-800/80">
								<Library className="w-3.5 h-3.5 text-accent-cyan" />
								<span className="font-mono text-zinc-400">
									ACTIVE YT ID: {selectedVideo.youtube_id}
								</span>
							</div>
						)}
						<a
							href={
								process.env.NEXT_PUBLIC_COFFEE_URL ||
								"https://sociabuzz.com/gabcares/support"
							}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-950/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all duration-300"
						>
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
							</span>
							Buy me a coffee
						</a>
					</div>
				</header>

				{/* Viewport & chat splits */}
				<div
					className="flex-1 flex gap-6 min-h-0 overflow-hidden relative"
					style={{ userSelect: isDragging ? "none" : "auto" }}
				>
					{/* Left panel: player container */}
					<div
						className="flex flex-col gap-4 min-h-0"
						style={{ width: `${splitWidth}%` }}
					>
						<div className="glass-panel p-4 rounded-xl flex-1 flex flex-col justify-center min-h-0">
							<span className="text-xs text-zinc-500 font-semibold tracking-widest mb-3 block">
								VIDEO PLAYER ENGINE
							</span>
							<VideoPlayer
								ref={playerRef}
								youtubeId={selectedVideo?.youtube_id || ""}
							/>
						</div>
					</div>

					{/* Resizer Handle Bar */}
					<div
						onMouseDown={handleMouseDown}
						className={`w-1 cursor-col-resize h-full rounded transition-all duration-150 relative self-stretch flex items-center justify-center ${
							isDragging
								? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
								: "bg-zinc-800/40 hover:bg-zinc-700/60"
						}`}
					>
						<div className="w-4 h-8 rounded border border-zinc-800/80 bg-zinc-950/90 flex items-center justify-center gap-0.5 z-20">
							<div className="w-0.5 h-3 bg-zinc-600" />
							<div className="w-0.5 h-3 bg-zinc-600" />
						</div>
					</div>

					{/* Right panel: Agentic chat module */}
					<div className="flex flex-col min-h-0 flex-1">
						<ChatPanel
							videoId={selectedVideo?.id || ""}
							onSeek={handleSeek}
							onFocusChange={setIsChatFocused}
						/>
					</div>
				</div>
			</div>
		</main>
	);
}
