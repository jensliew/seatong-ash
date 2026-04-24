import { useEffect, useRef, useState } from 'react'
import { Video } from 'lucide-react'

interface Debris {
  x: number
  y: number
  w: number
  h: number
  speed: number
  type: string
  color: string
  shape: 'rect' | 'circle' | 'bag'
  detected: boolean
  confidence: number
}

interface FishObj {
  x: number
  y: number
  size: number
  speed: number
  dir: number
  wobbleOffset: number
  detected: boolean
  confidence: number
  alive: boolean
}

type Scenario = 'default' | 'ph_deadfish' | 'fish_haven' | 'heavy_pollution'

interface Props {
  seabinId: string
  scenario?: Scenario
  /** When true, skip the outer card wrapper — the parent provides the container */
  bare?: boolean
}

const debrisTypes = [
  { type: 'Plastic Bottle', color: '#4fc3f7', shape: 'rect' as const, w: 35, h: 55 },
  { type: 'Plastic Bag', color: '#e0e0e0', shape: 'bag' as const, w: 60, h: 45 },
  { type: 'Aluminium Can', color: '#bdbdbd', shape: 'circle' as const, w: 28, h: 28 },
  { type: 'Fishing Net', color: '#66bb6a', shape: 'rect' as const, w: 70, h: 30 },
]

