import type { ReactNode } from 'react'
import { Bell, Anchor, Waves, CheckCircle2 } from 'lucide-react'
import { alerts } from '../../data/alerts'
import type { Alert } from '../../types'
import { sortBySeverity } from '../alerts/alertConfig'
import AlertListItem from '../alerts/AlertListItem'

/* ─── Sub-components ──────────────────────────────────────────────────── */
function SectionGroup({
    title,
    icon,
    items,
    emptyText,
}: {
    title: string
    icon: ReactNode
    items: Alert[]
    emptyText: string
}) {
    const sorted = [...items].sort(sortBySeverity)
    return (
        <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-2 px-1'>
                <span className='text-slate-400'>{icon}</span>
                <span className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
                    {title}
                </span>
                {items.length > 0 && (
                    <span className='ml-auto text-xs font-medium text-slate-400'>
                        {items.length} alert{items.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
            {items.length === 0 ? (
                <div className='flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2'>
                    <CheckCircle2 size={13} className='shrink-0 text-teal-400' />
                    <span className='text-xs text-slate-400'>{emptyText}</span>
                </div>
            ) : (
                <div className='flex flex-col gap-2'>
                    {sorted.map((a) => (
                        <AlertListItem
                            key={a.id}
                            alert={a}
                            showSeabinChips={false}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

/* ─── Main component ──────────────────────────────────────────────────── */
interface Props {
    seabinId: string
}

export default function SeabinAlerts({ seabinId }: Props) {
    const seabinAlerts = alerts.filter((a) => a.seabin_ids.includes(seabinId))
    const equipmentAlerts = seabinAlerts.filter((a) => a.domain === 'seabin')
    const riverAlerts = seabinAlerts.filter((a) => a.domain === 'river')
    const totalCount = seabinAlerts.length

    const criticalCount = seabinAlerts.filter(
        (a) => a.severity === 'critical',
    ).length
    const dangerCount = seabinAlerts.filter(
        (a) => a.severity === 'danger',
    ).length
    const warningCount = seabinAlerts.filter(
        (a) => a.severity === 'warning',
    ).length
    const infoCount = seabinAlerts.filter((a) => a.severity === 'info').length

    return (
        <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div
                className={`flex items-center gap-3 border-b px-5 py-4 ${
                    criticalCount > 0
                        ? 'border-red-100 bg-red-50/40'
                        : dangerCount > 0
                          ? 'border-orange-100 bg-orange-50/30'
                          : 'border-slate-100 bg-slate-50/60'
                }`}
            >
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        criticalCount > 0
                            ? 'bg-red-100'
                            : dangerCount > 0
                              ? 'bg-orange-100'
                              : totalCount > 0
                                ? 'bg-amber-100'
                                : 'bg-teal-50'
                    }`}
                >
                    <Bell
                        size={15}
                        className={
                            criticalCount > 0
                                ? 'text-red-600'
                                : dangerCount > 0
                                  ? 'text-orange-600'
                                  : totalCount > 0
                                    ? 'text-amber-600'
                                    : 'text-teal-500'
                        }
                    />
                </div>
                <div>
                    <div className='text-sm font-semibold text-slate-700'>
                        Active Alerts
                    </div>
                    {totalCount > 0 ? (
                        <div className='mt-0.5 flex flex-wrap items-center gap-1.5'>
                            {criticalCount > 0 && (
                                <span className='inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-1.5 py-0.5 text-[0.62rem] font-bold text-red-700'>
                                    <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-red-500' />
                                    {criticalCount} critical
                                </span>
                            )}
                            {dangerCount > 0 && (
                                <span className='inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-1.5 py-0.5 text-[0.62rem] font-bold text-orange-700'>
                                    {dangerCount} danger
                                </span>
                            )}
                            {warningCount > 0 && (
                                <span className='inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[0.62rem] font-semibold text-amber-700'>
                                    {warningCount} warning
                                </span>
                            )}
                            {infoCount > 0 && (
                                <span className='inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[0.62rem] font-semibold text-blue-700'>
                                    {infoCount} info
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className='mt-0.5 text-xs text-slate-400'>
                            No active alerts
                        </div>
                    )}
                </div>
                {totalCount > 0 && (
                    <span className='ml-auto flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 shadow-sm'>
                        {totalCount}
                    </span>
                )}
            </div>

            <div className='p-5'>
                {totalCount === 0 ? (
                    <div className='flex flex-col items-center justify-center gap-3 py-8 text-center'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-teal-50'>
                            <CheckCircle2 size={24} className='text-teal-500' />
                        </div>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                All systems clear
                            </div>
                            <div className='mt-0.5 text-xs text-slate-400'>
                                No active alerts for this seabin
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='flex flex-col gap-5'>
                        <SectionGroup
                            title='Seabin Equipment'
                            icon={<Anchor size={13} />}
                            items={equipmentAlerts}
                            emptyText='No equipment alerts'
                        />
                        <div className='border-t border-slate-100' />
                        <SectionGroup
                            title='River Condition'
                            icon={<Waves size={13} />}
                            items={riverAlerts}
                            emptyText='No river condition alerts'
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
