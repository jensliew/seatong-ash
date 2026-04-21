import type { Prediction } from '../../types'
import { TrendingUp } from 'lucide-react'

interface Props {
  predictions: Prediction[]
}

export default function PredictionPanel({ predictions }: Props) {
  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <TrendingUp size={16} className="text-teal-500" />
        AI Predictions
      </div>
      <div className="grid grid-cols-1 gap-3">
        {predictions.map((p, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between border border-slate-100">
            <div>
              <div className="text-slate-700 text-sm font-medium">{p.label}</div>
              <div className="text-slate-400 text-xs mt-0.5">{p.timeframe}</div>
            </div>
            <div className="text-right">
              <span className="text-teal-600 font-bold text-lg">{p.value}</span>
              <span className="text-slate-400 text-xs ml-1">{p.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
