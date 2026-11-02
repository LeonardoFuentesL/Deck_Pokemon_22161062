<script setup>
import { computed, ref, watch } from 'vue'

defineOptions({
  name: 'PokemonCard'
})

const props = defineProps({
  pokemon: {
    type: Object,
    required: true
  }
})

const TYPE_PALETTE = Object.freeze({
  normal:   { primary: '#8a8d8a', light: '#f1f2ef', dark: '#4c4f4c', art: '#d5d8d2' },
  fire:     { primary: '#e63926', light: '#ffebe5', dark: '#8f1b0f', art: '#ffb59e' },
  water:    { primary: '#2578e8', light: '#e3f1ff', dark: '#12468f', art: '#9bcaff' },
  electric: { primary: '#ebb100', light: '#fff7d1', dark: '#7a5900', art: '#ffe47a' },
  grass:    { primary: '#389c24', light: '#e4f7df', dark: '#1c5910', art: '#9fe090' },
  ice:      { primary: '#2bb8db', light: '#e0faff', dark: '#126378', art: '#9eeeff' },
  fighting: { primary: '#d96514', light: '#ffead9', dark: '#7d3405', art: '#ffbe8f' },
  poison:   { primary: '#8b3cc4', light: '#f2e3ff', dark: '#4f1b75', art: '#d3a6f7' },
  ground:   { primary: '#9e5a24', light: '#f7eadb', dark: '#593010', art: '#deb992' },
  flying:   { primary: '#5e96de', light: '#e8f2ff', dark: '#294f82', art: '#b3d3ff' },
  psychic:  { primary: '#e33b73', light: '#ffe3ed', dark: '#87163c', art: '#ffa6c4' },
  bug:      { primary: '#7d9414', light: '#f1f6d4', dark: '#475407', art: '#cde07e' },
  rock:     { primary: '#9c9260', light: '#f3f0e1', dark: '#575130', art: '#d6ceb0' },
  ghost:    { primary: '#693c78', light: '#efe3f2', dark: '#3d1d47', art: '#c3a1cf' },
  dragon:   { primary: '#4958d9', light: '#e4e7ff', dark: '#232d85', art: '#a8b2fa' },
  dark:     { primary: '#594647', light: '#ebe4e4', dark: '#302425', art: '#bfb0b1' },
  steel:    { primary: '#528ea3', light: '#e3f0f5', dark: '#29505e', art: '#add0de' },
  fairy:    { primary: '#db5cdb', light: '#ffe6ff', dark: '#7d267d', art: '#f7b2f7' }
})

const imageFailed = ref(false)

watch(
  () => props.pokemon?.image,
  () => {
    imageFailed.value = false
  }
)

const primaryTypeKey = computed(() => {
  return props.pokemon?.types?.[0]?.key || 'normal'
})

const palette = computed(() => {
  return TYPE_PALETTE[primaryTypeKey.value] || TYPE_PALETTE.normal
})

const cardStyles = computed(() => ({
  '--tcg-primary': palette.value.primary,
  '--tcg-light': palette.value.light,
  '--tcg-dark': palette.value.dark,
  '--tcg-art': palette.value.art
}))

const formattedCardNumber = computed(() => {
  const num = String(props.pokemon?.id ?? 0).padStart(4, '0')
  return `${num}/1025`
})

const displayName = computed(() => {
  const raw = props.pokemon?.name || 'Pokémon'
  return raw.replace(/-/g, ' ')
})

function getTypeColor(key) {
  return (TYPE_PALETTE[key] || TYPE_PALETTE.normal).primary
}
</script>

