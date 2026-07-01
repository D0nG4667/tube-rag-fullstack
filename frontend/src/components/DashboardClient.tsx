"use client";

import {
	AlertCircle,
	BookOpen,
	Brain,
	BrainCircuit,
	Eye,
	EyeOff,
	Key,
	Library,
	Lock,
	Menu,
	Settings as SettingsIcon,
	Trash2,
	Tv,
	Unlock,
	X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import ChatPanel from "@/components/ChatPanel";
import ControlDrawer from "@/components/ControlDrawer";
import MatrixCanvas from "@/components/MatrixCanvas";
import { ModeToggle } from "@/components/ModeToggle";
import StudyStudio from "@/components/StudyStudio";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer, type VideoPlayerRef } from "@/components/VideoPlayer";
import { decryptApiKey, encryptApiKey } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";
import { type Locale, translations } from "@/lib/translations";

interface VideoNode {
	id: string;
	youtube_id: string;
	title: string;
	status: string;
}

export default function DashboardClient({ locale }: { locale: string }) {
	const t = translations[locale as Locale] || translations.en;

	const [videos, setVideos] = useState<VideoNode[]>([]);
	const [selectedVideo, setSelectedVideo] = useState<VideoNode | null>(null);
	const [isRealtimeActive, setIsRealtimeActive] = useState(true);
	const playerRef = useRef<VideoPlayerRef>(null);
	const rightPanelRef = useRef<PanelImperativeHandle>(null);

	const [isChatFocused, setIsChatFocused] = useState(false);
	const [isDraggingLayout, setIsDraggingLayout] = useState(false);

	const [isMobile, setIsMobile] = useState(false);
	const [isLeftOpen, setIsLeftOpen] = useState(true);
	const [isRightOpen, setIsRightOpen] = useState(true);

	useEffect(() => {
		const check = () => {
			const mobile = window.innerWidth < 1024;
			setIsMobile(mobile);
			if (mobile) {
				setIsLeftOpen(false);
				setIsRightOpen(false);
			} else {
				setIsLeftOpen(true);
				setIsRightOpen(true);
			}
		};
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	useEffect(() => {
		if (!isDraggingLayout) return;
		const handlePointerUp = () => setIsDraggingLayout(false);
		window.addEventListener("pointerup", handlePointerUp);
		return () => window.removeEventListener("pointerup", handlePointerUp);
	}, [isDraggingLayout]);

	// Custom Gemini API Key state
	const [geminiApiKey, setGeminiApiKey] = useState<string>(
		typeof window !== "undefined"
			? sessionStorage.getItem("tuberag_temp_gemini_key") || ""
			: "",
	);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [tempApiKey, setTempApiKey] = useState("");
	const [passphrase, setPassphrase] = useState("");
	const [showApiKey, setShowApiKey] = useState(false);

	// Passphrase dialog for saved key on load
	const [hasSavedKey, setHasSavedKey] = useState(false);
	const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
	const [unlockPassphrase, setUnlockPassphrase] = useState("");
	const [unlockError, setUnlockError] = useState("");
	const [toastMessage, setToastMessage] = useState<{
		text: string;
		type: "success" | "error" | "info";
	} | null>(null);

	const showToast = (
		text: string,
		type: "success" | "error" | "info" = "success",
	) => {
		setToastMessage({ text, type });
		setTimeout(() => setToastMessage(null), 3000);
	};

	useEffect(() => {
		const saved = localStorage.getItem("tuberag_encrypted_gemini_key");
		const inMemory = sessionStorage.getItem("tuberag_temp_gemini_key");
		if (saved && !inMemory) {
			setHasSavedKey(true);
			setIsUnlockModalOpen(true);
		} else if (inMemory) {
			setGeminiApiKey(inMemory);
			setHasSavedKey(!!saved);
		}
	}, []);

	const handleSaveKey = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!tempApiKey.trim() || !passphrase.trim()) return;
		try {
			const encrypted = await encryptApiKey(
				tempApiKey.trim(),
				passphrase.trim(),
			);
			localStorage.setItem("tuberag_encrypted_gemini_key", encrypted);
			sessionStorage.setItem("tuberag_temp_gemini_key", tempApiKey.trim());
			setGeminiApiKey(tempApiKey.trim());
			setHasSavedKey(true);
			setIsSettingsOpen(false);
			setTempApiKey("");
			setPassphrase("");
			showToast(
				locale === "ar"
					? "تم تشفير وحفظ مفتاحك بنجاح!"
					: "Gemini API key encrypted and saved successfully!",
				"success",
			);
		} catch (err) {
			console.error(err);
			showToast(
				locale === "ar" ? "فشل تشفير المفتاح." : "Error encrypting key.",
				"error",
			);
		}
	};

	const handleUnlockKey = async (e: React.FormEvent) => {
		e.preventDefault();
		const saved = localStorage.getItem("tuberag_encrypted_gemini_key");
		if (!saved || !unlockPassphrase.trim()) return;
		setUnlockError("");
		try {
			const decrypted = await decryptApiKey(saved, unlockPassphrase.trim());
			sessionStorage.setItem("tuberag_temp_gemini_key", decrypted);
			setGeminiApiKey(decrypted);
			setIsUnlockModalOpen(false);
			setUnlockPassphrase("");
			showToast(
				locale === "ar"
					? "تم فك تشفير المفتاح بنجاح!"
					: "Key unlocked successfully!",
				"success",
			);
		} catch (_err) {
			setUnlockError(
				locale === "ar"
					? "فشل فك التشفير. يرجى التحقق من العبارة."
					: "Decryption failed. Please check your passphrase.",
			);
		}
	};

	const handleClearKey = () => {
		localStorage.removeItem("tuberag_encrypted_gemini_key");
		sessionStorage.removeItem("tuberag_temp_gemini_key");
		setGeminiApiKey("");
		setHasSavedKey(false);
		setIsSettingsOpen(false);
		showToast(
			locale === "ar"
				? "تم مسح مفتاح API من متصفحك."
				: "Custom API key cleared from browser storage.",
			"info",
		);
	};

	const fetchVideos = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from("videos")
				.select("id, youtube_id, title, status")
				.order("created_at", { ascending: false });

			if (error) throw error;
			if (data && data.length > 0) {
				const processed = data.map((vid) => ({
					...vid,
					title:
						vid.youtube_id === "-9bo8HlSxwQ"
							? "CS50x 2026 - Artificial Intelligence"
							: vid.title,
				}));
				const sorted = processed.sort((a, b) => {
					if (a.youtube_id === "-9bo8HlSxwQ") return -1;
					if (b.youtube_id === "-9bo8HlSxwQ") return 1;
					if (a.youtube_id === "dQw4w9WgXcQ") return -1;
					if (b.youtube_id === "dQw4w9WgXcQ") return 1;
					return 0;
				});
				setVideos(sorted);
				setSelectedVideo((current) => current || sorted[0]);
			} else {
				const CATALOG_VIDEOS = [
					{
						id: "00000000-0000-0000-0000-000000000001",
						youtube_id: "-9bo8HlSxwQ",
						title: "CS50x 2026 - Artificial Intelligence",
						status: "pending",
					},
					{
						id: "00000000-0000-0000-0000-000000000002",
						youtube_id: "dQw4w9WgXcQ",
						title:
							"Rick Astley - Never Gonna Give You Up (Official Music Video)",
						status: "completed",
					},
				];
				setVideos(CATALOG_VIDEOS);
				setSelectedVideo((current) => current || CATALOG_VIDEOS[0]);
			}
		} catch (err) {
			console.error("Error fetching videos:", err);
			const CATALOG_VIDEOS = [
				{
					id: "00000000-0000-0000-0000-000000000001",
					youtube_id: "-9bo8HlSxwQ",
					title: "CS50x 2026 - Artificial Intelligence",
					status: "pending",
				},
				{
					id: "00000000-0000-0000-0000-000000000002",
					youtube_id: "dQw4w9WgXcQ",
					title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
					status: "completed",
				},
			];
			setVideos(CATALOG_VIDEOS);
			setSelectedVideo((current) => current || CATALOG_VIDEOS[0]);
		}
	}, []);

	useEffect(() => {
		fetchVideos();

		const channel = supabase
			.channel("video_changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "videos" },
				() => {
					fetchVideos();
				},
			)
			.subscribe((status) => {
				setIsRealtimeActive(status === "SUBSCRIBED");
			});

		return () => {
			supabase.removeChannel(channel);
		};
	}, [fetchVideos]);

	const hasActiveJob = videos.some(
		(vid) => vid.status !== "completed" && vid.status !== "failed",
	);

	// Polling fallback when there is an active ingestion job AND supabase realtime connection is down
	useEffect(() => {
		if (!hasActiveJob || isRealtimeActive) return;

		const interval = setInterval(() => {
			fetchVideos();
		}, 5000); // Failover poll every 5 seconds

		return () => {
			clearInterval(interval);
		};
	}, [hasActiveJob, isRealtimeActive, fetchVideos]);

	const handleSeek = (seconds: number) => {
		if (playerRef.current) {
			playerRef.current.seekTo(seconds);
		}
	};

	return (
		<main className="relative h-screen w-full flex text-zinc-800 dark:text-zinc-100 overflow-hidden bg-background">
			{/* 3D background canvas layer */}
			<MatrixCanvas
				active={hasActiveJob}
				selectedVideoId={selectedVideo?.id || ""}
				isFocused={isChatFocused}
			/>

			{/* Desktop collapsible left drawer control */}
			{!isMobile && (
				<ControlDrawer
					videos={videos}
					selectedVideoId={selectedVideo?.id || ""}
					onSelectVideo={(video) => {
						setSelectedVideo(video);
					}}
					onIngestSuccess={fetchVideos}
					geminiApiKey={geminiApiKey}
					isOpen={isLeftOpen}
					onToggleOpen={() => setIsLeftOpen(!isLeftOpen)}
					locale={locale}
					onShowToast={showToast}
				/>
			)}

			{/* Mobile responsive sidebar drawer using Radix Sheet */}
			{isMobile && (
				<Sheet open={isLeftOpen} onOpenChange={setIsLeftOpen}>
					<SheetContent
						side="left"
						className="p-0 border-r border-zinc-200 dark:border-zinc-800/40 bg-zinc-950 w-[320px] h-full"
					>
						<ControlDrawer
							videos={videos}
							selectedVideoId={selectedVideo?.id || ""}
							onSelectVideo={(video) => {
								setSelectedVideo(video);
								setIsLeftOpen(false);
							}}
							onIngestSuccess={fetchVideos}
							geminiApiKey={geminiApiKey}
							isOpen={true} // Always open within the sheet modal overlay
							onToggleOpen={() => setIsLeftOpen(false)}
							locale={locale}
							onShowToast={showToast}
						/>
					</SheetContent>
				</Sheet>
			)}

			{/* Main Core Viewport Split Grid */}
			<div className="flex-1 flex flex-col p-6 overflow-hidden h-screen gap-6 z-10">
				{/* Header toolbar */}
				<header className="flex justify-between items-center glass-panel p-4 rounded-xl shrink-0">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setIsLeftOpen(!isLeftOpen)}
							className="lg:hidden p-2 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition"
							title="Toggle Sources"
						>
							<Menu className="w-4 h-4" />
						</button>
						<BrainCircuit className="w-5 h-5 text-accent-cyan hidden lg:block" />
						<h1 className="text-xs lg:text-sm font-semibold tracking-wider uppercase text-zinc-800 dark:text-zinc-200">
							{t.headerTitle}
						</h1>
					</div>
					<div className="flex items-center gap-4">
						{selectedVideo && (
							<div className="hidden md:flex items-center gap-2 text-xs bg-zinc-100/60 dark:bg-zinc-900/60 px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800/80">
								<Library className="w-3.5 h-3.5 text-accent-cyan" />
								<span className="font-mono text-zinc-600 dark:text-zinc-400">
									{t.activeYtId}: {selectedVideo.youtube_id}
								</span>
							</div>
						)}
						{geminiApiKey ? (
							<div className="flex items-center gap-1.5 text-xs bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded border border-emerald-500/20">
								<Key className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">{t.customKeyActive}</span>
							</div>
						) : hasSavedKey ? (
							<div className="flex items-center gap-1.5 text-xs bg-amber-950/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded border border-amber-500/20">
								<Lock className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">{t.lockedKey}</span>
							</div>
						) : null}

						{/* Settings Trigger Icon */}
						<button
							type="button"
							onClick={() => setIsSettingsOpen(true)}
							className="p-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
							title={t.settingsTitle}
						>
							<SettingsIcon className="w-4 h-4" />
						</button>

						{/* Dark/Light mode toggle */}
						<ModeToggle />

						{/* Toggle StudyStudio Panel (Desktop Only) */}
						<button
							type="button"
							onClick={() => {
								if (isRightOpen) {
									rightPanelRef.current?.collapse();
								} else {
									rightPanelRef.current?.expand();
								}
							}}
							className={`hidden lg:inline-flex p-1.5 rounded-full border transition-all duration-300 ${
								isRightOpen
									? "border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-950/40"
									: "border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
							}`}
							title={
								locale === "ar" ? "تبديل استوديو الدراسة" : "Toggle StudyStudio"
							}
						>
							<BookOpen className="w-4 h-4" />
						</button>

						{/* Roadmap Link (Desktop Only) */}
						<Link
							href={`/${locale}/roadmap`}
							className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
							title={locale === "ar" ? "خريطة الطريق" : "Roadmap"}
						>
							<BrainCircuit className="w-3.5 h-3.5 text-accent-cyan" />
							<span>{locale === "ar" ? "خريطة الطريق" : "Roadmap"}</span>
						</Link>

						{/* Language Switch Toggle Component (Desktop Only) */}
						<Link
							href={locale === "en" ? "/ar" : "/en"}
							className="hidden lg:flex text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
						>
							{t.languageLabel}
						</Link>

						{/* Coffee Link (Desktop Only) */}
						<a
							href={
								process.env.NEXT_PUBLIC_COFFEE_URL ||
								"https://sociabuzz.com/gabcares/support"
							}
							target="_blank"
							rel="noopener noreferrer"
							className="hidden lg:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-950/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all duration-300"
						>
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
							</span>
							{t.buyMeCoffee}
						</a>
					</div>
				</header>

				{/* Viewport & chat splits + StudyStudio */}
				<div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
					{isMobile ? (
						<Tabs
							defaultValue="workspace"
							className="flex-grow flex flex-col min-h-0 w-full"
						>
							<div className="px-4 shrink-0">
								<TabsList className="grid w-full grid-cols-2 bg-zinc-900/30 border border-zinc-800/40 backdrop-blur-md rounded-lg">
									<TabsTrigger
										value="workspace"
										className="text-xs font-semibold py-2 flex items-center justify-center gap-1.5"
									>
										<Tv className="w-3.5 h-3.5 text-cyan-450" />
										<span>
											{locale === "ar" ? "الدردشة والتشغيل" : "Play & Chat"}
										</span>
									</TabsTrigger>
									<TabsTrigger
										value="studystudio"
										className="text-xs font-semibold py-2 flex items-center justify-center gap-1.5"
									>
										<Brain className="w-3.5 h-3.5 text-cyan-450" />
										<span>
											{locale === "ar" ? "استوديو الدراسة" : "StudyStudio"}
										</span>
									</TabsTrigger>
								</TabsList>
							</div>

							<div className="flex-1 min-h-0 p-4 relative">
								{/* Tab 1: Video Player & Chat Panel */}
								<TabsContent
									value="workspace"
									className="absolute inset-0 flex flex-col gap-4 overflow-y-auto px-4 pb-4"
								>
									{/* Video player container */}
									<div className="flex flex-col gap-4 min-h-[250px] sm:min-h-[300px] shrink-0">
										<div className="glass-panel p-4 rounded-xl flex-1 flex flex-col justify-center min-h-0">
											<span className="text-xs text-zinc-500 font-semibold tracking-widest mb-3 block">
												{t.videoPlayerEngine}
											</span>
											<VideoPlayer
												ref={playerRef}
												youtubeId={selectedVideo?.youtube_id || ""}
											/>
										</div>
									</div>

									{/* Agentic chat module */}
									<div className="flex-1 flex flex-col min-h-[350px]">
										<ChatPanel
											videoId={selectedVideo?.id || ""}
											onSeek={handleSeek}
											onFocusChange={setIsChatFocused}
											geminiApiKey={geminiApiKey}
											locale={locale}
											onApiKeyExpired={() => setIsSettingsOpen(true)}
										/>
									</div>
								</TabsContent>

								{/* Tab 2: StudyStudio Panel */}
								<TabsContent
									value="studystudio"
									className="absolute inset-0 flex flex-col px-4 pb-4"
								>
									<div className="flex-1 flex flex-col min-h-0">
										<StudyStudio
											videoId={selectedVideo?.id || ""}
											videoTitle={selectedVideo?.title || ""}
											onSeek={handleSeek}
											geminiApiKey={geminiApiKey}
											isOpen={true}
											onToggleOpen={() => {}}
											locale={locale}
											onApiKeyExpired={() => setIsSettingsOpen(true)}
											onShowToast={showToast}
										/>
									</div>
								</TabsContent>
							</div>
						</Tabs>
					) : (
						<ResizablePanelGroup
							orientation="horizontal"
							className="flex-grow min-h-0 w-full"
						>
							<ResizablePanel
								defaultSize="45%"
								minSize="25%"
								maxSize="65%"
								className="flex flex-col min-h-0 px-3"
							>
								<div
									className="glass-panel p-4 rounded-xl flex-grow flex flex-col justify-center min-h-0 h-full"
									style={{ pointerEvents: isDraggingLayout ? "none" : "auto" }}
								>
									<span className="text-xs text-zinc-500 font-semibold tracking-widest mb-3 block">
										{t.videoPlayerEngine}
									</span>
									<VideoPlayer
										ref={playerRef}
										youtubeId={selectedVideo?.youtube_id || ""}
									/>
								</div>
							</ResizablePanel>

							<ResizableHandle
								withHandle
								onPointerDown={() => setIsDraggingLayout(true)}
							/>

							<ResizablePanel
								defaultSize="30%"
								minSize="20%"
								className="flex flex-col min-h-0 px-3"
							>
								<div
									className="flex flex-col flex-1 min-h-0 h-full"
									style={{ pointerEvents: isDraggingLayout ? "none" : "auto" }}
								>
									<ChatPanel
										videoId={selectedVideo?.id || ""}
										onSeek={handleSeek}
										onFocusChange={setIsChatFocused}
										geminiApiKey={geminiApiKey}
										locale={locale}
										onApiKeyExpired={() => setIsSettingsOpen(true)}
									/>
								</div>
							</ResizablePanel>

							<ResizableHandle
								withHandle
								onPointerDown={() => setIsDraggingLayout(true)}
							/>
							<ResizablePanel
								panelRef={rightPanelRef}
								defaultSize="25%"
								minSize="20%"
								maxSize="40%"
								collapsible={true}
								onResize={(size) => {
									const collapsed = size.asPercentage === 0;
									if (collapsed && isRightOpen) {
										setIsRightOpen(false);
									} else if (!collapsed && !isRightOpen) {
										setIsRightOpen(true);
									}
								}}
								className="flex flex-col min-h-0 px-3"
							>
								<div
									className="flex flex-col flex-1 min-h-0 h-full"
									style={{
										pointerEvents: isDraggingLayout ? "none" : "auto",
									}}
								>
									<StudyStudio
										videoId={selectedVideo?.id || ""}
										videoTitle={selectedVideo?.title || ""}
										onSeek={handleSeek}
										geminiApiKey={geminiApiKey}
										isOpen={isRightOpen}
										onToggleOpen={() => {
											if (isRightOpen) {
												rightPanelRef.current?.collapse();
											} else {
												rightPanelRef.current?.expand();
											}
										}}
										locale={locale}
										onApiKeyExpired={() => setIsSettingsOpen(true)}
										onShowToast={showToast}
									/>
								</div>
							</ResizablePanel>
						</ResizablePanelGroup>
					)}
				</div>
			</div>

			{/* Settings Modal (BYOK Setup) */}
			<Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
				<DialogContent
					showCloseButton={false}
					className="max-w-md p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl flex flex-col gap-4"
				>
					<div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
						<div className="flex items-center gap-2 font-sans">
							<Key className="w-5 h-5 text-accent-cyan" />
							<h2 className="text-md font-semibold text-zinc-800 dark:text-zinc-100">
								{t.settingsTitle}
							</h2>
						</div>
						<button
							type="button"
							onClick={() => setIsSettingsOpen(false)}
							className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					<p className="text-xs text-zinc-700 dark:text-zinc-400 leading-relaxed">
						{t.settingsDesc}
					</p>

					<form onSubmit={handleSaveKey} className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="gemini-api-key"
								className="text-xs text-zinc-700 dark:text-zinc-400 font-semibold"
							>
								{locale === "ar" ? "مفتاح GEMINI API" : "GEMINI API KEY"}
							</label>
							<div className="relative">
								<input
									id="gemini-api-key"
									type={showApiKey ? "text" : "password"}
									value={tempApiKey}
									onChange={(e) => setTempApiKey(e.target.value)}
									placeholder={t.keyPlaceholder}
									className="w-full pl-3 pr-10 py-2 text-sm rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-accent-cyan text-zinc-800 dark:text-zinc-200"
									required
								/>
								<button
									type="button"
									onClick={() => setShowApiKey(!showApiKey)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-350"
								>
									{showApiKey ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="passphrase"
								className="text-xs text-zinc-700 dark:text-zinc-400 font-semibold"
							>
								{t.passphraseLabel}
							</label>
							<input
								id="passphrase"
								type="password"
								value={passphrase}
								onChange={(e) => setPassphrase(e.target.value)}
								placeholder={t.passphraseSetupPlaceholder}
								className="w-full px-3 py-2 text-sm rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-accent-cyan text-zinc-800 dark:text-zinc-200"
								required
							/>
							<span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium leading-normal">
								{locale === "ar"
									? "⚠️ تحذير: لا يتم حفظ عبارة المرور على أي خادم مطلقًا. في حال فقدانها، يجب عليك مسح المفتاح وإعادة إدخاله."
									: "⚠️ Warning: The passphrase is never stored on any server. If lost, you must clear and re-enter your API key."}
							</span>
						</div>

						<div className="flex gap-3 mt-2">
							<button
								type="submit"
								className="flex-1 py-2 text-sm rounded-lg font-semibold bg-accent-cyan/95 hover:bg-accent-cyan text-zinc-950 transition"
							>
								{t.saveSettingsBtn}
							</button>
							{hasSavedKey && (
								<button
									type="button"
									onClick={handleClearKey}
									className="px-3 py-2 text-sm rounded-lg font-semibold border border-red-500/20 bg-red-950/10 text-red-500 dark:text-red-400 hover:bg-red-950/30 transition flex items-center justify-center"
									title={t.clearSettingsBtn}
								>
									<Trash2 className="w-4 h-4" />
								</button>
							)}
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Unlock Passphrase Dialog on Load */}
			<Dialog open={isUnlockModalOpen} onOpenChange={setIsUnlockModalOpen}>
				<DialogContent
					showCloseButton={false}
					className="max-w-sm p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl flex flex-col gap-4 text-center"
				>
					<div className="mx-auto p-3 rounded-full bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-300 dark:border-cyan-500/20 w-fit">
						<Unlock className="w-6 h-6 text-accent-cyan animate-pulse" />
					</div>

					<div>
						<h2 className="text-md font-semibold text-zinc-800 dark:text-zinc-100">
							{t.lockedOverlayTitle}
						</h2>
						<p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
							{t.lockedOverlayDesc}
						</p>
					</div>

					<form onSubmit={handleUnlockKey} className="flex flex-col gap-3">
						<input
							type="password"
							value={unlockPassphrase}
							onChange={(e) => setUnlockPassphrase(e.target.value)}
							placeholder={t.passphrasePlaceholder}
							className="w-full px-3 py-2 text-sm rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-center focus:outline-none focus:border-accent-cyan text-zinc-800 dark:text-zinc-200"
							required
						/>
						{unlockError && (
							<p className="text-xs text-red-500 dark:text-red-400">
								{unlockError}
							</p>
						)}
						<button
							type="submit"
							className="w-full py-2 text-sm rounded-lg font-semibold bg-accent-cyan hover:bg-accent-cyan text-zinc-950 transition"
						>
							{t.unlockBtn}
						</button>
						<button
							type="button"
							onClick={() => {
								setIsUnlockModalOpen(false);
								showToast(
									locale === "ar"
										? "المتابعة باستخدام إعدادات مفتاح الخادم الافتراضي."
										: "Proceeding using default server API key settings.",
									"info",
								);
							}}
							className="text-xs text-zinc-500 hover:text-zinc-400 mt-1 transition"
						>
							{locale === "ar"
								? "تخطي / استخدام مفتاح الخادم"
								: "Skip / Use Server Key"}
						</button>
					</form>
				</DialogContent>
			</Dialog>
			{toastMessage && (
				<div
					className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-slide-up ${
						toastMessage.type === "success"
							? "bg-green-950/20 border-green-500/30 text-green-400"
							: toastMessage.type === "error"
								? "bg-red-950/20 border-red-500/30 text-red-400"
								: "bg-cyan-950/20 border-cyan-500/30 text-cyan-400"
					}`}
				>
					<AlertCircle className="w-4 h-4 shrink-0" />
					<span>{toastMessage.text}</span>
				</div>
			)}
		</main>
	);
}
