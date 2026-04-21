import SeabinMap from '../components/map/SeabinMap'
import RiverHealthCard from '../components/dashboard/RiverHealthCard'
import ContaminationRiskCard from '../components/dashboard/ContaminationRiskCard'
import DeadFishCard from '../components/dashboard/DeadFishCard'
import DebrisTable from '../components/dashboard/DebrisTable'
import { useSeabinStore } from '../store/seabinStore'
import { detectionLogs } from '../data/detections'

export default function Dashboard() {
  const seabins = useSeabinStore((s) => s.seabins)

  const avgHealth = Math.round(seabins.reduce((a, b) => a + b.health_score, 0) / seabins.length)
  const totalDeadFish = seabins.reduce((a, b) => a + b.dead_fish_today, 0)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Port Klang — Real-time seabin monitoring</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RiverHealthCard score={avgHealth} />
        <DeadFishCard count={totalDeadFish} />
      </div>

      {/* Contamination chart - full width */}
      <ContaminationRiskCard seabins={seabins} />

      {/* Map */}
      <div className="bg-white border border-teal-200 rounded-xl p-4 shadow-sm">
        <div className="text-sm text-slate-500 mb-3">Seabin Locations — Port Klang</div>
        <div className="h-96">
          <SeabinMap seabins={seabins} />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" /> Active</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Paused</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Inactive</span>
          <span className="flex items-center gap-1.5 ml-auto">Heatmap intensity = debris density</span>
        </div>
      </div>

      {/* Detection table */}
      <DebrisTable logs={detectionLogs} />
    </div>
  )
}
