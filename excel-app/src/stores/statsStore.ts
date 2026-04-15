import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface MatchStat {
  goals: number | null
  goalsConceded: number | null
  duelsWon: number | null
}

const STORAGE_KEY = 'match-stats-p2013'

function load(): Record<number, MatchStat> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export const useStatsStore = defineStore('stats', () => {
  const stats = ref<Record<number, MatchStat>>(load())

  // Spara till localStorage vid varje ändring
  watch(stats, val => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  function setStat(colIndex: number, field: keyof MatchStat, value: number | null) {
    if (!stats.value[colIndex]) {
      stats.value[colIndex] = { goals: null, goalsConceded: null, duelsWon: null }
    }
    stats.value[colIndex][field] = value
  }

  function getStat(colIndex: number): MatchStat {
    return stats.value[colIndex] ?? { goals: null, goalsConceded: null, duelsWon: null }
  }

  return { stats, setStat, getStat }
})
