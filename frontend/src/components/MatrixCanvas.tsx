"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";

interface ParticleFieldProps {
	selectedVideoId?: string;
	isFocused?: boolean;
	active?: boolean;
	isLight?: boolean;
}

function ParticleField({
	selectedVideoId,
	isFocused = false,
	active = false,
	isLight = false,
}: ParticleFieldProps) {
	const groupRef = useRef<THREE.Group>(null);
	const pointsRef = useRef<THREE.Points>(null);
	const lightRef = useRef<THREE.PointLight>(null);
	const mouseRef = useRef({ x: 0, y: 0 });
	const zoomOffsetRef = useRef({ z: 0 });

	// Track window mouse movements normalized to [-1, 1] range
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
			mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
		};
		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, []);

	// Trigger GSAP zoom animation when a video is selected
	useEffect(() => {
		if (!selectedVideoId) return;
		gsap.fromTo(
			zoomOffsetRef.current,
			{ z: -2.5 },
			{ z: 0, duration: 1.5, ease: "power2.out" },
		);
	}, [selectedVideoId]);

	// Animate light intensity using GSAP directly on three.js light instance
	useEffect(() => {
		if (!lightRef.current) return;
		const baseIntensity = active ? 3.5 : 1.5;
		const targetIntensity = baseIntensity * (isFocused ? 2.5 : 1.0);
		gsap.to(lightRef.current, {
			intensity: targetIntensity,
			duration: 0.8,
			ease: "power2.out",
		});
	}, [isFocused, active]);

	// Generate positions and theme-aware colors for 250 particles
	const [positions, colors] = useMemo(() => {
		const pos = new Float32Array(250 * 3);
		const cols = new Float32Array(250 * 3);
		for (let i = 0; i < 250; i++) {
			pos[i * 3] = (Math.random() - 0.5) * 12;
			pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
			pos[i * 3 + 2] = (Math.random() - 0.5) * 12;

			const isCyan = Math.random() > 0.5;
			if (isLight) {
				// High contrast deep colors for light mode: Deep Indigo (#4f46e5) or Deep Teal (#0d9488)
				cols[i * 3] = isCyan ? 0.05 : 0.31; // R
				cols[i * 3 + 1] = isCyan ? 0.58 : 0.27; // G
				cols[i * 3 + 2] = isCyan ? 0.53 : 0.9; // B
			} else {
				// High contrast neon colors for dark mode: Cyan (#06b6d4) or Violet (#7c3aed)
				cols[i * 3] = isCyan ? 0.02 : 0.48; // R
				cols[i * 3 + 1] = isCyan ? 0.71 : 0.22; // G
				cols[i * 3 + 2] = isCyan ? 0.83 : 0.93; // B
			}
		}
		return [pos, cols];
	}, [isLight]);

	// Pre-calculate line connections between close particles to form a constellation network mesh
	const [linePositions, lineColors] = useMemo(() => {
		const maxDistance = 2.4;
		const linePos: number[] = [];
		const lineCols: number[] = [];
		for (let i = 0; i < 250; i++) {
			const xi = positions[i * 3];
			const yi = positions[i * 3 + 1];
			const zi = positions[i * 3 + 2];
			for (let j = i + 1; j < 250; j++) {
				const xj = positions[j * 3];
				const yj = positions[j * 3 + 1];
				const zj = positions[j * 3 + 2];
				const dx = xi - xj;
				const dy = yi - yj;
				const dz = zi - zj;
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
				if (dist < maxDistance) {
					linePos.push(xi, yi, zi);
					linePos.push(xj, yj, zj);
					lineCols.push(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
					lineCols.push(colors[j * 3], colors[j * 3 + 1], colors[j * 3 + 2]);
				}
			}
		}
		return [new Float32Array(linePos), new Float32Array(lineCols)];
	}, [positions, colors]);

	useFrame((state) => {
		const time = state.clock.getElapsedTime();

		// Slow rotational drift of the entire group
		if (groupRef.current) {
			groupRef.current.rotation.y = time * 0.01;
		}

		// Wave movement on particles
		if (pointsRef.current) {
			const posAttribute = pointsRef.current.geometry.attributes.position;
			if (posAttribute) {
				for (let i = 0; i < 250; i++) {
					const x = posAttribute.getX(i);
					const y = posAttribute.getY(i);
					const wave = Math.sin(time * 0.5 + x) * 0.002;
					posAttribute.setY(i, y + wave);
				}
				posAttribute.needsUpdate = true;
			}
		}

		// Dynamic mouse parallax camera orbit lerp
		const targetX = mouseRef.current.x * (isFocused ? 0.8 : 1.5);
		const targetY = mouseRef.current.y * (isFocused ? 0.6 : 1.2);
		const targetZ = (isFocused ? 3.5 : 5.0) + zoomOffsetRef.current.z;

		state.camera.position.x += (targetX - state.camera.position.x) * 0.05;
		state.camera.position.y += (targetY - state.camera.position.y) * 0.05;
		state.camera.position.z += (targetZ - state.camera.position.z) * 0.05;
		state.camera.lookAt(0, 0, 0);
	});

	return (
		<>
			<pointLight
				ref={lightRef}
				position={[2, 3, 2]}
				intensity={active ? 3.5 : 1.5}
				color={
					isLight
						? active
							? "#0d9488"
							: "#4f46e5"
						: active
							? "#06b6d4"
							: "#7c3aed"
				}
			/>
			<group ref={groupRef}>
				{/* Particle Nodes */}
				<points ref={pointsRef}>
					<bufferGeometry>
						<bufferAttribute
							attach="attributes-position"
							args={[positions, 3]}
						/>
						<bufferAttribute attach="attributes-color" args={[colors, 3]} />
					</bufferGeometry>
					<pointsMaterial
						size={isLight ? 0.11 : 0.08}
						vertexColors
						transparent
						opacity={isLight ? 0.9 : 0.8}
						sizeAttenuation={true}
						depthWrite={false}
					/>
				</points>

				{/* Interconnecting Line Segments */}
				{linePositions.length > 0 && (
					<lineSegments>
						<bufferGeometry>
							<bufferAttribute
								attach="attributes-position"
								args={[linePositions, 3]}
							/>
							<bufferAttribute
								attach="attributes-color"
								args={[lineColors, 3]}
							/>
						</bufferGeometry>
						<lineBasicMaterial
							vertexColors
							transparent
							opacity={isLight ? 0.22 : 0.14}
							depthWrite={false}
						/>
					</lineSegments>
				)}
			</group>
		</>
	);
}

interface MatrixCanvasProps {
	active?: boolean;
	selectedVideoId?: string;
	isFocused?: boolean;
}

export default function MatrixCanvas({
	active = false,
	selectedVideoId,
	isFocused = false,
}: MatrixCanvasProps) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isLight = mounted && resolvedTheme === "light";

	return (
		<div className="fixed inset-0 -z-10 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
			<Canvas
				camera={{ position: [0, 0, 5], fov: 60 }}
				gl={{ antialias: true }}
			>
				<ambientLight intensity={isLight ? 0.85 : 0.4} />
				<ParticleField
					selectedVideoId={selectedVideoId}
					isFocused={isFocused}
					active={active}
					isLight={isLight}
				/>
			</Canvas>
		</div>
	);
}
