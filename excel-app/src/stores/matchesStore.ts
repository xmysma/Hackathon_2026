import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useExcelStore } from './excelStore'

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, maj: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11,
}

export type ActivityType = 'match' | 'training-match' | 'training'

export interface Activity {
  date: Date
  dayLabel: string
  time: string
  title: string
  opponent: string   // tom sträng för träningar
  type: ActivityType
  colIndex: number   // kolumnposition i rawSheet, används för närvaro
}

// Bakgrundsfärg per typ (används i kalender och popup)
export const ACTIVITY_COLOR: Record<ActivityType, string> = {
  'match':          '#1a3a6b',
  'training-match': '#5c3d8f',
  'training':       '#1e6b45',
}

function classifyActivity(name: string): ActivityType {
  if (name.startsWith('Match mot'))       return 'match'
  if (name.startsWith('Träningsmatch mot')) return 'training-match'
  return 'training'
}

function parseHeader(header: string, year: number, colIndex: number): Activity | null {
  const lines = header.split(/\r?\n/)
  if (lines.length < 3) return null

  const dateParts = lines[0].trim().split(' ')
  if (dateParts.length < 3) return null

  const day = parseInt(dateParts[1])
  const month = MONTHS[dateParts[2].toLowerCase()]
  if (month === undefined || isNaN(day)) return null

  const name = lines[2].trim()
  const type = classifyActivity(name)
  const opponent = type !== 'training'
    ? name.replace(/^(Träningsmatch|Match) mot /, '').trim()
    : ''

  return {
    date: new Date(year, month, day),
    dayLabel: lines[0].trim(),
    time: lines[1].trim(),
    title: name,
    opponent,
    type,
    colIndex,
  }
}

export const useMatchesStore = defineStore('matches', () => {
  const excelStore = useExcelStore()

  const year = computed<number>(() => {
    for (const row of excelStore.rawSheet) {
      if (row[0] === 'Period' && row[1]) {
        const y = parseInt(String(row[1]))
        if (!isNaN(y)) return y
      }
    }
    return new Date().getFullYear()
  })

  const headerRow = computed<string[]>(() => {
    for (const row of excelStore.rawSheet) {
      if (row[0] === 'Person') return row as string[]
    }
    return []
  })

  const allActivities = computed<Activity[]>(() =>
    headerRow.value
      .map((h, i) => parseHeader(String(h), year.value, i))
      .filter((a): a is Activity => a !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  )

  const allMatches = computed(() =>
    allActivities.value.filter(a => a.type === 'match' || a.type === 'training-match')
  )

  const upcomingMatches = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return allMatches.value.filter(a => a.date >= today)
  })

  return { allActivities, allMatches, upcomingMatches, year }
})
