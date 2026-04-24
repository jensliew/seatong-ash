import type { LucideIcon } from 'lucide-react'
import {
    PackageOpen,
    Zap,
    Activity,
    VideoOff,
    Fish,
    Droplets,
    FlaskConical,
} from 'lucide-react'
import type { Alert } from '../../types'

/** Visual + sort order for severities (0 = most urgent) */
export const SEVERITY = {
    critical: {
        bar: 'bg-red-500',
        badge: 'bg-red-100 text-red-700 border-red-200',
        dot: 'bg-red-500',
        ring: 'ring-red-200',
        row: 'bg-red-50/60 hover:bg-red-50',
        label: 'Critical',
        order: 0,
    },
    danger: {
        bar: 'bg-orange-500',
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
        dot: 'bg-orange-500',
        ring: 'ring-orange-200',
        row: 'bg-orange-50/40 hover:bg-orange-50',
        label: 'Danger',
        order: 1,
    },
    warning: {
        bar: 'bg-amber-400',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-400',
        ring: 'ring-amber-200',
        row: 'bg-amber-50/30 hover:bg-amber-50',
        label: 'Warning',
        order: 2,
    },
    info: {
        bar: 'bg-blue-400',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-400',
        ring: 'ring-blue-200',
        row: 'bg-blue-50/30 hover:bg-blue-50',
        label: 'Info',
        order: 3,
    },
} as const

export const ALERT_TYPE_META: Record<
    Alert['type'],
    { label: string; Icon: LucideIcon }
> = {
    overflow: { label: 'Overflow', Icon: PackageOpen },
    debris_surge: { label: 'Debris Surge', Icon: Zap },
    sensor_anomaly: { label: 'Sensor Anomaly', Icon: Activity },
    camera_issue: { label: 'Camera Issue', Icon: VideoOff },
    fish_population: { label: 'Fish Population', Icon: Fish },
    dead_fish: { label: 'Dead Fish', Icon: Fish },
    high_turbidity: { label: 'High Turbidity', Icon: Droplets },
    ph_anomaly: { label: 'pH Anomaly', Icon: FlaskConical },
}

export function relativeTime(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

export function sortBySeverity(a: Alert, b: Alert) {
    return SEVERITY[a.severity].order - SEVERITY[b.severity].order
}

export function iconColorForSeverity(
    severity: Alert['severity'],
): string {
    if (severity === 'critical') return 'text-red-600'
    if (severity === 'danger') return 'text-orange-600'
    if (severity === 'warning') return 'text-amber-600'
    return 'text-blue-600'
}
