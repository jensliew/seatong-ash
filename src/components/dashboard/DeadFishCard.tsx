import { Fish } from 'lucide-react'

interface Props {
  count: number
}

export default function DeadFishCard({ count }: Props) {
  const color = count === 0 ? '#0d9488' : count < 5 ? '#f59e0b' : '#ef4444'
  const label = count === 0 ? 'Clear' : count < 5 ? 'Low' : 'Concerning'

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
        <Fish size={16} className="text-red-400" />
        Dead Fish Detected Today
      </div>
      <div className="flex flex-col items-center justify-center py-4">
        <div className="text-6xl font-bold leading-none" style={{ color }}>{count}</div>
        <div className="text-sm mt-3 font-semibold px-3 py-1 rounded-md" style={{ color, backgroundColor: `${color}15` }}>
          {label}
        </div>
      </div>
      <div className="text-xs text-slate-400 pt-3 border-t border-slate-100">
        AI vision detection across all seabins
      </div>
    </div>
  )
}
