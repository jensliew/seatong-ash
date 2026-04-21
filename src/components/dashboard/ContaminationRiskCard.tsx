import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle } from 'lucide-react'
import type { Seabin } from '../../types'

const riskValue: Record<Seabin['contamination_risk'], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

const riskColor: Record<number, string> = {
  1: '#0d9488',
  2: '#f59e0b',
  3: '#f97316',
  4: '#ef4444',
}

const riskLabels: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
}

interface Props {
  seabins: Seabin[]
}

interface AreaData {
  area: string
  risk: number
  turbidity: number
  seabinNames: string[]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: AreaData }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-teal-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <div className="font-semibold text-slate-700 mb-1">{d.area}</div>
      <div className="text-slate-500">
        Risk: <span className="font-medium" style={{ color: riskColor[d.risk] }}>{riskLabels[d.risk]}</span>
      </div>
      <div className="text-slate-500">Turbidity: <span className="font-medium text-slate-700">{d.turbidity} NTU</span></div>
      <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-xs text-slate-400">
        Seabins:
        {d.seabinNames.map((name) => (
          <div key={name} className="text-teal-600 font-medium">{name}</div>
        ))}
      </div>
    </div>
  )
}

export default function ContaminationRiskCard({ seabins }: Props) {
  // Group by area, take worst risk per area
  const areaMap = new Map<string, { seabins: Seabin[] }>()
  seabins.forEach((sb) => {
    const entry = areaMap.get(sb.area) || { seabins: [] }
    entry.seabins.push(sb)
    areaMap.set(sb.area, entry)
  })

  const data: AreaData[] = Array.from(areaMap.entries()).map(([area, { seabins: sbs }]) => {
    const worstRisk = Math.max(...sbs.map((sb) => riskValue[sb.contamination_risk]))
    const avgTurbidity = Math.round(sbs.reduce((a, b) => a + b.turbidity, 0) / sbs.length)
    return {
      area,
      risk: worstRisk,
      turbidity: avgTurbidity,
      seabinNames: sbs.map((sb) => sb.name),
    }
  })

  data.sort((a, b) => b.risk - a.risk)

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
        <AlertTriangle size={16} className="text-orange-400" />
        Contamination Risk by Area
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <XAxis dataKey="area" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={40} />
            <YAxis
              domain={[0, 4]}
              ticks={[1, 2, 3, 4]}
              tickFormatter={(v: number) => riskLabels[v] || ''}
              tick={{ fill: '#64748b', fontSize: 10 }}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13,148,136,0.06)' }} />
            <Bar dataKey="risk" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={riskColor[d.risk]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
