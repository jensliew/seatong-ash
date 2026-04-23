import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, WifiOff } from 'lucide-react'
import { useSeabinStore } from '../store/seabinStore'
import { aiInsights, detectionLogs } from '../data/detections'
import SimulatedStream from '../components/seabin/SimulatedStream'
import ImageUploadTest from '../components/seabin/ImageUploadTest'
import SystemStatusCard from '../components/seabin/SystemStatusCard'
import QuickStats from '../components/seabin/QuickStats'
import SeabinAlerts from '../components/seabin/SeabinAlerts'
import RiverHealthCard from '../components/dashboard/RiverHealthCard'
import ContaminationRiskCard from '../components/dashboard/ContaminationRiskCard'
import AccuracyMetrics from '../components/insights/AccuracyMetrics'
import DetectionLogTable from '../components/insights/DetectionLogTable'
import PredictionPanel from '../components/insights/PredictionPanel'

export default function SeabinDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const seabins = useSeabinStore((s) => s.seabins)
  const seabin = seabins.find((sb) => sb.id === id)
  const [, setUploadDone] = useState(false)

  if (!seabin) {
    return (
      <div className="p-6 text-slate-400">
        Seabin not found.{' '}
        <button onClick={() => navigate('/')} className="text-teal-500 underline">Go back</button>
      </div>
    )
  }

  const isTestSeabin = seabin.id === 'SB-002'
  const isInactive = seabin.status === 'inactive'
  const insight = aiInsights.find((i) => i.seabin_id === seabin.id)
  const logs = detectionLogs.filter((l) => l.seabin_id === seabin.id)

  // Map seabin to stream scenario based on alerts
  const scenarioMap: Record<string, 'default' | 'ph_deadfish' | 'fish_haven' | 'heavy_pollution'> = {
    'SB-001': 'ph_deadfish',     // pH sensor anomaly + dead fish nearby
    'SB-003': 'fish_haven',      // High fish population, auto-paused
    'SB-004': 'heavy_pollution', // Overflow, dead fish critical, pH drop, high turbidity
  }
  const scenario = scenarioMap[seabin.id] || 'default'

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{seabin.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {seabin.area} — {seabin.lat.toFixed(4)}, {seabin.lng.toFixed(4)}
            {isTestSeabin && <span className="ml-2 text-teal-500 font-medium">• AI Test Mode</span>}
            {isInactive && <span className="ml-2 text-slate-400 font-medium">• Offline</span>}
          </p>
        </div>
      </div>

      {/* Inactive banner */}
      {isInactive && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            <WifiOff size={20} className="text-slate-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-600">This seabin is currently offline</div>
            <div className="text-xs text-slate-400 mt-0.5">
              No live stream, AI detection, or debris collection is active. The unit may be under maintenance or powered off.
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Stream + Quick Stats + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
        <div className="lg:col-span-3 flex">
          {isInactive ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm w-full flex flex-col">
              <div className="text-sm text-slate-400 mb-3">Live Stream</div>
              <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-2">
                <WifiOff size={32} className="text-slate-300" />
                <div className="text-sm text-slate-400">Stream unavailable</div>
                <div className="text-xs text-slate-300">Seabin is offline</div>
              </div>
            </div>
          ) : isTestSeabin ? (
            <div className="w-full">
              <ImageUploadTest onDetectionComplete={() => setUploadDone(true)} />
            </div>
          ) : (
            <div className="w-full">
              <SimulatedStream seabinId={seabin.id} scenario={scenario} />
            </div>
          )}
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SystemStatusCard seabin={seabin} />
          <div className="flex-1">
            <QuickStats seabin={seabin} />
          </div>
        </div>
      </div>

      {/* Row 2: Alerts — full width */}
      <SeabinAlerts seabinId={seabin.id} />

      {/* Row 2: Contamination Risk + River Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ContaminationRiskCard seabins={[seabin]} />
        <RiverHealthCard score={seabin.health_score} />
      </div>

      {/* Row 3: AI Insights section */}
      {insight && (
        <>
          <div className="border-t border-slate-200 pt-4">
            <h2 className="text-lg font-bold text-slate-800">AI Insights</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {isTestSeabin ? 'Results from AI vision model test' : 'Model performance & predictions'}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AccuracyMetrics insight={insight} />
            <PredictionPanel predictions={insight.predictions} />
          </div>
          <DetectionLogTable logs={logs} />
        </>
      )}
    </div>
  )
}

