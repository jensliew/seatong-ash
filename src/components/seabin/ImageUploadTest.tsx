import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react'

interface DetectionResult {
  category: string
  confidence: number
  count: number
}

interface Props {
  onDetectionComplete: (results: DetectionResult[], imageUrl: string) => void
}

// Simulated AI detection results based on uploaded image
const mockDetectionResults: DetectionResult[] = [
  { category: 'Plastic Bottle', confidence: 0.96, count: 4 },
  { category: 'Plastic Bag', confidence: 0.91, count: 2 },
  { category: 'Aluminium Can', confidence: 0.87, count: 1 },
  { category: 'Fishing Net', confidence: 0.83, count: 1 },
]

export default function ImageUploadTest({ onDetectionComplete }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setPreview(url)
    setIsDone(false)

    // Simulate AI processing delay
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setIsDone(true)
      onDetectionComplete(mockDetectionResults, url)
    }, 2500)
  }

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <ImageIcon size={16} className="text-teal-500" />
          AI Vision Test — SB-002
        </div>
        {isDone && (
          <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-200">
            Detection Complete
          </span>
        )}
      </div>

      {!preview ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-teal-300 hover:bg-teal-50/30 transition-colors cursor-pointer"
        >
          <Upload size={32} className="text-slate-300" />
          <div className="text-sm text-slate-400">Upload an image to test AI detection</div>
          <div className="text-xs text-slate-300">JPG, PNG supported</div>
        </button>
      ) : (
        <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
          <img src={preview} alt="Uploaded" className="w-full h-full object-cover" />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
              <Loader2 size={28} className="text-teal-400 animate-spin" />
              <span className="text-white text-sm">AI model processing...</span>
            </div>
          )}
          {isDone && (
            <div className="absolute top-2 left-2 bg-teal-600 text-white text-xs px-2 py-1 rounded">
              AI Detected — {mockDetectionResults.length} categories
            </div>
          )}
          <button
            onClick={() => {
              setPreview(null)
              setIsDone(false)
              if (fileRef.current) fileRef.current.value = ''
            }}
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

      {isDone && (
        <div className="mt-4">
          <div className="text-xs text-slate-400 mb-2">Detection Results</div>
          <div className="grid grid-cols-2 gap-2">
            {mockDetectionResults.map((r, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <div className="text-sm font-medium text-slate-700">{r.category}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-400">Count: {r.count}</span>
                  <span className="text-xs text-teal-600 font-medium">{(r.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
