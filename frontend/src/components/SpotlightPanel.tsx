"use client";

import type React from "react";
import { useRef, useState } from "react";

interface SpotlightPanelProps {
	children: React.ReactNode;
	className?: string;
}

export default function SpotlightPanel({
	children,
	className = "",
}: SpotlightPanelProps) {
	const divRef = useRef<HTMLDivElement>(null);
	const [coords, setCoords] = useState({ x: 0, y: 0 });
	const [isHovered, setIsHovered] = useState(false);

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!divRef.current) return;
		const rect = divRef.current.getBoundingClientRect();
		setCoords({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: mouse tracker for radial background hover effects
		<div
			ref={divRef}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={`relative overflow-hidden transition-all duration-300 ${className}`}
		>
			{isHovered && (
				<div
					className="pointer-events-none absolute -inset-px transition duration-300 z-0"
					style={{
						background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, rgba(6, 182, 212, 0.12), transparent 80%)`,
					}}
				/>
			)}
			<div className="relative z-10 h-full flex flex-col">{children}</div>
		</div>
	);
}
