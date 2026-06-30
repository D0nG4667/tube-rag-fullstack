"use client";
import {
	ArrowLeft,
	BookOpen,
	Coffee,
	Database,
	Download,
	Eye,
	History,
	Key,
	Layers,
	Lock,
	Network,
	Radio,
	ShieldCheck,
	Sparkles,
	Tv,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

interface RoadmapItem {
	title: string;
	titleAr: string;
	desc: string;
	descAr: string;
	status: "completed" | "in-dev" | "planned";
	icon: React.ComponentType<{ className?: string }>;
}

interface RoadmapPhase {
	phaseTitle: string;
	phaseTitleAr: string;
	timeline: string;
	timelineAr: string;
	status: "completed" | "in-progress" | "planned";
	items: RoadmapItem[];
}

export default function RoadmapPage() {
	const params = useParams();
	const locale = (params?.locale as string) || "en";
	const isRtl = locale === "ar";
	const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);

	const coffeeUrl =
		process.env.NEXT_PUBLIC_COFFEE_URL ||
		"https://sociabuzz.com/gabcares/support";

	const phases: RoadmapPhase[] = [
		{
			phaseTitle: "Phase 1: Core Synthesis & Pipeline",
			phaseTitleAr: "المرحلة الأولى: التوليد والبحث الأساسي",
			timeline: "Q1 - Q2 2026",
			timelineAr: "الربع الأول - الثاني 2026",
			status: "completed",
			items: [
				{
					title: "Public Video Ingestion",
					titleAr: "استيراد مقاطع الفيديو العامة",
					desc: "Asynchronous processing queue powered by serverless Upstash QStash, returning instant 202 responses.",
					descAr:
						"طابور معالجة غير متزامن مدعوم بـ Upstash QStash اللاسيرفري، مع استجابة 202 فورية.",
					status: "completed",
					icon: Tv,
				},
				{
					title: "Supabase pgvector Database",
					titleAr: "تكامل قاعدة بيانات pgvector",
					desc: "Chunking and embedding transcript text structures for semantic vector-aware querying and citations.",
					descAr:
						"تقسيم وتضمين نصوص النصوص للبحث الدلالي الفائق المبني على النواقل والاستشهاد بالمصادر.",
					status: "completed",
					icon: Database,
				},
				{
					title: "Interactive Study Studio",
					titleAr: "استوديو الدراسة التفاعلي",
					desc: "Real-time generation of structured outlines, concepts mindmaps, and cursive calligraphy study notes.",
					descAr:
						"توليد فوري للمخططات التفصيلية، وخرائط المفاهيم الدلالية، وملاحظات خطية كاليغرافية تفاعلية.",
					status: "completed",
					icon: BookOpen,
				},
			],
		},
		{
			phaseTitle: "Phase 2: Security & Session Persistence",
			phaseTitleAr: "المرحلة الثانية: الأمان واستمرارية الجلسة",
			timeline: "Q3 - Q4 2026",
			timelineAr: "الربع الثالث - الرابع 2026",
			status: "in-progress",
			items: [
				{
					title: "User Authentication & JWT Verification",
					titleAr: "توثيق المستخدمين والتحقق من الهوية",
					desc: "Secure user registration and token-based sessions utilizing Supabase Auth and JWT state verification.",
					descAr:
						"تسجيل دخول آمن للمستخدمين وجلسات مبنية على التوكنات باستخدام Supabase Auth والتحقق من JWT.",
					status: "in-dev",
					icon: Lock,
				},
				{
					title: "Row Level Security (RLS) Policies",
					titleAr: "سياسات أمان صفوف الجدول (RLS)",
					desc: "Database layer isolation to secure user nodes, ensuring users can only read and write their own ingested workspaces.",
					descAr:
						"عزل كامل على مستوى قاعدة البيانات لتأمين مساحات العمل وضمان عدم إمكانية قراءة غير البيانات الخاصة بك.",
					status: "in-dev",
					icon: ShieldCheck,
				},
				{
					title: "Chat History Persistence",
					titleAr: "حفظ وتتبع المحادثات السابقة",
					desc: "Saving multi-agent chat sessions to the database to allow users to pause, resume, and manage historic queries.",
					descAr:
						"حفظ جلسات المحادثة بالكامل في قاعدة البيانات للسماح للمستخدمين باستئناف محادثاتهم وإدارة استفساراتهم.",
					status: "planned",
					icon: History,
				},
				{
					title: "Multi-tenant Shared Workspace Folders",
					titleAr: "مجلدات مساحات العمل المشتركة",
					desc: "Allowing users to organize ingested videos into folders and share workspaces or playlists with teammates.",
					descAr:
						"تمكين المستخدمين من تنظيم مقاطع الفيديو في مجلدات ومشاركة مساحات العمل مع زملائهم في الفريق.",
					status: "planned",
					icon: Users,
				},
			],
		},
		{
			phaseTitle: "Phase 3: Visual & Audio Intelligence",
			phaseTitleAr: "المرحلة الثالثة: الذكاء البصري والصوتي",
			timeline: "H1 2027",
			timelineAr: "النصف الأول 2027",
			status: "planned",
			items: [
				{
					title: "Multimodal Frame Sampling",
					titleAr: "تحليل ولقط إطارات الفيديو",
					desc: "Periodic frame extraction using vision models to transcribe texts from slide decks, code editors, and diagrams.",
					descAr:
						"استخراج دوري لإطارات الفيديو باستخدام نماذج الرؤية لقراءة النصوص من الشرائح، محرر الأكواد، والمخططات.",
					status: "planned",
					icon: Eye,
				},
				{
					title: "Gemini 3.1 TTS Speech Expressions",
					titleAr: "تعبيرات Gemini 3.1 الصوتية المتطورة",
					desc: "Inline voice tags support ([laughs], [whispers]) inside generated podcasts to create human-like audio conversations.",
					descAr:
						"دعم التعبيرات الصوتية المتطورة (مثل [ضحك]، [همس]) داخل البودكاست لإنشاء مناقشات طبيعية كالبشر.",
					status: "planned",
					icon: Radio,
				},
				{
					title: "Vector SVG Concept Maps Exporters",
					titleAr: "تصدير خرائط المفاهيم كملفات SVG متجهة",
					desc: "Downloading and printing high-definition interactive mindmaps as editable SVG vector assets.",
					descAr:
						"تنزيل وطباعة خرائط المفاهيم التفاعلية عالية الجودة كملفات متجهة قابلة للتعديل بصيغة SVG.",
					status: "planned",
					icon: Network,
				},
			],
		},
		{
			phaseTitle: "Phase 4: Developer Ecosystem & Scales",
			phaseTitleAr: "المرحلة الرابعة: نظام المطورين والتوسع",
			timeline: "H2 2027 - 2028",
			timelineAr: "النصف الثاني 2027 - 2028",
			status: "planned",
			items: [
				{
					title: "Public Developer APIs",
					titleAr: "واجهات برمجة التطبيقات للمطورين (APIs)",
					desc: "Secure API keys and webhooks subscription endpoints to build integrations with external learning management tools.",
					descAr:
						"مفاتيح API آمنة ونقاط استقبال ويب (webhooks) لبناء تكاملات مع أدوات إدارة التعلم الخارجية.",
					status: "planned",
					icon: Key,
				},
				{
					title: "Batch Transcript Downloads",
					titleAr: "تحميل نصوص الفيديوهات دفعة واحدة",
					desc: "Exporting semantic lecture transcripts in multiple formats including SRT, VTT, and styled Markdown reports.",
					descAr:
						"تصدير نصوص الفيديوهات الدلالية بصيغ متعددة بما في ذلك SRT و VTT وتقارير Markdown المنسقة.",
					status: "planned",
					icon: Download,
				},
				{
					title: "Enterprise Multi-modal Search Engine",
					titleAr: "محرك البحث الدلالي للمؤسسات",
					desc: "Global semantic search index crossing transcripts, notes, and visual frames across all user repositories.",
					descAr:
						"مؤشر بحث دلالي عالمي يعبر النصوص والملاحظات وإطارات الصور البصرية عبر جميع مستودعات المستخدم.",
					status: "planned",
					icon: Layers,
				},
			],
		},
	];

	return (
		<div className="relative min-h-screen w-screen bg-[#030303] text-zinc-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-400 font-sans pb-20">
			{/* Blurred decorative ambient circles */}
			<div className="absolute top-[-10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-cyan-900/10 blur-[150px] pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />

			{/* Center container */}
			<div className="max-w-4xl mx-auto px-6 pt-10 flex flex-col gap-10">
				{/* Top bar back navigation */}
				<div className="flex justify-between items-center z-10">
					<Link
						href={`/${locale}`}
						className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 backdrop-blur-md text-xs font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition duration-300"
					>
						<ArrowLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
						{isRtl ? "العودة لمساحة العمل" : "Back to Workspace"}
					</Link>

					<button
						type="button"
						onClick={() => setIsCoffeeModalOpen(true)}
						className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition duration-300 shadow-lg shadow-amber-500/10"
					>
						<Coffee className="w-4 h-4" />
						{isRtl ? "ادعمنا بكوب قهوة ☕" : "Support Our Dev ☕"}
					</button>
				</div>

				{/* Header Intro */}
				<div className="text-center flex flex-col items-center gap-4 mt-6 z-10">
					<div className="px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
						<Sparkles className="w-3.5 h-3.5" />
						{isRtl ? "خريطة طريق المنتج" : "PRODUCT ROADMAP 2026 - 2028"}
					</div>
					<h1 className="text-3xl lg:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 max-w-2xl leading-tight">
						{isRtl
							? "مستقبل محركات البحث للمحاضرات"
							: "The Future of Multimodal Lecture RAG"}
					</h1>
					<p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
						{isRtl
							? "خطتنا الاستراتيجية لتطوير منصة TubeRAG وتحويلها إلى رفيق الدراسة المفضل للمطورين والمؤسسات الأكاديمية. ساعدنا في تحقيق ذلك!"
							: "Our strategic timeline to scale TubeRAG into the ultimate study companion for engineers, students, and workspaces. Join us on this journey!"}
					</p>
				</div>

				{/* Support Callout Banner */}
				<div className="glass-panel p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 z-10 shadow-xl shadow-cyan-950/5 relative overflow-hidden">
					<div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
					<div className="flex flex-col gap-1.5 md:max-w-lg text-center md:text-start">
						<span className="text-sm font-bold text-zinc-100 flex items-center gap-2 justify-center md:justify-start">
							🚀{" "}
							{isRtl
								? "ادعم طموحنا لتسريع البناء"
								: "Accelerate Our Build Process"}
						</span>
						<span className="text-xs text-zinc-400 leading-relaxed">
							{isRtl
								? "نحن نؤمن بالوصول المفتوح والتكنولوجيا اللاسيرفرية. دعمك السخي يغطي تكاليف الاستضافة واستدعاء نماذج الذكاء الاصطناعي ويسرع إصدار الميزات القادمة."
								: "We believe in open learning tools and high-fidelity tech. Your contributions fund backend operations, API calls, and directly fast-tracks upcoming features."}
						</span>
					</div>
					<button
						type="button"
						onClick={() => setIsCoffeeModalOpen(true)}
						className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition duration-300 flex items-center gap-2 shadow-lg shadow-amber-500/15 shrink-0"
					>
						<Coffee className="w-4 h-4 fill-zinc-950" />
						{isRtl ? "دعم وتبرع للمطورين ☕" : "Support Development ☕"}
					</button>
				</div>

				{/* Timeline Phases Grid */}
				<div className="flex flex-col gap-12 mt-4 relative">
					{/* Central line connection */}
					<div
						className={`absolute top-10 bottom-10 w-0.5 bg-zinc-900 hidden md:block ${isRtl ? "right-[calc(50%-1px)]" : "left-[calc(50%-1px)]"}`}
					/>

					{phases.map((phase, idx) => {
						const isEven = idx % 2 === 0;
						const statusColor =
							phase.status === "completed"
								? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400"
								: phase.status === "in-progress"
									? "bg-cyan-950/30 border-cyan-500/20 text-cyan-400"
									: "bg-zinc-900 border-zinc-800 text-zinc-500";

						const statusText =
							phase.status === "completed"
								? isRtl
									? "مكتمل"
									: "Shipped"
								: phase.status === "in-progress"
									? isRtl
										? "قيد التطوير"
										: "Active Build"
									: isRtl
										? "مخطط له"
										: "Planned";

						return (
							<div
								key={phase.timeline}
								className={`flex flex-col md:flex-row gap-8 relative items-stretch ${
									isRtl
										? isEven
											? "md:flex-row-reverse"
											: ""
										: isEven
											? "md:flex-row"
											: "md:flex-row-reverse"
								}`}
							>
								{/* Left/Right content card */}
								<div className="flex-1 flex flex-col">
									<div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-950/20 backdrop-blur-md hover:border-zinc-700/60 transition duration-300 flex flex-col gap-4 shadow-xl">
										{/* Phase Timeline and Status */}
										<div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
											<div className="flex flex-col gap-0.5">
												<span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
													{isRtl ? phase.timelineAr : phase.timeline}
												</span>
												<h2 className="text-sm font-extrabold uppercase tracking-wide text-zinc-200">
													{isRtl ? phase.phaseTitleAr : phase.phaseTitle}
												</h2>
											</div>
											<span
												className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${statusColor}`}
											>
												{statusText}
											</span>
										</div>

										{/* Items list */}
										<div className="flex flex-col gap-4">
											{phase.items.map((item) => {
												const ItemIcon = item.icon;
												const itemStatusText =
													item.status === "completed"
														? isRtl
															? "تم الشحن"
															: "Shipped"
														: item.status === "in-dev"
															? isRtl
																? "قيد العمل"
																: "In Dev"
															: isRtl
																? "مجدول"
																: "Scheduled";

												const itemStatusColor =
													item.status === "completed"
														? "text-emerald-400 bg-emerald-950/20"
														: item.status === "in-dev"
															? "text-cyan-400 bg-cyan-950/20 animate-pulse"
															: "text-zinc-500 bg-zinc-900/50";

												return (
													<div
														key={item.title}
														className="flex items-start gap-3"
													>
														<div className="p-2 rounded bg-zinc-900 text-cyan-400 border border-zinc-800 shrink-0">
															<ItemIcon className="w-4 h-4" />
														</div>
														<div className="flex-1 flex flex-col gap-0.5">
															<div className="flex items-center gap-2 flex-wrap">
																<h3 className="text-xs font-bold text-zinc-100">
																	{isRtl ? item.titleAr : item.title}
																</h3>
																<span
																	className={`px-1.5 py-0.5 rounded text-[8px] font-semibold ${itemStatusColor}`}
																>
																	{itemStatusText}
																</span>
															</div>
															<p className="text-[11px] text-zinc-400 leading-normal">
																{isRtl ? item.descAr : item.desc}
															</p>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								</div>

								{/* Timeline node dot indicator */}
								<div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-4 h-4 rounded-full border-2 border-zinc-800 bg-[#030303] hidden md:flex items-center justify-center">
									<div
										className={`w-1.5 h-1.5 rounded-full ${phase.status === "completed" ? "bg-emerald-500" : phase.status === "in-progress" ? "bg-cyan-500" : "bg-zinc-700"}`}
									/>
								</div>

								{/* Empty symmetric spacing element */}
								<div className="flex-1 hidden md:block" />
							</div>
						);
					})}
				</div>
			</div>

			{/* Coffee Modal popup */}
			{isCoffeeModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-250">
					<div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 relative animate-in zoom-in-95 duration-200">
						<button
							type="button"
							onClick={() => setIsCoffeeModalOpen(false)}
							className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
						>
							<X className="w-4 h-4" />
						</button>
						<div className="flex flex-col items-center text-center space-y-3">
							<div className="w-12 h-12 rounded-full bg-amber-950/50 border border-amber-800/40 flex items-center justify-center shadow-inner">
								<Coffee className="w-6 h-6 text-amber-400" />
							</div>
							<h3 className="text-lg font-bold text-white">
								{isRtl ? "دعم عملنا" : "Support our work"}
							</h3>
							<p className="text-xs text-zinc-300 leading-relaxed">
								{isRtl
									? "نشكرك على رغبتك في دعم مساعد TubeRAG! ☕"
									: "Thank you for wanting to support TubeRAG! ☕"}
							</p>
							<p className="text-xs text-zinc-400 leading-relaxed">
								{isRtl
									? "دعمك يساعد في تسريع المرحلة التالية من خريطة الطريق الخاصة بنا."
									: "Your support helps power the next phase of our strategic roadmap."}
							</p>
							<a
								href={coffeeUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="w-full mt-2 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/30"
							>
								<Coffee className="w-3.5 h-3.5 animate-bounce" />
								{isRtl ? "دعم المساهمين ☕" : "Support Gabcares ☕"}
							</a>
							<button
								type="button"
								onClick={() => setIsCoffeeModalOpen(false)}
								className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer"
							>
								{isRtl ? "حسناً، شكراً!" : "Got it, thanks!"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
