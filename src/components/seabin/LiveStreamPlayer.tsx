import { Video } from 'lucide-react'

interface Props {
  seabinId: string
}

export default function LiveStreamPlayer({ seabinId }: Props) {
  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Video size={16} className="text-teal-500" />
          Live Stream — {seabinId}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-red-500">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Hardcoded video placeholder — replace src with actual stream URL */}
      <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
        <video
          className="w-full h-full object-cover rounded-lg"
          autoPlay
          muted
          loop
          playsInline
          src="https://www.w3schools.com/html/mov_bbb.mp4"
        />
        <div className="absolute top-2 left-2 bg-black/50 text-xs text-white px-2 py-1 rounded">
          CAM-{seabinId}
        </div>
      </div>
    </div>
  )
}
