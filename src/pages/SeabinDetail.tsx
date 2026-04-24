import { lazy, Suspense, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    WifiOff,
    Pause,
    Play,
    Video,
    Box as BoxIcon,
    Gauge,
    Fish,
    Droplets,
    FlaskConical,
    AlertTriangle,
    Activity,
    MapPin,
    Eye,
    Brain,
} from 'lucide-react';
import { useSeabinStore } from '../store/seabinStore';
import { aiInsights, detectionLogs } from '../data/detections';
import SimulatedStream from '../components/seabin/SimulatedStream';
import ImageUploadTest from '../components/seabin/ImageUploadTest';
import SeabinAlerts from '../components/seabin/SeabinAlerts';
import RiverHealthCard from '../components/dashboard/RiverHealthCard';
import ContaminationRiskCard from '../components/dashboard/ContaminationRiskCard';
import AccuracyMetrics from '../components/insights/AccuracyMetrics';
import DetectionLogTable from '../components/insights/DetectionLogTable';
import PredictionPanel from '../components/insights/PredictionPanel';
import SensorTrendSparklines from '../components/seabin/SensorTrendSparklines';
import CollectionRateAreaChart from '../components/insights/CollectionRateAreaChart';
import { streamScenarioForSeabin, SCENARIO_META } from '../lib/streamScenario';

const Seabin3D = lazy(() => import('../components/seabin/Seabin3D'));

/* ─── Style maps ─────────────────────────────────────────────────────────── */
const STATUS_CFG = {
    active: {
        color: 'text-teal-700',
        bg: 'bg-teal-50 border-teal-200',
        dot: 'bg-teal-500',
        label: 'Active',
    },
    paused: {
        color: 'text-yellow-700',
        bg: 'bg-yellow-50 border-yellow-200',
        dot: 'bg-yellow-400',
        label: 'Paused',
    },
    inactive: {
        color: 'text-slate-500',
        bg: 'bg-slate-100 border-slate-200',
        dot: 'bg-slate-400',
        label: 'Inactive',
    },
} as const;

