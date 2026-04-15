<template>
  <section
    v-if="matchesStore.allMatches.length > 0"
    class="match-section"
    aria-labelledby="matches-heading"
  >
    <h2 id="matches-heading">
      Kommande matcher
      <span class="match-count">({{ matchesStore.upcomingMatches.length }})</span>
    </h2>

    <p v-if="matchesStore.upcomingMatches.length === 0" role="status">
      Inga kommande matcher.
    </p>

    <ul class="match-list" aria-label="Lista över kommande matcher">
      <li
        v-for="match in matchesStore.upcomingMatches"
        :key="match.date.toISOString()"
        class="match-item"
        :class="{ 'training-match': match.type === 'training-match' }"
      >
        <article :aria-label="`${match.type === 'training-match' ? 'Träningsmatch' : 'Match'} mot ${match.opponent}, ${match.dayLabel}, ${match.time}`">
          <header class="match-header" :class="{ 'training-match-header': match.type === 'training-match' }">
            <span class="day-label">{{ match.dayLabel }}</span>
            <Tag
              :value="match.type === 'training-match' ? 'Träningsmatch' : 'Match'"
              :severity="match.type === 'training-match' ? 'secondary' : 'success'"
              aria-hidden="true"
            />
          </header>
          <div class="match-body">
            <p class="match-opponent">
              <i class="pi pi-users" aria-hidden="true" />
              <span>mot {{ match.opponent }}</span>
            </p>
            <p class="match-time">
              <i class="pi pi-clock" aria-hidden="true" />
              <span>{{ match.time }}</span>
            </p>
            <a
              :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.opponent)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="maps-link"
              :aria-label="`Hitta ${match.opponent} på Google Maps (öppnas i ny flik)`"
            >
              <i class="pi pi-map-marker" aria-hidden="true" />
              Hitta på karta
            </a>
          </div>
        </article>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { useMatchesStore } from '../stores/matchesStore'
import Tag from 'primevue/tag'

const matchesStore = useMatchesStore()
</script>

<style scoped>
.match-section {
  margin-top: 2.5rem;
}

h2 {
  margin-bottom: 1rem;
  color: #1a1a2e;
  font-size: 1.25rem;
}

.match-count {
  font-weight: 400;
  color: #2d2d4a;
  font-size: 1rem;
}

/* Återställ list-styling */
.match-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.match-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  background: #ffffff;
}

/* Matchers header: mörkblå (#1a3a6b) med vit text → kontrast 10.8:1 ✓ */
.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #1a3a6b;
  color: #ffffff;
}

/* Träningsmatchers header: mörkgrå (#2d2d4a) med vit text → kontrast 13.6:1 ✓ */
.training-match .match-header {
  background: #2d2d4a;
}

.day-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #ffffff;
}

.match-body {
  padding: 0.75rem 1rem;
}

/* Brödtext #1a1a2e på vit → kontrast 17.7:1 ✓ */
.match-opponent {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #1a1a2e;
  margin: 0 0 0.4rem;
}

/* Sekundär text #2d2d4a på vit → kontrast 13.6:1 ✓ */
.match-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2d2d4a;
  font-size: 0.9rem;
  margin: 0 0 0.75rem;
}

/* Google Maps-länk: mörkblå på vitt → kontrast 10.8:1 ✓ */
.maps-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a3a6b;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.maps-link:hover {
  color: #0f2347;
}
</style>