<template>
  <article class="tcg-card" :style="cardStyles">
    <div class="tcg-card__inner">
      <!-- Encabezado: Nombre, PS y Tipo(s) -->
      <header class="tcg-header">
        <div class="tcg-header__top">
          <h2 class="tcg-name" :title="displayName">
            {{ displayName }}
          </h2>
          <div class="tcg-hp" aria-label="Puntos de salud">
            <span class="tcg-hp__label">PS</span>
            <span class="tcg-hp__value">{{ pokemon.hp }}</span>
          </div>
        </div>

        <div class="tcg-types">
          <span
            v-for="type in pokemon.types"
            :key="type.key"
            class="tcg-type-pill"
            :style="{ backgroundColor: getTypeColor(type.key) }"
          >
            {{ type.name }}
          </span>
        </div>
      </header>

      <!-- Recuadro de imagen con fondo según el tipo o placeholder -->
      <div class="tcg-art-frame">
        <img
          v-if="pokemon.image && !imageFailed"
          :src="pokemon.image"
          :alt="displayName"
          class="tcg-art-img"
          loading="lazy"
          @error="imageFailed = true"
        />
        <div
          v-else
          class="tcg-art-placeholder"
          role="img"
          :aria-label="`Sin imagen para ${displayName}`"
        >
          <svg class="tcg-pokeball-icon" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="6" />
            <path d="M6 50h88" stroke="currentColor" stroke-width="6" />
            <circle cx="50" cy="50" r="14" fill="currentColor" />
          </svg>
          <span>Sin imagen</span>
        </div>
      </div>

      <!-- Franja con N.º, Altura y Peso -->
      <div class="tcg-meta-strip">
        <span>N.º {{ pokemon.id }}</span>
        <span class="tcg-meta-sep">•</span>
        <span>Alt. {{ pokemon.height }} m</span>
        <span class="tcg-meta-sep">•</span>
        <span>Peso {{ pokemon.weight }} kg</span>
      </div>

      <!-- Dos bloques de habilidades -->
      <section class="tcg-abilities" aria-label="Habilidades">
        <div
          v-for="(ability, idx) in pokemon.abilities.slice(0, 2)"
          :key="`${ability.kind}-${ability.id}-${idx}`"
          class="tcg-ability"
        >
          <div class="tcg-ability__header">
            <span class="tcg-ability__dot"></span>
            <h3 class="tcg-ability__name" :title="ability.name">
              {{ ability.name }}
            </h3>
            <span
              v-if="ability.kind === 'move'"
              class="tcg-ability__tag tcg-ability__tag--move"
            >
              Movimiento
            </span>
          </div>
          <p class="tcg-ability__desc" :title="ability.description">
            {{ ability.description }}
          </p>
        </div>
      </section>

      <!-- Pie con Ataque, Defensa, Velocidad e ID 0025/1025 -->
      <footer class="tcg-footer">
        <div class="tcg-stats">
          <div class="tcg-stat">
            <span class="tcg-stat__label">Ataque</span>
            <strong class="tcg-stat__val">{{ pokemon.attack }}</strong>
          </div>
          <div class="tcg-stat">
            <span class="tcg-stat__label">Defensa</span>
            <strong class="tcg-stat__val">{{ pokemon.defense }}</strong>
          </div>
          <div class="tcg-stat">
            <span class="tcg-stat__label">Velocidad</span>
            <strong class="tcg-stat__val">{{ pokemon.speed }}</strong>
          </div>
        </div>

        <div class="tcg-footer__bottom">
          <span class="tcg-collection">PokéAPI</span>
          <span class="tcg-number">{{ formattedCardNumber }}</span>
        </div>
      </footer>
    </div>
  </article>
</template>

<style scoped>
.tcg-card {
  --tcg-primary: #8a8d8a;
  --tcg-light: #f1f2ef;
  --tcg-dark: #4c4f4c;
  --tcg-art: #d5d8d2;

  container-type: inline-size;
  width: 100%;
  max-width: 310px;
  min-width: 150px;
  aspect-ratio: 63 / 88;
  border-radius: 5.2% / 3.7%;
  padding: 2.9%;
  background: linear-gradient(
    145deg,
    #f6d95c 0%,
    var(--tcg-primary) 28%,
    var(--tcg-dark) 75%,
    #e2be36 100%
  );
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1.5px rgba(255, 255, 255, 0.35);
  color: #1b1e23;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tcg-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.5),
    0 0 12px var(--tcg-primary);
}

.tcg-card__inner {
  width: 100%;
  height: 100%;
  border-radius: 3.2cqw;
  padding: 2.5cqw 2.9cqw 2cqw;
  background: linear-gradient(
    165deg,
    var(--tcg-light) 0%,
    #ffffff 48%,
    var(--tcg-light) 100%
  );
  border: 0.65cqw solid var(--tcg-primary);
  display: flex;
  flex-direction: column;
  gap: 1.5cqw;
  overflow: hidden;
  min-height: 0;
}

/* Encabezado */
.tcg-header {
  display: flex;
  flex-direction: column;
  gap: 0.9cqw;
  flex-shrink: 0;
}

.tcg-header__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 2cqw;
  min-width: 0;
}

.tcg-name {
  margin: 0;
  font-size: 5.3cqw;
  font-weight: 800;
  line-height: 1.15;
  text-transform: capitalize;
  color: #15181e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.tcg-hp {
  display: flex;
  align-items: baseline;
  gap: 0.7cqw;
  flex-shrink: 0;
  color: #b81d13;
}

