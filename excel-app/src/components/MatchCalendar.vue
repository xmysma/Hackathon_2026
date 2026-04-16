<template>
  <section
    class="calendar-section"
    aria-labelledby="calendar-heading"
  >
    <h2 id="calendar-heading">Kalender {{ store.allActivities.length > 0 ? store.year : new Date().getFullYear() }}</h2>

    <div class="legend" role="group" aria-label="Filtrera händelsetyper">
      <template v-if="store.allActivities.length > 0">
        <button
          v-for="(label, type) in LABELS"
          :key="type"
          class="legend-item"
          :class="{ inactive: !activeFilters.has(type) }"
          :aria-pressed="activeFilters.has(type)"
          :aria-label="`${label} – ${activeFilters.has(type) ? 'visas' : 'dold'}, klicka för att växla`"
          @click="toggleFilter(type)"
        >
          <span class="legend-dot" :style="{ background: ACTIVITY_COLOR[type] }" aria-hidden="true" />
          {{ label }}
        </button>
      </template>
      <button
        class="legend-item"
        :class="{ inactive: !activeFilters.has('wc') }"
        :aria-pressed="activeFilters.has('wc')"
        aria-label="VM 2026 – Sverige, klicka för att växla"
        @click="toggleFilter('wc')"
      >
        <span class="legend-dot" :style="{ background: WC_COLOR }" aria-hidden="true" />
        VM 2026 – Sverige
      </button>
      <button
        class="legend-item"
        :class="{ inactive: !activeFilters.has('allsvenskan') }"
        :aria-pressed="activeFilters.has('allsvenskan')"
        aria-label="Allsvenskan 2026, klicka för att växla"
        @click="toggleFilter('allsvenskan')"
      >
        <span class="legend-dot" :style="{ background: ALLSVENSKAN_COLOR }" aria-hidden="true" />
        Allsvenskan 2026
      </button>
    </div>

    <p v-if="wcStore.error" class="api-error" role="alert">
      <i class="pi pi-exclamation-triangle" aria-hidden="true" />
      {{ wcStore.error }}
    </p>
    <p v-if="allsvenskanStore.error" class="api-error" role="alert">
      <i class="pi pi-exclamation-triangle" aria-hidden="true" />
      {{ allsvenskanStore.error }}
    </p>

    <FullCalendar :options="calendarOptions" />

    <!-- Popup: lokal aktivitet -->
    <div
      v-if="selected"
      class="activity-popup"
      role="dialog"
      :aria-label="`Detaljer: ${selected.title}`"
      aria-modal="true"
      @keydown.escape="closeDialog"
    >
      <div class="popup-inner">
        <button ref="closeBtn" class="popup-close" aria-label="Stäng" @click="closeDialog">
          <i class="pi pi-times" aria-hidden="true" />
        </button>
        <div class="popup-badge" :style="{ background: ACTIVITY_COLOR[selected.type] }">
          {{ LABELS[selected.type] }}
        </div>
        <h3 class="popup-title">
          {{ selected.opponent ? `mot ${selected.opponent}` : selected.title }}
        </h3>
        <p class="popup-detail">
          <i class="pi pi-calendar" aria-hidden="true" />
          {{ selected.dayLabel }}
        </p>
        <p class="popup-detail">
          <i class="pi pi-clock" aria-hidden="true" />
          {{ selected.time }}
        </p>
        <a
          v-if="selected.opponent"
          :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.opponent)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="maps-link"
          :aria-label="`Hitta ${selected.opponent} på Google Maps (öppnas i ny flik)`"
        >
          <i class="pi pi-map-marker" aria-hidden="true" />
          Hitta på karta
        </a>
        <div v-if="selected.type === 'training'" class="attendance">
          <div class="attendance-stats">
            <div class="stat present">
              <i class="pi pi-check-circle" aria-hidden="true" />
              <span class="stat-number">{{ attendanceList.filter(p => p.attended).length }}</span>
              <span class="stat-label">Närvarande</span>
            </div>
            <div class="stat absent">
              <i class="pi pi-times-circle" aria-hidden="true" />
              <span class="stat-number">{{ attendanceList.filter(p => !p.attended).length }}</span>
              <span class="stat-label">Frånvarande</span>
            </div>
          </div>
        </div>

        <!-- Statistikinmatning för matcher -->
        <div v-if="selected.type === 'match' || selected.type === 'training-match'" class="match-stats-input">
          <h4 class="stats-heading">Matchstatistik</h4>
          <div class="stats-fields">
            <label class="stats-label" :for="`goals-${selected.colIndex}`">
              <i class="pi pi-circle-fill" aria-hidden="true" />
              Mål gjorda
            </label>
            <input
              :id="`goals-${selected.colIndex}`"
              type="number"
              min="0"
              max="99"
              class="stats-input"
              :value="statsStore.getStat(selected.colIndex).goals ?? ''"
              placeholder="–"
              aria-label="Antal mål gjorda"
              @change="statsStore.setStat(selected.colIndex, 'goals', ($event.target as HTMLInputElement).valueAsNumber || null)"
            />
            <label class="stats-label" :for="`goals-conceded-${selected.colIndex}`">
              <i class="pi pi-circle" aria-hidden="true" />
              Mål insläppta
            </label>
            <input
              :id="`goals-conceded-${selected.colIndex}`"
              type="number"
              min="0"
              max="99"
              class="stats-input"
              :value="statsStore.getStat(selected.colIndex).goalsConceded ?? ''"
              placeholder="–"
              aria-label="Antal mål insläppta"
              @change="statsStore.setStat(selected.colIndex, 'goalsConceded', ($event.target as HTMLInputElement).valueAsNumber || null)"
            />
            <label class="stats-label" :for="`duels-${selected.colIndex}`">
              <i class="pi pi-users" aria-hidden="true" />
              Dueller vunna
            </label>
            <input
              :id="`duels-${selected.colIndex}`"
              type="number"
              min="0"
              max="999"
              class="stats-input"
              :value="statsStore.getStat(selected.colIndex).duelsWon ?? ''"
              placeholder="–"
              aria-label="Antal dueller vunna"
              @change="statsStore.setStat(selected.colIndex, 'duelsWon', ($event.target as HTMLInputElement).valueAsNumber || null)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Popup: VM-match -->
    <div
      v-if="selectedWC"
      class="activity-popup"
      role="dialog"
      :aria-label="`VM-match: Sverige mot ${selectedWC.opponent}`"
      aria-modal="true"
      @keydown.escape="closeWCDialog"
    >
      <div class="popup-inner">
        <button ref="closeBtnWC" class="popup-close" aria-label="Stäng" @click="closeWCDialog">
          <i class="pi pi-times" aria-hidden="true" />
        </button>
        <div class="popup-badge" :style="{ background: WC_COLOR }">VM 2026</div>
        <h3 class="popup-title">Sverige mot {{ selectedWC.opponent }}</h3>
        <p class="popup-detail">
          <i class="pi pi-calendar" aria-hidden="true" />
          {{ selectedWC.date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long' }) }}
        </p>
        <p class="popup-detail">
          <i class="pi pi-clock" aria-hidden="true" />
          {{ selectedWC.time }}
        </p>
        <p v-if="selectedWC.venue" class="popup-detail">
          <i class="pi pi-map-marker" aria-hidden="true" />
          {{ selectedWC.venue }}
        </p>
        <a
          :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedWC.venue || selectedWC.opponent)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="maps-link"
          :aria-label="`Hitta ${selectedWC.venue || selectedWC.opponent} på Google Maps (öppnas i ny flik)`"
        >
          <i class="pi pi-map-marker" aria-hidden="true" />
          Hitta arenan på karta
        </a>
      </div>
    </div>

    <!-- Popup: Allsvenskan-match -->
    <div
      v-if="selectedAllsvenskan"
      class="activity-popup"
      role="dialog"
      :aria-label="`Allsvenskan: ${selectedAllsvenskan.homeTeam} vs ${selectedAllsvenskan.awayTeam}`"
      aria-modal="true"
      @keydown.escape="closeAllsvenskanDialog"
    >
      <div class="popup-inner">
        <button ref="closeBtnAllsvenskan" class="popup-close" aria-label="Stäng" @click="closeAllsvenskanDialog">
          <i class="pi pi-times" aria-hidden="true" />
        </button>
        <div class="popup-badge" :style="{ background: ALLSVENSKAN_COLOR }">Allsvenskan</div>
        <div class="allsvenskan-teams">
          <div class="allsvenskan-team">
            <img
              v-if="allsvenskanStore.teamBadges[selectedAllsvenskan.homeTeam]"
              :src="allsvenskanStore.teamBadges[selectedAllsvenskan.homeTeam]"
              :alt="selectedAllsvenskan.homeTeam"
              class="team-badge"
            />
            <span>{{ selectedAllsvenskan.homeTeam }}</span>
          </div>
          <span class="vs-sep">vs</span>
          <div class="allsvenskan-team">
            <img
              v-if="allsvenskanStore.teamBadges[selectedAllsvenskan.awayTeam]"
              :src="allsvenskanStore.teamBadges[selectedAllsvenskan.awayTeam]"
              :alt="selectedAllsvenskan.awayTeam"
              class="team-badge"
            />
            <span>{{ selectedAllsvenskan.awayTeam }}</span>
          </div>
        </div>
        <p class="popup-detail">
          <i class="pi pi-calendar" aria-hidden="true" />
          {{ new Date(selectedAllsvenskan.dateStr + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long' }) }}
        </p>
        <p class="popup-detail">
          <i class="pi pi-clock" aria-hidden="true" />
          {{ selectedAllsvenskan.time }}
        </p>
        <p v-if="selectedAllsvenskan.venue" class="popup-detail">
          <i class="pi pi-map-marker" aria-hidden="true" />
          {{ selectedAllsvenskan.venue }}
        </p>
        <a
          v-if="selectedAllsvenskan.venue"
          :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedAllsvenskan.venue)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="maps-link"
          :aria-label="`Hitta ${selectedAllsvenskan.venue} på Google Maps (öppnas i ny flik)`"
        >
          <i class="pi pi-map-marker" aria-hidden="true" />
          Hitta arenan på karta
        </a>
      </div>
    </div>

    <div v-if="selected || selectedWC || selectedAllsvenskan" class="popup-backdrop" @click="closeDialog(); closeWCDialog(); closeAllsvenskanDialog()" aria-hidden="true" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core'
import { useMatchesStore, ACTIVITY_COLOR } from '../stores/matchesStore'
import type { Activity, ActivityType } from '../stores/matchesStore'
import { useAttendanceStore } from '../stores/attendanceStore'
import { useStatsStore } from '../stores/statsStore'
import { useWCStore, WC_COLOR } from '../stores/wcStore'
import type { WCMatch } from '../stores/wcStore'
import { useAllsvenskanStore, ALLSVENSKAN_COLOR } from '../stores/allsvenskanStore'
import type { AllsvenskanMatch } from '../stores/allsvenskanStore'

const store = useMatchesStore()
const attendanceStore = useAttendanceStore()
const statsStore = useStatsStore()
const wcStore = useWCStore()
const allsvenskanStore = useAllsvenskanStore()

const selected = ref<Activity | null>(null)
const selectedWC = ref<WCMatch | null>(null)
const selectedAllsvenskan = ref<AllsvenskanMatch | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
const closeBtnWC = ref<HTMLButtonElement | null>(null)
const closeBtnAllsvenskan = ref<HTMLButtonElement | null>(null)
let lastFocusedEl: HTMLElement | null = null

const attendanceList = computed(() =>
  selected.value ? attendanceStore.getAttendance(selected.value.colIndex) : []
)

watch(selected, async (val) => {
  if (val) {
    lastFocusedEl = document.activeElement as HTMLElement
    await nextTick()
    closeBtn.value?.focus()
  } else {
    lastFocusedEl?.focus()
    lastFocusedEl = null
  }
})

watch(selectedWC, async (val) => {
  if (val) {
    lastFocusedEl = document.activeElement as HTMLElement
    await nextTick()
    closeBtnWC.value?.focus()
  } else {
    lastFocusedEl?.focus()
    lastFocusedEl = null
  }
})

watch(selectedAllsvenskan, async (val) => {
  if (val) {
    lastFocusedEl = document.activeElement as HTMLElement
    await nextTick()
    closeBtnAllsvenskan.value?.focus()
  } else {
    lastFocusedEl?.focus()
    lastFocusedEl = null
  }
})

function closeDialog() { selected.value = null }
function closeWCDialog() { selectedWC.value = null }
function closeAllsvenskanDialog() { selectedAllsvenskan.value = null }

onMounted(() => {
  wcStore.fetchMatches()
  allsvenskanStore.fetchMatches()
  allsvenskanStore.fetchTeamBadges()
})

const LABELS: Record<ActivityType, string> = {
  'match':          'Match',
  'training-match': 'Träningsmatch',
  'training':       'Träning',
}

type FilterKey = ActivityType | 'wc' | 'allsvenskan'
const ALL_FILTERS: FilterKey[] = ['match', 'training-match', 'training', 'wc', 'allsvenskan']
const activeFilters = ref<Set<FilterKey>>(new Set(ALL_FILTERS))

function toggleFilter(key: FilterKey) {
  const next = new Set(activeFilters.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  activeFilters.value = next
}

// Tidszonsäker datumformatering – undviker UTC-förskjutning från toISOString()
function localDateStr(d: Date): string {
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const events = computed(() => [
  ...(activeFilters.value.has('match') || activeFilters.value.has('training-match') || activeFilters.value.has('training')
    ? store.allActivities
        .filter(a => activeFilters.value.has(a.type))
        .map(a => ({
          title: a.opponent ? `mot ${a.opponent}` : a.title,
          start: localDateStr(a.date),
          backgroundColor: ACTIVITY_COLOR[a.type],
          borderColor:     ACTIVITY_COLOR[a.type],
          textColor: '#ffffff',
          extendedProps: { kind: 'local', activity: a },
        }))
    : []),
  ...(activeFilters.value.has('wc')
    ? wcStore.matches.map(m => ({
        title: `🏆 Sverige vs ${m.opponent}`,
        start: localDateStr(m.date),
        backgroundColor: WC_COLOR,
        borderColor:     WC_COLOR,
        textColor: '#ffffff',
        extendedProps: { kind: 'wc', match: m },
      }))
    : []),
  ...(activeFilters.value.has('allsvenskan')
    ? allsvenskanStore.matches.map(m => ({
        title: `${m.homeTeam} vs ${m.awayTeam}`,
        start: m.dateStr,
        backgroundColor: ALLSVENSKAN_COLOR,
        borderColor:     ALLSVENSKAN_COLOR,
        textColor: '#ffffff',
        extendedProps: { kind: 'allsvenskan', match: m },
      }))
    : []),
])

function onEventClick(arg: EventClickArg) {
  lastFocusedEl = arg.el as HTMLElement
  const kind = arg.event.extendedProps.kind
  if (kind === 'wc') {
    selectedWC.value = arg.event.extendedProps.match as WCMatch
  } else if (kind === 'allsvenskan') {
    selectedAllsvenskan.value = arg.event.extendedProps.match as AllsvenskanMatch
  } else {
    selected.value = arg.event.extendedProps.activity as Activity
  }
}

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, listPlugin],
  initialView: 'dayGridMonth',
  locale: 'sv',
  firstDay: 1,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,listYear',
  },
  buttonText: {
    today: 'Idag',
    month: 'Månad',
    list: 'Lista',
  },
  initialDate: new Date(),
  events: events.value,
  eventClick: onEventClick,
  eventDisplay: 'block',
  height: 'auto',
  fixedWeekCount: false,
}))
</script>

