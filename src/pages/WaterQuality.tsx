import { useEffect, useMemo, useState } from 'react';
import { Droplet, Gauge, Thermometer, Wind } from 'lucide-react';
import { useSeabinStore } from '../store/seabinStore';
import type { Seabin } from '../types';

// ---------------------------------------------------------------------------
// Simulated live sensor readings (jitter ±2% every 3 s per seabin)
// ---------------------------------------------------------------------------
type Reading = {
    ph: number;
    turbidity: number;
    do_mgl: number;
    temp_c: number;
};

type HistorySeries = Array<Reading & { ts: number }>;

function baseReading(sb: Seabin): Reading {
    return {
        ph: sb.ph,
        turbidity: sb.turbidity,
        // Dissolved oxygen: healthy = 6-8 mg/L, degrades with turbidity
        do_mgl: parseFloat(
            Math.max(1.5, 8.2 - sb.turbidity * 0.055).toFixed(2),
        ),
        // Sea surface temp: Port Klang range ~28–32 °C
        temp_c: parseFloat((29.5 + Math.random() * 2.5).toFixed(1)),
    };
}

function jitter(v: number, pct = 0.015): number {
    return parseFloat((v + v * (Math.random() * 2 - 1) * pct).toFixed(2));
}

// ---------------------------------------------------------------------------
// Gauge helpers
// ---------------------------------------------------------------------------
function phStatus(ph: number): { label: string; color: string; bg: string } {
    if (ph >= 7.0 && ph <= 8.5)
        return { label: 'Normal', color: 'text-teal-700', bg: 'bg-teal-500' };
    if (ph >= 6.5)
        return {
            label: 'Slightly acidic',
            color: 'text-amber-700',
            bg: 'bg-amber-500',
        };
    return { label: 'Acidic – alert', color: 'text-red-700', bg: 'bg-red-500' };
}
function turbidityStatus(t: number): {
    label: string;
    color: string;
    bg: string;
} {
    if (t <= 25)
        return { label: 'Clear', color: 'text-teal-700', bg: 'bg-teal-500' };
    if (t <= 60)
        return {
            label: 'Moderate',
            color: 'text-amber-700',
            bg: 'bg-amber-500',
        };
    return { label: 'Turbid – alert', color: 'text-red-700', bg: 'bg-red-500' };
}
function doStatus(d: number): { label: string; color: string; bg: string } {
    if (d >= 6)
        return { label: 'Good', color: 'text-teal-700', bg: 'bg-teal-500' };
    if (d >= 3)
        return { label: 'Low', color: 'text-amber-700', bg: 'bg-amber-500' };
    return {
        label: 'Hypoxic – alert',
        color: 'text-red-700',
        bg: 'bg-red-500',
    };
}
function tempStatus(t: number): { label: string; color: string; bg: string } {
    if (t <= 30)
        return { label: 'Normal', color: 'text-teal-700', bg: 'bg-teal-500' };
    if (t <= 31.5)
        return { label: 'Warm', color: 'text-amber-700', bg: 'bg-amber-500' };
    return { label: 'High', color: 'text-orange-700', bg: 'bg-orange-500' };
}

