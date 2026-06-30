"use client";

import { motion } from "framer-motion";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import MatrixCanvas from "@/components/MatrixCanvas";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("TubeRAG pipeline error:", error);
	}, [error]);

	return (
		<div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-zinc-950 text-zinc-100 font-sans">
			{/* Spatial 3D Matrix Nodes Layer */}
			<div className="absolute inset-0 z-0">
				<MatrixCanvas />
			</div>

			{/* Glassmorphic 3D Card Overlay */}
			<motion.div
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				whileHover={{ rotateX: -2, rotateY: 2, translateZ: 10 }}
				style={{ transformStyle: "preserve-3d" }}
				className="z-10 max-w-lg w-full mx-4 p-8 rounded-2xl glass-panel border border-zinc-800/50 bg-zinc-950/40 backdrop-blur-md text-center shadow-2xl flex flex-col items-center gap-6"
			>
				{/* 3D Glowing Red Neon Icon */}
				<div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
					<AlertOctagon className="w-8 h-8 text-red-400" />
				</div>

				<div className="flex flex-col gap-2 w-full">
					<h1 className="text-2xl font-black uppercase tracking-widest text-red-400">
						System Exception Decrypted
					</h1>
					<p className="text-xs text-zinc-400 leading-relaxed px-2">
						An unexpected exception occurred along the semantic processing
						pipeline. The error details have been logged.
					</p>
				</div>

				{/* Error details container */}
				<div className="w-full text-start p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg max-h-[120px] overflow-y-auto font-mono text-[10px] text-red-300 leading-relaxed">
					{error.message || "Unknown pipeline exception."}
					{error.digest && (
						<div className="text-zinc-500 mt-1 select-all">
							Digest: {error.digest}
						</div>
					)}
				</div>

				<button
					type="button"
					onClick={reset}
					className="w-full py-2.5 rounded-lg bg-red-500/15 border border-red-500/35 hover:bg-red-500/25 text-red-300 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
				>
					<RefreshCw className="w-4 h-4" />
					Reinitialize Pipeline
				</button>
			</motion.div>
		</div>
	);
}
