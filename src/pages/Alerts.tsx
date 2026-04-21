import { Anchor, Waves } from 'lucide-react'
import { alerts } from '../data/alerts'
import AlertGroup from '../components/alerts/AlertGroup'
import type { Alert } from '../types'

const seabinAlertTypes: Alert['type'][] = ['overflow', 'debris_surge', 'camera_issue', 'sensor_anomaly']
const riverAlertTypes: Alert['type'][] = ['fish_population', 'dead_fish', 'high_turbidity', 'ph_anomaly']

export default function Alerts() {
  const seabinAlerts = alerts.filter((a) => a.domain === 'seabin')
  const riverAlerts = alerts.filter((a) => a.domain === 'river')

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Alerts</h1>
        <p className="text-slate-400 text-sm mt-0.5">All system alerts grouped by category</p>
      </div>

      {/* Seabin Equipment Alerts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Anchor size={16} className="text-teal-500" />
          <h2 className="text-base font-semibold text-slate-700">Seabin Equipment</h2>
          <span className="text-xs text-slate-400 ml-1">{seabinAlerts.length} total</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {seabinAlertTypes.map((type) => (
            <AlertGroup
              key={type}
              type={type}
              alerts={seabinAlerts.filter((a) => a.type === type)}
            />
          ))}
        </div>
      </div>

      {/* River Condition Alerts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Waves size={16} className="text-blue-500" />
          <h2 className="text-base font-semibold text-slate-700">River Condition</h2>
          <span className="text-xs text-slate-400 ml-1">{riverAlerts.length} total</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {riverAlertTypes.map((type) => (
            <AlertGroup
              key={type}
              type={type}
              alerts={riverAlerts.filter((a) => a.type === type)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
