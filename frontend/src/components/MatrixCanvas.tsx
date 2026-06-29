'use client'

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import type * as THREE from 'three'

interface ParticleFieldProps {
  selectedVideoId?: string
}

function ParticleField({ selectedVideoId }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const zoomOffsetRef = useRef({ z: 0 })

  // Track window mouse movements normalized to [-1, 1] range
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Trigger GSAP zoom animation when a video is selected
  useEffect(() => {
    if (!selectedVideoId) return
    gsap.fromTo(
      zoomOffsetRef.current,
      { z: -2.5 },
      { z: 0, duration: 1.5, ease: 'power2.out' }
    )
  }, [selectedVideoId])

  // Generate random positions and colors for 250 semantic data node particles
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(250 * 3)
    const cols = new Float32Array(250 * 3)
    for (let i = 0; i < 250; i++) {
      // Position range
      pos[i * 3] = (Math.random() - 0.5) * 12
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12

      // Neon colors (violet #7c3aed or cyan #06b6d4)
      const isCyan = Math.random() > 0.5
      cols[i * 3] = isCyan ? 0.02 : 0.48   // R
      cols[i * 3 + 1] = isCyan ? 0.71 : 0.22 // G
      cols[i * 3 + 2] = isCyan ? 0.83 : 0.93 // B
    }
    return [pos, cols]
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    const time = state.clock.getElapsedTime()
    
    // Slow rotational drift
    pointsRef.current.rotation.y = time * 0.01

    // Wave movement on particles
    const posAttribute = pointsRef.current.geometry.attributes.position
    if (posAttribute) {
      for (let i = 0; i < 250; i++) {
        const x = posAttribute.getX(i)
        const y = posAttribute.getY(i)
        const wave = Math.sin(time * 0.5 + x) * 0.002
        posAttribute.setY(i, y + wave)
      }
      posAttribute.needsUpdate = true
    }

    // Dynamic mouse parallax camera orbit lerp
    const targetX = mouseRef.current.x * 1.5
    const targetY = mouseRef.current.y * 1.2
    const targetZ = 5 + zoomOffsetRef.current.z

    state.camera.position.x += (targetX - state.camera.position.x) * 0.05
    state.camera.position.y += (targetY - state.camera.position.y) * 0.05
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.05
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  )
}

interface MatrixCanvasProps {
  active?: boolean
  selectedVideoId?: string
}

export default function MatrixCanvas({ active = false, selectedVideoId }: MatrixCanvasProps) {
  return (
    <div className="fixed inset-0 -z-10 bg-zinc-950">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.4} />
        {/* Neon point light shifting colors when ingestion transitions */}
        <pointLight
          position={[2, 3, 2]}
          intensity={active ? 3.5 : 1.5}
          color={active ? '#06b6d4' : '#7c3aed'}
        />
        <ParticleField selectedVideoId={selectedVideoId} />
      </Canvas>
    </div>
  )
}
