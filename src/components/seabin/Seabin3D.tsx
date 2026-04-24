import { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    Float,
    MeshTransmissionMaterial,
} from '@react-three/drei';
import * as THREE from 'three';
import { Box, Eye } from 'lucide-react';
import type { Seabin } from '../../types';
import {
    streamScenarioForSeabin,
    SCENARIO_META,
    type StreamScenario,
} from '../../lib/streamScenario';

type ViewMode = 'exterior' | 'cutaway';

/* ─── Color palettes ─────────────────────────────────────────────────── */
const STATUS_PALETTE = {
    active: {
        collar: '#0d9488',
        pump: '#0f766e',
        led: '#2dd4bf',
        glow: '#14b8a6',
    },
    paused: {
        collar: '#d97706',
        pump: '#92400e',
        led: '#fcd34d',
        glow: '#f59e0b',
    },
    inactive: {
        collar: '#475569',
        pump: '#334155',
        led: '#94a3b8',
        glow: '#64748b',
    },
} as const;

const RISK_COLOR = {
    low: '#6ee7b7',
    medium: '#fcd34d',
    high: '#fb923c',
    critical: '#f87171',
} as const;

const RISK_FILL = {
    low: 0.06,
    medium: 0.3,
    high: 0.58,
    critical: 0.86,
} as const;

const DEBRIS_COLORS = ['#78716c', '#a16207', '#57534e', '#6b7280'] as const;

type EnvPreset =
    | 'apartment'
    | 'city'
    | 'dawn'
    | 'forest'
    | 'lobby'
    | 'night'
    | 'park'
    | 'studio'
    | 'sunset'
    | 'warehouse';

const SCENARIO_VISUAL: Record<
    StreamScenario,
    {
        particleFactor: number;
        inflowSpeedMul: number;
        rippleSpeedMul: number;
        yawSpeedMul: number;
        waterColor: string;
        waterOpacity: number;
        chromatic: number;
        envPreset: EnvPreset;
        warmthLight: string;
        warmthIntensity: number;
        fillBoost: number;
        floatSpeed: number;
        ledPulseMul: number;
        showFishOrbit: boolean;
        ambientMul: number;
        /** Scene background — deep water colour matching the scenario mood. */
        bgColor: string;
        /** Ocean floor colour. */
        floorColor: string;
    }
> = {
    default: {
        particleFactor: 1,
        inflowSpeedMul: 1,
        rippleSpeedMul: 1,
        yawSpeedMul: 1,
        waterColor: '#38bdf8',
        waterOpacity: 0.5,
        chromatic: 0.06,
        envPreset: 'sunset',
        warmthLight: '#14b8a6',
        warmthIntensity: 0.9,
        fillBoost: 0,
        floatSpeed: 1.1,
        ledPulseMul: 1,
        showFishOrbit: false,
        ambientMul: 1,
        bgColor: '#0b2235',
        floorColor: '#0a2d40',
    },
    ph_deadfish: {
        particleFactor: 1.15,
        inflowSpeedMul: 1.12,
        rippleSpeedMul: 1.08,
        yawSpeedMul: 0.95,
        waterColor: '#c4b5fd',
        waterOpacity: 0.55,
        chromatic: 0.1,
        envPreset: 'night',
        warmthLight: '#a855f7',
        warmthIntensity: 0.95,
        fillBoost: 0.06,
        floatSpeed: 1,
        ledPulseMul: 1.5,
        showFishOrbit: false,
        ambientMul: 0.85,
        bgColor: '#130c25',
        floorColor: '#1a1030',
    },
    fish_haven: {
        particleFactor: 0.4,
        inflowSpeedMul: 0.68,
        rippleSpeedMul: 0.75,
        yawSpeedMul: 0.55,
        waterColor: '#22d3ee',
        waterOpacity: 0.4,
        chromatic: 0.035,
        envPreset: 'dawn',
        warmthLight: '#2dd4bf',
        warmthIntensity: 0.55,
        fillBoost: -0.04,
        floatSpeed: 0.82,
        ledPulseMul: 0.8,
        showFishOrbit: true,
        ambientMul: 1.05,
        bgColor: '#071e2c',
        floorColor: '#083040',
    },
    heavy_pollution: {
        particleFactor: 1.6,
        inflowSpeedMul: 1.38,
        rippleSpeedMul: 1.4,
        yawSpeedMul: 1.2,
        waterColor: '#78716c',
        waterOpacity: 0.58,
        chromatic: 0.12,
        envPreset: 'city',
        warmthLight: '#ea580c',
        warmthIntensity: 1.2,
        fillBoost: 0.1,
        floatSpeed: 1.28,
        ledPulseMul: 1.35,
        showFishOrbit: false,
        ambientMul: 0.9,
        bgColor: '#100e07',
        floorColor: '#1a160a',
    },
};

