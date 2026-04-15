<template>
  <div class="stats-overlay" role="dialog" aria-modal="true" aria-labelledby="stats-heading" @keydown.escape="$emit('close')">
    <div class="stats-panel">

      <div class="stats-panel-header">
        <h2 id="stats-heading">Matchstatistik – P 2013 Grön</h2>
        <div class="header-actions">
          <button
            v-if="matchesWithStats.length === 0 && matchStore.allMatches.length > 0"
            class="seed-btn"
            @click="seedDemo"
          >
            <i class="pi pi-database" aria-hidden="true" />
            Demo-data
          </button>
          <button ref="closeBtn" class="close-btn" aria-label="Stäng statistik" @click="$emit('close')">
            <i class="pi pi-times" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div v-if="matchesWithStats.length === 0" class="empty">
        <i class="pi pi-chart-bar" aria-hidden="true" style="font-size:2.5rem;color:#c0c4d0" />
        <p>Ingen statistik inlagd ännu.<br>Klicka på en match i kalendern för att lägga till.</p>
      </div>

      <template v-else>
        <!-- Rekordrad -->
        <div class="record-bar" aria-label="Säsongssammanfattning">
          <div class="record-item win">
            <span class="record-num">{{ wins }}</span>
            <span class="record-lbl">Vinster</span>
          </div>
          <div class="record-item draw">
            <span class="record-num">{{ draws }}</span>
            <span class="record-lbl">Oavgjorda</span>
          </div>
          <div class="record-item loss">
            <span class="record-num">{{ losses }}</span>
            <span class="record-lbl">Förluster</span>
          </div>
          <div class="record-divider" aria-hidden="true" />
          <div class="record-item" :class="goalDiffClass">
            <span class="record-num">{{ goalDiffLabel }}</span>
            <span class="record-lbl">Målskillnad</span>
          </div>
          <div class="record-item">
            <span class="record-num">{{ cleanSheets }}</span>
            <span class="record-lbl">Rena nollor</span>
          </div>
          <div class="record-item">
            <span class="record-num">{{ avgGoals }}–{{ avgConceded }}</span>
            <span class="record-lbl">Mål/match</span>
          </div>
          <div class="record-item">
            <span class="record-num">{{ avgDuels }}</span>
            <span class="record-lbl">Dueller/match</span>
          </div>
        </div>

        <!-- Diagram: mål + dueller -->
        <div class="charts">
          <!-- Grupperat mål-diagram -->
          <div class="chart-wrap chart-wide">
            <h3 class="chart-title">Mål per match</h3>
            <div class="grouped-legend">
              <span class="gl-dot goals-dot" aria-hidden="true" />Gjorda
              <span class="gl-dot conceded-dot" aria-hidden="true" style="margin-left:1rem" />Insläppta
            </div>
            <div class="bar-chart" aria-label="Stapeldiagram – mål per match">
              <div v-for="m in matchesWithStats" :key="m.colIndex" class="bar-row grouped">
                <span class="bar-label" :title="m.opponent">{{ m.shortLabel }}</span>
                <div class="bar-pair">
                  <div class="bar-track" :aria-label="`${m.opponent}: ${m.goals ?? 0} gjorda`">
                    <div class="bar goals-bar" :style="{ width: barWidth(m.goals, maxGoalsAny) }" />
                  </div>
                  <div class="bar-track" :aria-label="`${m.opponent}: ${m.goalsConceded ?? 0} insläppta`">
                    <div class="bar conceded-bar" :style="{ width: barWidth(m.goalsConceded, maxGoalsAny) }" />
                  </div>
                </div>
                <span class="bar-value">{{ m.goals ?? 0 }}–{{ m.goalsConceded ?? 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Dueller -->
          <div class="chart-wrap">
            <h3 class="chart-title">Dueller vunna/match</h3>
            <div class="bar-chart" aria-label="Stapeldiagram – dueller vunna per match">
              <div v-for="m in matchesWithStats" :key="m.colIndex" class="bar-row">
                <span class="bar-label" :title="m.opponent">{{ m.shortLabel }}</span>
                <div class="bar-track" :aria-label="`${m.opponent}: ${m.duelsWon ?? 0} dueller`">
                  <div class="bar duels-bar" :style="{ width: barWidth(m.duelsWon, maxDuels) }" />
                </div>
                <span class="bar-value">{{ m.duelsWon ?? 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabell -->
        <div class="stats-table-wrap">
          <h3 class="chart-title">Alla matcher</h3>
          <table class="stats-table">
            <thead>
              <tr>
                <th scope="col">Datum</th>
                <th scope="col">Motståndare</th>
                <th scope="col">Typ</th>
                <th scope="col" class="num-col">Resultat</th>
                <th scope="col" class="num-col">Dueller</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in matchesWithStats" :key="m.colIndex">
                <td>{{ m.dayLabel }}</td>
                <td>{{ m.opponent }}</td>
                <td>{{ m.type === 'training-match' ? 'Träningsmatch' : 'Match' }}</td>
                <td class="num-col result-cell" :class="resultClass(m)">
                  {{ m.goals ?? '–' }}–{{ m.goalsConceded ?? '–' }}
                </td>
                <td class="num-col">{{ m.duelsWon ?? '–' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { useMatchesStore } from '../stores/matchesStore'
import { useStatsStore } from '../stores/statsStore'

defineEmits<{ close: [] }>()

const matchStore = useMatchesStore()
const statsStore = useStatsStore()
const closeBtn = ref<HTMLButtonElement | null>(null)

onMounted(async () => {
  await nextTick()
  closeBtn.value?.focus()
})

const matchesWithStats = computed(() =>
  matchStore.allMatches
    .map(m => {
      const s = statsStore.getStat(m.colIndex)
      return { ...m, goals: s.goals, goalsConceded: s.goalsConceded, duelsWon: s.duelsWon }
    })
    .filter(m => m.goals !== null || m.goalsConceded !== null || m.duelsWon !== null)
    .map(m => ({
      ...m,
      shortLabel: m.opponent.split(' ').slice(0, 2).join(' '),
    }))
)

// W/D/L – räknas bara när båda mål är inlagda
const wins   = computed(() => matchesWithStats.value.filter(m => m.goals !== null && m.goalsConceded !== null && m.goals > m.goalsConceded).length)
const draws  = computed(() => matchesWithStats.value.filter(m => m.goals !== null && m.goalsConceded !== null && m.goals === m.goalsConceded).length)
const losses = computed(() => matchesWithStats.value.filter(m => m.goals !== null && m.goalsConceded !== null && m.goals < m.goalsConceded).length)

const totalGoals    = computed(() => matchesWithStats.value.reduce((s, m) => s + (m.goals ?? 0), 0))
const totalConceded = computed(() => matchesWithStats.value.reduce((s, m) => s + (m.goalsConceded ?? 0), 0))
const totalDuels    = computed(() => matchesWithStats.value.reduce((s, m) => s + (m.duelsWon ?? 0), 0))

const n = computed(() => matchesWithStats.value.length)
const avgGoals    = computed(() => n.value ? (totalGoals.value / n.value).toFixed(1)    : '–')
const avgConceded = computed(() => n.value ? (totalConceded.value / n.value).toFixed(1) : '–')
const avgDuels    = computed(() => n.value ? (totalDuels.value / n.value).toFixed(1)    : '–')

const goalDiff      = computed(() => totalGoals.value - totalConceded.value)
const goalDiffLabel = computed(() => goalDiff.value > 0 ? `+${goalDiff.value}` : String(goalDiff.value))
const goalDiffClass = computed(() => goalDiff.value > 0 ? 'positive' : goalDiff.value < 0 ? 'negative' : '')
const cleanSheets   = computed(() => matchesWithStats.value.filter(m => m.goalsConceded === 0).length)

const maxGoalsAny = computed(() => Math.max(1, ...matchesWithStats.value.map(m => Math.max(m.goals ?? 0, m.goalsConceded ?? 0))))
const maxDuels    = computed(() => Math.max(1, ...matchesWithStats.value.map(m => m.duelsWon ?? 0)))

function barWidth(val: number | null, max: number): string {
  if (!val) return '0%'
  return `${Math.round((val / max) * 100)}%`
}

function resultClass(m: { goals: number | null; goalsConceded: number | null }) {
  if (m.goals === null || m.goalsConceded === null) return ''
  if (m.goals > m.goalsConceded) return 'win'
  if (m.goals < m.goalsConceded) return 'loss'
  return 'draw'
}

function seedDemo() {
  statsStore.seedDemoData(matchStore.allMatches.map(m => m.colIndex))
}
</script>

<style scoped>
.stats-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 2rem 1rem;
}

.stats-panel {
  background: #ffffff;
  border-radius: 12px;
  width: min(900px, 100%);
  padding: 2rem;
  box-shadow: 0 16px 48px rgba(0,0,0,0.3);
}

.stats-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #1a1a2e;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #2d2d4a;
  padding: 0.25rem;
  border-radius: 4px;
  line-height: 1;
}
.close-btn:hover { color: #1a1a2e; }

.seed-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f0f4ff;
  border: 1px solid #c0cbe8;
  color: #1a3a6b;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
}
.seed-btn:hover { background: #dde6ff; }

/* ── Rekordrad ───────────────────────────── */
.record-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: stretch;
  background: #f5f7ff;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
}

.record-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0 0.75rem;
}

.record-divider {
  width: 1px;
  background: #d0d4e8;
  align-self: stretch;
  margin: 0 0.25rem;
}

.record-num {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
  color: #1a1a2e;
}

.record-lbl {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #5a5a7a;
  white-space: nowrap;
}

/* Vinst/förlust färgkodning */
.record-item.win  .record-num { color: #1e6b45; }
.record-item.draw .record-num { color: #92400e; }
.record-item.loss .record-num { color: #8b1a1a; }
.record-item.positive .record-num { color: #1e6b45; }
.record-item.negative .record-num { color: #8b1a1a; }

/* ── Diagram ────────────────────────────── */
.charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 640px) {
  .charts { grid-template-columns: 1fr; }
}

.chart-wrap { min-width: 0; }

.chart-title {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a2e;
}

.grouped-legend {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #4a4a6a;
  margin-bottom: 0.6rem;
}

.gl-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}
.goals-dot    { background: #1a3a6b; }
.conceded-dot { background: #8b1a1a; }

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* Enkel rad */
.bar-row {
  display: grid;
  grid-template-columns: 80px 1fr 2.5rem;
  align-items: center;
  gap: 0.5rem;
}

/* Grupperad rad: label | pair | value */
.bar-row.grouped {
  align-items: center;
}

.bar-pair {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bar-label {
  font-size: 0.78rem;
  color: #2d2d4a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-track {
  background: #e8eaf0;
  border-radius: 3px;
  height: 14px;
  overflow: hidden;
}

.bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.goals-bar    { background: #1a3a6b; }
.conceded-bar { background: #8b1a1a; }
.duels-bar    { background: #1e6b45; }

.bar-value {
  font-size: 0.78rem;
  font-weight: 600;
  color: #1a1a2e;
  text-align: right;
}

/* ── Tabell ─────────────────────────────── */
.stats-table-wrap { overflow-x: auto; }

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  color: #1a1a2e;
}

.stats-table th {
  background: #f0f2f8;
  padding: 0.6rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #1a1a2e;
  border-bottom: 2px solid #d0d4e0;
}

.stats-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e8eaf0;
}

.stats-table tr:last-child td { border-bottom: none; }
.stats-table tr:hover td { background: #f8f9ff; }
.num-col { text-align: center; }

.result-cell { font-weight: 700; }
.result-cell.win  { color: #1e6b45; }
.result-cell.draw { color: #92400e; }
.result-cell.loss { color: #8b1a1a; }

/* ── Tom vy ─────────────────────────────── */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  color: #4a4a6a;
  text-align: center;
  line-height: 1.6;
}
</style>
