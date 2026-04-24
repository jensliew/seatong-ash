import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import type { DetectionLog } from '../../types';
import { hourlyCollectionBuckets } from '../../lib/series';

interface Props {
    seabinId: string;
    logs: DetectionLog[];
    /** When no hourly logs exist, shapes a demo curve from this total (AI insight). */
    totalDetectionsHint?: number;
}

export default function CollectionRateAreaChart({
    seabinId,
    logs,
    totalDetectionsHint = 0,
}: Props) {
    const { buckets, synthetic } = useMemo(
        () => hourlyCollectionBuckets(logs, seabinId, totalDetectionsHint),
        [logs, seabinId, totalDetectionsHint],
    );

    return (
        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm'>
            <div className='mb-1 text-sm font-medium text-slate-700'>
                Collection rate (24h)
            </div>
            <p className='mb-3 text-[0.72rem] text-slate-400'>
                {synthetic
                    ? 'No detections in the last 24h — curve is a proportional estimate from total detections.'
                    : 'Items logged per hour from AI detections for this unit.'}
            </p>
            <div className='h-52 w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart
                        data={buckets}
                        margin={{ top: 8, right: 8, left: -4, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id={`fill-collection-${seabinId}`}
                                x1='0'
                                y1='0'
                                x2='0'
                                y2='1'
                            >
                                <stop
                                    offset='0%'
                                    stopColor='#14b8a6'
                                    stopOpacity={0.35}
                                />
                                <stop
                                    offset='100%'
                                    stopColor='#14b8a6'
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey='label'
                            tick={{ fontSize: 9 }}
                            interval={3}
                            stroke='#94a3b8'
                        />
                        <YAxis
                            width={28}
                            tick={{ fontSize: 10 }}
                            stroke='#94a3b8'
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            formatter={(value) => {
                                const n = Number(value);
                                return [
                                    Number.isFinite(n) ? `${n} items` : '—',
                                    'Detected',
                                ];
                            }}
                        />
                        <Area
                            type='monotone'
                            dataKey='count'
                            stroke='#0f766e'
                            strokeWidth={2}
                            fill={`url(#fill-collection-${seabinId})`}
                            isAnimationActive
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
