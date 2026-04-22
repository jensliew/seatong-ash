import { useEffect, useState } from 'react'

interface Options {
  ratePerSecond: number
  intervalMs?: number
  jitter?: number
}

export function useLiveCounter(initial: number, { ratePerSecond, intervalMs = 1500, jitter = 0.4 }: Options) {
  const [value, setValue] = useState(initial)

  useEffect(() => {
    const id = window.setInterval(() => {
      const base = (ratePerSecond * intervalMs) / 1000
      const variance = base * jitter * (Math.random() * 2 - 1)
      const increment = Math.max(0, base + variance)
      setValue((v) => v + increment)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, jitter, ratePerSecond])

  return value
}
