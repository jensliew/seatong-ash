import { useState, useRef, useEffect } from 'react'
import { Upload, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'

export interface DetectionResult {
  category: string
  confidence: number
  count: number
  bbox?: { x1: number; y1: number; x2: number; y2: number }
}

interface Props {
  onDetectionComplete: (results: DetectionResult[], imageUrl: string) => void
  seabinId?: string
  onDeadFishDetected?: (count: number) => void
  onFishDetected?: (count: number) => void
  onNoFishDetected?: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  plastic_bottle: '#3b82f6',
  plastic_bag: '#8b5cf6',
  fishing_net: '#f59e0b',
  aluminium_can: '#10b981',
  fish: '#06b6d4',
  dead_fish: '#ef4444',
}

function colorFor(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? '#64748b'
}

function drawBoxes(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  results: DetectionResult[],
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const W = canvas.width
  const H = canvas.height

  for (const r of results) {
    if (!r.bbox) continue
    const { x1, y1, x2, y2 } = r.bbox
    const bx = x1 * W
    const by = y1 * H
    const bw = (x2 - x1) * W
    const bh = (y2 - y1) * H

    const color = colorFor(r.category)
    const label = `${r.category.replace(/_/g, ' ')} ${r.confidence.toFixed(1)}%`
    const fontSize = Math.max(12, Math.min(16, W * 0.018))

    ctx.strokeStyle = color
    ctx.lineWidth = Math.max(2, W * 0.003)
    ctx.strokeRect(bx, by, bw, bh)

    ctx.font = `bold ${fontSize}px sans-serif`
    const textW = ctx.measureText(label).width
    const padX = 6
    const padY = 4
    const tagH = fontSize + padY * 2
    const tagY = by > tagH ? by - tagH : by + bh

    ctx.fillStyle = color
    ctx.fillRect(bx, tagY, textW + padX * 2, tagH)

    ctx.fillStyle = '#ffffff'
    ctx.fillText(label, bx + padX, tagY + fontSize + padY - 2)
  }
}

export default function ImageUploadTest({
  onDetectionComplete,
  seabinId,
  onDeadFishDetected,
  onFishDetected,
  onNoFishDetected,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isDone || !imgRef.current || !canvasRef.current || detectionResults.length === 0) return
    const img = imgRef.current
    if (img.complete) {
      drawBoxes(canvasRef.current, img, detectionResults)
    } else {
      img.onload = () => drawBoxes(canvasRef.current!, img, detectionResults)
    }
  }, [isDone, detectionResults, preview])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setPreview(url)
    setIsDone(false)
    setError(null)
    setIsProcessing(true)
    setDetectionResults([])

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Detection failed')

      const data = await response.json()

      const results: DetectionResult[] = data.detections.map((det: any) => ({
        category: det.category,
        confidence: parseFloat((det.confidence * 100).toFixed(2)),
        count: 1,
        bbox: det.bbox ?? undefined,
      }))

      setDetectionResults(results)
      setIsProcessing(false)
      setIsDone(true)
      onDetectionComplete(results, url)

      const fishDetected = results.filter(
        (r) => r.category.toLowerCase() === 'fish' || r.category.toLowerCase() === 'dead_fish',
      )

      const deadFishDetected = results.filter((r) => r.category.toLowerCase() === 'dead_fish')
      const liveFishDetected = results.filter((r) => r.category.toLowerCase() === 'fish')

      console.log('🐟 Fish detection check:', { results, deadFishDetected, liveFishDetected })

      if (deadFishDetected.length > 0 && onDeadFishDetected) {
        console.log('💀 Dead fish detected, calling onDeadFishDetected')
        onDeadFishDetected(deadFishDetected.length)
      } else if (liveFishDetected.length > 0 && onFishDetected) {
        console.log('🐠 Live fish detected, calling onFishDetected')
        onFishDetected(liveFishDetected.length)
      } else if (fishDetected.length === 0 && onNoFishDetected) {
        console.log('✅ No fish detected')
        onNoFishDetected()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setIsProcessing(false)
      setPreview(null)
    }
  }

  const reset = () => {
    setPreview(null)
    setIsDone(false)
    setDetectionResults([])
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <ImageIcon size={16} className="text-teal-500" />
          AI Vision Test — {seabinId ?? 'SB-002'}
        </div>
        {isDone && (
          <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-200">
            Detection Complete
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {!preview ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 min-h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-teal-300 hover:bg-teal-50/30 transition-colors cursor-pointer"
        >
          <Upload size={32} className="text-slate-300" />
          <div className="text-sm text-slate-400">Upload an image to test AI detection</div>
          <div className="text-xs text-slate-300">JPG, PNG supported</div>
        </button>
      ) : (
        <div className="relative w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-1 min-h-[400px] flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              ref={imgRef}
              src={preview}
              alt="Uploaded"
              className="max-w-full max-h-full object-contain"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{ pointerEvents: 'none', maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
              <Loader2 size={28} className="text-teal-400 animate-spin" />
              <span className="text-white text-sm">AI model processing…</span>
            </div>
          )}

          {isDone && (
            <div className="absolute top-2 left-2 bg-teal-600/90 text-white text-xs px-2 py-1 rounded">
              {detectionResults.length} object{detectionResults.length !== 1 ? 's' : ''} detected
            </div>
          )}

          <button
            onClick={reset}
            className="absolute top-2 right-2 bg-white/80 text-slate-600 text-xs px-2 py-1 rounded hover:bg-white transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {isDone && detectionResults.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-400 mb-3">Detection Results</div>
          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {detectionResults.map((r, i) => (
              <div
                key={i}
                className="rounded-lg p-2 border text-xs"
                style={{
                  borderColor: colorFor(r.category) + '55',
                  background: colorFor(r.category) + '11',
                }}
              >
                <div className="flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: colorFor(r.category) }}
                  />
                  <span className="font-medium text-slate-700 capitalize truncate">
                    {r.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-400">×{r.count}</span>
                  <span className="font-semibold" style={{ color: colorFor(r.category) }}>
                    {r.confidence.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isDone && detectionResults.length === 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm text-amber-700">No objects detected in this image</div>
        </div>
      )}
    </div>
  )
}
