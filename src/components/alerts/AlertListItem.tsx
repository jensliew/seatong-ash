import type { Alert } from '../../types'
import { seabins } from '../../data/seabins'
import {
    ALERT_TYPE_META,
    SEVERITY,
    iconColorForSeverity,
    relativeTime,
} from './alertConfig'

type Props = {
    alert: Alert
    /** Show which seabins are affected (global alerts page) */
    showSeabinChips?: boolean
}

export default function AlertListItem({
    alert,
    showSeabinChips = true,
}: Props) {
    const sev = SEVERITY[alert.severity]
    const meta = ALERT_TYPE_META[alert.type]
    const isCritical = alert.severity === 'critical'
    const Icon = meta.Icon

    const affected =
        showSeabinChips && alert.seabin_ids.length > 0
            ? seabins.filter((sb) => alert.seabin_ids.includes(sb.id))
            : []

    return (
        <div
            className={`relative flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200/80 transition-colors ${sev.row}`}
        >
            <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${sev.bar}`}
            />

            <div
                className={`ml-4 mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ring-2 ${sev.ring}`}
            >
                <Icon
                    size={14}
                    className={iconColorForSeverity(alert.severity)}
                />
            </div>

            <div className='min-w-0 flex-1 py-3 pr-3'>
                <div className='mb-1 flex flex-wrap items-center gap-2'>
                    <span className='text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500'>
                        {meta.label}
                    </span>
                    <span
                        className={`rounded-full border px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${sev.badge}`}
                    >
                        {sev.label}
                    </span>
                    {isCritical && (
                        <span className='flex items-center gap-1 text-[0.6rem] font-semibold text-red-600'>
                            <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-red-500' />
                            Active
                        </span>
                    )}
                    <span className='ml-auto shrink-0 text-[0.65rem] tabular-nums text-slate-400'>
                        {relativeTime(alert.timestamp)}
                    </span>
                </div>
                <p className='text-sm leading-snug text-slate-700'>
                    {alert.message}
                </p>
                {affected.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                        {affected.map((sb) => (
                            <span
                                key={sb.id}
                                className='rounded-md border border-teal-200/80 bg-teal-50/80 px-2 py-0.5 text-[0.65rem] font-medium text-teal-800'
                            >
                                {sb.name}
                                <span className='ml-1 font-normal text-teal-600/80'>
                                    {sb.id}
                                </span>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
