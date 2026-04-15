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

  const DEMO_RESULTS: MatchStat[] = [
    { goals: 3, goalsConceded: 1, duelsWon: 14 },
    { goals: 2, goalsConceded: 0, duelsWon: 11 },
    { goals: 1, goalsConceded: 2, duelsWon: 8  },
    { goals: 4, goalsConceded: 1, duelsWon: 15 },
    { goals: 2, goalsConceded: 2, duelsWon: 10 },
    { goals: 1, goalsConceded: 0, duelsWon: 12 },
    { goals: 0, goalsConceded: 3, duelsWon: 6  },
    { goals: 3, goalsConceded: 2, duelsWon: 13 },
    { goals: 2, goalsConceded: 1, duelsWon: 9  },
  ]

  function seedDemoData(colIndices: number[]) {
    colIndices.forEach((colIndex, i) => {
      stats.value[colIndex] = { ...DEMO_RESULTS[i % DEMO_RESULTS.length] }
    })
  }

  function clearAll() {
    stats.value = {}
  }

  return { stats, setStat, getStat, seedDemoData, clearAll }
})
