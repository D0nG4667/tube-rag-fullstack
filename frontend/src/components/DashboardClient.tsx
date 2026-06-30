"use client";

import {
	Eye,
	EyeOff,
	Key,
	Library,
	Lock,
	Menu,
	Settings as SettingsIcon,
	Sparkles,
	Trash2,
	Unlock,
	X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import ControlDrawer from "@/components/ControlDrawer";
import MatrixCanvas from "@/components/MatrixCanvas";
import { ModeToggle } from "@/components/ModeToggle";
import StudyStudio from "@/components/StudyStudio";
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
	const playerRef = useRef<VideoPlayerRef>(null);

	const [splitWidth, setSplitWidth] = useState(50); // default 50% split width
	const [isDragging, setIsDragging] = useState(false);
	const [rightSplitWidth, setRightSplitWidth] = useState(480); // default 480px
	const [isRightDragging, setIsRightDragging] = useState(false);
	const [isChatFocused, setIsChatFocused] = useState(false);

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
			alert(
				locale === "ar"
					? "تم تشفير وحفظ مفتاحك بنجاح!"
					: "Gemini API key encrypted and saved successfully!",
			);
		} catch (err) {
			console.error(err);
			alert(locale === "ar" ? "فشل تشفير المفتاح." : "Error encrypting key.");
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
		alert(
			locale === "ar"
				? "تم مسح مفتاح API من متصفحك."
				: "Custom API key cleared from browser storage.",
		);
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleRightMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsRightDragging(true);
	};

	useEffect(() => {
		if (!isDragging && !isRightDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				const percentage = (e.clientX / window.innerWidth) * 100;
				setSplitWidth(Math.max(30, Math.min(70, percentage)));
			}
			if (isRightDragging) {
				const width = window.innerWidth - e.clientX;
				setRightSplitWidth(Math.max(280, Math.min(600, width)));
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			setIsRightDragging(false);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, isRightDragging]);

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

	const hasActiveJob = videos.some(
		(vid) => vid.status !== "completed" && vid.status !== "failed",
	);

	return (
		<main className="relative min-h-screen w-screen flex text-zinc-800 dark:text-zinc-100 overflow-hidden bg-background">
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
				onSelectVideo={(video) => {
					setSelectedVideo(video);
					if (isMobile) setIsLeftOpen(false);
				}}
				onIngestSuccess={fetchVideos}
				geminiApiKey={geminiApiKey}
				isOpen={isLeftOpen}
				onToggleOpen={() => setIsLeftOpen(!isLeftOpen)}
				locale={locale}
			/>

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
						<Sparkles className="w-5 h-5 text-accent-cyan hidden lg:block" />
						<h1 className="text-xs lg:text-sm font-semibold tracking-wider uppercase text-zinc-800 dark:text-zinc-200">
							{t.headerTitle}
						</h1>
					</div>
					<div className="flex items-center gap-4">
						{selectedVideo && (
							<div className="flex items-center gap-2 text-xs bg-zinc-100/60 dark:bg-zinc-900/60 px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800/80">
								<Library className="w-3.5 h-3.5 text-accent-cyan" />
								<span className="font-mono text-zinc-600 dark:text-zinc-400">
									{t.activeYtId}: {selectedVideo.youtube_id}
								</span>
							</div>
						)}
						{geminiApiKey ? (
							<div className="flex items-center gap-1.5 text-xs bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded border border-emerald-500/20">
								<Key className="w-3.5 h-3.5" />
								<span>{t.customKeyActive}</span>
							</div>
						) : hasSavedKey ? (
							<div className="flex items-center gap-1.5 text-xs bg-amber-950/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded border border-amber-500/20">
								<Lock className="w-3.5 h-3.5" />
								<span>{t.lockedKey}</span>
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

						{/* Language Switch Toggle Component (Client routed Link) */}
						<Link
							href={locale === "en" ? "/ar" : "/en"}
							className="text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
						>
							{t.languageLabel}
						</Link>

						<a
							href={
								process.env.NEXT_PUBLIC_COFFEE_URL ||
								"https://sociabuzz.com/gabcares/support"
							}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-950/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all duration-300"
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
				<div
					className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto lg:overflow-hidden relative"
					style={{ userSelect: isDragging ? "none" : "auto" }}
				>
					{/* Left panel: player container */}
					<div
						className="flex flex-col gap-4 min-h-[300px] lg:min-h-0 shrink-0"
						style={{
							width: isMobile ? "100%" : `${splitWidth}%`,
							pointerEvents: isDragging ? "none" : "auto",
						}}
					>
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

					{/* Resizer Handle Bar (Desktop only) */}
					{!isMobile && (
						// biome-ignore lint/a11y/noStaticElementInteractions: custom resize resizer handle div
						<div
							onMouseDown={handleMouseDown}
							className={`w-1 cursor-col-resize h-full rounded transition-all duration-150 relative self-stretch flex items-center justify-center ${
								isDragging
									? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
									: "bg-zinc-300 dark:bg-zinc-800/40 hover:bg-zinc-400 dark:hover:bg-zinc-700/60"
							}`}
						>
							<div className="w-4 h-8 rounded border border-zinc-300 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-950/90 flex items-center justify-center gap-0.5 z-20">
								<div className="w-0.5 h-3 bg-zinc-400 dark:bg-zinc-600" />
								<div className="w-0.5 h-3 bg-zinc-400 dark:bg-zinc-600" />
							</div>
						</div>
					)}

					{/* Center panel: Agentic chat module */}
					<div className="flex flex-col min-h-[400px] lg:min-h-0 flex-1">
						<ChatPanel
							videoId={selectedVideo?.id || ""}
							onSeek={handleSeek}
							onFocusChange={setIsChatFocused}
							geminiApiKey={geminiApiKey}
							locale={locale}
							onApiKeyExpired={() => setIsSettingsOpen(true)}
						/>
					</div>

					{/* Right Resizer Handle Bar (Desktop only, if right panel is open) */}
					{!isMobile && isRightOpen && (
						// biome-ignore lint/a11y/noStaticElementInteractions: custom resize resizer handle div
						<div
							onMouseDown={handleRightMouseDown}
							className={`w-1 cursor-col-resize h-full rounded transition-all duration-150 relative self-stretch flex items-center justify-center ${
								isRightDragging
									? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
									: "bg-zinc-300 dark:bg-zinc-800/40 hover:bg-zinc-400 dark:hover:bg-zinc-700/60"
							}`}
						>
							<div className="w-4 h-8 rounded border border-zinc-300 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-950/90 flex items-center justify-center gap-0.5 z-20">
								<div className="w-0.5 h-3 bg-zinc-400 dark:bg-zinc-600" />
								<div className="w-0.5 h-3 bg-zinc-400 dark:bg-zinc-600" />
							</div>
						</div>
					)}

					{/* Right panel: StudyStudio workspace */}
					<StudyStudio
						videoId={selectedVideo?.id || ""}
						videoTitle={selectedVideo?.title || ""}
						onSeek={handleSeek}
						geminiApiKey={geminiApiKey}
						isOpen={isRightOpen}
						onToggleOpen={() => setIsRightOpen(!isRightOpen)}
						locale={locale}
						onApiKeyExpired={() => setIsSettingsOpen(true)}
						width={rightSplitWidth}
					/>
				</div>
			</div>

			{/* Settings Modal (BYOK Setup) */}
			{isSettingsOpen && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
					<div className="p-6 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col gap-4 shadow-2xl transition-colors duration-300">
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
					</div>
				</div>
			)}

			{/* Unlock Passphrase Dialog on Load */}
			{isUnlockModalOpen && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
					<div className="p-6 rounded-2xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col gap-4 shadow-2xl text-center transition-colors duration-300">
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
									alert(
										locale === "ar"
											? "المتابعة باستخدام إعدادات مفتاح الخادم الافتراضي."
											: "Proceeding using default server API key settings.",
									);
								}}
								className="text-xs text-zinc-500 hover:text-zinc-400 mt-1 transition"
							>
								{locale === "ar"
									? "تخطي / استخدام مفتاح الخادم"
									: "Skip / Use Server Key"}
							</button>
						</form>
					</div>
				</div>
			)}
		</main>
	);
}
