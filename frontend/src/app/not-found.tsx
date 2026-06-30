"use client";

import { motion } from "framer-motion";
import { Network, Home } from "lucide-react";
import Link from "next/link";
import MatrixCanvas from "@/components/MatrixCanvas";

export default function NotFound() {
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
				whileHover={{ rotateX: 2, rotateY: -2, translateZ: 10 }}
				style={{ transformStyle: "preserve-3d" }}
				className="z-10 max-w-md w-full mx-4 p-8 rounded-2xl glass-panel border border-zinc-800/50 bg-zinc-950/40 backdrop-blur-md text-center shadow-2xl flex flex-col items-center gap-6"
			>
				{/* 3D Glowing Neon Icon */}
				<div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-pulse">
					<Network className="w-8 h-8 text-cyan-400" />
				</div>

				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-black uppercase tracking-widest text-gradient">
						404 - Node Lost
					</h1>
					<p className="text-xs text-zinc-400 leading-relaxed px-2">
						The semantic video segment or workspace folder you are trying to index does not exist in the TubeRAG database.
					</p>
				</div>

				<Link
					href="/en"
					className="w-full py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/35 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
				>
					<Home className="w-4 h-4" />
					Return to Console
				</Link>
			</motion.div>
		</div>
	);
}