/** Stable 0..1 value from a numeric seed (pure — safe during render). */
function hash01(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}

/** Stable integer seed from seabin id (for deterministic trash layout). */
function idHashSeed(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) {
        h = (h << 5) - h + id.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

/* ─── Expanding ripple ring ──────────────────────────────────────────── */
function RippleRing({
    delay = 0,
    color,
    speedMul = 1,
}: {
    delay?: number;
    color: string;
    speedMul?: number;
}) {
    const ref = useRef<THREE.Mesh>(null);
    const t = useRef(delay);
    useFrame((_, dt) => {
        t.current += dt * 0.44 * speedMul;
        const p = (t.current % 2.8) / 2.8;
        if (!ref.current) return;
        const s = 1 + p * 1.7;
        ref.current.scale.set(s, 1, s);
        (ref.current.material as THREE.MeshBasicMaterial).opacity =
            (1 - p) * 0.26;
    });
    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[0.68, 0.75, 64]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.26}
                depthWrite={false}
            />
        </mesh>
    );
}

/* ─── Rising underwater bubbles ─────────────────────────────────────── */
function BubbleParticles({ count = 18 }: { count?: number }) {
    const defs = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => ({
                x: (hash01(i * 37.3) - 0.5) * 3.2,
                z: (hash01(i * 53.7) - 0.5) * 3.2,
                speed: 0.18 + hash01(i * 71.9) * 0.22,
                phase: hash01(i * 97.1) * 6.28,
                size: 0.012 + hash01(i * 113.3) * 0.018,
                wobble: hash01(i * 131.7) * 0.3,
            })),
        [count],
    );

    const refs = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        defs.forEach((d, i) => {
            const m = refs.current[i];
            if (!m) return;
            const p = ((t * d.speed + d.phase) % 3.5) / 3.5;
            m.position.set(
                d.x + Math.sin(t * 0.4 + d.phase) * d.wobble,
                -3.0 + p * 4.2,
                d.z + Math.cos(t * 0.35 + d.phase) * d.wobble,
            );
            (m.material as THREE.MeshBasicMaterial).opacity =
                p < 0.15 ? p / 0.15 * 0.35 : p > 0.75 ? (1 - p) / 0.25 * 0.35 : 0.35;
        });
    });

    return (
        <>
            {defs.map((_, i) => (
                <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
                    <sphereGeometry args={[defs[i].size, 6, 6]} />
                    <meshBasicMaterial
                        color='#7dd3fc'
                        transparent
                        opacity={0.35}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </>
    );
}

/* ─── Ocean floor plane ──────────────────────────────────────────────── */
function OceanFloor({ color }: { color: string }) {
    return (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.2, 0]}>
            <planeGeometry args={[28, 28, 1, 1]} />
            <meshStandardMaterial color={color} roughness={0.95} metalness={0.0} />
        </mesh>
    );
}

/* ─── Debris inflow particles ────────────────────────────────────────── */
function InflowParticles({
    count,
    speedMul,
}: {
    count: number;
    speedMul: number;
}) {
    const defs = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => {
                const s = i * 73.1 + count * 19.7;
                return {
                    baseAngle:
                        (i / Math.max(count, 1)) * Math.PI * 2 +
                        hash01(s + 1) * 0.5,
                    radius: 0.55 + hash01(s + 2) * 0.7,
                    speed: (0.32 + hash01(s + 3) * 0.28) * speedMul,
                    phase: hash01(s + 4) * Math.PI * 2,
                    size: 0.02 + hash01(s + 5) * 0.02,
                    color: DEBRIS_COLORS[
                        Math.floor(hash01(s + 6) * DEBRIS_COLORS.length)
                    ],
                };
            }),
        [count, speedMul],
    );

    const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        defs.forEach((d, i) => {
            const m = meshRefs.current[i];
            if (!m) return;
            const prog =
                ((t * d.speed + d.phase) % (Math.PI * 2)) / (Math.PI * 2);
            const r = d.radius * (1 - prog * 0.68);
            const angle = d.baseAngle + prog * Math.PI * 3.5;
            m.position.set(
                Math.cos(angle) * r,
                0.06 - prog * 0.14,
                Math.sin(angle) * r,
            );
            (m.material as THREE.MeshStandardMaterial).opacity =
                prog < 0.78 ? 0.78 : (1 - (prog - 0.78) / 0.22) * 0.78;
        });
    });

    return (
        <>
            {defs.map((d, i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        meshRefs.current[i] = el;
                    }}
                >
                    <sphereGeometry args={[d.size, 6, 6]} />
                    <meshStandardMaterial
                        color={d.color}
                        transparent
                        opacity={0.78}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </>
    );
}

