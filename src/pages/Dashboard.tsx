import SeabinMap from '../components/map/SeabinMap'
import ImpactRow from '../components/dashboard/ImpactRow'
import LiveFeed from '../components/dashboard/LiveFeed'
import PlasticMix from '../components/dashboard/PlasticMix'
import ContaminationRiskCard from '../components/dashboard/ContaminationRiskCard'
import { useSeabinStore } from '../store/seabinStore'
import { detectionLogs } from '../data/detections'

export default function Dashboard() {
  const seabins = useSeabinStore((s) => s.seabins)

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-teal-700/80">
            Operations
          </div>
          <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Port Klang · Real-time seabin monitoring
          </p>
        </div>
        <div className="text-[0.72rem] text-slate-500">
          Updated{' '}
          <span className="font-medium text-slate-700">
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </header>

      <ImpactRow />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-800">Port Klang pollution heatmap</div>
              <div className="text-[0.72rem] text-slate-500">
                Live debris density · {seabins.length} seabins
              </div>
            </div>
            <div className="hidden flex-wrap items-center gap-3 text-[0.7rem] text-slate-500 md:flex">
              <Legend color="bg-teal-500" label="Active" />
              <Legend color="bg-amber-400" label="Paused" />
              <Legend color="bg-slate-400" label="Offline" />
              <span className="inline-flex items-center gap-1.5">
                <span className="block h-1.5 w-12 rounded-full bg-linear-to-r from-teal-500 via-amber-400 to-red-500" />
                Debris density
              </span>
            </div>
          </div>
          <div className="h-112 xl:h-128">
            <SeabinMap seabins={seabins} />
          </div>
        </div>

        <div className="min-h-0">
          <LiveFeed logs={detectionLogs} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ContaminationRiskCard seabins={seabins} />
        </div>
        <div className="min-h-0">
          <PlasticMix />
        </div>
      </section>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}
