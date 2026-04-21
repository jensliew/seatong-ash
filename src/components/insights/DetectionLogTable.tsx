import type { DetectionLog } from '../../types'

const categoryLabel: Record<DetectionLog['category'], string> = {
  plastic_bottle: 'Plastic Bottle',
  fishing_net: 'Fishing Net',
  aluminium_can: 'Aluminium Can',
  plastic_bag: 'Plastic Bag',
  fish: 'Fish',
  dead_fish: 'Dead Fish',
}

interface Props {
  logs: DetectionLog[]
}

export default function DetectionLogTable({ logs }: Props) {
  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm">
      <div className="text-sm text-slate-500 mb-4">Detection Log</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-200">
              <th className="text-left pb-2 pr-4">Timestamp</th>
              <th className="text-left pb-2 pr-4">Category</th>
              <th className="text-left pb-2 pr-4">Count</th>
              <th className="text-left pb-2">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="text-slate-600">
                <td className="py-2 pr-4 text-slate-400 text-xs font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-2 pr-4">{categoryLabel[log.category]}</td>
                <td className="py-2 pr-4">{log.count}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${log.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-teal-600">{(log.confidence * 100).toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
