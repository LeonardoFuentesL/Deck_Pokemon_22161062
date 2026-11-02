<script setup>
import { ref, onMounted } from 'vue'
import PokemonCard from '../components/PokemonCard.vue'
import { fetchRandomDeck, DEFAULT_DECK_SIZE } from '../services/pokeapi.js'

const deck = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const loadedCount = ref(0)
const totalCount = ref(DEFAULT_DECK_SIZE)

async function generateNewDeck() {
  isLoading.value = true
  errorMessage.value = ''
  loadedCount.value = 0

  try {
    const cards = await fetchRandomDeck(
      DEFAULT_DECK_SIZE,
      (current, total) => {
        loadedCount.value = current
        totalCount.value = total
      }
    )
    deck.value = cards
  } catch {
    errorMessage.value =
      'No se pudo obtener el mazo desde PokéAPI. Revisa tu conexión e inténtalo nuevamente.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  generateNewDeck()
})
</script>

<template>
  <div class="deck-page">
    <!-- Encabezado sobrio que no compite con los colores de las cartas -->
    <header class="deck-header border-bottom border-secondary border-opacity-25">
      <div class="container py-3 py-md-4 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
        <div class="text-center text-sm-start">
          <h1 class="deck-title mb-1">Mazo Pokémon TCG</h1>
          <p class="deck-subtitle mb-0">
            Colección aleatoria de {{ totalCount }} cartas coleccionables en español
          </p>
        </div>

        <div class="d-flex align-items-center gap-3">
          <span
            v-if="!isLoading && !errorMessage"
            class="deck-counter-badge"
          >
            {{ deck.length }} / {{ totalCount }} cartas
          </span>

          <button
            type="button"
            class="btn btn-warning fw-bold px-4 py-2 deck-btn-new"
            :disabled="isLoading"
            @click="generateNewDeck"
          >
            {{ isLoading ? 'Generando...' : 'Nuevo mazo' }}
          </button>
        </div>
      </div>
    </header>

    <main class="container py-4 pb-5">
      <!-- Estado de carga con spinner y contador "X de 40" -->
      <section
        v-if="isLoading"
        class="deck-status-box text-center my-5 py-5"
        aria-live="polite"
      >
        <div
          class="spinner-border text-warning mb-3 deck-spinner"
          role="status"
          aria-hidden="true"
        ></div>
        <h2 class="h5 fw-bold mb-1">Repartiendo cartas del mazo...</h2>
        <p class="deck-progress-text mb-3">
          <strong>{{ loadedCount }} de {{ totalCount }}</strong> cartas listas
        </p>
        <div class="progress mx-auto deck-progress-bar" role="progressbar" :aria-valuenow="loadedCount" aria-valuemin="0" :aria-valuemax="totalCount">
          <div
            class="progress-bar bg-warning"
            :style="{ width: `${(loadedCount / totalCount) * 100}%` }"
          ></div>
        </div>
      </section>

      <!-- Estado de error con mensaje en español y botón "Reintentar" -->
      <section
        v-else-if="errorMessage"
        class="deck-status-box text-center my-5 py-5"
        role="alert"
      >
        <p class="h5 text-danger fw-bold mb-2">Error al cargar el mazo</p>
        <p class="text-secondary mb-4">{{ errorMessage }}</p>
        <button
          type="button"
          class="btn btn-outline-warning fw-bold px-4 py-2"
          @click="generateNewDeck"
        >
          Reintentar
        </button>
      </section>

      <!-- Grilla Bootstrap responsiva: 1 col (xs), 2 cols (sm), 3 cols (md), 4 cols (lg+) -->
      <section v-else aria-label="Cartas del mazo">
        <div class="row g-3 g-md-4 justify-content-center">
          <div
            v-for="pokemon in deck"
            :key="pokemon.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center"
          >
            <PokemonCard :pokemon="pokemon" />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.deck-page {
  min-height: 100vh;
}

.deck-header {
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(8px);
}

.deck-title {
  font-size: clamp(1.4rem, 2.5vw, 1.95rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #f8fafc;
}

.deck-subtitle {
  font-size: 0.92rem;
  color: #94a3b8;
}

.deck-counter-badge {
  font-size: 0.85rem;
  font-weight: 700;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 6px 12px;
  border-radius: 999px;
}

.deck-btn-new {
  color: #1e1b08;
  border-radius: 999px;
  box-shadow: 0 2px 10px rgba(234, 179, 8, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.deck-btn-new:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(234, 179, 8, 0.4);
}

.deck-status-box {
  max-width: 440px;
  margin-inline: auto;
  padding-inline: 20px;
}

.deck-spinner {
  width: 3rem;
  height: 3rem;
}

.deck-progress-text {
  font-size: 1.05rem;
  color: #cbd5e1;
}

.deck-progress-bar {
  height: 8px;
  max-width: 280px;
  background-color: rgba(255, 255, 255, 0.12);
}
</style>
