<template>
  <section
    v-if="matchesStore.allMatches.length > 0"
    class="calendar-section"
    aria-labelledby="calendar-heading"
  >
    <h2 id="calendar-heading">Matchkalender {{ matchesStore.year }}</h2>

    <FullCalendar :options="calendarOptions" />

    <!-- Popup vid klick på match -->
    <div
      v-if="selected"
      class="match-popup"
      role="dialog"
      :aria-label="`Matchdetaljer: mot ${selected.opponent}`"
      aria-modal="true"
    >
      <div class="popup-inner">
        <button class="popup-close" aria-label="Stäng" @click="selected = null">
          <i class="pi pi-times" aria-hidden="true" />
        </button>
        <div class="popup-badge" :class="{ training: selected.isTrainingMatch }">
          {{ selected.isTrainingMatch ? 'Träningsmatch' : 'Match' }}
        </div>
        <h3 class="popup-opponent">mot {{ selected.opponent }}</h3>
        <p class="popup-detail">
          <i class="pi pi-calendar" aria-hidden="true" />
          {{ selected.dayLabel }}
        </p>
        <p class="popup-detail">
          <i class="pi pi-clock" aria-hidden="true" />
          {{ selected.time }}
        </p>
        <a
          :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.opponent)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="maps-link"
          :aria-label="`Hitta ${selected.opponent} på Google Maps (öppnas i ny flik)`"
        >
          <i class="pi pi-map-marker" aria-hidden="true" />
          Hitta på karta
        </a>
      </div>
    </div>
    <div v-if="selected" class="popup-backdrop" @click="selected = null" aria-hidden="true" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core'
import { useMatchesStore } from '../stores/matchesStore'
import type { Match } from '../stores/matchesStore'

const matchesStore = useMatchesStore()
const selected = ref<Match | null>(null)

const events = computed(() =>
  matchesStore.allMatches.map(m => ({
    title: `mot ${m.opponent}`,
    start: m.date.toISOString().slice(0, 10),
    backgroundColor: m.isTrainingMatch ? '#2d2d4a' : '#1a3a6b',
    borderColor: m.isTrainingMatch ? '#2d2d4a' : '#1a3a6b',
    textColor: '#ffffff',
    extendedProps: { match: m },
  }))
)

function onEventClick(arg: EventClickArg) {
  selected.value = arg.event.extendedProps.match as Match
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
  initialDate: matchesStore.allMatches[0]?.date ?? new Date(),
  events: events.value,
  eventClick: onEventClick,
  eventDisplay: 'block',
  height: 'auto',
  fixedWeekCount: false,
}))
</script>

<style scoped>
.calendar-section {
  margin-top: 2rem;
}

h2 {
  margin-bottom: 1rem;
  color: #1a1a2e;
  font-size: 1.25rem;
}

/* FullCalendar-anpassningar */
:deep(.fc) {
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: #1a1a2e;
}

:deep(.fc-toolbar-title) {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
}

:deep(.fc-button) {
  background: #1a3a6b !important;
  border-color: #1a3a6b !important;
  color: #ffffff !important;
  font-size: 0.85rem;
  border-radius: 4px !important;
}

:deep(.fc-button:hover) {
  background: #0f2347 !important;
  border-color: #0f2347 !important;
}

:deep(.fc-button:focus-visible) {
  outline: 3px solid #1a3a6b;
  outline-offset: 2px;
}

:deep(.fc-button-active) {
  background: #0f2347 !important;
  border-color: #0f2347 !important;
}

:deep(.fc-day-today) {
  background: #e8f0fe !important;
}

:deep(.fc-event) {
  cursor: pointer;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 0.8rem;
}

:deep(.fc-event:focus-visible) {
  outline: 3px solid #1a3a6b;
  outline-offset: 2px;
}

:deep(.fc-col-header-cell) {
  background: #f0f2f8;
  color: #1a1a2e;
  font-weight: 600;
}

/* Popup */
.popup-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
}

.match-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  width: min(360px, 90vw);
}

.popup-inner {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  position: relative;
}

.popup-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #2d2d4a;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 4px;
}
.popup-close:hover { color: #1a1a2e; }

.popup-badge {
  display: inline-block;
  background: #1a3a6b;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  margin-bottom: 0.5rem;
}
.popup-badge.training { background: #2d2d4a; }

.popup-opponent {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
  color: #1a1a2e;
}

.popup-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.4rem;
  color: #2d2d4a;
  font-size: 0.9rem;
}

/* Google Maps-länk: #1a3a6b på vitt → kontrast 10.8:1 ✓ */
.maps-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a3a6b;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.maps-link:hover { color: #0f2347; }
</style>