const RISK_CFG = {
    low: { color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', label: 'Low' },
    medium: { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', label: 'Medium' },
    high: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', label: 'High' },
    critical: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Critical' },
} as const;

const SCENARIO_BADGE = {
    default: 'bg-teal-50 text-teal-700 border-teal-200',
    ph_deadfish: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    fish_haven: 'bg-green-50 text-green-700 border-green-200',
    heavy_pollution: 'bg-red-50 text-red-700 border-red-200',
} as const;

function phStatus(ph: number) {
    if (ph >= 6.5 && ph <= 8.0) return { color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' };
    if (ph < 6.0 || ph > 8.5) return { color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
    return { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' };
}
function turbidityStatus(ntu: number) {
    if (ntu <= 40) return { color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' };
    if (ntu > 70) return { color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
    return { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' };
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function SeabinDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const seabins = useSeabinStore((s) => s.seabins);
    const toggleStatus = useSeabinStore((s) => s.toggleStatus);
    const seabin = seabins.find((sb) => sb.id === id);
    const [, setUploadDone] = useState(false);
    const [viewTab, setViewTab] = useState<'3d' | 'stream'>('3d');

    if (!seabin) {
        return (
            <div className='p-6 text-slate-400'>
                Seabin not found.{' '}
                <button onClick={() => navigate('/')} className='text-teal-500 underline'>
                    Go back
                </button>
            </div>
        );
    }

    const isTestSeabin = seabin.id === 'SB-002';
    const isInactive = seabin.status === 'inactive';
    const insight = aiInsights.find((i) => i.seabin_id === seabin.id);
    const logs = detectionLogs.filter((l) => l.seabin_id === seabin.id);
    const scenario = streamScenarioForSeabin(seabin);
    const scenarioMeta = SCENARIO_META[scenario];
    const statusCfg = STATUS_CFG[seabin.status];
    const riskCfg = RISK_CFG[seabin.contamination_risk];
    const phCfg = phStatus(seabin.ph);
    const turbCfg = turbidityStatus(seabin.turbidity);

    return (
        <div className='flex flex-col gap-4 p-4 md:p-6'>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className='flex items-center gap-3'>
                <button
                    onClick={() => navigate('/')}
                    className='shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors'
                >
                    <ArrowLeft size={18} />
                </button>
                <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2'>
                    <h1 className='text-lg font-bold text-slate-800 truncate'>{seabin.name}</h1>
                    {/* Status — one pill */}
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} ${seabin.status === 'active' ? 'animate-pulse' : ''}`} />
                        {statusCfg.label}
                    </span>
                    {/* Scenario — one pill */}
                    {!isInactive && (
                        <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${SCENARIO_BADGE[scenario]}`}>
                            {scenarioMeta.title}
                        </span>
                    )}
                    {isTestSeabin && (
                        <span className='shrink-0 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700'>
                            AI Test Mode
                        </span>
                    )}
                </div>
                <div className='flex shrink-0 items-center gap-1.5 text-xs text-slate-400'>
                    <MapPin size={12} />
                    <span className='hidden sm:inline'>{seabin.area} ·</span>
                    <span className='font-mono'>{seabin.lat.toFixed(3)}, {seabin.lng.toFixed(3)}</span>
                </div>
            </div>

            {/* ── Offline banner ────────────────────────────────────────── */}
            {isInactive && (
                <div className='flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4'>
                    <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200'>
                        <WifiOff size={18} className='text-slate-400' />
                    </div>
                    <div>
                        <div className='text-sm font-semibold text-slate-600'>Seabin offline</div>
                        <div className='mt-0.5 text-xs text-slate-400'>
                            No live stream, AI detection, or debris collection is active.
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main viewer hero ──────────────────────────────────────── */}
            <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
                {/* Toolbar — no duplicate status/scenario, those are in the header */}
                <div className='flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5'>
                    {/* Tab switcher */}
                    <div className='flex rounded-lg bg-slate-100 p-0.5 gap-0.5'>
                        <button
                            onClick={() => setViewTab('3d')}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                                viewTab === '3d'
                                    ? 'bg-white text-sky-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <BoxIcon size={12} />
                            3D Model
                        </button>
                        <button
                            onClick={() => setViewTab('stream')}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                                viewTab === 'stream'
                                    ? 'bg-white text-teal-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Video size={12} />
                            AI Stream
                        </button>
                    </div>

                    {/* Scenario subtitle — the only context info here */}
                    {!isInactive && (
                        <span className='min-w-0 truncate text-[0.68rem] italic text-slate-400 hidden md:block flex-1'>
                            {scenarioMeta.subtitle}
                        </span>
                    )}

                    {/* Right: LIVE + Pause/Resume */}
                    <div className='flex shrink-0 items-center gap-2 ml-auto'>
                        {!isInactive && (
                            <span className='flex items-center gap-1 text-xs font-semibold text-red-500'>
                                <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-red-500' />
                                LIVE
                            </span>
                        )}
                        {seabin.status !== 'inactive' && (
                            <button
                                onClick={() => toggleStatus(seabin.id)}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    seabin.status === 'active'
                                        ? 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                        : 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'
                                }`}
                            >
                                {seabin.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                                {seabin.status === 'active' ? 'Pause' : 'Resume'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Viewer — fixed height */}
                <div style={{ height: 540 }} className='relative'>
                    {isInactive ? (
                        <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 text-center'>
                            <WifiOff size={40} className='text-slate-300' />
                            <div className='text-sm font-semibold text-slate-400'>Stream unavailable</div>
                            <div className='text-xs text-slate-300'>Seabin is offline</div>
                        </div>
                    ) : isTestSeabin ? (
                        <div className='absolute inset-0 p-4'>
                            <ImageUploadTest onDetectionComplete={() => setUploadDone(true)} />
                        </div>
                    ) : viewTab === '3d' ? (
                        <Suspense
                            fallback={
                                <div className='absolute inset-0 flex items-center justify-center text-sm text-slate-400'>
                                    Loading 3D model…
                                </div>
                            }
                        >
                            <div className='absolute inset-0'>
                                <Seabin3D seabin={seabin} scenario={scenario} embedded />
                            </div>
                        </Suspense>
                    ) : (
                        <div className='absolute inset-0 flex flex-col p-3'>
                            <SimulatedStream seabinId={seabin.id} scenario={scenario} bare />
                        </div>
                    )}
                </div>

                {/* 3D legend — only shown when 3D tab is active */}
                {!isInactive && viewTab === '3d' && (
                    <div className='border-t border-slate-100 bg-slate-50/60 px-4 py-3'>
                        <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
                            <span className='text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400'>
                                What you see
                            </span>
                            <LegendItem color='#0d9488' label='Floating collar — keeps bin at water surface' />
                            <LegendItem color='#0f766e' label='Basket body — collects debris via water intake' />
                            <LegendItem color='#f59e0b' label='Pump unit — draws water through the filter' />
                            <LegendItem color='#2dd4bf' label='Status LED — blinks with pump activity' />
                            <LegendItem color='#a3e635' label='Debris fill — shows collected waste level' />
                            <span className='ml-auto flex items-center gap-1.5 text-[0.65rem] text-slate-400'>
                                <Eye size={11} />
                                Use the button at the bottom of the model to toggle cutaway view
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Stat strip ────────────────────────────────────────────── */}
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
                <StatTile
                    icon={<Gauge size={13} />}
                    label='Bin capacity'
                    value={`${seabin.capacity}%`}
                    sub={
                        seabin.capacity >= 90 ? 'Near full'
                        : seabin.capacity >= 75 ? 'High'
                        : seabin.capacity >= 50 ? 'Moderate'
                        : 'Normal'
                    }
                    cfg={
                        seabin.capacity >= 95
                            ? { color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
                            : seabin.capacity >= 75
                              ? { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' }
                              : seabin.capacity >= 50
                                ? { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' }
                                : { color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' }
                    }
                />
                <StatTile
                    icon={<AlertTriangle size={13} />}
                    label='Risk level'
                    value={riskCfg.label}
                    cfg={riskCfg}
                />
                <StatTile
                    icon={<FlaskConical size={13} />}
                    label='pH level'
                    value={seabin.ph.toFixed(1)}
                    sub={seabin.ph < 6.5 ? 'Acidic ⚠' : seabin.ph > 8.0 ? 'Alkaline ⚠' : 'Normal'}
                    cfg={phCfg}
                />
                <StatTile
                    icon={<Droplets size={13} />}
                    label='Turbidity'
                    value={`${seabin.turbidity} NTU`}
                    sub={seabin.turbidity > 70 ? 'High ⚠' : seabin.turbidity > 40 ? 'Elevated' : 'Clear'}
                    cfg={turbCfg}
                />
                <StatTile
                    icon={<Fish size={13} />}
                    label='Dead fish today'
                    value={String(seabin.dead_fish_today)}
                    cfg={
                        seabin.dead_fish_today >= 5
                            ? { color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
                            : seabin.dead_fish_today > 0
                              ? { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' }
                              : { color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' }
                    }
                />
                <StatTile
                    icon={<Activity size={13} />}
                    label='Debris intensity'
                    value={`${(seabin.debris_intensity * 100).toFixed(0)}%`}
                    cfg={
                        seabin.debris_intensity >= 0.85
                            ? { color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
                            : seabin.debris_intensity >= 0.6
                              ? { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' }
                              : { color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' }
                    }
                />
            </div>

            {/* ── Alerts ────────────────────────────────────────────────── */}
            <SeabinAlerts seabinId={seabin.id} />

            {/* ── Sensor trends (24h) ───────────────────────────────────── */}
            <SensorTrendSparklines
                seabinId={seabin.id}
                ph={seabin.ph}
                turbidity={seabin.turbidity}
            />

            {/* ── Collection rate ───────────────────────────────────────── */}
            <CollectionRateAreaChart
                seabinId={seabin.id}
                logs={logs}
                totalDetectionsHint={insight?.total_detections ?? 0}
            />

            {/* ── Contamination risk + River health ─────────────────────── */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <ContaminationRiskCard seabins={[seabin]} />
                <RiverHealthCard score={seabin.health_score} />
            </div>

            {/* ── AI Insights ───────────────────────────────────────────── */}
            {insight && (
                <>
                    <div className='flex items-center gap-3 border-t border-slate-200 pt-4'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-teal-50'>
                            <Brain size={15} className='text-teal-600' />
                        </div>
                        <div>
                            <h2 className='text-base font-bold text-slate-800'>AI Insights</h2>
                            <p className='text-xs text-slate-400'>
                                {isTestSeabin ? 'Results from AI vision model test' : 'Model performance & predictions for this unit'}
                            </p>
                        </div>
                    </div>
                    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                        <AccuracyMetrics insight={insight} />
                        <PredictionPanel predictions={insight.predictions} />
                    </div>
                    <DetectionLogTable logs={logs} />
                </>
            )}
        </div>
    );
}

/* ─── Stat tile ───────────────────────────────────────────────────────────── */
function StatTile({
    icon,
    label,
    value,
    sub,
    cfg,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    cfg: { color: string; bg: string };
}) {
    return (
        <div className={`rounded-xl border p-3 flex flex-col gap-1.5 ${cfg.bg}`}>
            <div className={`flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wide ${cfg.color}`}>
                {icon}
                {label}
            </div>
            <div className={`text-lg font-bold tabular-nums leading-none ${cfg.color}`}>{value}</div>
            {sub && <div className={`text-[0.62rem] font-medium opacity-80 ${cfg.color}`}>{sub}</div>}
        </div>
    );
}

/* ─── 3D legend colour dot + label ───────────────────────────────────────── */
function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <span className='flex items-center gap-1.5 text-[0.65rem] text-slate-500'>
            <span className='h-2.5 w-2.5 shrink-0 rounded-full' style={{ background: color }} />
            {label}
        </span>
    );
}
