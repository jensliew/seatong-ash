import type { Alert } from '../../types'
import { seabins } from '../../data/seabins'

const typeLabel: Record<Alert['type'], string> = {
  overflow: 'Debris Overflow',
  fish_population: 'High Fish Population',
  debris_surge: 'Debris Surge',
  sensor_anomaly: 'Sensor Anomaly',
  dead_fish: 'Dead Fish Detected',
  camera_issue: 'Camera Feed Issue',
  high_turbidity: 'High Turbidity',
  ph_anomaly: 'pH Anomaly',
}

const typeIcon: Record<Alert['type'], string> = {
  overflow: '🌊',
  fish_population: '🐟',
  debris_surge: '🗑️',
  sensor_anomaly: '⚠️',
  dead_fish: '💀',
  camera_issue: '📷',
  high_turbidity: '🌫️',
  ph_anomaly: '🧪',
}

const severityConfig = {
  info: 'border-blue-200 bg-blue-50',
  warning: 'border-yellow-200 bg-yellow-50',
  danger: 'border-orange-200 bg-orange-50',
  critical: 'border-red-200 bg-red-50',
}

const severityBadge = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

interface Props {
  type: Alert['type']
  alerts: Alert[]
}

export default function AlertGroup({ type, alerts }: Props) {
  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{typeIcon[type]}</span>
        <span className="font-semibold text-slate-700">{typeLabel[type]}</span>
        <span className="ml-auto text-xs text-slate-400">{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span>
      </div>

      {alerts.length === 0 ? (
        <div className="text-slate-400 text-sm py-2">No alerts of this type</div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => {
            const affectedSeabins = seabins.filter((sb) => alert.seabin_ids.includes(sb.id))
            return (
              <div key={alert.id} className={`rounded-lg border p-3 ${severityConfig[alert.severity]}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm text-slate-700">{alert.message}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${severityBadge[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {affectedSeabins.map((sb) => (
                    <span key={sb.id} className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded">
                      {sb.name}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-2">{new Date(alert.timestamp).toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
