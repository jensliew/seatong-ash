import { Link } from 'react-router-dom'
import { ArrowUpRight, Droplet, Gauge, MapPin } from 'lucide-react'
import type { Seabin } from '../../types'

interface Props {
  seabin: Seabin
  lastDetectionLabel?: string
}

const statusCopy: Record<Seabin['status'], { label: string; dot: string; chip: string }> = {
  active: {
    label: 'Active',
    dot: 'bg-teal-500',
    chip: 'bg-teal-50 text-teal-700 ring-teal-200',
  },
  paused: {
    label: 'Paused',
    dot: 'bg-amber-400',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  inactive: {
    label: 'Offline',
    dot: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
}

const riskCopy: Record<Seabin['contamination_risk'], { label: string; chip: string }> = {
  low: { label: 'Low risk', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  medium: { label: 'Medium risk', chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
  high: { label: 'High risk', chip: 'bg-orange-50 text-orange-700 ring-orange-200' },
  critical: { label: 'Critical', chip: 'bg-red-50 text-red-700 ring-red-200' },
}

function capacityColor(pct: number) {
  if (pct >= 85) return 'bg-red-500'
  if (pct >= 65) return 'bg-amber-500'
  return 'bg-teal-500'
}

export default function SeabinCard({ seabin, lastDetectionLabel }: Props) {
  const s = statusCopy[seabin.status]
  const r = riskCopy[seabin.contamination_risk]

  return (
    <Link
      to={`/seabin/${seabin.id}`}
      className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {seabin.id}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[0.85rem] font-medium text-slate-500">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{seabin.area}</span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.68rem] font-medium ring-1 ${s.chip}`}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className={`absolute inset-0 rounded-full ${s.dot}`} />
            {seabin.status === 'active' && (
              <span className={`absolute inset-0 animate-ping rounded-full ${s.dot} opacity-60`} />
            )}
          </span>
          {s.label}
        </span>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-[0.7rem] font-medium uppercase tracking-wider text-slate-500">
            Capacity
          </span>
          <span className="text-sm font-semibold tabular-nums text-slate-800">
            {seabin.capacity}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${capacityColor(seabin.capacity)}`}
            style={{ width: `${Math.min(100, seabin.capacity)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-slate-500">
            <Droplet size={11} /> pH
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-800">
            {seabin.ph.toFixed(1)}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-slate-500">
            <Gauge size={11} /> Turbidity
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-800">
            {seabin.turbidity}
            <span className="ml-0.5 text-xs font-medium text-slate-400">NTU</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-medium ring-1 ${r.chip}`}>
          {r.label}
        </span>
        <div className="flex min-w-0 items-center gap-1 text-[0.72rem] text-slate-500">
          {lastDetectionLabel && <span className="truncate">{lastDetectionLabel}</span>}
          <ArrowUpRight
            size={14}
            className="shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-600"
          />
        </div>
      </div>
    </Link>
  )
}
