import { marineDebrisTypes } from '../../data/impact'

export default function PlasticMix() {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">Marine debris type</div>
          <div className="text-[0.72rem] text-slate-500">Rubbish breakdown this month</div>
        </div>
        <span className="text-[0.68rem] font-medium uppercase tracking-wider text-slate-400">
          Share of items
        </span>
      </header>
      <ul className="flex-1 divide-y divide-slate-100">
        {marineDebrisTypes.map((c) => (
          <li key={c.key} className="flex items-center gap-3 px-5 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-slate-800">{c.label}</span>
                <span className="tabular-nums font-semibold text-slate-700">{c.percent}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-linear-to-r from-teal-500 to-teal-400"
                  style={{ width: `${c.percent}%` }}
                />
              </div>
              <div className="mt-1 text-[0.68rem] text-slate-400 tabular-nums">
                {c.items.toLocaleString('en-MY')} items
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
