import { lazy, Suspense, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useSeabinStore } from '../store/seabinStore'
import { detectionLogs } from '../data/detections'
import SeabinCard from '../components/fleet/SeabinCard'
import SeabinMap from '../components/map/SeabinMap'
import type { Seabin } from '../types'

const Seabin3D = lazy(() => import('../components/seabin/Seabin3D'))

type StatusFilter = 'all' | Seabin['status']

const filters: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'inactive', label: 'Offline' },
]

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export default function Fleet() {
  const seabins = useSeabinStore((s) => s.seabins)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const lastDetectionById = useMemo(() => {
    const map = new Map<string, string>()
    for (const log of detectionLogs) {
      const existing = map.get(log.seabin_id)
      if (!existing || new Date(log.timestamp) > new Date(existing)) {
        map.set(log.seabin_id, log.timestamp)
      }
    }
    return map
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return seabins.filter((sb) => {
      if (status !== 'all' && sb.status !== status) return false
      if (!q) return true
      return (
        sb.id.toLowerCase().includes(q) ||
        sb.area.toLowerCase().includes(q) ||
        sb.name.toLowerCase().includes(q)
      )
    })
  }, [seabins, query, status])

  const counts = useMemo(
    () => ({
      total: seabins.length,
      active: seabins.filter((s) => s.status === 'active').length,
      paused: seabins.filter((s) => s.status === 'paused').length,
      inactive: seabins.filter((s) => s.status === 'inactive').length,
      critical: seabins.filter((s) => s.contamination_risk === 'critical').length,
    }),
    [seabins],
  )

  // Pick the most interesting seabin for the 3D hero (critical first, else first active)
  const heroSeabin =
    seabins.find((s) => s.contamination_risk === 'critical') ??
    seabins.find((s) => s.status === 'active') ??
    seabins[0]

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-7 py-6 lg:px-8 lg:py-7">
        {/* subtle background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative flex items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-teal-700/80">
              Fleet
            </div>
            <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight text-slate-900">
              Port Klang deployment
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              {counts.total} seabins across the Klang estuary — filter, search, and jump to any unit.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatPill label="Active" value={counts.active} tone="teal" />
              <StatPill label="Paused" value={counts.paused} tone="amber" />
              <StatPill label="Offline" value={counts.inactive} tone="slate" />
              <StatPill label="Critical" value={counts.critical} tone="red" />
            </div>
          </div>

          {/* 3D seabin — decorative, auto-rotates, no controls */}
          {heroSeabin && (
            <div className="hidden shrink-0 lg:block" style={{ width: 180, height: 180 }}>
              <Suspense fallback={null}>
                <Seabin3D seabin={heroSeabin} ambient />
              </Suspense>
            </div>
          )}
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-slate-700">Fleet map</div>
          <div className="text-[0.72rem] text-slate-500">
            Click a marker to inspect the seabin
          </div>
        </div>
        <div className="h-72 md:h-80">
          <SeabinMap seabins={visible.length ? visible : seabins} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-white p-1 ring-1 ring-slate-200/80">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatus(f.id)}
                className={`rounded-full px-3 py-1.5 text-[0.78rem] font-medium transition-colors ${
                  status === f.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID or area…"
              className="w-full rounded-full border border-slate-200/80 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
            No seabins match those filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visible.map((sb) => {
              const iso = lastDetectionById.get(sb.id)
              return (
                <SeabinCard
                  key={sb.id}
                  seabin={sb}
                  lastDetectionLabel={iso ? `Detected ${relativeTime(iso)}` : undefined}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'teal' | 'amber' | 'slate' | 'red'
}) {
  const tones: Record<typeof tone, string> = {
    teal: 'bg-teal-50 text-teal-700 ring-teal-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${tones[tone]}`}>
      <span className="text-[0.66rem] uppercase tracking-[0.14em] opacity-80">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  )
}