.tcg-hp__label {
  font-size: 3.5cqw;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.tcg-hp__value {
  font-size: 5.6cqw;
  font-weight: 900;
  line-height: 1;
}

.tcg-types {
  display: flex;
  flex-wrap: nowrap;
  gap: 1.3cqw;
  min-width: 0;
}

.tcg-type-pill {
  display: inline-block;
  padding: 0.35cqw 2.3cqw;
  border-radius: 999px;
  font-size: 3.2cqw;
  font-weight: 700;
  line-height: 1.3;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  box-shadow: 0 0.3cqw 0.6cqw rgba(0, 0, 0, 0.25);
  white-space: nowrap;
}

/* Recuadro de imagen */
.tcg-art-frame {
  position: relative;
  height: 32%;
  min-height: 0;
  flex-shrink: 0;
  border-radius: 2cqw;
  border: 0.95cqw solid #d4af37;
  background:
    radial-gradient(
      circle at 50% 55%,
      rgba(255, 255, 255, 0.92) 0%,
      var(--tcg-art) 58%,
      var(--tcg-primary) 100%
    );
  box-shadow:
    inset 0 0.6cqw 2.5cqw rgba(0, 0, 0, 0.22),
    0 0.3cqw 1cqw rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tcg-art-img {
  width: 86%;
  height: 92%;
  object-fit: contain;
  filter: drop-shadow(0 1.2cqw 1.8cqw rgba(0, 0, 0, 0.32));
}

.tcg-art-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2cqw;
  color: var(--tcg-dark);
  opacity: 0.78;
  font-size: 3.6cqw;
  font-weight: 700;
}

.tcg-pokeball-icon {
  width: 12cqw;
  height: 12cqw;
}

/* Franja de medidas */
.tcg-meta-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.6cqw;
  padding: 0.65cqw 1.8cqw;
  border-radius: 1.3cqw;
  background: linear-gradient(90deg, #e5c358 0%, #f9e699 50%, #d9b443 100%);
  border: 0.35cqw solid rgba(110, 82, 12, 0.45);
  font-size: 3.15cqw;
  font-weight: 700;
  font-style: italic;
  color: #2b2208;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.tcg-meta-sep {
  opacity: 0.6;
}

/* Bloques de habilidades */
.tcg-abilities {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 1.2cqw;
  padding: 0.3cqw 0;
  overflow: hidden;
}

.tcg-ability {
  background: rgba(255, 255, 255, 0.75);
  border: 0.35cqw solid rgba(0, 0, 0, 0.1);
  border-left: 1cqw solid var(--tcg-primary);
  border-radius: 1.6cqw;
  padding: 1.2cqw 1.9cqw;
  display: flex;
  flex-direction: column;
  gap: 0.55cqw;
  min-height: 0;
  overflow: hidden;
}

.tcg-ability__header {
  display: flex;
  align-items: center;
  gap: 1.5cqw;
  min-width: 0;
}

.tcg-ability__dot {
  width: 2.5cqw;
  height: 2.5cqw;
  border-radius: 50%;
  background: var(--tcg-primary);
  flex-shrink: 0;
  box-shadow: 0 0 0 0.35cqw rgba(0, 0, 0, 0.25);
}

.tcg-ability__name {
  margin: 0;
  font-size: 3.9cqw;
  font-weight: 800;
  line-height: 1.15;
  color: #181b20;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.tcg-ability__tag {
  font-size: 2.75cqw;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.3cqw 1.5cqw;
  border-radius: 1.2cqw;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.tcg-ability__tag--move {
  background-color: var(--tcg-dark);
  color: #ffffff;
}

.tcg-ability__desc {
  margin: 0;
  font-size: 3.25cqw;
  line-height: 1.2;
  color: #323741;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Pie de carta */
.tcg-footer {
  margin-top: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9cqw;
}

.tcg-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2cqw;
  background: rgba(255, 255, 255, 0.84);
  border: 0.35cqw solid rgba(0, 0, 0, 0.14);
  border-radius: 1.6cqw;
  padding: 0.95cqw 1.2cqw;
  text-align: center;
}

.tcg-stat {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.tcg-stat + .tcg-stat {
  border-left: 0.35cqw solid rgba(0, 0, 0, 0.12);
}

.tcg-stat__label {
  font-size: 2.8cqw;
  font-weight: 700;
  text-transform: uppercase;
  color: #555b66;
}

.tcg-stat__val {
  font-size: 3.9cqw;
  font-weight: 900;
  color: #16191f;
}

.tcg-footer__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 2.9cqw;
  font-weight: 700;
  color: #494e57;
  padding: 0 0.6cqw;
}

.tcg-number {
  font-variant-numeric: tabular-nums;
}
</style>
