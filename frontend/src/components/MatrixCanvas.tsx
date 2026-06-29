'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type * as THREE from 'three'

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)

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
    pointsRef.current.rotation.y = time * 0.02
    pointsRef.current.rotation.x = time * 0.01

    // Wave movement
    const posAttribute = pointsRef.current.geometry.attributes.position
    if (posAttribute) {
      for (let i = 0; i < 250; i++) {
        const x = posAttribute.getX(i)
        const y = posAttribute.getY(i)
        // Offset Y with a sine wave based on time and coordinate
        const wave = Math.sin(time * 0.5 + x) * 0.002
        posAttribute.setY(i, y + wave)
      }
      posAttribute.needsUpdate = true
    }
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

export default function MatrixCanvas({ active = false }: { active?: boolean }) {
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
        <ParticleField />
      </Canvas>
    </div>
  )
}
