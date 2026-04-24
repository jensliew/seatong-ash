import { useMemo, useState } from 'react'
import { Bell, Anchor, Waves, CheckCircle2, SlidersHorizontal } from 'lucide-react'
import { alerts } from '../data/alerts'
import { sortBySeverity } from '../components/alerts/alertConfig'
import AlertListItem from '../components/alerts/AlertListItem'
import type { Alert } from '../types'

type FilterId = 'all' | 'critical' | 'seabin' | 'river'

const FILTERS: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'seabin', label: 'Seabin' },
    { id: 'river', label: 'River' },
]

function countBySeverity(
    list: typeof alerts,
    sev: Alert['severity'],
) {
    return list.filter((a) => a.severity === sev).length
}

export default function Alerts() {
    const [filter, setFilter] = useState<FilterId>('all')

    const { seabinList, riverList, total, criticalTotal } = useMemo(() => {
        const s = alerts.filter((a) => a.domain === 'seabin')
        const r = alerts.filter((a) => a.domain === 'river')
        const c = alerts.filter((a) => a.severity === 'critical')
        return {
            seabinList: [...s].sort(sortBySeverity),
            riverList: [...r].sort(sortBySeverity),
            total: alerts.length,
            criticalTotal: c.length,
        }
    }, [])

    const filteredSeabin = useMemo(() => {
        if (filter === 'all' || filter === 'seabin' || filter === 'critical') {
            const list = filter === 'critical'
                ? seabinList.filter((a) => a.severity === 'critical')
                : seabinList
            return list
        }
        return []
    }, [filter, seabinList])

    const filteredRiver = useMemo(() => {
        if (filter === 'all' || filter === 'river' || filter === 'critical') {
            const list = filter === 'critical'
                ? riverList.filter((a) => a.severity === 'critical')
                : riverList
            return list
        }
        return []
    }, [filter, riverList])

    const hasAnyInView = filteredSeabin.length + filteredRiver.length > 0
    const crit = countBySeverity(alerts, 'critical')
    const danger = countBySeverity(alerts, 'danger')
    const warn = countBySeverity(alerts, 'warning')
    const info = countBySeverity(alerts, 'info')

    return (
        <div className='flex flex-col gap-6 p-6'>
            {/* Page header + summary */}
            <header className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-6 py-6 shadow-sm md:px-8'>
                <div className='pointer-events-none absolute -right-12 -top-10 h-48 w-48 rounded-full bg-amber-400/8 blur-3xl' />
                <div className='relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6'>
                    <div className='min-w-0'>
                        <p className='text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-amber-700/90'>
                            Monitoring
                        </p>
                        <h1 className='mt-1 text-2xl font-semibold tracking-tight text-slate-900'>
                            Alerts
                        </h1>
                        <p className='mt-0.5 max-w-xl text-sm text-slate-500'>
                            Every active event across the network — newest
                            and highest severity first. Filter by type or
                            show critical only.
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center justify-end gap-2 md:shrink-0'>
                        {crit > 0 && (
                            <span className='inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800'>
                                <span className='h-2 w-2 animate-pulse rounded-full bg-red-500' />
                                {crit} critical
                            </span>
                        )}
                        {danger > 0 && (
                            <span className='inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800'>
                                {danger} danger
                            </span>
                        )}
                        {warn > 0 && (
                            <span className='inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/90 px-2.5 py-1 text-xs font-semibold text-amber-800'>
                                {warn} warning
                            </span>
                        )}
                        {info > 0 && (
                            <span className='inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800'>
                                {info} info
                            </span>
                        )}
                        <span className='inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold tabular-nums text-slate-800'>
                            <Bell size={15} className='text-amber-500' />
                            {total}
                        </span>
                    </div>
                </div>

                {/* Filter chips */}
                <div className='relative mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4'>
                    <span className='mr-1 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400'>
                        <SlidersHorizontal size={12} />
                        View
                    </span>
                    {FILTERS.map((f) => {
                        const active = filter === f.id
                        return (
                            <button
                                key={f.id}
                                type='button'
                                onClick={() => setFilter(f.id)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    active
                                        ? 'border-teal-300 bg-teal-50 text-teal-800 shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {f.label}
                            </button>
                        )
                    })}
                </div>
            </header>

            {total === 0 ? (
                <div className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-16 text-center shadow-sm'>
                    <div className='flex h-14 w-14 items-center justify-center rounded-full bg-teal-50'>
                        <CheckCircle2
                            size={28}
                            className='text-teal-500'
                        />
                    </div>
                    <p className='text-sm font-semibold text-slate-600'>
                        No system alerts
                    </p>
                    <p className='max-w-sm text-xs text-slate-400'>
                        You&apos;re all clear. New alerts will show here when
                        sensors or AI raise them.
                    </p>
                </div>
            ) : !hasAnyInView ? (
                <div className='rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500'>
                    No alerts match this filter. Try
                    <button
                        type='button'
                        onClick={() => setFilter('all')}
                        className='mx-1 font-medium text-teal-600 underline decoration-teal-300'
                    >
                        All
                    </button>
                </div>
            ) : (
                <div className='flex flex-col gap-6'>
                    {filter === 'all' && criticalTotal > 0 && (
                        <div
                            className='flex items-start gap-2 rounded-lg border border-red-200/60 bg-red-50/50 px-3 py-2 text-[0.8rem] text-red-900'
                            role='status'
                        >
                            <span className='mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500' />
                            <span>
                                <span className='font-semibold'>
                                    {criticalTotal} critical
                                </span>
                                {criticalTotal > 1 ? ' events' : ' event'}{' '}
                                need immediate attention. Review the red
                                rows below.
                            </span>
                        </div>
                    )}

                    {(filter === 'all' ||
                        filter === 'seabin' ||
                        filter === 'critical') &&
                        filteredSeabin.length > 0 && (
                        <section className='overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm'>
                            <div className='flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 md:px-5'>
                                <Anchor
                                    size={16}
                                    className='text-teal-600'
                                />
                                <h2 className='text-sm font-semibold text-slate-800'>
                                    Seabin equipment
                                </h2>
                                <span className='ml-auto rounded-full border border-slate-200/80 bg-white px-2 py-0.5 text-xs font-medium text-slate-500'>
                                    {filteredSeabin.length}
                                </span>
                            </div>
                            <div className='flex flex-col gap-2 p-4 md:gap-3 md:p-5'>
                                {filteredSeabin.map((a) => (
                                    <AlertListItem
                                        key={a.id}
                                        alert={a}
                                        showSeabinChips
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {(filter === 'all' ||
                        filter === 'river' ||
                        filter === 'critical') &&
                        filteredRiver.length > 0 && (
                        <section className='overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm'>
                            <div className='flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 md:px-5'>
                                <Waves
                                    size={16}
                                    className='text-sky-600'
                                />
                                <h2 className='text-sm font-semibold text-slate-800'>
                                    River &amp; water quality
                                </h2>
                                <span className='ml-auto rounded-full border border-slate-200/80 bg-white px-2 py-0.5 text-xs font-medium text-slate-500'>
                                    {filteredRiver.length}
                                </span>
                            </div>
                            <div className='flex flex-col gap-2 p-4 md:gap-3 md:p-5'>
                                {filteredRiver.map((a) => (
                                    <AlertListItem
                                        key={a.id}
                                        alert={a}
                                        showSeabinChips
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}
