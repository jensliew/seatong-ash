import { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    Float,
    MeshTransmissionMaterial,
} from '@react-three/drei';
import * as THREE from 'three';
import { Box, Eye, ChevronDown, ChevronUp, Info } from 'lucide-react';
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

function clamp01(v: number): number {
    return Math.min(1, Math.max(0, v));
}

function formatDuration(minutes: number): string {
    if (!Number.isFinite(minutes) || minutes <= 0) return 'now';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h <= 0) return `${m}m`;
    if (m <= 0) return `${h}h`;
    return `${h}h ${m}m`;
}

function formatHoursSince(ts: number): string {
    const hours = Math.max(0, Math.round((Date.now() - ts) / (1000 * 60 * 60)));
    return `${hours}h ago`;
}

function scenarioAnomalyReason(seabin: Seabin, scenario: StreamScenario): string {
    if (scenario === 'heavy_pollution') {
        if (seabin.capacity >= 90) return 'Near-full bin + surge debris';
        if (seabin.turbidity >= 88) return 'Extreme turbidity + debris surge';
        return 'Critical contamination signal';
    }
    if (scenario === 'ph_deadfish') {
        if (seabin.dead_fish_today >= 2 && seabin.ph < 6.95)
            return 'Low pH + fish mortality trend';
        if (seabin.ph < 6.95) return 'Acidic pH drift';
        return 'Fish mortality anomaly';
    }
    if (scenario === 'fish_haven') return 'Pause mode for marine life safety';
    return 'No active anomaly';
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
            <pointLight
                position={[-2, 0.5, -1]}
                intensity={0.35 * sv.ambientMul}
                color='#a8d8ea'
            />
            <pointLight
                position={[2.2, 0.8, 1.5]}
                intensity={0.25}
                color={pal.glow}
            />
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
    /** Stream narrative; defaults from seabin id (same as live preview). */
    scenario?: StreamScenario;
}

