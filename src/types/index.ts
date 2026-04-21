export interface Seabin {
  id: string
  name: string
  lat: number
  lng: number
  status: 'active' | 'inactive' | 'paused'
  health_score: number
  contamination_risk: 'low' | 'medium' | 'high' | 'critical'
  ph: number
  turbidity: number
  dead_fish_today: number
  debris_intensity: number
  capacity: number // percentage 0-100
  area: string
}

export interface Alert {
  id: string
  type: 'overflow' | 'fish_population' | 'debris_surge' | 'sensor_anomaly' | 'dead_fish' | 'camera_issue' | 'high_turbidity' | 'ph_anomaly'
  domain: 'seabin' | 'river'
  severity: 'info' | 'warning' | 'danger' | 'critical'
  message: string
  seabin_ids: string[]
  timestamp: string
}

export interface DetectionLog {
  id: string
  seabin_id: string
  timestamp: string
  category: 'plastic_bottle' | 'fishing_net' | 'aluminium_can' | 'plastic_bag' | 'fish' | 'dead_fish'
  confidence: number
  count: number
}

export interface AIInsight {
  seabin_id: string
  accuracy: number
  total_detections: number
  predictions: Prediction[]
}

export interface Prediction {
  label: string
  value: number
  unit: string
  timeframe: string
}
