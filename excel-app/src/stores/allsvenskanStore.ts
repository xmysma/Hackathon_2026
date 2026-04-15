import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AllsvenskanMatch {
  id: string
  dateStr: string   // YYYY-MM-DD, tidszonsäkert
  time: string
  homeTeam: string
  awayTeam: string
  venue: string
}

export const ALLSVENSKAN_COLOR = '#0f766e'  // teal – kontrast 4.6:1 på vitt ✓

const LEAGUE_ID = '4347'
const SEASON    = '2026'
const ROUNDS    = 30   // Allsvenskan har 30 omgångar

function parseEvent(e: Record<string, string>): AllsvenskanMatch {
  return {
    id:       e.idEvent,
    dateStr:  e.dateEvent,           // redan YYYY-MM-DD från API:et, ingen konvertering behövs
    time:     e.strTime?.slice(0, 5) ?? '',
    homeTeam: e.strHomeTeam,
    awayTeam: e.strAwayTeam,
    venue:    e.strVenue ?? '',
  }
}

export const useAllsvenskanStore = defineStore('allsvenskan', () => {
  const matches = ref<AllsvenskanMatch[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMatches() {
    loading.value = true
    error.value = null
    try {
      // Hämta alla omgångar parallellt
      const results = await Promise.allSettled(
        Array.from({ length: ROUNDS }, (_, i) =>
          fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsround.php?id=${LEAGUE_ID}&r=${i + 1}&s=${SEASON}`)
            .then(r => r.json())
        )
      )

      const all: AllsvenskanMatch[] = []
      for (const result of results) {
        if (result.status === 'fulfilled') {
          for (const e of result.value.events ?? []) {
            all.push(parseEvent(e))
          }
        }
      }

      // Sortera kronologiskt och ta bort eventuella dubbletter
      const seen = new Set<string>()
      matches.value = all
        .filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true })
        .sort((a, b) => a.dateStr.localeCompare(b.dateStr))

    } catch {
      error.value = 'Kunde inte hämta Allsvenskan-matcher.'
    } finally {
      loading.value = false
    }
  }

  return { matches, loading, error, fetchMatches }
})