// ---------------------------------------------------------------------------
// Sparkline (last 20 readings stored per seabin/metric)
// ---------------------------------------------------------------------------
function Sparkline({ values, color }: { values: number[]; color: string }) {
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const w = 80;
    const h = 28;
    const pts = values
        .map((v, i) => {
            const x = (i / (values.length - 1)) * w;
            const y = h - ((v - min) / range) * h;
            return `${x},${y}`;
        })
        .join(' ');
    return (
        <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            className='shrink-0 overflow-visible'
        >
            <polyline
                points={pts}
                fill='none'
                stroke={color}
                strokeWidth='1.8'
                strokeLinejoin='round'
                strokeLinecap='round'
            />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Single metric tile
// ---------------------------------------------------------------------------
function MetricTile({
    label,
    value,
    unit,
    sparkValues,
    sparkColor,
    status,
    icon,
    range,
    normalRange,
}: {
    label: string;
    value: number;
    unit: string;
    sparkValues: number[];
    sparkColor: string;
    status: { label: string; color: string; bg: string };
    icon: React.ReactNode;
    range: [number, number];
    normalRange: string;
}) {
    const pct = Math.min(
        100,
        Math.max(0, ((value - range[0]) / (range[1] - range[0])) * 100),
    );
    return (
        <div className='flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                    {icon}
                    {label}
                </div>
                <span
                    className={`rounded-full px-2 py-0.5 text-[0.68rem] font-medium ring-1 ring-current ${status.color}`}
                >
                    {status.label}
                </span>
            </div>
            <div className='flex items-end justify-between gap-2'>
                <div>
                    <span className='text-[2.2rem] font-semibold leading-none tabular-nums tracking-tight text-slate-900'>
                        {value}
                    </span>
                    <span className='ml-1 text-sm font-medium text-slate-500'>
                        {unit}
                    </span>
                </div>
                <Sparkline values={sparkValues} color={sparkColor} />
            </div>
            <div>
                <div className='flex items-center justify-between text-[0.65rem] text-slate-400'>
                    <span>
                        {range[0]}
                        {unit}
                    </span>
                    <span className='text-slate-500'>
                        Normal: {normalRange}
                    </span>
                    <span>
                        {range[1]}
                        {unit}
                    </span>
                </div>
                <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100'>
                    <div
                        className={`h-full rounded-full transition-[width] duration-700 ${status.bg}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function WaterQuality() {
    const seabins = useSeabinStore((s) => s.seabins);
    const [selected, setSelected] = useState<string>('all');
    const [history, setHistory] = useState<Record<string, HistorySeries>>({});

    // Sync series to fleet + jitter on an interval. Initial sync is deferred (microtask)
    // so we avoid synchronous setState in the effect body (react-hooks/set-state-in-effect).
    useEffect(() => {
        let cancelled = false;

        function syncFromFleet(prev: Record<string, HistorySeries>) {
            const next: Record<string, HistorySeries> = {};
            for (const sb of seabins) {
                if (prev[sb.id]) {
                    next[sb.id] = prev[sb.id];
                } else {
                    next[sb.id] = Array.from({ length: 20 }, () => ({
                        ...baseReading(sb),
                        ts: Date.now(),
                    }));
                }
            }
            return next;
        }

        queueMicrotask(() => {
            if (!cancelled) {
                setHistory((prev) => syncFromFleet(prev));
            }
        });

        const id = window.setInterval(() => {
            if (cancelled) return;
            setHistory((prev) => {
                const next = { ...syncFromFleet(prev) };
                for (const sb of seabins) {
                    const last = next[sb.id]?.at(-1) ?? baseReading(sb);
                    next[sb.id] = [
                        ...(next[sb.id] ?? []).slice(-19),
                        {
                            ph: jitter(last.ph, 0.008),
                            turbidity: jitter(last.turbidity, 0.012),
                            do_mgl: jitter(last.do_mgl, 0.01),
                            temp_c: jitter(last.temp_c, 0.005),
                            ts: Date.now(),
                        },
                    ];
                }
                return next;
            });
        }, 3000);

        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [seabins]);

    const displaySeabins = useMemo(
        () =>
            selected === 'all'
                ? seabins
                : seabins.filter((sb) => sb.id === selected),
        [seabins, selected],
    );

    const avgReading: Reading = useMemo(() => {
        const vals = seabins.map(
            (sb) => history[sb.id]?.at(-1) ?? baseReading(sb),
        );
        return {
            ph: parseFloat(
                (vals.reduce((a, v) => a + v.ph, 0) / vals.length).toFixed(2),
            ),
            turbidity: parseFloat(
                (
                    vals.reduce((a, v) => a + v.turbidity, 0) / vals.length
                ).toFixed(1),
            ),
            do_mgl: parseFloat(
                (vals.reduce((a, v) => a + v.do_mgl, 0) / vals.length).toFixed(
                    2,
                ),
            ),
            temp_c: parseFloat(
                (vals.reduce((a, v) => a + v.temp_c, 0) / vals.length).toFixed(
                    1,
                ),
            ),
        };
    }, [seabins, history]);

    return (
        <div className='flex flex-col gap-6 p-6 lg:p-8'>
            <header className='flex flex-wrap items-end justify-between gap-4'>
                <div>
                    <div className='text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-teal-700/80'>
                        Sensors
                    </div>
                    <h1 className='mt-1 text-[1.75rem] font-semibold tracking-tight text-slate-900'>
                        Water quality monitor
                    </h1>
                    <p className='mt-1 text-sm text-slate-500'>
                        Live pH, turbidity, dissolved oxygen and temperature —
                        updated every 3 s.
                    </p>
                </div>
                <div className='flex items-center gap-2 text-[0.72rem] text-slate-500'>
                    <span className='relative flex h-1.5 w-1.5'>
                        <span className='absolute inset-0 rounded-full bg-teal-500' />
                        <span className='absolute inset-0 animate-ping rounded-full bg-teal-500/70' />
                    </span>
                    Live · refreshes every 3 s
                </div>
            </header>

            {/* Fleet averages */}
            <section>
                <div className='mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                    Fleet average — all {seabins.length} seabins
                </div>
                <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
                    <MetricTile
                        label='pH'
                        value={avgReading.ph}
                        unit=''
                        sparkValues={seabins.map(
                            (sb) => history[sb.id]?.at(-1)?.ph ?? sb.ph,
                        )}
                        sparkColor='#0d9488'
                        status={phStatus(avgReading.ph)}
                        icon={<Droplet size={12} />}
                        range={[5, 9]}
                        normalRange='7.0 – 8.5'
                    />
                    <MetricTile
                        label='Turbidity'
                        value={avgReading.turbidity}
                        unit=' NTU'
                        sparkValues={seabins.map(
                            (sb) =>
                                history[sb.id]?.at(-1)?.turbidity ??
                                sb.turbidity,
                        )}
                        sparkColor='#f59e0b'
                        status={turbidityStatus(avgReading.turbidity)}
                        icon={<Gauge size={12} />}
                        range={[0, 100]}
                        normalRange='< 25 NTU'
                    />
                    <MetricTile
                        label='Dissolved O₂'
                        value={avgReading.do_mgl}
                        unit=' mg/L'
                        sparkValues={seabins.map(
                            (sb) => history[sb.id]?.at(-1)?.do_mgl ?? 5,
                        )}
                        sparkColor='#3b82f6'
                        status={doStatus(avgReading.do_mgl)}
                        icon={<Wind size={12} />}
                        range={[0, 10]}
                        normalRange='≥ 6 mg/L'
                    />
                    <MetricTile
                        label='Temperature'
                        value={avgReading.temp_c}
                        unit=' °C'
                        sparkValues={seabins.map(
                            (sb) =>
                                history[sb.id]?.at(-1)?.temp_c ?? 30,
                        )}
                        sparkColor='#f97316'
                        status={tempStatus(avgReading.temp_c)}
                        icon={<Thermometer size={12} />}
                        range={[26, 34]}
                        normalRange='28 – 30 °C'
                    />
                </div>
            </section>

            {/* Per-seabin filter */}
            <section>
                <div className='mb-3 flex flex-wrap items-center gap-2'>
                    <div className='text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                        Per-seabin readings
                    </div>
                    <div className='ml-auto flex flex-wrap items-center gap-1.5 rounded-full bg-white p-1 ring-1 ring-slate-200/80'>
                        <FilterBtn
                            id='all'
                            label='All'
                            selected={selected}
                            onClick={setSelected}
                        />
                        {seabins.map((sb) => (
                            <FilterBtn
                                key={sb.id}
                                id={sb.id}
                                label={sb.id}
                                selected={selected}
                                onClick={setSelected}
                            />
                        ))}
                    </div>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                    {displaySeabins.map((sb) => {
                        const hist = history[sb.id] ?? [];
                        const r: Reading = hist.at(-1) ?? baseReading(sb);
                        return (
                            <div
                                key={sb.id}
                                className='rounded-2xl border border-slate-200/80 bg-white p-5'
                            >
                                <div className='mb-4 flex items-center justify-between'>
                                    <div>
                                        <div className='text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400'>
                                            {sb.id}
                                        </div>
                                        <div className='text-sm font-semibold text-slate-800'>
                                            {sb.area}
                                        </div>
                                    </div>
                                    <span
                                        className={`inline-flex h-2 w-2 rounded-full ${
                                            sb.status === 'active'
                                                ? 'bg-teal-500'
                                                : sb.status === 'paused'
                                                  ? 'bg-amber-400'
                                                  : 'bg-slate-400'
                                        }`}
                                    />
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    <MiniStat
                                        label='pH'
                                        value={r.ph.toString()}
                                        status={phStatus(r.ph)}
                                        sparkline={hist.map((h) => h.ph)}
                                        sparkColor='#0d9488'
                                    />
                                    <MiniStat
                                        label='Turbidity'
                                        value={`${r.turbidity} NTU`}
                                        status={turbidityStatus(r.turbidity)}
                                        sparkline={hist.map((h) => h.turbidity)}
                                        sparkColor='#f59e0b'
                                    />
                                    <MiniStat
                                        label='DO'
                                        value={`${r.do_mgl} mg/L`}
                                        status={doStatus(r.do_mgl)}
                                        sparkline={hist.map((h) => h.do_mgl)}
                                        sparkColor='#3b82f6'
                                    />
                                    <MiniStat
                                        label='Temp'
                                        value={`${r.temp_c} °C`}
                                        status={tempStatus(r.temp_c)}
                                        sparkline={hist.map((h) => h.temp_c)}
                                        sparkColor='#f97316'
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

function FilterBtn({
    id,
    label,
    selected,
    onClick,
}: {
    id: string;
    label: string;
    selected: string;
    onClick: (id: string) => void;
}) {
    return (
        <button
            type='button'
            onClick={() => onClick(id)}
            className={`rounded-full px-3 py-1.5 text-[0.78rem] font-medium transition-colors ${
                selected === id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
            }`}
        >
            {label}
        </button>
    );
}

function MiniStat({
    label,
    value,
    status,
    sparkline,
    sparkColor,
}: {
    label: string;
    value: string;
    status: { label: string; color: string };
    sparkline: number[];
    sparkColor: string;
}) {
    return (
        <div className='flex flex-col gap-1 rounded-xl bg-slate-50 p-3'>
            <div className='flex items-center justify-between'>
                <span className='text-[0.62rem] font-semibold uppercase tracking-wider text-slate-500'>
                    {label}
                </span>
                <Sparkline values={sparkline.slice(-12)} color={sparkColor} />
            </div>
            <div className='text-sm font-semibold tabular-nums text-slate-800'>
                {value}
            </div>
            <div className={`text-[0.65rem] font-medium ${status.color}`}>
                {status.label}
            </div>
        </div>
    );
}
