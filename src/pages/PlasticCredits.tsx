import { impactStats, topPlasticCategories, offtakePartners } from '../data/impact'
import { useLiveCounter } from '../hooks/useLiveCounter'
import { CheckCircle2, Clock, Sparkles, TrendingUp, Leaf, Building2 } from 'lucide-react'

const KG_PER_CREDIT = 5
const MYR_PER_CREDIT = 5

const statusMeta: Record<
  typeof offtakePartners[number]['status'],
  { label: string; chip: string; Icon: typeof CheckCircle2 }
> = {
  contracted: { label: 'Contracted', chip: 'bg-teal-50 text-teal-700 ring-teal-200', Icon: CheckCircle2 },
  pending: { label: 'Pending', chip: 'bg-amber-50 text-amber-700 ring-amber-200', Icon: Clock },
  interested: { label: 'Interested', chip: 'bg-slate-100 text-slate-600 ring-slate-200', Icon: Sparkles },
}

const monthlyCredits = [
  { month: 'Oct', credits: 310 },
  { month: 'Nov', credits: 420 },
  { month: 'Dec', credits: 390 },
  { month: 'Jan', credits: 510 },
  { month: 'Feb', credits: 580 },
  { month: 'Mar', credits: 720 },
]

export default function PlasticCredits() {
  const liveCredits = useLiveCounter(impactStats.credits_earned, {
    ratePerSecond: 0.002,
    intervalMs: 4000,
  })
  const liveValue = liveCredits * MYR_PER_CREDIT
  const liveKg = liveCredits * KG_PER_CREDIT

  const maxCredits = Math.max(...monthlyCredits.map((m) => m.credits))

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-teal-700/80">
            Plastic Credits
          </div>
          <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight text-slate-900">
            Credits portal
          </h1>
          <p className="mt-1 max-w-lg text-sm text-slate-500">
            Every kilogram captured by a SeaTong seabin becomes a verified plastic credit. Credits
            are sold to corporate offtake partners to offset plastic footprint.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-2.5 text-sm text-teal-800">
          <Leaf size={15} className="shrink-0" />
          <span className="font-medium">
            {KG_PER_CREDIT} kg plastic = 1 credit = RM {MYR_PER_CREDIT}
          </span>
        </div>
      </header>

      {/* Hero stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <HeroTile
          label="Credits earned"
          value={Math.floor(liveCredits).toLocaleString('en-MY')}
          sub={impactStats.period_label}
          accent="text-teal-700"
          icon={<TrendingUp size={20} className="text-teal-600" />}
        />
        <HeroTile
          label="Total value"
          value={`RM ${Math.floor(liveValue).toLocaleString('en-MY')}`}
          sub="At RM 5 per credit"
          accent="text-slate-900"
          icon={<Sparkles size={20} className="text-amber-500" />}
        />
        <HeroTile
          label="Plastic recovered"
          value={`${Math.floor(liveKg / 1000).toFixed(2)} t`}
          sub={`${Math.floor(liveKg).toLocaleString('en-MY')} kg total`}
          accent="text-slate-900"
          icon={<Leaf size={20} className="text-emerald-600" />}
        />
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Monthly bar chart */}
        <section className="flex flex-col rounded-2xl border border-slate-200/80 bg-white">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <div className="text-sm font-semibold text-slate-800">Credits generated</div>
              <div className="text-[0.72rem] text-slate-500">Month by month · Port Klang pilot</div>
            </div>
            <span className="text-[0.72rem] font-medium text-emerald-600">
              +{Math.round(((monthlyCredits.at(-1)!.credits - monthlyCredits[0].credits) / monthlyCredits[0].credits) * 100)}% since Oct
            </span>
          </header>
          <div className="flex flex-1 items-end gap-3 px-6 pb-5 pt-6">
            {monthlyCredits.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[0.7rem] font-semibold tabular-nums text-slate-700">
                  {m.credits}
                </span>
                <div className="w-full overflow-hidden rounded-t-lg bg-slate-100" style={{ height: '9rem' }}>
                  <div
                    className="w-full rounded-t-lg bg-linear-to-t from-teal-600 to-teal-400 transition-all duration-700"
                    style={{ height: `${(m.credits / maxCredits) * 100}%`, marginTop: 'auto' }}
                  />
                </div>
                <span className="text-[0.68rem] text-slate-500">{m.month}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Plastic categories */}
        <section className="flex flex-col rounded-2xl border border-slate-200/80 bg-white">
          <header className="border-b border-slate-100 px-5 py-3.5">
            <div className="text-sm font-semibold text-slate-800">Plastic mix captured</div>
            <div className="text-[0.72rem] text-slate-500">Share of items · last 30 days</div>
          </header>
          <ul className="flex-1 divide-y divide-slate-100">
            {topPlasticCategories.map((c) => (
              <li key={c.key} className="flex items-center gap-4 px-5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-slate-700">{c.label}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-800">
                      {c.percent}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-teal-500 to-teal-400"
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-[0.7rem] tabular-nums text-slate-400">
                  {c.items.toLocaleString('en-MY')} items
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Offtake partners */}
      <section className="rounded-2xl border border-slate-200/80 bg-white">
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
          <Building2 size={16} className="text-teal-600" />
          <div>
            <div className="text-sm font-semibold text-slate-800">Offtake partners</div>
            <div className="text-[0.72rem] text-slate-500">
              Corporates buying plastic credits to offset their plastic footprint
            </div>
          </div>
        </header>
        <div className="divide-y divide-slate-100">
          {offtakePartners.map((p) => {
            const meta = statusMeta[p.status]
            const Icon = meta.Icon
            return (
              <div
                key={p.name}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                    {p.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                    <div className="text-[0.72rem] text-slate-500">
                      {p.tonnes} tonnes offtake commitment
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-slate-700">
                    {(p.tonnes / KG_PER_CREDIT * 1000 / 1000).toFixed(0)} k credits
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-medium ring-1 ${meta.chip}`}
                  >
                    <Icon size={12} />
                    {meta.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[0.72rem] text-slate-500">
          Credits are verified against physical capture weight logged by seabin sensors. Each credit
          represents 5 kg of plastic removed from Port Klang waterways.
        </div>
      </section>
    </div>
  )
}

function HeroTile({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string
  value: string
  sub: string
  accent: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </div>
        {icon}
      </div>
      <div className={`text-[2.2rem] font-semibold leading-none tabular-nums tracking-tight ${accent}`}>
        {value}
      </div>
      <div className="text-[0.75rem] text-slate-500">{sub}</div>
    </div>
  )
}
