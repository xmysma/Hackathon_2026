import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useExcelStore } from './excelStore'

// Spelare = född >= 2000. Ledare = född <= 1999.
const PLAYER_MIN_BIRTH_YEAR = 2000

export interface Player {
  name: string
  birthYear: number
  rowIndex: number
}

export interface PlayerAttendance {
  name: string
  attended: boolean
}

export const useAttendanceStore = defineStore('attendance', () => {
  const excelStore = useExcelStore()

  const players = computed<Player[]>(() => {
    const raw = excelStore.rawSheet
    const headerIdx = raw.findIndex(r => r[0] === 'Person')
    if (headerIdx === -1) return []

    const result: Player[] = []
    for (let i = headerIdx + 1; i < raw.length; i++) {
      const row = raw[i]
      if (!row[0] || row[0] === 'Närvarande') continue
      const birthYear = parseInt(String(row[1]).slice(0, 4))
      if (!isNaN(birthYear) && birthYear < PLAYER_MIN_BIRTH_YEAR) continue
      result.push({ name: String(row[0]), birthYear, rowIndex: i })
    }
    return result
  })

  function getAttendance(colIndex: number): PlayerAttendance[] {
    const raw = excelStore.rawSheet
    return players.value.map(p => ({
      name: p.name,
      attended: raw[p.rowIndex]?.[colIndex] === 1,
    }))
  }

  return { players, getAttendance }
})
