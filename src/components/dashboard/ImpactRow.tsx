import { useLiveCounter } from '../../hooks/useLiveCounter'
import { impactStats } from '../../data/impact'

function formatInt(n: number) {
  return Math.floor(n).toLocaleString('en-MY')
}

function formatLitres(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return Math.floor(n).toString()
}

export default function ImpactRow() {
  const litres = useLiveCounter(impactStats.litres_filtered, { ratePerSecond: 26, intervalMs: 1200 })
  const items = useLiveCounter(impactStats.plastic_items, { ratePerSecond: 0.06, intervalMs: 3500 })

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-linear-to-br from-white via-white to-teal-50/60 px-6 py-6 lg:px-8 lg:py-7">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-teal-700 ring-1 ring-teal-100">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-teal-500" />
              <span className="absolute inset-0 animate-ping rounded-full bg-teal-500/70" />
            </span>
            Live · Port Klang pilot
          </div>
          <h2 className="mt-3 max-w-xl text-[1.6rem] font-semibold leading-tight tracking-tight text-slate-900 lg:text-[1.85rem]">
            Cleaner water, protected fish, verified credits.
          </h2>
          <p className="mt-1 text-sm text-slate-500">{impactStats.period_label}</p>
        </div>
      </div>

      <div className="relative mt-7 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
        <Metric
          label="Litres filtered"
          value={formatLitres(litres)}
          sub="≈ 3.2 Olympic pools"
          trend="+2.1% vs last week"
        />
        <Metric
          label="Plastic items captured"
          value={formatInt(items)}
          sub={`${impactStats.microplastics.toLocaleString('en-MY')} microplastics`}
          trend="+5.6% vs last week"
        />
        <Metric
          label="Fish lives saved"
          value={impactStats.fish_saved.toString()}
          sub="Auto-pump stops triggered"
          trend="This week"
          accent="text-red-600"
        />
        <Metric
          label="Plastic credits earned"
          value={impactStats.credits_earned.toLocaleString('en-MY')}
          sub={`≈ RM ${impactStats.credit_value_myr.toLocaleString('en-MY')}`}
          trend="4 offtake partners"
          accent="text-teal-700"
        />
      </div>
    </section>
  )
}

function Metric({
  label,
  value,
  sub,
  trend,
  accent = 'text-slate-900',
}: {
  label: string
  value: string
  sub: string
  trend: string
  accent?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className={`text-[2rem] font-semibold leading-none tracking-tight tabular-nums lg:text-[2.4rem] ${accent}`}>
        {value}
      </div>
      <div className="text-[0.78rem] text-slate-500">{sub}</div>
      <div className="text-[0.68rem] font-medium uppercase tracking-wider text-emerald-600">
        {trend}
      </div>
    </div>
  )
}
