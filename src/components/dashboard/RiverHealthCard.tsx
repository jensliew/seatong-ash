import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Droplets } from 'lucide-react'

interface Props {
  score: number
}

export default function RiverHealthCard({ score }: Props) {
  const color = score >= 75 ? '#14b8a6' : score >= 50 ? '#f59e0b' : score >= 25 ? '#f97316' : '#ef4444'
  const label = score >= 75 ? 'Good' : score >= 50 ? 'Moderate' : score >= 25 ? 'Poor' : 'Critical'

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
        <Droplets size={16} className="text-teal-500" />
        River Health Score
      </div>
      <div className="flex items-center justify-center gap-5 py-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="60%" outerRadius="100%"
              startAngle={90} endAngle={-270}
              data={[{ value: score, fill: color }]}
              barSize={12}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#e2f0f5' }} angleAxisId={0} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col">
          <div className="text-5xl font-bold leading-none" style={{ color }}>{score}</div>
          <div className="text-slate-400 text-sm mt-1">/ 100</div>
          <div className="text-sm mt-2 font-semibold px-2 py-0.5 rounded-md w-fit" style={{ color, backgroundColor: `${color}15` }}>
            {label}
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-400 pt-3 border-t border-slate-100">
        Based on pH levels & biological integrity
      </div>
    </div>
  )
}
