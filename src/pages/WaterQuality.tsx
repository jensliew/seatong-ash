import { useEffect, useMemo, useState } from 'react';
import { Droplet, Gauge } from 'lucide-react';
import { useSeabinStore } from '../store/seabinStore';
import type { Seabin } from '../types';

// ---------------------------------------------------------------------------
// Simulated live sensor readings (jitter ±2% every 3 s per seabin)
// ---------------------------------------------------------------------------
type Reading = {
    ph: number;
    turbidity: number;
};

type HistorySeries = Array<Reading & { ts: number }>;

function baseReading(sb: Seabin): Reading {
    return {
        ph: sb.ph,
        turbidity: sb.turbidity,
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
        <div className="h-7 w-20 max-w-full shrink-0 overflow-hidden" aria-hidden>
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${w} ${h}`}
                preserveAspectRatio="xMidYMid meet"
                className="block h-full w-full"
            >
                <polyline
                    points={pts}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </svg>
        </div>
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
        <div className="flex min-w-0 max-w-full flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
            <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {icon}
                    <span className="truncate">{label}</span>
                </div>
                <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium ring-1 ring-current sm:text-[0.68rem] ${status.color}`}
                >
                    {status.label}
                </span>
            </div>
            <div className="flex min-w-0 items-end justify-between gap-2">
                <div className="min-w-0">
                    <span className="text-[clamp(1.5rem,5vw,2.2rem)] font-semibold leading-none tabular-nums tracking-tight text-slate-900">
                        {value}
                    </span>
                    <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>
                </div>
                <Sparkline values={sparkValues} color={sparkColor} />
            </div>
            <div className="min-w-0">
                <div className="grid grid-cols-3 gap-1 text-[0.6rem] text-slate-400 sm:gap-2 sm:text-[0.65rem]">
                    <span className="tabular-nums sm:text-left">
                        {range[0]}
                        {unit}
                    </span>
                    <span className="min-w-0 truncate text-center text-slate-500" title={normalRange}>
                        Normal: {normalRange}
                    </span>
                    <span className="tabular-nums sm:text-right">
                        {range[1]}
                        {unit}
                    </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`h-full max-w-full rounded-full transition-[width] duration-700 ${status.bg}`}
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

    // Sync series from live seabin data + jitter on an interval. Initial sync is deferred (microtask)
    // so we avoid synchronous setState in the effect body (react-hooks/set-state-in-effect).
    useEffect(() => {
        let cancelled = false;

        function syncFromSeabins(prev: Record<string, HistorySeries>) {
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
                setHistory((prev) => syncFromSeabins(prev));
            }
        });

        const id = window.setInterval(() => {
            if (cancelled) return;
            setHistory((prev) => {
                const next = { ...syncFromSeabins(prev) };
                for (const sb of seabins) {
                    const last = next[sb.id]?.at(-1) ?? baseReading(sb);
                    next[sb.id] = [
                        ...(next[sb.id] ?? []).slice(-19),
                        {
                            ph: jitter(last.ph, 0.008),
                            turbidity: jitter(last.turbidity, 0.012),
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
        };
    }, [seabins, history]);

    return (
        <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
            <header className="flex min-w-0 flex-wrap items-end justify-between gap-4">
                <div>
                    <div className='text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-teal-700/80'>
                        Sensors
                    </div>
                    <h1 className='mt-1 text-[1.75rem] font-semibold tracking-tight text-slate-900'>
                        Water quality monitor
                    </h1>
                    <p className='mt-1 text-sm text-slate-500'>
                        Live pH and turbidity — updated every 3 s.
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

            {/* Seabin network averages */}
            <section>
                <div className='mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                    Seabin average — all {seabins.length} units
                </div>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
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
                </div>
            </section>

            {/* Per-seabin filter */}
            <section>
                <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Per-seabin readings
                    </div>
                    <div className="-mx-1 flex min-w-0 max-w-full snap-x snap-mandatory items-center gap-1.5 overflow-x-auto overflow-y-hidden scroll-smooth rounded-full bg-white p-1 pl-1 ring-1 ring-slate-200/80 [scrollbar-width:thin] sm:mx-0 sm:ml-auto sm:flex-wrap sm:overflow-x-visible sm:pl-0">
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

                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {displaySeabins.map((sb) => {
                        const hist = history[sb.id] ?? [];
                        const r: Reading = hist.at(-1) ?? baseReading(sb);
                        return (
                            <div
                                key={sb.id}
                                className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5"
                            >
                                <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            {sb.id}
                                        </div>
                                        <div className="truncate text-sm font-semibold text-slate-800">
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
                                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
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
            type="button"
            onClick={() => onClick(id)}
            className={`shrink-0 snap-start rounded-full px-3 py-1.5 text-[0.78rem] font-medium transition-colors ${
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
        <div className="flex min-w-0 flex-col gap-1 overflow-hidden rounded-xl bg-slate-50 p-3">
            <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[0.62rem] font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                </span>
                <div className="shrink-0">
                    <Sparkline values={sparkline.slice(-12)} color={sparkColor} />
                </div>
            </div>
            <div className="min-w-0 truncate text-sm font-semibold tabular-nums text-slate-800" title={value}>
                {value}
            </div>
            <div className={`min-w-0 truncate text-[0.65rem] font-medium ${status.color}`}>
                {status.label}
            </div>
        </div>
    );
}
