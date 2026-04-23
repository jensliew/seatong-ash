import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { Seabin } from '../../types'

const statusPalette: Record<Seabin['status'], { body: string; emissive: string; light: string }> = {
  active: { body: '#0f766e', emissive: '#0f766e', light: '#14b8a6' },
  paused: { body: '#b45309', emissive: '#f59e0b', light: '#fbbf24' },
  inactive: { body: '#475569', emissive: '#334155', light: '#94a3b8' },
}

function FloatRing({ color }: { color: string }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
      <torusGeometry args={[0.72, 0.12, 8, 48]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  )
}

function Body({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.3, 0]} castShadow>
      <cylinderGeometry args={[0.56, 0.6, 0.82, 48, 1, true]} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.2} side={THREE.FrontSide} />
    </mesh>
  )
}

function DebrisSurface({ contamination }: { contamination: Seabin['contamination_risk'] }) {
  const colors: Record<Seabin['contamination_risk'], string> = {
    low: '#99f6e4',
    medium: '#a3d4b8',
    high: '#d4a96a',
    critical: '#c47d7d',
  }
  return (
    <mesh position={[0, 0.25, 0]}>
      <cylinderGeometry args={[0.52, 0.52, 0.02, 48]} />
      <meshStandardMaterial color={colors[contamination]} roughness={0.8} metalness={0} />
    </mesh>
  )
}

function IntakeFunnel({ color }: { color: string }) {
  return (
    <>
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.58, 0.56, 0.05, 48]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.51, 0.025, 6, 48]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
    </>
  )
}

function Pump({ emissiveColor }: { emissiveColor: string }) {
  return (
    <>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.0, 24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.96, 0]}>
        <cylinderGeometry args={[0.14, 0.1, 0.2, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.87, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.025, 8, 32]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={2.5}
          roughness={0.2}
          metalness={0}
        />
      </mesh>
    </>
  )
}

function WaterSurface() {
  return (
    <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.8, 64]} />
      <MeshTransmissionMaterial
        backside={false}
        samples={4}
        thickness={0.2}
        roughness={0.05}
        transmission={0.92}
        ior={1.33}
        chromaticAberration={0.04}
        color="#a8d8ea"
        opacity={0.65}
        transparent
      />
    </mesh>
  )
}

function DebrisParticles({ contamination }: { contamination: Seabin['contamination_risk'] }) {
  const count = { low: 4, medium: 9, high: 16, critical: 24 }[contamination]
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + i * 0.3
    const r = 0.35 + Math.random() * 0.85
    return { x: Math.cos(angle) * r, z: Math.sin(angle) * r, scale: 0.025 + Math.random() * 0.04 }
  })
  return (
    <>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, 0.005, p.z]} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
          <planeGeometry args={[p.scale * 3, p.scale * 1.5]} />
          <meshStandardMaterial color="#78716c" roughness={1} transparent opacity={0.6} />
        </mesh>
      ))}
    </>
  )
}

function SeabinModel({ seabin }: { seabin: Seabin }) {
  const groupRef = useRef<THREE.Group>(null)
  const palette = statusPalette[seabin.status]

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.22
  })

  return (
    <group ref={groupRef}>
      <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.18}>
        <group>
          <FloatRing color={palette.body} />
          <Body color={palette.body} />
          <DebrisSurface contamination={seabin.contamination_risk} />
          <IntakeFunnel color={palette.body} />
          <Pump emissiveColor={palette.emissive} />
        </group>
      </Float>
      <WaterSurface />
      <DebrisParticles contamination={seabin.contamination_risk} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  seabin: Seabin
  /** Ambient mode: decorative — no labels, no orbit controls, transparent background */
  ambient?: boolean
}

export default function Seabin3D({ seabin, ambient = false }: Props) {
  const palette = statusPalette[seabin.status]

  if (ambient) {
    return (
      <Canvas
        camera={{ position: [0, 1.2, 2.6], fov: 40 }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 3]} intensity={1.3} />
          <pointLight position={[0, 1.2, 0]} intensity={0.6} color={palette.light} />
          <SeabinModel seabin={seabin} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    )
  }

  const riskLabel: Record<Seabin['contamination_risk'], string> = {
    low: 'Low contamination',
    medium: 'Medium contamination',
    high: 'High contamination',
    critical: 'Critical contamination',
  }

  return (
    <div className="relative flex h-full min-h-88 w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-b from-sky-50/60 to-teal-50/60">
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
          3D model
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[0.72rem] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: palette.light }} />
          {seabin.id} · {seabin.area}
        </span>
        <span className="inline-flex rounded-full bg-white/70 px-2.5 py-0.5 text-[0.68rem] text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur">
          {riskLabel[seabin.contamination_risk]}
        </span>
      </div>
      <div className="absolute bottom-3 right-4 z-10 text-[0.65rem] text-slate-400/70">
        Drag to rotate
      </div>
      <Canvas
        camera={{ position: [0, 1.1, 2.8], fov: 42 }}
        shadows
        className="flex-1"
        style={{ touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 3]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
          <pointLight position={[0, 1.2, 0]} intensity={0.7} color={palette.light} />
          <SeabinModel seabin={seabin} />
          <Environment preset="city" />
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={2}
            maxDistance={5}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
