import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useExcelStore } from './excelStore'

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, maj: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11,
}

export interface Match {
  date: Date
  dayLabel: string
  time: string
  opponent: string
  isTrainingMatch: boolean
}

function parseActivityHeader(header: string, year: number): Match | null {
  const lines = header.split(/\r?\n/)
  if (lines.length < 3) return null

  const activityName = lines[2].trim()
  const isMatch = activityName.startsWith('Match mot')
  const isTrainingMatch = activityName.startsWith('Träningsmatch mot')
  if (!isMatch && !isTrainingMatch) return null

  const dateParts = lines[0].trim().split(' ')
  if (dateParts.length < 3) return null

  const day = parseInt(dateParts[1])
  const monthStr = dateParts[2].toLowerCase()
  const month = MONTHS[monthStr]
  if (month === undefined || isNaN(day)) return null

  const date = new Date(year, month, day)

  const opponent = activityName
    .replace(/^(Träningsmatch|Match) mot /, '')
    .trim()

  return {
    date,
    dayLabel: lines[0].trim(),
    time: lines[1].trim(),
    opponent,
    isTrainingMatch,
  }
}

export const useMatchesStore = defineStore('matches', () => {
  const excelStore = useExcelStore()

  const year = computed<number>(() => {
    const raw = excelStore.rawSheet
    for (const row of raw) {
      if (row[0] === 'Period' && row[1]) {
        const y = parseInt(String(row[1]))
        if (!isNaN(y)) return y
      }
    }
    return new Date().getFullYear()
  })

  const headerRow = computed<string[]>(() => {
    const raw = excelStore.rawSheet
    for (const row of raw) {
      if (row[0] === 'Person') return row as string[]
    }
    return []
  })

  const allMatches = computed<Match[]>(() => {
    return headerRow.value
      .map(h => parseActivityHeader(String(h), year.value))
      .filter((m): m is Match => m !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  })

  const upcomingMatches = computed<Match[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return allMatches.value.filter(m => m.date >= today)
  })

  const pastMatches = computed<Match[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return allMatches.value.filter(m => m.date < today)
  })

  return { allMatches, upcomingMatches, pastMatches, year }
})
