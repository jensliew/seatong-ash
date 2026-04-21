import { Bell, Anchor, Waves } from 'lucide-react'
import { alerts } from '../../data/alerts'

const severityConfig = {
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  danger: 'bg-orange-50 border-orange-200 text-orange-700',
  critical: 'bg-red-50 border-red-200 text-red-700',
}

interface Props {
  seabinId: string
}

export default function SeabinAlerts({ seabinId }: Props) {
  const seabinAlerts = alerts.filter((a) => a.seabin_ids.includes(seabinId))
  const equipmentAlerts = seabinAlerts.filter((a) => a.domain === 'seabin')
  const riverAlerts = seabinAlerts.filter((a) => a.domain === 'river')
  const totalCount = seabinAlerts.length

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <Bell size={16} className="text-yellow-500" />
        Active Alerts
        {totalCount > 0 && (
          <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full border border-red-200">
            {totalCount}
          </span>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="text-slate-400 text-sm py-4 text-center">No active alerts</div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Seabin Equipment Alerts */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider mb-2">
              <Anchor size={12} />
              Seabin Equipment
              {equipmentAlerts.length > 0 && (
                <span className="ml-auto text-slate-400 normal-case tracking-normal">{equipmentAlerts.length}</span>
              )}
            </div>
            {equipmentAlerts.length === 0 ? (
              <div className="text-slate-300 text-xs py-2 pl-4">No equipment alerts</div>
            ) : (
              <div className="flex flex-col gap-2">
                {equipmentAlerts.map((alert) => (
                  <div key={alert.id} className={`px-3 py-2.5 rounded-lg border text-sm ${severityConfig[alert.severity]}`}>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-xs opacity-70 mt-0.5">{new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* River Condition Alerts */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider mb-2">
              <Waves size={12} />
              River Condition
              {riverAlerts.length > 0 && (
                <span className="ml-auto text-slate-400 normal-case tracking-normal">{riverAlerts.length}</span>
              )}
            </div>
            {riverAlerts.length === 0 ? (
              <div className="text-slate-300 text-xs py-2 pl-4">No river condition alerts</div>
            ) : (
              <div className="flex flex-col gap-2">
                {riverAlerts.map((alert) => (
                  <div key={alert.id} className={`px-3 py-2.5 rounded-lg border text-sm ${severityConfig[alert.severity]}`}>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-xs opacity-70 mt-0.5">{new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