<style scoped>
.calendar-section { margin-top: 2rem; }

h2 {
  margin-bottom: 0.75rem;
  color: #1a1a2e;
  font-size: 1.25rem;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: #1a1a2e;
  font-weight: 500;
  background: none;
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: opacity 0.15s, border-color 0.15s;
}
.legend-item:hover {
  border-color: #1a1a2e;
}
.legend-item.inactive {
  opacity: 0.35;
}
.legend-item.inactive .legend-dot {
  filter: grayscale(1);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.api-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #b91c1c;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

:deep(.fc) { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; }
:deep(.fc-toolbar-title) { font-size: 1.1rem; font-weight: 600; color: #1a1a2e; }
:deep(.fc-button) {
  background: #1a3a6b !important; border-color: #1a3a6b !important;
  color: #ffffff !important; font-size: 0.85rem; border-radius: 4px !important;
}
:deep(.fc-button:hover) { background: #0f2347 !important; border-color: #0f2347 !important; }
:deep(.fc-button:focus-visible) { outline: 3px solid #1a3a6b; outline-offset: 2px; }
:deep(.fc-button-active) { background: #0f2347 !important; border-color: #0f2347 !important; }
:deep(.fc-day-today) { background: #e8f0fe !important; }
:deep(.fc-event) { cursor: pointer; border-radius: 3px; padding: 1px 4px; font-size: 0.8rem; }
:deep(.fc-event:focus-visible) { outline: 3px solid #1a3a6b; outline-offset: 2px; }
:deep(.fc-col-header-cell) { background: #f0f2f8; color: #1a1a2e; font-weight: 600; }

.popup-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45); z-index: 100;
}

.activity-popup {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101; width: min(360px, 90vw);
}

.popup-inner {
  background: #ffffff; border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  position: relative;
}

.popup-close {
  position: absolute; top: 0.75rem; right: 0.75rem;
  background: none; border: none; cursor: pointer;
  color: #2d2d4a; font-size: 1rem; padding: 0.25rem;
  border-radius: 4px; line-height: 1;
}
.popup-close:hover { color: #1a1a2e; }

.popup-badge {
  display: inline-block; color: #ffffff;
  font-size: 0.75rem; font-weight: 600;
  padding: 2px 8px; border-radius: 99px; margin-bottom: 0.6rem;
}

.popup-title {
  margin: 0 0 0.75rem; font-size: 1.05rem;
  color: #1a1a2e; padding-right: 1.5rem;
}

.popup-detail {
  display: flex; align-items: center; gap: 0.5rem;
  margin: 0 0 0.4rem; color: #2d2d4a; font-size: 0.9rem;
}

.maps-link {
  display: inline-flex; align-items: center; gap: 0.35rem;
  margin-top: 0.75rem; font-size: 0.875rem; font-weight: 600;
  color: #1a3a6b; text-decoration: underline; text-underline-offset: 2px;
}
.maps-link:hover { color: #0f2347; }

.attendance { margin-top: 1rem; border-top: 1px solid #e0e0e8; padding-top: 0.75rem; }
.attendance-stats { display: flex; gap: 1rem; }
.stat {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; gap: 0.2rem; padding: 0.75rem; border-radius: 8px;
}
.stat.present { background: #eaf4ee; color: #1e6b45; }
.stat.absent  { background: #fdeaea; color: #b91c1c; }
.stat-number { font-size: 2rem; font-weight: 700; line-height: 1; }
.stat-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

/* Statistikinmatning */
.match-stats-input {
  margin-top: 1rem;
  border-top: 1px solid #e0e0e8;
  padding-top: 0.75rem;
}

.stats-heading {
  margin: 0 0 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a2e;
}

.stats-fields {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.4rem 0.75rem;
}

.stats-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: #2d2d4a;
  font-weight: 500;
}

/* #1a1a2e text på vitt → kontrast 17.7:1 ✓ */
.stats-input {
  width: 5rem;
  padding: 0.35rem 0.5rem;
  border: 2px solid #c0c4d0;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  text-align: center;
  background: #fff;
}
.stats-input:focus {
  outline: 3px solid #1a3a6b;
  outline-offset: 1px;
  border-color: #1a3a6b;
}

/* Allsvenskan lagemblem */
.allsvenskan-teams {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.allsvenskan-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  flex: 1;
  min-width: 80px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1a2e;
  text-align: center;
}

.team-badge {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.vs-sep {
  font-size: 0.75rem;
  font-weight: 700;
  color: #888;
  flex-shrink: 0;
}
</style>
