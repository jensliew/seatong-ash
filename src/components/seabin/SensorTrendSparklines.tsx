import { useMemo } from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { syntheticSensorHistory } from '../../lib/series';

interface Props {
    seabinId: string;
    ph: number;
    turbidity: number;
}

export default function SensorTrendSparklines({
    seabinId,
    ph,
    turbidity,
}: Props) {
    const data = useMemo(
        () => syntheticSensorHistory(seabinId, 24, ph, turbidity),
        [seabinId, ph, turbidity],
    );

    return (
        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm'>
            <div className='mb-3 text-sm font-medium text-slate-700'>
                Sensor trends (24h)
            </div>
            <p className='mb-4 text-[0.72rem] text-slate-400'>
                Simulated hourly series ending at live readings — for ops
                context.
            </p>
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
                <div>
                    <div className='mb-1 text-[0.7rem] font-medium uppercase tracking-wide text-slate-500'>
                        pH
                    </div>
                    <div className='h-24 w-full'>
                        <ResponsiveContainer width='100%' height='100%'>
                            <LineChart
                                data={data}
                                margin={{
                                    top: 4,
                                    right: 4,
                                    left: -18,
                                    bottom: 0,
                                }}
                            >
                                <XAxis
                                    dataKey='label'
                                    tick={{ fontSize: 9 }}
                                    interval={5}
                                    stroke='#94a3b8'
                                />
                                <Tooltip
                                    contentStyle={{
                                        fontSize: 12,
                                        borderRadius: 8,
                                    }}
                                    formatter={(value) => {
                                        const n = Number(value);
                                        return [
                                            Number.isFinite(n)
                                                ? n.toFixed(2)
                                                : '—',
                                            'pH',
                                        ];
                                    }}
                                />
                                <Line
                                    type='monotone'
                                    dataKey='ph'
                                    stroke='#0d9488'
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div>
                    <div className='mb-1 text-[0.7rem] font-medium uppercase tracking-wide text-slate-500'>
                        Turbidity (NTU)
                    </div>
                    <div className='h-24 w-full'>
                        <ResponsiveContainer width='100%' height='100%'>
                            <LineChart
                                data={data}
                                margin={{
                                    top: 4,
                                    right: 4,
                                    left: -18,
                                    bottom: 0,
                                }}
                            >
                                <XAxis
                                    dataKey='label'
                                    tick={{ fontSize: 9 }}
                                    interval={5}
                                    stroke='#94a3b8'
                                />
                                <Tooltip
                                    contentStyle={{
                                        fontSize: 12,
                                        borderRadius: 8,
                                    }}
                                    formatter={(value) => {
                                        const n = Number(value);
                                        return [
                                            Number.isFinite(n)
                                                ? `${Math.round(n)} NTU`
                                                : '—',
                                            'Turbidity',
                                        ];
                                    }}
                                />
                                <Line
                                    type='monotone'
                                    dataKey='turbidity'
                                    stroke='#0284c7'
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
