import type { Seabin } from '../../types'

const STATUS_COLLAR: Record<Seabin['status'], string> = {
  active: '#0d9488',
  paused: '#d97706',
  inactive: '#64748b',
}

const STATUS_PUMP: Record<Seabin['status'], string> = {
  active: '#0f766e',
  paused: '#92400e',
  inactive: '#334155',
}

const STATUS_LED: Record<Seabin['status'], string> = {
  active: '#2dd4bf',
  paused: '#fcd34d',
  inactive: '#94a3b8',
}

interface Props {
  /** Drives accent colours; falls back to active teal when absent. */
  seabin: Seabin | null
}

/** Single decorative seabin silhouette for the fleet header (no per-unit dots). */
export default function FleetHeaderSeabin({ seabin }: Props) {
  const status = seabin?.status ?? 'active'
  const collar = STATUS_COLLAR[status]
  const pump = STATUS_PUMP[status]
  const led = STATUS_LED[status]

  return (
    <div
      className="hidden shrink-0 lg:flex lg:items-center lg:justify-center"
      role="img"
      aria-label="Seabin floating debris collector"
    >
      <svg
        width={152}
        height={168}
        viewBox="0 0 152 168"
        className="drop-shadow-sm"
        aria-hidden
      >
        {/* water */}
        <ellipse cx={76} cy={118} rx={68} ry={14} fill="#bae6fd" opacity={0.45} />
        <path
          d="M12 118 Q76 108 140 118 L140 128 Q76 118 12 128 Z"
          fill="#7dd3fc"
          opacity={0.35}
        />
        {/* basket */}
        <path
          d="M52 72 L52 108 Q76 118 100 108 L100 72 Q76 62 52 72 Z"
          fill={pump}
          opacity={0.92}
        />
        <path
          d="M54 74 L54 104 Q76 112 98 104 L98 74"
          fill="none"
          stroke="#0f172a"
          strokeOpacity={0.25}
          strokeWidth={1.2}
        />
        {/* float collar */}
        <ellipse cx={76} cy={72} rx={44} ry={14} fill={collar} />
        <ellipse cx={76} cy={70} rx={36} ry={9} fill="#0f172a" opacity={0.35} />
        {/* intake rim */}
        <ellipse cx={76} cy={58} rx={34} ry={10} fill="#1e293b" />
        <ellipse cx={76} cy={56} rx={28} ry={7} fill="#0f172a" opacity={0.5} />
        {/* side pump */}
        <rect x={102} y={78} width={22} height={36} rx={3} fill={pump} />
        <rect x={106} y={84} width={14} height={22} rx={1} fill="#0f172a" opacity={0.35} />
        <circle cx={113} cy={92} r={3.5} fill={led}>
          <animate
            attributeName="opacity"
            values="0.55;1;0.55"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </circle>
        <path d="M100 88 L102 88" stroke="#1e293b" strokeWidth={3} strokeLinecap="round" />
      </svg>
    </div>
  )
}