export default function SimulatedStream({ seabinId, scenario = 'default', bare = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const debrisRef = useRef<Debris[]>([])
  const fishRef = useRef<FishObj[]>([])
  const frameRef = useRef(0)
  const [phase, setPhase] = useState<'calm' | 'approaching' | 'detecting'>('calm')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 800
    canvas.height = 450
    debrisRef.current = []
    fishRef.current = []
    frameRef.current = 0

    let startTime = Date.now()

    function spawnDebris() {
      const t = debrisTypes[Math.floor(Math.random() * debrisTypes.length)]
      debrisRef.current.push({
        x: -80 - Math.random() * 100,
        y: 120 + Math.random() * 250,
        w: t.w + Math.random() * 15,
        h: t.h + Math.random() * 10,
        speed: 0.4 + Math.random() * 0.6,
        type: t.type,
        color: t.color,
        shape: t.shape,
        detected: false,
        confidence: 0.55 + Math.random() * 0.42,
      })
    }

    function spawnFish(alive = true) {
      const dir = Math.random() > 0.5 ? 1 : -1
      fishRef.current.push({
        x: dir === 1 ? -60 : 860,
        y: 140 + Math.random() * 220,
        size: 18 + Math.random() * 16,
        speed: alive ? 0.6 + Math.random() * 1.0 : 0.15 + Math.random() * 0.2,
        dir,
        wobbleOffset: Math.random() * Math.PI * 2,
        detected: false,
        confidence: 0.80 + Math.random() * 0.18,
        alive,
      })
    }

    // Initial spawns based on scenario
    if (scenario === 'fish_haven') {
      for (let i = 0; i < 6; i++) spawnFish(true)
    } else if (scenario === 'heavy_pollution') {
      for (let i = 0; i < 5; i++) spawnDebris()
      for (let i = 0; i < 2; i++) spawnFish(false)
    } else if (scenario === 'ph_deadfish') {
      for (let i = 0; i < 2; i++) spawnFish(true)
      spawnFish(false)
    } else {
      for (let i = 0; i < 3; i++) spawnFish(true)
    }

    function getWaterColors() {
      if (scenario === 'heavy_pollution') {
        return { top: '#4a6b3a', mid1: '#5a7040', mid2: '#6a6535', bottom: '#7a5e30' }
      }
      if (scenario === 'fish_haven') {
        return { top: '#4a8a7b', mid1: '#5a9a6a', mid2: '#6aaa60', bottom: '#5a9a55' }
      }
      if (scenario === 'ph_deadfish') {
        return { top: '#5a7a6b', mid1: '#6a8a5a', mid2: '#7a8a50', bottom: '#8a8545' }
      }
      return { top: '#5d8a6b', mid1: '#6b9a5a', mid2: '#7a9450', bottom: '#8a8e45' }
    }

    function drawWater(ctx: CanvasRenderingContext2D, frame: number) {
      const c = getWaterColors()
      const grad = ctx.createLinearGradient(0, 0, 0, 450)
      grad.addColorStop(0, c.top)
      grad.addColorStop(0.3, c.mid1)
      grad.addColorStop(0.7, c.mid2)
      grad.addColorStop(1, c.bottom)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 800, 450)

      // Ripples
      ctx.globalAlpha = 0.08
      for (let i = 0; i < 12; i++) {
        const y = (i * 40 + frame * 0.3) % 480 - 20
        ctx.beginPath()
        ctx.moveTo(0, y)
        for (let x = 0; x < 800; x += 20) {
          ctx.lineTo(x, y + Math.sin((x + frame * 0.8) * 0.02) * 6)
        }
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Caustics
      for (let i = 0; i < 6; i++) {
        const cx = (i * 150 + frame * 0.2) % 900 - 50
        const cy = 100 + Math.sin(frame * 0.01 + i) * 80
        ctx.beginPath()
        ctx.ellipse(cx, cy, 40 + Math.sin(frame * 0.02 + i) * 10, 15, 0.3, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = scenario === 'heavy_pollution' ? 0.02 : 0.04
        ctx.fill()
      }

      // Murky particles (more for pollution)
      const particleCount = scenario === 'heavy_pollution' ? 60 : scenario === 'fish_haven' ? 15 : 30
      ctx.globalAlpha = scenario === 'heavy_pollution' ? 0.25 : 0.15
      for (let i = 0; i < particleCount; i++) {
        const px = (i * 73 + frame * 0.5) % 820 - 10
        const py = (i * 47 + frame * 0.2) % 470 - 10
        const size = Math.abs(1 + Math.sin(i + frame * 0.01) * (scenario === 'heavy_pollution' ? 2 : 1))
        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fillStyle = scenario === 'heavy_pollution' ? '#806030' : '#a0a060'
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // pH warning overlay for ph_deadfish scenario
      if (scenario === 'ph_deadfish') {
        const flicker = Math.sin(frame * 0.05) * 0.5 + 0.5
        if (flicker > 0.7) {
          ctx.fillStyle = '#ff000008'
          ctx.fillRect(0, 0, 800, 450)
        }
      }

      // Heavy murk overlay for pollution
      if (scenario === 'heavy_pollution') {
        ctx.fillStyle = '#40300010'
        ctx.fillRect(0, 0, 800, 450)
      }
    }

    function drawFish(ctx: CanvasRenderingContext2D, f: FishObj, frame: number) {
      ctx.save()
      const wobbleY = f.alive ? Math.sin(frame * 0.03 + f.wobbleOffset) * 4 : 0
      const tailWag = f.alive ? Math.sin(frame * 0.1 + f.wobbleOffset) * 0.3 : 0
      const tilt = f.alive ? 0 : 0.4 // dead fish tilt sideways

      ctx.translate(f.x, f.y + wobbleY)
      ctx.scale(f.dir, 1)
      ctx.rotate(tilt)

      // Body
      ctx.fillStyle = f.alive ? '#ff8a65' : '#8a8a8a'
      ctx.globalAlpha = f.alive ? 0.9 : 0.7
      ctx.beginPath()
      ctx.ellipse(0, 0, f.size, f.size * 0.45, 0, 0, Math.PI * 2)
      ctx.fill()

      // Belly
      ctx.fillStyle = f.alive ? '#ffcc80' : '#a0a0a0'
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.ellipse(2, f.size * 0.1, f.size * 0.6, f.size * 0.2, 0, 0, Math.PI * 2)
      ctx.fill()

      // Tail
      ctx.fillStyle = f.alive ? '#ef6c00' : '#666666'
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.moveTo(-f.size, 0)
      ctx.lineTo(-f.size * 1.5, -f.size * 0.5 + tailWag * f.size)
      ctx.lineTo(-f.size * 1.5, f.size * 0.5 + tailWag * f.size)
      ctx.closePath()
      ctx.fill()

      // Dorsal fin
      ctx.fillStyle = f.alive ? '#e65100' : '#555555'
      ctx.globalAlpha = 0.7
      ctx.beginPath()
      ctx.moveTo(-f.size * 0.2, -f.size * 0.4)
      ctx.lineTo(f.size * 0.2, -f.size * 0.75)
      ctx.lineTo(f.size * 0.4, -f.size * 0.35)
      ctx.closePath()
      ctx.fill()

      // Eye
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(f.size * 0.55, -f.size * 0.1, f.size * 0.15, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = f.alive ? '#1a1a1a' : '#666666'
      ctx.beginPath()
      ctx.arc(f.size * 0.58, -f.size * 0.1, f.size * 0.07, 0, Math.PI * 2)
      ctx.fill()

      // X eyes for dead fish
      if (!f.alive) {
        ctx.strokeStyle = '#cc0000'
        ctx.lineWidth = 2
        const ex = f.size * 0.55
        const ey = -f.size * 0.1
        const s = f.size * 0.1
        ctx.beginPath()
        ctx.moveTo(ex - s, ey - s)
        ctx.lineTo(ex + s, ey + s)
        ctx.moveTo(ex + s, ey - s)
        ctx.lineTo(ex - s, ey + s)
        ctx.stroke()
      }

      ctx.restore()
    }

    function drawFishBox(ctx: CanvasRenderingContext2D, f: FishObj) {
      if (!f.detected) return
      const pad = 14
      const bx = f.x - f.size * 1.6 - pad
      const by = f.y - f.size * 0.8 - pad
      const bw = f.size * 3.2 + pad * 2
      const bh = f.size * 1.6 + pad * 2

      const boxColor = f.alive ? '#00e676' : '#ff1744'
      ctx.strokeStyle = boxColor
      ctx.lineWidth = 2.5
      ctx.strokeRect(bx, by, bw, bh)

      const label = `${f.alive ? 'Fish' : 'Dead Fish'} ${f.confidence.toFixed(2)}`
      ctx.font = 'bold 13px monospace'
      const textW = ctx.measureText(label).width + 10
      const labelH = 20
      const labelY = by - labelH - 2

      ctx.fillStyle = boxColor
      ctx.fillRect(bx, labelY, textW, labelH)
      ctx.fillStyle = f.alive ? '#1a1a1a' : '#ffffff'
      ctx.fillText(label, bx + 5, labelY + 14)
    }

    function drawDebris(ctx: CanvasRenderingContext2D, d: Debris) {
      ctx.save()
      ctx.globalAlpha = 0.85
      if (d.shape === 'rect') {
        ctx.fillStyle = d.color
        ctx.strokeStyle = '#00000030'
        ctx.lineWidth = 1
        const wobble = Math.sin(Date.now() * 0.002 + d.y) * 3
        ctx.translate(d.x + d.w / 2, d.y + d.h / 2)
        ctx.rotate(wobble * 0.03)
        ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h)
        ctx.strokeRect(-d.w / 2, -d.h / 2, d.w, d.h)
        ctx.fillStyle = '#ffffff30'
        ctx.fillRect(-d.w / 2 + 3, -d.h / 2 + 3, d.w * 0.3, d.h * 0.5)
      } else if (d.shape === 'circle') {
        ctx.fillStyle = d.color
        ctx.beginPath()
        ctx.ellipse(d.x + d.w / 2, d.y + d.h / 2, d.w / 2, d.h / 2, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#00000030'
        ctx.stroke()
        ctx.beginPath()
        ctx.ellipse(d.x + d.w * 0.35, d.y + d.h * 0.35, d.w * 0.15, d.h * 0.15, 0, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff50'
        ctx.fill()
      } else {
        const wobble = Math.sin(Date.now() * 0.003 + d.x) * 5
        ctx.globalAlpha = 0.5
        ctx.fillStyle = d.color
        ctx.beginPath()
        ctx.moveTo(d.x, d.y + wobble)
        ctx.quadraticCurveTo(d.x + d.w * 0.3, d.y - 10 + wobble, d.x + d.w, d.y + 5 + wobble)
        ctx.quadraticCurveTo(d.x + d.w + 5, d.y + d.h * 0.6, d.x + d.w * 0.7, d.y + d.h + wobble)
        ctx.quadraticCurveTo(d.x + d.w * 0.3, d.y + d.h + 5 + wobble, d.x, d.y + wobble)
        ctx.fill()
        ctx.strokeStyle = '#00000020'
        ctx.stroke()
      }
      ctx.restore()
    }

    function drawDebrisBox(ctx: CanvasRenderingContext2D, d: Debris) {
      if (!d.detected) return
      const pad = 12
      const bx = d.x - pad
      const by = d.y - pad
      const bw = d.w + pad * 2
      const bh = d.h + pad * 2

      ctx.strokeStyle = '#ffd600'
      ctx.lineWidth = 2.5
      ctx.strokeRect(bx, by, bw, bh)

      const label = `${d.type} ${d.confidence.toFixed(2)}`
      ctx.font = 'bold 13px monospace'
      const textW = ctx.measureText(label).width + 10
      const labelH = 20
      const labelY = by - labelH - 2

      ctx.fillStyle = '#ffd600'
      ctx.fillRect(bx, labelY, textW, labelH)
      ctx.fillStyle = '#1a1a1a'
      ctx.fillText(label, bx + 5, labelY + 14)
    }

    // Sensor HUD overlay
    function drawSensorHUD(ctx: CanvasRenderingContext2D, frame: number) {
      if (scenario === 'ph_deadfish') {
        // Flickering pH reading
        const flicker = Math.sin(frame * 0.08) > 0.3
        ctx.fillStyle = '#00000070'
        ctx.fillRect(620, 10, 170, 50)
        ctx.font = '11px monospace'
        ctx.fillStyle = '#94a3b8'
        ctx.fillText('SENSOR READINGS', 630, 26)
        ctx.font = 'bold 13px monospace'
        ctx.fillStyle = flicker ? '#ff6b6b' : '#ffd600'
        const phVal = flicker ? (7.1 + Math.sin(frame * 0.05) * 0.8).toFixed(1) : '---'
        ctx.fillText(`pH: ${phVal}`, 630, 48)
        if (flicker && parseFloat(phVal) < 6.8) {
          ctx.fillStyle = '#ff6b6b'
          ctx.font = '10px monospace'
          ctx.fillText('⚠ ANOMALY', 720, 48)
        }
      }

      if (scenario === 'heavy_pollution') {
        ctx.fillStyle = '#00000070'
        ctx.fillRect(600, 10, 190, 70)
        ctx.font = '11px monospace'
        ctx.fillStyle = '#94a3b8'
        ctx.fillText('SENSOR READINGS', 610, 26)
        ctx.font = 'bold 13px monospace'
        ctx.fillStyle = '#ff6b6b'
        ctx.fillText('pH: 5.9  ⚠ LOW', 610, 46)
        ctx.fillStyle = '#ff6b6b'
        ctx.fillText('Turb: 95 NTU  ⚠ HIGH', 610, 66)
      }

      if (scenario === 'fish_haven') {
        const fishCount = fishRef.current.filter(f => f.x > 0 && f.x < 800).length
        ctx.fillStyle = '#00000070'
        ctx.fillRect(620, 10, 170, 50)
        ctx.font = '11px monospace'
        ctx.fillStyle = '#94a3b8'
        ctx.fillText('MARINE LIFE MONITOR', 630, 26)
        ctx.font = 'bold 13px monospace'
        ctx.fillStyle = '#00e676'
        ctx.fillText(`Fish detected: ${fishCount}`, 630, 48)
      }
    }

    function animate() {
      if (!ctx || !canvas) return
      frameRef.current++
      const frame = frameRef.current
      const elapsed = (Date.now() - startTime) / 1000

      // Phase timing varies by scenario
      const calmEnd = scenario === 'heavy_pollution' ? 3 : scenario === 'fish_haven' ? 4 : 5
      const approachEnd = scenario === 'heavy_pollution' ? 5 : scenario === 'fish_haven' ? 6 : 8

      if (elapsed < calmEnd) {
        setPhase('calm')
      } else if (elapsed < approachEnd) {
        setPhase('approaching')
        // Spawn based on scenario
        if (scenario === 'heavy_pollution' && frame % 30 === 0) spawnDebris()
        else if (scenario === 'ph_deadfish' && frame % 80 === 0) spawnDebris()
        else if (scenario === 'fish_haven' && frame % 120 === 0) spawnDebris()
        else if (scenario === 'default' && frame % 60 === 0) spawnDebris()
      } else {
        setPhase('detecting')
        if (scenario === 'heavy_pollution' && frame % 40 === 0) spawnDebris()
        else if (scenario === 'default' && frame % 90 === 0) spawnDebris()
        else if (scenario === 'ph_deadfish' && frame % 100 === 0) spawnDebris()
      }

      // Fish spawning
      if (scenario === 'fish_haven') {
        if (frame % 100 === 0 && fishRef.current.length < 8) spawnFish(true)
      } else if (scenario === 'heavy_pollution') {
        if (frame % 300 === 0 && fishRef.current.filter(f => !f.alive).length < 4) spawnFish(false)
      } else if (scenario === 'ph_deadfish') {
        if (frame % 200 === 0 && fishRef.current.length < 4) {
          if (Math.random() > 0.4) spawnFish(true)
          else spawnFish(false)
        }
      } else {
        if (frame % 180 === 0 && fishRef.current.length < 5) spawnFish(true)
      }

      drawWater(ctx, frame)

      // Draw fish
      fishRef.current = fishRef.current.filter((f) => f.dir === 1 ? f.x < 900 : f.x > -100)
      fishRef.current.forEach((f) => {
        f.x += f.speed * f.dir
        if (f.alive) f.y += Math.sin(Date.now() * 0.0008 + f.wobbleOffset) * 0.2

        drawFish(ctx, f, frame)

        if (f.x > 80 && f.x < 720 && !f.detected && elapsed > approachEnd) {
          f.detected = true
        }
        if (f.detected) drawFishBox(ctx, f)
      })

      // Draw debris
      debrisRef.current = debrisRef.current.filter((d) => d.x < 850)
      debrisRef.current.forEach((d) => {
        d.x += d.speed
        d.y += Math.sin(Date.now() * 0.001 + d.x * 0.01) * 0.3

        drawDebris(ctx, d)

        if (d.x > 150 && !d.detected && elapsed > approachEnd) {
          d.detected = true
        }
        if (d.detected) drawDebrisBox(ctx, d)
      })

      // Sensor HUD
      drawSensorHUD(ctx, frame)

      // Status bar
      const fishCount = fishRef.current.filter((f) => f.detected).length
      const deadFishCount = fishRef.current.filter((f) => f.detected && !f.alive).length
      const debrisCount = debrisRef.current.filter((d) => d.detected).length

      ctx.fillStyle = '#00000060'
      ctx.fillRect(0, 425, 800, 25)
      ctx.font = '11px monospace'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(
        `CAM-${seabinId}  |  ${new Date().toLocaleTimeString()}  |  AI: ${elapsed > approachEnd ? 'ACTIVE' : 'STANDBY'}  |  Fish: ${fishCount}  Dead: ${deadFishCount}  Debris: ${debrisCount}`,
        10, 440
      )

      // Loop
      const loopTime = scenario === 'heavy_pollution' ? 20 : 25
      if (elapsed > loopTime) {
        startTime = Date.now()
        debrisRef.current = []
        fishRef.current = []
        if (scenario === 'fish_haven') {
          for (let i = 0; i < 6; i++) spawnFish(true)
        } else if (scenario === 'heavy_pollution') {
          for (let i = 0; i < 5; i++) spawnDebris()
          for (let i = 0; i < 2; i++) spawnFish(false)
        } else if (scenario === 'ph_deadfish') {
          for (let i = 0; i < 2; i++) spawnFish(true)
          spawnFish(false)
        } else {
          for (let i = 0; i < 3; i++) spawnFish(true)
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
    }
  }, [seabinId, scenario])

  const phaseLabel = phase === 'detecting' ? 'AI Detecting' : phase === 'approaching' ? 'Activity Detected' : 'Monitoring'
  const phaseStyle = phase === 'detecting'
    ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
    : phase === 'approaching'
    ? 'bg-orange-50 text-orange-500 border-orange-200'
    : 'bg-teal-50 text-teal-600 border-teal-200'

  const canvas = (
    <div className="relative w-full flex-1 min-h-[200px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
      <canvas ref={canvasRef} className="w-full h-full object-cover rounded-lg" />
      {/* Phase pill overlaid on canvas when bare */}
      {bare && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${phaseStyle}`}>
            {phaseLabel}
          </span>
        </div>
      )}
    </div>
  )

  if (bare) {
    return (
      <div className="flex flex-col h-full gap-0">
        {canvas}
      </div>
    )
  }

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Video size={16} className="text-teal-500" />
          Live Stream — {seabinId}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${phaseStyle}`}>
            {phaseLabel}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>
      <div className="relative w-full flex-1 min-h-[200px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        <canvas ref={canvasRef} className="w-full h-full object-cover rounded-lg" />
      </div>
    </div>
  )
}
