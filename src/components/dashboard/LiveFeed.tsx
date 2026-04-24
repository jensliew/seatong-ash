import { useMemo } from 'react'
import { Fish, Recycle, Waves, AlertTriangle } from 'lucide-react'
import type { DetectionLog } from '../../types'

interface Props {
  logs: DetectionLog[]
}

type Tone = 'teal' | 'amber' | 'red' | 'slate'

const categoryMeta: Record<DetectionLog['category'], { label: string; Icon: typeof Fish; tone: Tone }> = {
  plastic_bottle: { label: 'PET bottle', Icon: Recycle, tone: 'teal' },
  plastic_bag: { label: 'Plastic bag', Icon: Recycle, tone: 'teal' },
  aluminium_can: { label: 'Aluminium can', Icon: Recycle, tone: 'slate' },
  fishing_net: { label: 'Fishing net', Icon: Waves, tone: 'amber' },
  fish: { label: 'Live fish', Icon: Fish, tone: 'red' },
  dead_fish: { label: 'Dead fish', Icon: AlertTriangle, tone: 'red' },
}

const toneClasses: Record<Tone, string> = {
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
}

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.max(0, Math.round(diff / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export default function LiveFeed({ logs }: Props) {
  const sorted = useMemo(
    () => [...logs].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 8),
    [logs],
  )

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">Live detection feed</div>
          <div className="text-[0.72rem] text-slate-500">Most recent events across all seabins</div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-wider text-teal-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-teal-500" />
            <span className="absolute inset-0 animate-ping rounded-full bg-teal-500/70" />
          </span>
          Streaming
        </span>
      </header>
      <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
        {sorted.map((log) => {
          const meta = categoryMeta[log.category]
          const Icon = meta.Icon
          return (
            <li key={log.id} className="flex items-center gap-3 px-5 py-3">
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${toneClasses[meta.tone]}`}
              >
                <Icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-800">{meta.label}</span>
                  <span className="text-slate-400">·</span>
                  <span className="truncate text-slate-500">{log.seabin_id}</span>
                </div>
                <div className="mt-0.5 text-[0.72rem] text-slate-500">
                  {log.count} item{log.count === 1 ? '' : 's'} · {(log.confidence * 100).toFixed(0)}% conf
                </div>
              </div>
              <span className="shrink-0 text-[0.72rem] font-medium tabular-nums text-slate-400">
                {relative(log.timestamp)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