/* ─── Pulsing status LED ─────────────────────────────────────────────── */
function PulsingLED({ color, pulseMul }: { color: string; pulseMul: number }) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        if (matRef.current)
            matRef.current.emissiveIntensity =
                2.2 +
                Math.sin(clock.getElapsedTime() * 2.4 * pulseMul) * 1.6;
    });
    return (
        <mesh position={[0.07, 0.14, 0.1]}>
            <sphereGeometry args={[0.036, 12, 12]} />
            <meshStandardMaterial
                ref={matRef}
                color={color}
                emissive={color}
                emissiveIntensity={3}
                roughness={0}
                metalness={0}
            />
        </mesh>
    );
}

/* ─── Fish-haven orbit markers (abstract “life” around the unit) ─────── */
function FishHavenOrbit() {
    const g = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (g.current)
            g.current.rotation.y = clock.getElapsedTime() * 0.22;
    });
    const n = 5;
    return (
        <group ref={g}>
            {Array.from({ length: n }, (_, i) => {
                const a = (i / n) * Math.PI * 2;
                const r = 1.05;
                return (
                    <mesh
                        key={i}
                        position={[
                            Math.cos(a) * r,
                            0.1 + Math.sin(i * 1.1) * 0.04,
                            Math.sin(a) * r,
                        ]}
                    >
                        <sphereGeometry args={[0.038, 8, 8]} />
                        <meshStandardMaterial
                            color='#5eead4'
                            emissive='#14b8a6'
                            emissiveIntensity={0.45}
                            roughness={0.35}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

/* ─── Floating collar buoy ───────────────────────────────────────────── */
function FloatCollar({
    color,
    cutaway,
}: {
    color: string;
    cutaway: boolean;
}) {
    return (
        <group position={[0, 0.02, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.76, 0.2, 20, 72]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.22}
                    metalness={0.12}
                    transparent={cutaway}
                    opacity={cutaway ? 0.55 : 1}
                />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.55, 0.028, 8, 48]} />
                <meshStandardMaterial
                    color='#1e293b'
                    roughness={0.35}
                    metalness={0.75}
                />
            </mesh>
            <mesh position={[0, 0.19, 0]}>
                <cylinderGeometry args={[0.56, 0.58, 0.04, 48]} />
                <meshStandardMaterial
                    color='#0f172a'
                    roughness={0.4}
                    metalness={0.6}
                />
            </mesh>
        </group>
    );
}

/* ─── Mesh basket body ───────────────────────────────────────────────── */
function BasketBody({
    color,
    cutaway,
}: {
    color: string;
    cutaway: boolean;
}) {
    return (
        <group position={[0, -0.46, 0]}>
            {/* Outer shell — translucent when cutaway so internals are visible */}
            <mesh>
                <cylinderGeometry args={[0.54, 0.44, 0.88, 36, 1, true]} />
                <meshStandardMaterial
                    color={color}
                    roughness={cutaway ? 0.2 : 0.58}
                    metalness={cutaway ? 0.05 : 0.12}
                    side={THREE.DoubleSide}
                    transparent={cutaway}
                    opacity={cutaway ? 0.22 : 1}
                    depthWrite={!cutaway}
                />
            </mesh>
            {([-0.33, -0.07, 0.19] as number[]).map((y, i) => (
                <mesh
                    key={i}
                    position={[0, y, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <torusGeometry args={[0.5 - i * 0.015, 0.012, 6, 36]} />
                    <meshStandardMaterial
                        color='#0f172a'
                        roughness={0.45}
                        metalness={0.45}
                    />
                </mesh>
            ))}
            <mesh position={[0, -0.44, 0]}>
                <cylinderGeometry args={[0.44, 0.44, 0.018, 32]} />
                <meshStandardMaterial
                    color='#1e293b'
                    roughness={0.4}
                    metalness={0.3}
                />
            </mesh>
        </group>
    );
}

/* ─── Internal parts visible in cutaway view ─────────────────────────── */
function InternalParts({ ledColor }: { ledColor: string }) {
    return (
        <group>
            {/* Intake filter mesh — fine disc at the top of the basket */}
            <mesh position={[0, -0.14, 0]}>
                <cylinderGeometry args={[0.42, 0.42, 0.012, 48]} />
                <meshStandardMaterial
                    color='#334155'
                    roughness={0.85}
                    metalness={0.2}
                    transparent
                    opacity={0.6}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* Perforated bottom plate */}
            <mesh position={[0, -0.88, 0]}>
                <cylinderGeometry args={[0.42, 0.42, 0.01, 32]} />
                <meshStandardMaterial
                    color='#475569'
                    roughness={0.7}
                    metalness={0.2}
                />
            </mesh>
            {Array.from({ length: 14 }, (_, i) => {
                const a = (i / 14) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        position={[
                            Math.cos(a) * 0.22,
                            -0.875,
                            Math.sin(a) * 0.22,
                        ]}
                    >
                        <cylinderGeometry args={[0.016, 0.016, 0.018, 10]} />
                        <meshStandardMaterial color='#0f172a' />
                    </mesh>
                );
            })}
            {/* Central intake riser */}
            <mesh position={[0, -0.4, 0]}>
                <cylinderGeometry args={[0.04, 0.06, 0.72, 16]} />
                <meshStandardMaterial
                    color='#1e293b'
                    roughness={0.35}
                    metalness={0.8}
                />
            </mesh>
            {/* pH sensor probe */}
            <group position={[-0.3, -0.52, 0]}>
                <mesh>
                    <boxGeometry args={[0.1, 0.14, 0.08]} />
                    <meshStandardMaterial
                        color='#f1f5f9'
                        roughness={0.5}
                        metalness={0.3}
                    />
                </mesh>
                <mesh position={[0, -0.16, 0]}>
                    <cylinderGeometry args={[0.014, 0.014, 0.22, 12]} />
                    <meshStandardMaterial
                        color='#334155'
                        roughness={0.4}
                        metalness={0.6}
                    />
                </mesh>
                <mesh position={[0.058, 0.02, 0.042]}>
                    <sphereGeometry args={[0.008, 8, 8]} />
                    <meshStandardMaterial
                        color={ledColor}
                        emissive={ledColor}
                        emissiveIntensity={2.6}
                    />
                </mesh>
            </group>
        </group>
    );
}

/* ─── Recognisable trash pieces (cutaway — full pile) — deterministic ─── */
type TrashKind = 'bottle' | 'bag' | 'can' | 'chunk';

function TrashInBasket({ fill, seed }: { fill: number; seed: number }) {
    const pieces = useMemo(() => {
        const n = Math.min(42, Math.max(10, Math.floor(10 + fill * 34)));
        const bottomY = -0.88;
        const pileH = Math.max(0.06, fill * 0.72);
        const topY = bottomY + pileH;
        const out: Array<{
            key: string;
            kind: TrashKind;
            pos: [number, number, number];
            rot: [number, number, number];
            scale: [number, number, number];
            color: string;
        }> = [];

        for (let i = 0; i < n; i++) {
            const h1 = hash01(seed + i * 31);
            const h2 = hash01(seed + i * 47);
            const h3 = hash01(seed + i * 59);
            const h4 = hash01(seed + i * 71);
            const theta = h1 * Math.PI * 2;
            const r = 0.06 + h2 * 0.26;
            const py = bottomY + h3 * (topY - bottomY);
            const px = Math.cos(theta) * r;
            const pz = Math.sin(theta) * r;
            const kind = (['bottle', 'bag', 'can', 'chunk'] as const)[i % 4];
            const rot: [number, number, number] = [
                h4 * Math.PI * 2,
                hash01(seed + i * 83) * Math.PI * 2,
                hash01(seed + i * 97) * Math.PI * 2,
            ];
            const s = 0.55 + hash01(seed + i * 109) * 0.55;
            const scale: [number, number, number] =
                kind === 'bottle'
                    ? [0.04 * s, 0.1 * s, 0.04 * s]
                    : kind === 'bag'
                      ? [0.09 * s, 0.02 * s, 0.07 * s]
                      : kind === 'can'
                        ? [0.04 * s, 0.055 * s, 0.04 * s]
                        : [0.06 * s, 0.04 * s, 0.05 * s];
            out.push({
                key: `${seed}-t-${i}`,
                kind,
                pos: [px, py, pz],
                rot,
                scale,
                color: DEBRIS_COLORS[i % DEBRIS_COLORS.length],
            });
        }
        return out;
    }, [fill, seed]);

    return (
        <group>
            {pieces.map((p) => (
                <mesh
                    key={p.key}
                    position={p.pos}
                    rotation={p.rot}
                    castShadow
                >
                    {p.kind === 'bottle' ? (
                        <cylinderGeometry
                            args={[
                                p.scale[0],
                                p.scale[0],
                                p.scale[1],
                                8,
                                1,
                            ]}
                        />
                    ) : p.kind === 'bag' ? (
                        <boxGeometry args={p.scale} />
                    ) : p.kind === 'can' ? (
                        <cylinderGeometry
                            args={[
                                p.scale[0],
                                p.scale[0],
                                p.scale[1],
                                10,
                                1,
                            ]}
                        />
                    ) : (
                        <boxGeometry args={p.scale} />
                    )}
                    <meshStandardMaterial
                        color={p.color}
                        roughness={0.78}
                        metalness={p.kind === 'can' ? 0.65 : 0.08}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ─── Few trash bits visible at the rim (exterior — shell stays solid) ─ */
function TrashRimHint({ fill, seed }: { fill: number; seed: number }) {
    const pieces = useMemo(() => {
        // Exterior: hint only when there is meaningful fill; empty stays clean.
        if (fill < 0.1) return [];
        const n = Math.min(8, Math.max(3, Math.floor(3 + fill * 6)));
        const bottomY = -0.88;
        const pileH = Math.max(0.06, fill * 0.72);
        const topY = bottomY + pileH;
        const rimLow = topY - pileH * 0.24;
        const out: Array<{
            key: string;
            kind: TrashKind;
            pos: [number, number, number];
            rot: [number, number, number];
            scale: [number, number, number];
            color: string;
        }> = [];

        for (let i = 0; i < n; i++) {
            const h1 = hash01(seed + i * 31);
            const h2 = hash01(seed + i * 47);
            const h3 = hash01(seed + i * 59);
            const h4 = hash01(seed + i * 71);
            const theta = h1 * Math.PI * 2;
            const r = 0.2 + h2 * 0.12;
            const py = rimLow + h3 * (topY - rimLow);
            const px = Math.cos(theta) * r;
            const pz = Math.sin(theta) * r;
            const kind = (['bottle', 'bag', 'can', 'chunk'] as const)[i % 4];
            const rot: [number, number, number] = [
                h4 * Math.PI * 0.5,
                hash01(seed + i * 83) * Math.PI,
                hash01(seed + i * 97) * Math.PI * 0.35,
            ];
            const s = 0.42 + hash01(seed + i * 109) * 0.35;
            const scale: [number, number, number] =
                kind === 'bottle'
                    ? [0.032 * s, 0.075 * s, 0.032 * s]
                    : kind === 'bag'
                      ? [0.065 * s, 0.016 * s, 0.052 * s]
                      : kind === 'can'
                        ? [0.032 * s, 0.042 * s, 0.032 * s]
                        : [0.045 * s, 0.03 * s, 0.038 * s];
            out.push({
                key: `${seed}-r-${i}`,
                kind,
                pos: [px, py, pz],
                rot,
                scale,
                color: DEBRIS_COLORS[i % DEBRIS_COLORS.length],
            });
        }
        return out;
    }, [fill, seed]);

    return (
        <group>
            {pieces.map((p) => (
                <mesh
                    key={p.key}
                    position={p.pos}
                    rotation={p.rot}
                    castShadow
                >
                    {p.kind === 'bottle' ? (
                        <cylinderGeometry
                            args={[
                                p.scale[0],
                                p.scale[0],
                                p.scale[1],
                                8,
                                1,
                            ]}
                        />
                    ) : p.kind === 'bag' ? (
                        <boxGeometry args={p.scale} />
                    ) : p.kind === 'can' ? (
                        <cylinderGeometry
                            args={[
                                p.scale[0],
                                p.scale[0],
                                p.scale[1],
                                10,
                                1,
                            ]}
                        />
                    ) : (
                        <boxGeometry args={p.scale} />
                    )}
                    <meshStandardMaterial
                        color={p.color}
                        roughness={0.78}
                        metalness={p.kind === 'can' ? 0.65 : 0.08}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ─── Debris fill: volume + full trash (cutaway) or rim hint (exterior) ─ */
function DebrisFill({
    seabin,
    fillBoost,
    cutaway,
}: {
    seabin: Seabin;
    fillBoost: number;
    cutaway: boolean;
}) {
    const contamination = seabin.contamination_risk;
    const risk = RISK_FILL[contamination];
    const cap = seabin.capacity / 100;
    const fill = Math.min(0.95, risk * 0.38 + cap * 0.5 + fillBoost);
    const tint = RISK_COLOR[contamination];
    const height = Math.max(0.04, fill * 0.74);
    const y = -0.9 + height / 2 + 0.02;
    const seed = idHashSeed(seabin.id);

    return (
        <group>
            {/* Murky water / mixed debris volume */}
            <mesh position={[0, y, 0]}>
                <cylinderGeometry args={[0.42, 0.42, height, 32]} />
                <meshStandardMaterial
                    color={tint}
                    roughness={0.88}
                    metalness={0}
                    transparent
                    opacity={cutaway ? 0.32 : 0.92}
                    depthWrite={!cutaway}
                />
            </mesh>
            {cutaway ? (
                <TrashInBasket fill={fill} seed={seed} />
            ) : (
                <TrashRimHint fill={fill} seed={seed + 1_001_023} />
            )}
        </group>
    );
}

/* ─── Side-mounted pump unit ─────────────────────────────────────────── */
function PumpUnit({
    color,
    ledColor,
    pulseMul,
}: {
    color: string;
    ledColor: string;
    pulseMul: number;
}) {
    return (
        <group position={[0.65, -0.14, 0]}>
            <mesh>
                <boxGeometry args={[0.22, 0.42, 0.2]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.26}
                    metalness={0.58}
                />
            </mesh>
            <mesh position={[-0.155, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.028, 0.028, 0.14, 10]} />
                <meshStandardMaterial
                    color='#1e293b'
                    roughness={0.5}
                    metalness={0.5}
                />
            </mesh>
            <mesh position={[0, -0.34, 0]}>
                <cylinderGeometry args={[0.052, 0.052, 0.25, 12]} />
                <meshStandardMaterial
                    color='#0f172a'
                    roughness={0.45}
                    metalness={0.65}
                />
            </mesh>
            <mesh position={[0.07, 0, 0.102]}>
                <boxGeometry args={[0.06, 0.28, 0.004]} />
                <meshStandardMaterial
                    color='#0f172a'
                    roughness={0.6}
                    metalness={0.3}
                />
            </mesh>
            <PulsingLED color={ledColor} pulseMul={pulseMul} />
        </group>
    );
}

/* ─── Animated water surface + ripples ───────────────────────────────── */
function WaterSurface({
    glowColor,
    waterColor,
    waterOpacity,
    chromatic,
    rippleSpeedMul,
}: {
    glowColor: string;
    waterColor: string;
    waterOpacity: number;
    chromatic: number;
    rippleSpeedMul: number;
}) {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <circleGeometry args={[2.6, 80]} />
                <MeshTransmissionMaterial
                    backside={false}
                    samples={3}
                    thickness={0.12}
                    roughness={0.02}
                    transmission={0.95}
                    ior={1.33}
                    chromaticAberration={chromatic}
                    color={waterColor}
                    opacity={waterOpacity}
                    transparent
                />
            </mesh>
            <RippleRing delay={0} color={glowColor} speedMul={rippleSpeedMul} />
            <RippleRing
                delay={0.93}
                color={glowColor}
                speedMul={rippleSpeedMul}
            />
            <RippleRing
                delay={1.86}
                color={glowColor}
                speedMul={rippleSpeedMul}
            />
        </>
    );
}

/* ─── Full assembled Seabin model ────────────────────────────────────── */
function SeabinModel({
    seabin,
    scenario,
    viewMode,
}: {
    seabin: Seabin;
    scenario: StreamScenario;
    viewMode: ViewMode;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const pal = STATUS_PALETTE[seabin.status];
    const sv = SCENARIO_VISUAL[scenario];
    const cutaway = viewMode === 'cutaway';
    const baseParticles = {
        low: 3,
        medium: 7,
        high: 12,
        critical: 18,
    }[seabin.contamination_risk];
    const particleCount = Math.max(
        2,
        Math.round(baseParticles * sv.particleFactor),
    );

    useFrame((_, dt) => {
        if (groupRef.current)
            groupRef.current.rotation.y += dt * 0.18 * sv.yawSpeedMul;
    });

    return (
        <group ref={groupRef}>
            <WaterSurface
                glowColor={sv.warmthLight}
                waterColor={sv.waterColor}
                waterOpacity={sv.waterOpacity}
                chromatic={sv.chromatic}
                rippleSpeedMul={sv.rippleSpeedMul}
            />
            {sv.showFishOrbit ? <FishHavenOrbit /> : null}
            <Float
                speed={sv.floatSpeed}
                rotationIntensity={0.04}
                floatIntensity={0.15}
            >
                <group>
                    <FloatCollar color={pal.collar} cutaway={cutaway} />
                    <BasketBody color={pal.pump} cutaway={cutaway} />
                    {cutaway ? <InternalParts ledColor={pal.led} /> : null}
                    <DebrisFill
                        seabin={seabin}
                        fillBoost={sv.fillBoost}
                        cutaway={cutaway}
                    />
                    <PumpUnit
                        color={pal.pump}
                        ledColor={pal.led}
                        pulseMul={sv.ledPulseMul}
                    />
                    <InflowParticles
                        count={particleCount}
                        speedMul={sv.inflowSpeedMul}
                    />
                </group>
            </Float>
        </group>
    );
}

/* ─── Shared lighting + scene ────────────────────────────────────────── */
function Scene({
    seabin,
    shadows,
    scenario,
    viewMode,
}: {
    seabin: Seabin;
    shadows: boolean;
    scenario: StreamScenario;
    viewMode: ViewMode;
}) {
    const pal = STATUS_PALETTE[seabin.status];
    const sv = SCENARIO_VISUAL[scenario];
    return (
        <Suspense fallback={null}>
            {/* Ocean background — no white */}
            <color attach='background' args={[sv.bgColor]} />
            <fog attach='fog' args={[sv.bgColor, 5, 18]} />

            <ambientLight intensity={0.7 * sv.ambientMul} />
            <directionalLight
                position={[3, 6, 3]}
                intensity={1.6}
                castShadow={shadows}
            />
            <pointLight
                position={[0, 1.6, 0]}
                intensity={sv.warmthIntensity}
                color={sv.warmthLight}
            />
            {/* Underwater caustic fill — blue-green from below */}
            <pointLight
                position={[0, -2.0, 0]}
                intensity={0.55 * sv.ambientMul}
                color='#0ea5e9'
            />
            <pointLight
                position={[-2, 0.5, -1]}
                intensity={0.35 * sv.ambientMul}
                color='#7dd3fc'
            />
            <pointLight
                position={[2.2, 0.8, 1.5]}
                intensity={0.25}
                color={pal.glow}
            />

            <OceanFloor color={sv.floorColor} />
            <BubbleParticles count={20} />
            <SeabinModel
                seabin={seabin}
                scenario={scenario}
                viewMode={viewMode}
            />
            <Environment preset={sv.envPreset} />
        </Suspense>
    );
}

function LiveClock() {
    const [t, setT] = useState(() => new Date());
    useEffect(() => {
        const id = window.setInterval(() => setT(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);
    return (
        <time
            dateTime={t.toISOString()}
            className='text-[0.72rem] font-medium tabular-nums text-slate-600'
        >
            {t.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })}
        </time>
    );
}

/* ─── Public component ───────────────────────────────────────────────── */
interface Props {
    seabin: Seabin;
    /** Compact decorative mode: no controls, transparent background */
    compact?: boolean;
    /** Embedded inside a parent card — strip own border/bg/rounded styling */
    embedded?: boolean;
    /** Stream narrative; defaults from seabin id (same as live preview). */
    scenario?: StreamScenario;
}

export default function Seabin3D({
    seabin,
    compact = false,
    embedded = false,
    scenario: scenarioProp,
}: Props) {
    const pal = STATUS_PALETTE[seabin.status];
    const scenario = scenarioProp ?? streamScenarioForSeabin(seabin);
    const meta = SCENARIO_META[scenario];
    const sv = SCENARIO_VISUAL[scenario];
    // Default to cutaway when embedded so the interior is immediately visible
    const [viewMode, setViewMode] = useState<ViewMode>(
        embedded ? 'cutaway' : 'exterior',
    );

    if (compact) {
        return (
            <Canvas
                camera={{ position: [0, 1.4, 2.8], fov: 38 }}
                style={{
                    background: 'transparent',
                    width: '100%',
                    height: '100%',
                }}
                gl={{ alpha: true, antialias: true }}
            >
                <Scene
                    seabin={seabin}
                    shadows={false}
                    scenario={scenario}
                    viewMode='exterior'
                />
            </Canvas>
        );
    }

    const outerClass = embedded
        ? 'absolute inset-0 flex flex-col overflow-hidden'
        : 'relative flex h-full min-h-96 w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80';

    return (
        <div className={outerClass}>
            {/* Top-left: clock (only when NOT embedded — card toolbar handles context) */}
            {!embedded && (
                <div className='pointer-events-none absolute left-4 top-4 z-10 flex max-w-[min(100%,22rem)] flex-col gap-1.5'>
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                        <span className='inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-teal-800 shadow-sm ring-1 ring-teal-200/80 backdrop-blur'>
                            <span className='relative flex h-1.5 w-1.5'>
                                <span className='absolute inset-0 animate-ping rounded-full bg-teal-500 opacity-60' />
                                <span className='relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500' />
                            </span>
                            Live
                        </span>
                        <LiveClock />
                    </div>
                    <div className='inline-flex items-center gap-1.5 self-start rounded-full bg-white/80 px-2.5 py-1 shadow-sm ring-1 ring-slate-200 backdrop-blur'>
                        <span
                            className='h-1.5 w-1.5 rounded-full'
                            style={{ background: sv.warmthLight }}
                        />
                        <span className='text-[0.72rem] font-semibold leading-none text-slate-800'>
                            {meta.title}
                        </span>
                    </div>
                </div>
            )}

            {/* Clock only when embedded */}
            {embedded && (
                <div className='pointer-events-none absolute left-3 top-3 z-10'>
                    <LiveClock />
                </div>
            )}

            {/* View mode toggle — pill button with label, bottom-centre */}
            <div className='absolute bottom-3 left-1/2 z-10 -translate-x-1/2'>
                <button
                    type='button'
                    onClick={() =>
                        setViewMode((v) =>
                            v === 'exterior' ? 'cutaway' : 'exterior',
                        )
                    }
                    aria-label='Toggle cutaway view'
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.7rem] font-semibold shadow-md backdrop-blur transition-all ${
                        viewMode === 'cutaway'
                            ? 'border-sky-300/60 bg-sky-900/70 text-sky-200 hover:bg-sky-800/80'
                            : 'border-white/30 bg-black/40 text-white hover:bg-black/60'
                    }`}
                >
                    {viewMode === 'cutaway' ? (
                        <>
                            <Box size={12} />
                            Exterior view
                        </>
                    ) : (
                        <>
                            <Eye size={12} />
                            See inside (cutaway)
                        </>
                    )}
                </button>
            </div>

            {/* Bottom-right: capacity pill — only when NOT embedded (stat strip covers this) */}
            {!embedded && (
                <div className='pointer-events-none absolute bottom-3 right-4 z-10'>
                    <span className='inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2 py-0.5 text-[0.6rem] font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur'>
                        <span
                            className='h-1.5 w-1.5 rounded-full'
                            style={{ background: pal.led }}
                        />
                        {seabin.capacity}% full · {seabin.contamination_risk} risk
                    </span>
                </div>
            )}

            <Canvas
                camera={{ position: [0, 1.0, 2.4], fov: 48 }}
                shadows
                className='flex-1'
                style={{ touchAction: 'none' }}
            >
                <Scene
                    seabin={seabin}
                    shadows
                    scenario={scenario}
                    viewMode={viewMode}
                />
                <OrbitControls
                    enablePan={false}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 2.1}
                    minDistance={1.4}
                    maxDistance={6}
                    autoRotate={false}
                    makeDefault
                />
            </Canvas>
        </div>
    );
}
