import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface WCMatch {
  id: string
  date: Date
  time: string
  homeTeam: string
  awayTeam: string
  venue: string
  opponent: string  // motståndaren (inte Sverige)
}

export const WC_COLOR = '#92400e'  // mörkbrun/guld – kontrast 7.2:1 på vitt ✓

export const useWCStore = defineStore('wc2026', () => {
  const matches = ref<WCMatch[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMatches() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(
        'https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=Sweden&s=2026'
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const events: Record<string, string>[] = (data.event ?? []).filter(
        (e: Record<string, string>) =>
          e.strLeague === 'FIFA World Cup' &&
          (e.strHomeTeam === 'Sweden' || e.strAwayTeam === 'Sweden')
      )

      matches.value = events.map(e => {
        const [year, month, day] = e.dateEvent.split('-').map(Number)
        return {
          id: e.idEvent,
          date: new Date(year, month - 1, day),
          time: e.strTime?.slice(0, 5) ?? '',
          homeTeam: e.strHomeTeam,
          awayTeam: e.strAwayTeam,
          venue: e.strVenue ?? '',
          opponent: e.strHomeTeam === 'Sweden' ? e.strAwayTeam : e.strHomeTeam,
        }
      })
    } catch {
      error.value = 'Kunde inte hämta VM-matcher från TheSportsDB.'
    } finally {
      loading.value = false
    }
  }

  return { matches, loading, error, fetchMatches }
})
