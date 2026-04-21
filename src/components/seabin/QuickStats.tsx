import { MapPin, Gauge, Fish, Droplets } from 'lucide-react'
import type { Seabin } from '../../types'

interface Props {
  seabin: Seabin
}

export default function QuickStats({ seabin }: Props) {
  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm flex flex-col gap-3 h-full">
      <div className="text-sm text-slate-500 flex items-center gap-2">
        <Gauge size={16} className="text-teal-500" />
        Quick Stats
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <MapPin size={11} />
            Area
          </div>
          <div className="text-sm font-medium text-slate-700">{seabin.area}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Gauge size={11} />
            Capacity
          </div>
          <div className="text-sm font-medium text-slate-700">{seabin.capacity}%</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Fish size={11} />
            Dead Fish Today
          </div>
          <div className={`text-sm font-medium ${seabin.dead_fish_today === 0 ? 'text-teal-600' : seabin.dead_fish_today < 5 ? 'text-yellow-600' : 'text-red-500'}`}>
            {seabin.dead_fish_today}
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Droplets size={11} />
            Debris Intensity
          </div>
          <div className="text-sm font-medium text-slate-700">{(seabin.debris_intensity * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  )
}
