import { Power, Pause, Play } from 'lucide-react'
import type { Seabin } from '../../types'
import { useSeabinStore } from '../../store/seabinStore'

interface Props {
  seabin: Seabin
}

const statusConfig = {
  active: { color: 'text-teal-600', bg: 'bg-teal-50 border-teal-300', dot: 'bg-teal-500', label: 'Active' },
  paused: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300', dot: 'bg-yellow-400', label: 'Paused' },
  inactive: { color: 'text-slate-500', bg: 'bg-slate-100 border-slate-300', dot: 'bg-slate-400', label: 'Inactive' },
}

export default function SystemStatusCard({ seabin }: Props) {
  const toggleStatus = useSeabinStore((s) => s.toggleStatus)
  const cfg = statusConfig[seabin.status]
  const canToggle = seabin.status !== 'inactive'

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <Power size={16} className="text-teal-500" />
        System Status
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${cfg.bg}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${seabin.status === 'active' ? 'animate-pulse' : ''}`} />
          <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
        </div>

        {canToggle && (
          <button
            onClick={() => toggleStatus(seabin.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              seabin.status === 'active'
                ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-300'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-300'
            }`}
          >
            {seabin.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
            {seabin.status === 'active' ? 'Pause System' : 'Resume System'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="text-slate-400 text-xs mb-1">pH Level</div>
          <div className="text-slate-700 font-mono">{seabin.ph}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="text-slate-400 text-xs mb-1">Turbidity</div>
          <div className="text-slate-700 font-mono">{seabin.turbidity} NTU</div>
        </div>
      </div>
    </div>
  )
}
