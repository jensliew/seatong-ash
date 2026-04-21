import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { AIInsight } from '../../types'

interface Props {
  insight: AIInsight
}

const categoryData = [
  { name: 'Plastic Bottle', accuracy: 94 },
  { name: 'Fishing Net', accuracy: 89 },
  { name: 'Aluminium Can', accuracy: 85 },
  { name: 'Plastic Bag', accuracy: 88 },
  { name: 'Fish', accuracy: 97 },
  { name: 'Dead Fish', accuracy: 93 },
]

export default function AccuracyMetrics({ insight }: Props) {
  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="text-sm text-slate-500">Model Accuracy</div>
      <div className="flex items-end gap-6">
        <div>
          <div className="text-4xl font-bold text-teal-600">{insight.accuracy}%</div>
          <div className="text-xs text-slate-400 mt-1">Overall accuracy</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-700">{insight.total_detections}</div>
          <div className="text-xs text-slate-400 mt-1">Total detections</div>
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[70, 100]} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #99f6e4', borderRadius: 8 }}
              labelStyle={{ color: '#475569' }}
              itemStyle={{ color: '#0d9488' }}
            />
            <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
              {categoryData.map((_, i) => (
                <Cell key={i} fill={`hsl(${170 + i * 10}, 60%, ${45 + i * 3}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
