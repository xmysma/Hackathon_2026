<template>
  <header class="site-header">
    <h1>Närvaroöversikt</h1>
  </header>

  <main id="main-content">
    <section aria-labelledby="upload-heading" class="upload-section">
      <h2 id="upload-heading" class="sr-only">Ladda upp fil</h2>
      <FileUpload
        mode="basic"
        accept=".xlsx,.xls,.csv"
        :auto="true"
        chooseLabel="Välj Excel-fil"
        :chooseButtonProps="{ 'aria-label': 'Välj Excel-fil att ladda upp' }"
        @select="onFileSelect"
      />
      <Button
        v-if="store.fileName"
        label="Statistik"
        severity="info"
        icon="pi pi-chart-bar"
        aria-label="Visa matchstatistik"
        @click="showStats = true"
      />
      <Button
        v-if="store.fileName"
        label="Rensa data"
        severity="secondary"
        icon="pi pi-times"
        aria-label="Rensa inläst data"
        @click="store.clear()"
      />
    </section>

    <div
      aria-live="polite"
      aria-atomic="true"
      class="status-region"
    >
      <output v-if="store.fileName" class="file-info">
        <i class="pi pi-file-excel" aria-hidden="true" />
        <span>{{ store.fileName }} – {{ store.rows.length }} rader inlästa</span>
      </output>
    </div>

    <div v-if="!store.fileName" class="empty-state" role="status">
      <i class="pi pi-upload" aria-hidden="true" style="font-size: 3rem; color: #1a3a6b" />
      <p>Ladda upp en Excel-fil för att komma igång</p>
    </div>

    <MatchCalendar />
    <StatsPanel v-if="showStats" @close="showStats = false" />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useExcelStore } from './stores/excelStore'
import MatchCalendar from './components/MatchCalendar.vue'
import StatsPanel from './components/StatsPanel.vue'
import FileUpload from 'primevue/fileupload'
import Button from 'primevue/button'

const store = useExcelStore()
const showStats = ref(false)

function onFileSelect(event: { files: File[] }) {
  const file = event.files[0]
  if (file) store.loadFile(file)
}
</script>

<style>
/* Återställ Vite-mallens globala stilar som krockar */
#app {
  width: 100%;
  max-width: 100%;
  text-align: left;
  border-inline: none;
}

* {
  box-sizing: border-box;
}

/* Skip-länk: synlig vid fokus, annars utanför skärmen */
.skip-link {
  position: absolute;
  top: -100%;
  left: 1rem;
  background: #1a3a6b;
  color: #ffffff;
  padding: 0.75rem 1.25rem;
  border-radius: 0 0 6px 6px;
  font-weight: 600;
  text-decoration: none;
  z-index: 9999;
}
.skip-link:focus {
  top: 0;
}

/* Skärmläsartext: visuellt dold men läsbar */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

body {
  margin: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #e8eaf0;
  color: #1a1a2e;
}

.site-header {
  background: #1a3a6b;
  padding: 1rem 2rem;
}

.site-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #ffffff;
  letter-spacing: normal;
}

main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem 3rem;
}

.upload-section {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.status-region {
  margin-bottom: 1rem;
  min-height: 2rem;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #1a1a2e;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  gap: 1rem;
  color: #2d2d4a;
  font-size: 1.1rem;
}

.data-table {
  margin-top: 0.5rem;
}

/* Tydliga fokusstilar för hela appen */
:focus-visible {
  outline: 3px solid #1a3a6b;
  outline-offset: 2px;
  border-radius: 2px;
}
</style>