export default function Seabin3D({
    seabin,
    compact = false,
    scenario: scenarioProp,
}: Props) {
    const pal = STATUS_PALETTE[seabin.status];
    const scenario = scenarioProp ?? streamScenarioForSeabin(seabin);
    const meta = SCENARIO_META[scenario];
    const sv = SCENARIO_VISUAL[scenario];
    const [viewMode, setViewMode] = useState<ViewMode>('exterior');
    const [showDetails, setShowDetails] = useState(false);
    const seed = idHashSeed(seabin.id);

    const insights = useMemo(() => {
        const rateMulByScenario: Record<StreamScenario, number> = {
            default: 1,
            heavy_pollution: 1.34,
            ph_deadfish: 0.86,
            fish_haven: 0.4,
        };
        const baseRate = 3.1 + seabin.debris_intensity * 7.9;
        const captureRateKgHr =
            seabin.status === 'inactive'
                ? 0
                : baseRate *
                  rateMulByScenario[scenario] *
                  (0.72 + seabin.health_score / 220);
        const remainingPct = Math.max(0, 100 - seabin.capacity);
        const fillPctPerHour = Math.max(
            0.5,
            captureRateKgHr * (0.85 + seabin.debris_intensity * 0.6),
        );
        const etaMinutes =
            seabin.status === 'active'
                ? (remainingPct / fillPctPerHour) * 60
                : Number.POSITIVE_INFINITY;

        // Simulated service stamps: deterministic per unit, refreshed by current time.
        const now = Date.now();
        const lookbackH = 2 + Math.floor(hash01(seed + 13) * 16);
        const lastServiceTs = now - lookbackH * 60 * 60 * 1000;
        const nextServiceMinutes =
            seabin.status === 'inactive'
                ? Number.POSITIVE_INFINITY
                : Math.min(
                      etaMinutes,
                      Math.max(30, (100 - seabin.health_score) * 6),
                  );

        const inletPh = 6.75 + hash01(seed + 29) * 0.65;
        const outletPh = Math.min(
            7.55,
            seabin.ph + (scenario === 'ph_deadfish' ? 0.08 : 0.22),
        );
        const phDelta = outletPh - inletPh;

        const inletTurbidity = Math.min(
            98,
            seabin.turbidity + 8 + Math.round(hash01(seed + 31) * 10),
        );
        const turbidityDrop = Math.max(
            2,
            Math.round(
                inletTurbidity *
                    (0.09 +
                        seabin.debris_intensity * 0.11 +
                        (scenario === 'heavy_pollution' ? 0.06 : 0)),
            ),
        );
        const outletTurbidity = Math.max(0, inletTurbidity - turbidityDrop);
        const turbidityDeltaPct =
            inletTurbidity > 0
                ? ((inletTurbidity - outletTurbidity) / inletTurbidity) * 100
                : 0;

        const confidence = Math.round(
            clamp01(
                seabin.health_score / 100 -
                    (scenario === 'heavy_pollution' ? 0.08 : 0) -
                    (seabin.status === 'inactive' ? 0.2 : 0),
            ) * 100,
        );
        const fleetBaseRate = 6.1;
        const captureDeltaVsFleet =
            fleetBaseRate > 0
                ? ((captureRateKgHr - fleetBaseRate) / fleetBaseRate) * 100
                : 0;
        const fleetEtaMinutes = 360;
        const etaDeltaVsFleet =
            Number.isFinite(etaMinutes) && fleetEtaMinutes > 0
                ? ((etaMinutes - fleetEtaMinutes) / fleetEtaMinutes) * 100
                : 0;

        return {
            captureRateKgHr,
            etaMinutes,
            lastServiceTs,
            nextServiceMinutes,
            phDelta,
            turbidityDeltaPct,
            anomalyReason: scenarioAnomalyReason(seabin, scenario),
            confidence,
            captureDeltaVsFleet,
            etaDeltaVsFleet,
        };
    }, [scenario, seabin, seed]);

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

    return (
        <div className='relative flex h-full min-h-96 w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-b from-sky-50/60 to-teal-50/60'>
            {/* Top-left: minimal live + scenario tag */}
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

            {/* Top-right: view mode badge */}
            <div className='pointer-events-none absolute right-4 top-4 z-10'>
                <span
                    className='inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide shadow-sm ring-1 backdrop-blur'
                    style={{
                        background:
                            viewMode === 'cutaway'
                                ? 'rgba(14,165,233,0.12)'
                                : 'rgba(255,255,255,0.8)',
                        color: viewMode === 'cutaway' ? '#0369a1' : '#475569',
                        borderColor: 'transparent',
                    }}
                >
                    {viewMode === 'cutaway' ? 'Cutaway view' : 'Exterior view'}
                </span>
            </div>

            {/* Bottom-right: icon control dock */}
            <div className='absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-white/85 p-1 shadow-md ring-1 ring-slate-200 backdrop-blur'>
                <button
                    type='button'
                    onClick={() =>
                        setViewMode((v) =>
                            v === 'exterior' ? 'cutaway' : 'exterior',
                        )
                    }
                    title={
                        viewMode === 'exterior'
                            ? 'Show cutaway (see inside)'
                            : 'Show exterior'
                    }
                    aria-label='Toggle cutaway view'
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition ${
                        viewMode === 'cutaway'
                            ? 'bg-sky-100 text-sky-700'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    {viewMode === 'cutaway' ? (
                        <Box size={14} />
                    ) : (
                        <Eye size={14} />
                    )}
                </button>
            </div>

            {/* Bottom-left: tiny status pill (context without clutter) */}
            <div className='pointer-events-none absolute bottom-3 left-4 z-10'>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2 py-0.5 text-[0.6rem] font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur'>
                    <span
                        className='h-1.5 w-1.5 rounded-full'
                        style={{ background: pal.led }}
                    />
                    {seabin.capacity}% full · {seabin.contamination_risk}{' '}
                    risk
                </span>
            </div>
            {/* Useful live ops chips */}
            <div className='absolute left-4 top-22 z-10 max-w-[20rem]'>
                <div className='mb-1 flex items-center gap-1.5 sm:hidden'>
                    <button
                        type='button'
                        onClick={() => setShowDetails((v) => !v)}
                        className='pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur'
                        aria-expanded={showDetails}
                        aria-label='Toggle details chips'
                    >
                        details {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <span className='inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[0.58rem] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur'>
                        <Info size={11} /> tap chips for hints
                    </span>
                </div>
                <div
                    className={`grid grid-cols-1 gap-1.5 transition-all sm:grid-cols-2 ${
                        showDetails ? 'max-h-80 opacity-100' : 'max-h-14 overflow-hidden sm:max-h-80 sm:opacity-100 opacity-95'
                    }`}
                >
                    <span
                        title='Estimated time to reach full capacity using current capture/load rate.'
                        className='inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[0.6rem] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white'
                    >
                        ETA full: {formatDuration(insights.etaMinutes)} ·{' '}
                        {insights.etaDeltaVsFleet >= 0 ? '+' : ''}
                        {Math.round(insights.etaDeltaVsFleet)}% vs fleet
                    </span>
                    <span
                        title='Live estimated debris collection throughput.'
                        className='inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[0.6rem] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white'
                    >
                        Capture: {insights.captureRateKgHr.toFixed(1)} kg/h ·{' '}
                        {insights.captureDeltaVsFleet >= 0 ? '+' : ''}
                        {Math.round(insights.captureDeltaVsFleet)}% vs fleet
                    </span>
                    <span
                        title='Outlet pH minus inlet pH (positive means improved neutrality).'
                        className='inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[0.6rem] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white'
                    >
                        pH delta: {insights.phDelta >= 0 ? '+' : ''}
                        {insights.phDelta.toFixed(2)}
                    </span>
                    <span
                        title='Estimated turbidity reduction through intake cycle.'
                        className='inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[0.6rem] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white'
                    >
                        Turbidity: -{Math.round(insights.turbidityDeltaPct)}%
                    </span>
                    <span
                        title='Deterministic simulated timestamp of last emptying cycle.'
                        className='inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[0.6rem] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white'
                    >
                        Last service: {formatHoursSince(insights.lastServiceTs)}
                    </span>
                    <span
                        title='Recommended next service based on fill ETA and health score.'
                        className='inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[0.6rem] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white'
                    >
                        Next service: {formatDuration(insights.nextServiceMinutes)}
                    </span>
                    <span
                        title='Sensor trust score adjusted by scenario stress and device state.'
                        className='inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-medium shadow-sm ring-1 backdrop-blur col-span-1 sm:col-span-2 transition'
                        style={{
                            background:
                                insights.confidence >= 80
                                    ? 'rgba(16,185,129,0.12)'
                                    : insights.confidence >= 60
                                      ? 'rgba(245,158,11,0.12)'
                                      : 'rgba(239,68,68,0.12)',
                            color:
                                insights.confidence >= 80
                                    ? '#065f46'
                                    : insights.confidence >= 60
                                      ? '#92400e'
                                      : '#991b1b',
                            borderColor: 'transparent',
                        }}
                    >
                        Sensor confidence {insights.confidence}% ·{' '}
                        {insights.anomalyReason}
                    </span>
                </div>
            </div>

            <Canvas
                camera={{ position: [0, 1.2, 3.0], fov: 42 }}
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
