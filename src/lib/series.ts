import type { DetectionLog } from '../types'

/** Deterministic 0..1 from a seed (pure). */
export function hash01(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function seabinSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Hourly pH / turbidity ending at current live readings (simulated history for UI). */
export function syntheticSensorHistory(
  seabinId: string,
  hours: number,
  phEnd: number,
  turbEnd: number,
): Array<{ label: string; ph: number; turbidity: number }> {
  const seed = seabinSeed(seabinId)
  const n = Math.max(hours, 2)
  const rows: Array<{ label: string; ph: number; turbidity: number }> = []

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const fade = 1 - t
    const phWobble =
      (hash01(seed + i * 17) - 0.5) * 1.1 * fade +
      Math.sin(i * 0.42 + seed * 0.02) * 0.22 * fade
    const turbWobble =
      (hash01(seed + i * 19) - 0.5) * 32 * fade +
      Math.cos(i * 0.38) * 10 * fade

    const hour = (new Date().getHours() - (n - 1 - i) + 48) % 24
    rows.push({
      label: `${hour}h`,
      ph: phEnd + phWobble,
      turbidity: Math.max(0, turbEnd + turbWobble),
    })
  }

  rows[n - 1] = { ...rows[n - 1], ph: phEnd, turbidity: turbEnd }
  return rows
}

export type HourlyBucket = { label: string; count: number }

export type HourlyBucketsResult = { buckets: HourlyBucket[]; synthetic: boolean }

/** Last 24h buckets: real log counts per hour; optional total hint shapes empty-window estimate. */
export function hourlyCollectionBuckets(
  logs: DetectionLog[],
  seabinId: string,
  totalDetectionsHint = 0,
): HourlyBucketsResult {
  const seed = seabinSeed(seabinId)
  const now = Date.now()
  const start = now - 24 * 60 * 60 * 1000
  const mine = logs.filter((l) => l.seabin_id === seabinId)

  const buckets: HourlyBucket[] = []
  for (let h = 0; h < 24; h++) {
    const bucketStart = start + h * 60 * 60 * 1000
    const bucketEnd = bucketStart + 60 * 60 * 1000
    const sum = mine.reduce((acc, log) => {
      const ts = new Date(log.timestamp).getTime()
      if (ts >= bucketStart && ts < bucketEnd) return acc + log.count
      return acc
    }, 0)
    const hour = new Date(bucketStart).getHours()
    buckets.push({ label: `${hour}h`, count: sum })
  }

  const loggedSum = buckets.reduce((a, b) => a + b.count, 0)
  if (loggedSum === 0 && totalDetectionsHint > 0) {
    const target = Math.min(
      totalDetectionsHint,
      Math.max(12, Math.round(totalDetectionsHint * 0.15)),
    )
    const weights = buckets.map((_, h) => 0.15 + hash01(seed + h * 11))
    const wSum = weights.reduce((a, b) => a + b, 0)
    return {
      synthetic: true,
      buckets: buckets.map((b, h) => ({
        ...b,
        count: Math.round((weights[h] / wSum) * target),
      })),
    }
  }

  return { buckets, synthetic: false }
}
