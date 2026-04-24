import { create } from 'zustand'
import { seabins as initialSeabins } from '../data/seabins'
import type { Seabin } from '../types'

interface SeabinStore {
  seabins: Seabin[]
  toggleStatus: (id: string) => void
  setStatus: (id: string, status: 'active' | 'paused' | 'inactive') => void
  incrementDeadFishCount: (id: string, count: number) => void
  updateDebrisIntensity: (id: string, intensity: number) => void
}

export const useSeabinStore = create<SeabinStore>((set) => ({
  seabins: initialSeabins,

  toggleStatus: (id) =>
    set((state) => ({
      seabins: state.seabins.map((sb) =>
        sb.id === id
          ? { ...sb, status: sb.status === 'active' ? 'paused' : 'active' }
          : sb,
      ),
    })),

  setStatus: (id, status) =>
    set((state) => ({
      seabins: state.seabins.map((sb) =>
        sb.id === id ? { ...sb, status } : sb
      ),
    })),

  incrementDeadFishCount: (id, count) =>
    set((state) => ({
      seabins: state.seabins.map((sb) =>
        sb.id === id ? { ...sb, dead_fish_today: sb.dead_fish_today + count } : sb
      ),
    })),

  updateDebrisIntensity: (id, intensity) =>
    set((state) => ({
      seabins: state.seabins.map((sb) =>
        sb.id === id ? { ...sb, debris_intensity: Math.min(1, intensity) } : sb
      ),
    })),
}))
