import { lazy, Suspense, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { useSeabinStore } from '../store/seabinStore';
import { aiInsights, detectionLogs } from '../data/detections';
import SimulatedStream from '../components/seabin/SimulatedStream';
import ImageUploadTest from '../components/seabin/ImageUploadTest';
import SystemStatusCard from '../components/seabin/SystemStatusCard';
import QuickStats from '../components/seabin/QuickStats';
import SeabinAlerts from '../components/seabin/SeabinAlerts';
import RiverHealthCard from '../components/dashboard/RiverHealthCard';
import ContaminationRiskCard from '../components/dashboard/ContaminationRiskCard';
import AccuracyMetrics from '../components/insights/AccuracyMetrics';
import DetectionLogTable from '../components/insights/DetectionLogTable';
import PredictionPanel from '../components/insights/PredictionPanel';
import CapacityGauge from '../components/seabin/CapacityGauge';
import SensorTrendSparklines from '../components/seabin/SensorTrendSparklines';
import CollectionRateAreaChart from '../components/insights/CollectionRateAreaChart';
import { streamScenarioForSeabin } from '../lib/streamScenario';

const Seabin3D = lazy(() => import('../components/seabin/Seabin3D'));

export default function SeabinDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const seabins = useSeabinStore((s) => s.seabins);
    const seabin = seabins.find((sb) => sb.id === id);
    const [, setUploadDone] = useState(false);

    if (!seabin) {
        return (
            <div className='p-6 text-slate-400'>
                Seabin not found.{' '}
                <button
                    onClick={() => navigate('/')}
                    className='text-teal-500 underline'
                >
                    Go back
                </button>
            </div>
        );
    }

    const isTestSeabin = seabin.id === 'SB-002';
    const isInactive = seabin.status === 'inactive';
    const insight = aiInsights.find((i) => i.seabin_id === seabin.id);
    const logs = detectionLogs.filter((l) => l.seabin_id === seabin.id);

    // Same scenario as SimulatedStream (see streamScenario.ts)
    const scenario = streamScenarioForSeabin(seabin);

    return (
        <div className='p-6 flex flex-col gap-6'>
            {/* Header */}
            <div className='flex items-center gap-3'>
                <button
                    onClick={() => navigate('/')}
                    className='text-slate-400 hover:text-slate-600 transition-colors'
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className='text-xl font-bold text-slate-800'>
                        {seabin.name}
                    </h1>
                    <p className='text-slate-400 text-sm mt-0.5'>
                        {seabin.area} — {seabin.lat.toFixed(4)},{' '}
                        {seabin.lng.toFixed(4)}
                        {isTestSeabin && (
                            <span className='ml-2 text-teal-500 font-medium'>
                                • AI Test Mode
                            </span>
                        )}
                        {isInactive && (
                            <span className='ml-2 text-slate-400 font-medium'>
                                • Offline
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Inactive banner */}
            {isInactive && (
                <div className='bg-slate-100 border border-slate-200 rounded-xl p-5 flex items-center gap-4'>
                    <div className='w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0'>
                        <WifiOff size={20} className='text-slate-400' />
                    </div>
                    <div>
                        <div className='text-sm font-semibold text-slate-600'>
                            This seabin is currently offline
                        </div>
                        <div className='text-xs text-slate-400 mt-0.5'>
                            No live stream, AI detection, or debris collection
                            is active. The unit may be under maintenance or
                            powered off.
                        </div>
                    </div>
                </div>
            )}

            {/* Row 1: Stream + Quick Stats + System Status */}
            <div className='grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch'>
                <div className='lg:col-span-3 flex'>
                    {isInactive ? (
                        <div className='bg-white border border-slate-200 rounded-xl p-5 shadow-sm w-full flex flex-col'>
                            <div className='text-sm text-slate-400 mb-3'>
                                Live Stream
                            </div>
                            <div className='flex-1 bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-2'>
                                <WifiOff size={32} className='text-slate-300' />
                                <div className='text-sm text-slate-400'>
                                    Stream unavailable
                                </div>
                                <div className='text-xs text-slate-300'>
                                    Seabin is offline
                                </div>
                            </div>
                        </div>
                    ) : isTestSeabin ? (
                        <div className='w-full'>
                            <ImageUploadTest
                                onDetectionComplete={() => setUploadDone(true)}
                            />
                        </div>
                    ) : (
                        <div className='w-full'>
                            <SimulatedStream
                                seabinId={seabin.id}
                                scenario={scenario}
                            />
                        </div>
                    )}
                </div>
                <div className='lg:col-span-2 flex flex-col gap-4'>
                    <SystemStatusCard seabin={seabin} />
                    <div className='flex-1'>
                        <QuickStats seabin={seabin} />
                    </div>
                </div>
            </div>

            {/* Row 2: Alerts — full width */}
            <SeabinAlerts seabinId={seabin.id} />

            {/* Row 3: 3D preview + capacity gauge */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch'>
                <div className='lg:col-span-2' style={{ minHeight: 380 }}>
                    <Suspense
                        fallback={
                            <div className='flex h-full min-h-96 items-center justify-center rounded-2xl border border-slate-200/80 bg-linear-to-b from-sky-50/60 to-teal-50/60 text-sm text-slate-400'>
                                Loading 3D preview…
                            </div>
                        }
                    >
                        <Seabin3D seabin={seabin} scenario={scenario} />
                    </Suspense>
                </div>
                <div className='flex flex-col gap-4'>
                    {/* Capacity gauge card */}
                    <div className='flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm'>
                        <div className='self-start text-sm font-medium text-slate-700'>
                            Bin capacity
                        </div>
                        <CapacityGauge capacity={seabin.capacity} size={148} />
                    </div>
                    {/* Sensor quick-read */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm'>
                        <div className='mb-3 text-sm font-medium text-slate-700'>
                            Sensor readings
                        </div>
                        <div className='flex flex-col gap-2.5'>
                            <SensorBar
                                label='pH'
                                value={seabin.ph}
                                min={5}
                                max={9}
                                ideal={[6.5, 8.0]}
                                unit=''
                            />
                            <SensorBar
                                label='Turbidity'
                                value={seabin.turbidity}
                                min={0}
                                max={100}
                                ideal={[0, 40]}
                                unit=' NTU'
                            />
                            <SensorBar
                                label='Debris intensity'
                                value={seabin.debris_intensity * 100}
                                min={0}
                                max={100}
                                ideal={[0, 50]}
                                unit='%'
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 4: Contamination Risk + River Health */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <ContaminationRiskCard seabins={[seabin]} />
                <RiverHealthCard score={seabin.health_score} />
            </div>

            {/* Row 5: pH / turbidity sparklines */}
            <SensorTrendSparklines
                seabinId={seabin.id}
                ph={seabin.ph}
                turbidity={seabin.turbidity}
            />

            {/* Row 6: Collection rate (all units — uses logs + optional AI totals) */}
            <CollectionRateAreaChart
                seabinId={seabin.id}
                logs={logs}
                totalDetectionsHint={insight?.total_detections ?? 0}
            />

            {/* Row 7: AI Insights section */}
            {insight && (
                <>
                    <div className='border-t border-slate-200 pt-4'>
                        <h2 className='text-lg font-bold text-slate-800'>
                            AI Insights
                        </h2>
                        <p className='text-slate-400 text-sm mt-0.5'>
                            {isTestSeabin
                                ? 'Results from AI vision model test'
                                : 'Model performance & predictions'}
                        </p>
                    </div>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                        <AccuracyMetrics insight={insight} />
                        <PredictionPanel predictions={insight.predictions} />
                    </div>
                    <DetectionLogTable logs={logs} />
                </>
            )}
        </div>
    );
}

/* ─── Sensor bar ─────────────────────────────────────────────────────── */
function SensorBar({
    label,
    value,
    min,
    max,
    ideal,
    unit,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    ideal: [number, number];
    unit: string;
}) {
    const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    const inRange = value >= ideal[0] && value <= ideal[1];
    const barColor = inRange
        ? '#14b8a6'
        : value > ideal[1]
          ? '#f97316'
          : '#f59e0b';

    return (
        <div>
            <div className='mb-1 flex items-center justify-between'>
                <span className='text-[0.72rem] text-slate-500'>{label}</span>
                <span
                    className='text-[0.72rem] font-semibold tabular-nums'
                    style={{ color: barColor }}
                >
                    {typeof value === 'number' && !Number.isInteger(value)
                        ? value.toFixed(1)
                        : value}
                    {unit}
                </span>
            </div>
            <div className='h-1.5 overflow-hidden rounded-full bg-slate-100'>
                <div
                    className='h-full rounded-full transition-all duration-700'
                    style={{ width: `${pct}%`, background: barColor }}
                />
            </div>
        </div>
    );
}
