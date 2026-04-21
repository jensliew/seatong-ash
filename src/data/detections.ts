import type { DetectionLog, AIInsight } from '../types'

export const detectionLogs: DetectionLog[] = [
  { id: 'D-001', seabin_id: 'SB-001', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), category: 'plastic_bottle', confidence: 0.94, count: 3 },
  { id: 'D-002', seabin_id: 'SB-001', timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), category: 'plastic_bag', confidence: 0.88, count: 5 },
  { id: 'D-003', seabin_id: 'SB-001', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), category: 'fish', confidence: 0.97, count: 2 },
  { id: 'D-004', seabin_id: 'SB-002', timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), category: 'fishing_net', confidence: 0.91, count: 1 },
  { id: 'D-005', seabin_id: 'SB-002', timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(), category: 'aluminium_can', confidence: 0.85, count: 7 },
  { id: 'D-006', seabin_id: 'SB-002', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), category: 'dead_fish', confidence: 0.93, count: 3 },
  { id: 'D-007', seabin_id: 'SB-003', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), category: 'plastic_bottle', confidence: 0.79, count: 1 },
  { id: 'D-008', seabin_id: 'SB-004', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), category: 'dead_fish', confidence: 0.96, count: 8 },
  { id: 'D-009', seabin_id: 'SB-004', timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(), category: 'fishing_net', confidence: 0.89, count: 2 },
  { id: 'D-010', seabin_id: 'SB-005', timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(), category: 'aluminium_can', confidence: 0.82, count: 4 },
]

export const aiInsights: AIInsight[] = [
  {
    seabin_id: 'SB-001',
    accuracy: 92.4,
    total_detections: 148,
    predictions: [
      { label: 'Debris Volume', value: 12, unit: 'items', timeframe: 'Next 6h' },
      { label: 'Fish Activity', value: 65, unit: '%', timeframe: 'Next 6h' },
      { label: 'Overflow Risk', value: 28, unit: '%', timeframe: 'Next 24h' },
    ],
  },
  {
    seabin_id: 'SB-002',
    accuracy: 89.1,
    total_detections: 312,
    predictions: [
      { label: 'Debris Volume', value: 34, unit: 'items', timeframe: 'Next 6h' },
      { label: 'Fish Activity', value: 20, unit: '%', timeframe: 'Next 6h' },
      { label: 'Overflow Risk', value: 74, unit: '%', timeframe: 'Next 24h' },
    ],
  },
  {
    seabin_id: 'SB-003',
    accuracy: 95.7,
    total_detections: 67,
    predictions: [
      { label: 'Debris Volume', value: 4, unit: 'items', timeframe: 'Next 6h' },
      { label: 'Fish Activity', value: 88, unit: '%', timeframe: 'Next 6h' },
      { label: 'Overflow Risk', value: 8, unit: '%', timeframe: 'Next 24h' },
    ],
  },
  {
    seabin_id: 'SB-004',
    accuracy: 87.3,
    total_detections: 489,
    predictions: [
      { label: 'Debris Volume', value: 52, unit: 'items', timeframe: 'Next 6h' },
      { label: 'Fish Activity', value: 10, unit: '%', timeframe: 'Next 6h' },
      { label: 'Overflow Risk', value: 91, unit: '%', timeframe: 'Next 24h' },
    ],
  },
  {
    seabin_id: 'SB-005',
    accuracy: 90.8,
    total_detections: 203,
    predictions: [
      { label: 'Debris Volume', value: 18, unit: 'items', timeframe: 'Next 6h' },
      { label: 'Fish Activity', value: 45, unit: '%', timeframe: 'Next 6h' },
      { label: 'Overflow Risk', value: 42, unit: '%', timeframe: 'Next 24h' },
    ],
  },
]
