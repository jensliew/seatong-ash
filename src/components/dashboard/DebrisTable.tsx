import type { DetectionLog } from '../../types'

const categoryLabel: Record<DetectionLog['category'], string> = {
  plastic_bottle: 'Plastic Bottle',
  fishing_net: 'Fishing Net',
  aluminium_can: 'Aluminium Can',
  plastic_bag: 'Plastic Bag',
  fish: 'Fish',
  dead_fish: 'Dead Fish',
}

const categoryColor: Record<DetectionLog['category'], string> = {
  plastic_bottle: 'bg-blue-100 text-blue-700',
  fishing_net: 'bg-purple-100 text-purple-700',
  aluminium_can: 'bg-slate-100 text-slate-600',
  plastic_bag: 'bg-yellow-100 text-yellow-700',
  fish: 'bg-teal-100 text-teal-700',
  dead_fish: 'bg-red-100 text-red-700',
}

interface Props {
  logs: DetectionLog[]
}

export default function DebrisTable({ logs }: Props) {
  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm">
      <div className="text-sm text-slate-500 mb-4">Rubbish & Species Detection Log</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-200">
              <th className="text-left pb-2 pr-4">Category</th>
              <th className="text-left pb-2 pr-4">Seabin</th>
              <th className="text-left pb-2 pr-4">Count</th>
              <th className="text-left pb-2 pr-4">Confidence</th>
              <th className="text-left pb-2">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="text-slate-600">
                <td className="py-2 pr-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColor[log.category]}`}>
                    {categoryLabel[log.category]}
                  </span>
                </td>
                <td className="py-2 pr-4 text-teal-600 font-mono text-xs">{log.seabin_id}</td>
                <td className="py-2 pr-4">{log.count}</td>
                <td className="py-2 pr-4">
                  <span className={`text-xs ${log.confidence >= 0.9 ? 'text-teal-600' : 'text-yellow-600'}`}>
                    {(log.confidence * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="py-2 text-slate-400 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
