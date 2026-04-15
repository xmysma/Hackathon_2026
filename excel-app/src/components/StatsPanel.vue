<template>
  <div class="stats-overlay" role="dialog" aria-modal="true" aria-labelledby="stats-heading" @keydown.escape="$emit('close')">
    <div class="stats-panel">

      <div class="stats-panel-header">
        <h2 id="stats-heading">Matchstatistik – P 2013 Grön</h2>
        <button ref="closeBtn" class="close-btn" aria-label="Stäng statistik" @click="$emit('close')">
          <i class="pi pi-times" aria-hidden="true" />
        </button>
      </div>

      <div v-if="matchesWithStats.length === 0" class="empty">
        <i class="pi pi-chart-bar" aria-hidden="true" style="font-size:2.5rem;color:#c0c4d0" />
        <p>Ingen statistik inlagd ännu.<br>Klicka på en match i kalendern för att lägga till.</p>
      </div>

      <template v-else>
        <!-- Sammanfattning -->
        <div class="summary-cards" aria-label="Totalt">
          <div class="summary-card">
            <span class="summary-number">{{ totalGoals }}</span>
            <span class="summary-label">Totalt mål gjorda</span>
          </div>
          <div class="summary-card conceded-card">
            <span class="summary-number">{{ totalConceded }}</span>
            <span class="summary-label">Totalt mål insläppta</span>
          </div>
          <div class="summary-card">
            <span class="summary-number">{{ totalDuels }}</span>
            <span class="summary-label">Totalt dueller vunna</span>
          </div>
          <div class="summary-card">
            <span class="summary-number">{{ avgGoals }}</span>
            <span class="summary-label">Mål gjorda/match</span>
          </div>
          <div class="summary-card conceded-card">
            <span class="summary-number">{{ avgConceded }}</span>
            <span class="summary-label">Mål insläppta/match</span>
          </div>
          <div class="summary-card">
            <span class="summary-number">{{ avgDuels }}</span>
            <span class="summary-label">Dueller/match</span>
          </div>
        </div>

        <!-- Stapeldiagram -->
        <div class="charts">
          <div class="chart-wrap">
            <h3 class="chart-title">Mål gjorda per match</h3>
            <div class="bar-chart" aria-label="Stapeldiagram – mål gjorda per match">
              <div v-for="m in matchesWithStats" :key="m.colIndex" class="bar-row">
                <span class="bar-label" :title="m.opponent">{{ m.shortLabel }}</span>
                <div class="bar-track" :aria-label="`${m.opponent}: ${m.goals ?? 0} mål gjorda`">
                  <div class="bar goals-bar" :style="{ width: barWidth(m.goals, maxGoals) }" />
                </div>
                <span class="bar-value">{{ m.goals ?? 0 }}</span>
              </div>
            </div>
          </div>

          <div class="chart-wrap">
            <h3 class="chart-title">Mål insläppta per match</h3>
            <div class="bar-chart" aria-label="Stapeldiagram – mål insläppta per match">
              <div v-for="m in matchesWithStats" :key="m.colIndex" class="bar-row">
                <span class="bar-label" :title="m.opponent">{{ m.shortLabel }}</span>
                <div class="bar-track" :aria-label="`${m.opponent}: ${m.goalsConceded ?? 0} mål insläppta`">
                  <div class="bar conceded-bar" :style="{ width: barWidth(m.goalsConceded, maxConceded) }" />
                </div>
                <span class="bar-value">{{ m.goalsConceded ?? 0 }}</span>
              </div>
            </div>
          </div>

          <div class="chart-wrap">
            <h3 class="chart-title">Dueller vunna per match</h3>
            <div class="bar-chart" aria-label="Stapeldiagram – dueller vunna per match">
              <div v-for="m in matchesWithStats" :key="m.colIndex" class="bar-row">
                <span class="bar-label" :title="m.opponent">{{ m.shortLabel }}</span>
                <div class="bar-track" :aria-label="`${m.opponent}: ${m.duelsWon ?? 0} dueller vunna`">
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
                <th scope="col" class="num-col">Mål gjorda</th>
                <th scope="col" class="num-col">Mål insläppta</th>
                <th scope="col" class="num-col">Dueller vunna</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in matchesWithStats" :key="m.colIndex">
                <td>{{ m.dayLabel }}</td>
                <td>{{ m.opponent }}</td>
                <td>{{ m.type === 'training-match' ? 'Träningsmatch' : 'Match' }}</td>
                <td class="num-col">{{ m.goals ?? '–' }}</td>
                <td class="num-col">{{ m.goalsConceded ?? '–' }}</td>
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

const totalGoals      = computed(() => matchesWithStats.value.reduce((s, m) => s + (m.goals ?? 0), 0))
const totalConceded   = computed(() => matchesWithStats.value.reduce((s, m) => s + (m.goalsConceded ?? 0), 0))
const totalDuels      = computed(() => matchesWithStats.value.reduce((s, m) => s + (m.duelsWon ?? 0), 0))
const avgGoals        = computed(() => matchesWithStats.value.length
  ? (totalGoals.value / matchesWithStats.value.length).toFixed(1) : '–')
const avgConceded     = computed(() => matchesWithStats.value.length
  ? (totalConceded.value / matchesWithStats.value.length).toFixed(1) : '–')
const avgDuels        = computed(() => matchesWithStats.value.length
  ? (totalDuels.value / matchesWithStats.value.length).toFixed(1) : '–')

const maxGoals    = computed(() => Math.max(1, ...matchesWithStats.value.map(m => m.goals ?? 0)))
const maxConceded = computed(() => Math.max(1, ...matchesWithStats.value.map(m => m.goalsConceded ?? 0)))
const maxDuels    = computed(() => Math.max(1, ...matchesWithStats.value.map(m => m.duelsWon ?? 0)))

function barWidth(val: number | null, max: number): string {
  if (!val) return '0%'
  return `${Math.round((val / max) * 100)}%`
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
  width: min(860px, 100%);
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

/* Sammanfattning */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: #f0f4ff;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.conceded-card {
  background: #fff0f0;
}

/* #8b1a1a på #fff0f0 → kontrast 9.4:1 ✓ */
.conceded-card .summary-number {
  color: #8b1a1a;
}

/* #1a3a6b på #f0f4ff → kontrast 8.4:1 ✓ */
.summary-number {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1a3a6b;
  line-height: 1;
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2d2d4a;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
}

/* Diagram */
.charts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 700px) {
  .charts { grid-template-columns: 1fr; }
}

.chart-wrap { min-width: 0; }

.chart-title {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a2e;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-row {
  display: grid;
  grid-template-columns: 80px 1fr 2rem;
  align-items: center;
  gap: 0.5rem;
}

.bar-label {
  font-size: 0.8rem;
  color: #2d2d4a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-track {
  background: #e8eaf0;
  border-radius: 4px;
  height: 20px;
  overflow: hidden;
}

.bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

/* #1a3a6b stapel */
.goals-bar    { background: #1a3a6b; }
/* #8b1a1a stapel – insläppta mål */
.conceded-bar { background: #8b1a1a; }
/* #1e6b45 stapel */
.duels-bar    { background: #1e6b45; }

.bar-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1a1a2e;
  text-align: right;
}

/* Tabell */
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

/* Tom vy */
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
