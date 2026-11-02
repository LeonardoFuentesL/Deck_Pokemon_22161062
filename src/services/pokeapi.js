const API_BASE_URL = 'https://pokeapi.co/api/v2'
export const MAX_POKEMON_ID = 1025
export const DEFAULT_DECK_SIZE = 40
export const BATCH_SIZE = 8

/**
 * Mapa fijo de los 18 tipos de Pokémon en español.
 * Se conserva la clave original en inglés para estilos/colores.
 */
export const TYPE_MAP_ES = Object.freeze({
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  electric: 'Eléctrico',
  grass: 'Planta',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
  fairy: 'Hada'
})

// Caché en memoria como respaldo y deduplicador de peticiones concurrentes
const memoryCache = new Map()

/**
 * Limpia saltos de línea (\n, \r, \f) y espacios múltiples en un texto.
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/[\r\n\f\v\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Formatea un nombre de especie o Pokémon eliminando sufijos de forma y guiones.
 */
function formatCleanPokemonName(rawName, isAlreadyLocalized = false) {
  if (!rawName || typeof rawName !== 'string') return 'Pokémon'
  if (isAlreadyLocalized) {
    return cleanText(rawName.replace(/-/g, ' '))
  }
  const withoutFormSuffix = rawName.replace(
    /-(normal|solo|incarnate|altered|land|red-striped|standard|ordinary|aria|baile|midday|disguised|amped|ice|full-belly|single-strike|male|plant|overcast|west|family-of-four|green-plumage|curly|two-segment|hero)$/i,
    ''
  )
  return cleanText(withoutFormSuffix.replace(/-/g, ' '))
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Verifica si un texto de flavor_text corresponde al aviso de movimiento retirado
 * ("no se puede usar" u "olvidarlo").
 */
function isRetiredFlavorText(text) {
  if (!text) return true
  const normalized = cleanText(text).toLowerCase()
  return (
    normalized.includes('no se puede usar') ||
    normalized.includes('olvidarlo')
  )
}

/**
 * Extrae el ID numérico desde una URL de PokéAPI o devuelve el valor si ya es ID.
 */
function extractIdFromUrl(urlOrId) {
  if (typeof urlOrId === 'number') return String(urlOrId)
  const parts = String(urlOrId).replace(/\/+$/, '').split('/')
  return parts[parts.length - 1]
}

/**
 * Lee un valor cacheado en sessionStorage de forma segura con try/catch.
 */
function readSessionCache(key) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(key)
      if (raw) return JSON.parse(raw)
    } else if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(key)
      if (raw) return JSON.parse(raw)
    }
  } catch {
    // Si sessionStorage está bloqueado o falla, usar memoryCache como respaldo
  }
  return null
}

/**
 * Guarda un valor en sessionStorage de forma segura con try/catch.
 */
function writeSessionCache(key, value) {
  try {
    const serialized = JSON.stringify(value)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, serialized)
    } else if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, serialized)
    }
  } catch {
    // Si sessionStorage excede cuota o está deshabilitado, memoryCache mantiene el respaldo
  }
}

/**
 * Obtiene y cachea en sessionStorage (+ memoryCache) el nombre en español desde /pokemon-species/{id}.
 */
export async function fetchSpeciesName(idOrUrl, fallbackSlug = '') {
  const id = extractIdFromUrl(idOrUrl)
  const cacheKey = `pokeapi_species_${id}`

  const cachedInSession = readSessionCache(cacheKey)
  if (cachedInSession) {
    return cachedInSession
  }

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pokemon-species/${id}`)
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status} al consultar /pokemon-species/${id}`)
      }
      const data = await response.json()
      const names = Array.isArray(data.names) ? data.names : []
      const esEntry =
        names.find((n) => n.language?.name === 'es') ||
        names.find((n) => n.language?.name === 'es-419')

      const parsed = esEntry?.name
        ? {
            id: data.id,
            name: formatCleanPokemonName(esEntry.name, true),
            lang: 'es'
          }
        : {
            id: data.id,
            name: formatCleanPokemonName(data.name || fallbackSlug, false),
            lang: 'en'
          }

      writeSessionCache(cacheKey, parsed)
      memoryCache.set(cacheKey, parsed)
      return parsed
    } catch {
      memoryCache.delete(cacheKey)
      return {
        id: Number(id),
        name: formatCleanPokemonName(fallbackSlug, false),
        lang: 'en'
      }
    }
  })()

  memoryCache.set(cacheKey, requestPromise)
  return requestPromise
}

/**
 * Procesa el JSON crudo de /ability/{id} o /move/{id} siguiendo las reglas de idioma:
 * - Nombre: names con language "es" -> "es-419" -> name de la API en inglés.
 * - Descripción: última entrada de flavor_text_entries con language "es" que NO contenga
 *   "no se puede usar" ni "olvidarlo".
 *   Si no queda ninguna en español, usa short_effect en inglés de effect_entries con lang: "en".
 */
function parseTraitPayload(data, kind) {
  const names = Array.isArray(data.names) ? data.names : []
  const esNameEntry =
    names.find((n) => n.language?.name === 'es') ||
    names.find((n) => n.language?.name === 'es-419')

  const name = cleanText(esNameEntry?.name || data.name || '')

  const flavorEntries = Array.isArray(data.flavor_text_entries)
    ? data.flavor_text_entries
    : []

  // Filtrar entradas en español descartando los avisos de movimientos retirados
  const validEsFlavors = flavorEntries.filter(
    (f) => f.language?.name === 'es' && !isRetiredFlavorText(f.flavor_text)
  )

  let description = ''
  let lang = 'es'

  if (validEsFlavors.length > 0) {
    const latestEsFlavor = validEsFlavors[validEsFlavors.length - 1]
    description = cleanText(latestEsFlavor.flavor_text)
    lang = 'es'
  }

  if (!description) {
    const effectEntries = Array.isArray(data.effect_entries)
      ? data.effect_entries
      : []
    const enEffect = effectEntries.find((e) => e.language?.name === 'en')
    const enFlavors = flavorEntries.filter((f) => f.language?.name === 'en')
    const latestEnFlavor =
      enFlavors.length > 0 ? enFlavors[enFlavors.length - 1] : null

    description = cleanText(
      enEffect?.short_effect ||
        enEffect?.effect ||
        latestEnFlavor?.flavor_text ||
        'No description available.'
    )
    lang = 'en'
  }

  return {
    id: data.id,
    name,
    description,
    lang,
    kind,
    power: data.power ?? null
  }
}

/**
 * Obtiene y cachea (en sessionStorage + memoryCache como respaldo) una habilidad (/ability/{id})
 * o un movimiento (/move/{id}).
 */
export async function fetchTraitDetails(kind, idOrUrl) {
  const id = extractIdFromUrl(idOrUrl)
  const cacheKey = `pokeapi_${kind}_${id}`

  const cachedInSession = readSessionCache(cacheKey)
  if (cachedInSession) {
    return { ...cachedInSession, kind }
  }

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)
  }

  const requestPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/${kind}/${id}`)
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status} al consultar /${kind}/${id}`)
    }
    const rawData = await response.json()
    const parsed = parseTraitPayload(rawData, kind)
    writeSessionCache(cacheKey, parsed)
    memoryCache.set(cacheKey, parsed)
    return parsed
  })()

  memoryCache.set(cacheKey, requestPromise)

  try {
    return await requestPromise
  } catch (error) {
    memoryCache.delete(cacheKey)
    throw error
  }
}

/**
 * Formatea el objeto público de habilidad/movimiento para la carta.
 */
function toPublicTrait(trait) {
  return {
    id: trait.id,
    name: trait.name,
    description: trait.description,
    lang: trait.lang,
    kind: trait.kind
  }
}

/**
 * Resuelve exactamente 2 habilidades para el Pokémon.
 * Si el Pokémon solo tiene 1 habilidad única, completa la segunda con un move real (kind: "move")
 * que tenga power !== null y descripción válida en español (lang === "es"); si no cumple, prueba otro.
 */
async function resolveTwoAbilities(rawAbilities = [], rawMoves = []) {
  const seenAbilityIds = new Set()
  const uniqueAbilityRefs = []

  for (const item of rawAbilities) {
    const url = item?.ability?.url
    if (!url) continue
    const id = extractIdFromUrl(url)
    if (!seenAbilityIds.has(id)) {
      seenAbilityIds.add(id)
      uniqueAbilityRefs.push({ id, name: item.ability.name })
    }
    if (uniqueAbilityRefs.length === 2) break
  }

  const resolved = (
    await Promise.all(
      uniqueAbilityRefs.map((ref) => fetchTraitDetails('ability', ref.id))
    )
  ).map(toPublicTrait)

  if (resolved.length < 2 && rawMoves.length > 0) {
    let fallbackMove = null

    for (const moveItem of rawMoves) {
      const moveUrl = moveItem?.move?.url
      if (!moveUrl) continue
      const moveId = extractIdFromUrl(moveUrl)
      try {
        const moveDetail = await fetchTraitDetails('move', moveId)
        if (!fallbackMove || (fallbackMove.lang !== 'es' && moveDetail.lang === 'es')) {
          fallbackMove = moveDetail
        }
        const hasValidSpanishDesc =
          moveDetail.lang === 'es' &&
          Boolean(moveDetail.description) &&
          !isRetiredFlavorText(moveDetail.description)

        if (moveDetail.power !== null && hasValidSpanishDesc) {
          resolved.push(toPublicTrait(moveDetail))
          break
        }
      } catch {
        // Intentar con el siguiente movimiento si alguno falla
      }
    }

    if (resolved.length < 2 && fallbackMove) {
      resolved.push(toPublicTrait(fallbackMove))
    }
  }

  if (resolved.length < 2) {
    try {
      const backupMove = await fetchTraitDetails('move', 33)
      resolved.push(toPublicTrait(backupMove))
    } catch {
      // Si tampoco hay red para el movimiento de respaldo, el lote principal manejará el error
    }
  }

  return resolved.slice(0, 2)
}

/**
 * Extrae una estadística base por su nombre en PokéAPI.
 */
function getBaseStat(stats = [], statName) {
  const found = stats.find((s) => s.stat?.name === statName)
  return found?.base_stat ?? 0
}

/**
 * Consulta un Pokémon individual por ID (junto con su especie en español en el mismo lote)
 * y construye el objeto normalizado.
 */
export async function fetchPokemonById(id) {
  const [pokemonRes, speciesInfo] = await Promise.all([
    fetch(`${API_BASE_URL}/pokemon/${id}`),
    fetchSpeciesName(id)
  ])

  if (!pokemonRes.ok) {
    throw new Error(`Error HTTP ${pokemonRes.status} al consultar /pokemon/${id}`)
  }

  const data = await pokemonRes.json()

  const resolvedName =
    speciesInfo?.name && speciesInfo.name !== 'Pokémon'
      ? speciesInfo.name
      : formatCleanPokemonName(data.species?.name || data.name, false)

  const types = (data.types || []).map((t) => {
    const key = t.type?.name || 'normal'
    return {
      key,
      name: TYPE_MAP_ES[key] || key
    }
  })

  const officialArtwork =
    data.sprites?.other?.['official-artwork']?.front_default || null
  const frontDefault = data.sprites?.front_default || null
  const image = officialArtwork || frontDefault || null

  const abilities = await resolveTwoAbilities(data.abilities, data.moves)

  return {
    id: data.id,
    name: resolvedName,
    types,
    hp: getBaseStat(data.stats, 'hp'),
    attack: getBaseStat(data.stats, 'attack'),
    defense: getBaseStat(data.stats, 'defense'),
    speed: getBaseStat(data.stats, 'speed'),
    height: (data.height ?? 0) / 10,
    weight: (data.weight ?? 0) / 10,
    image,
    abilities
  }
}

/**
 * Genera `count` IDs aleatorios únicos entre 1 y MAX_POKEMON_ID,
 * excluyendo cualquier ID presente en `excludedIds`.
 */
export function generateUniqueRandomIds(
  count = DEFAULT_DECK_SIZE,
  excludedIds = new Set()
) {
  const selected = new Set()
  const maxAvailable = MAX_POKEMON_ID - excludedIds.size
  const target = Math.min(count, maxAvailable)

  while (selected.size < target) {
    const randomId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1
    if (!excludedIds.has(randomId) && !selected.has(randomId)) {
      selected.add(randomId)
    }
  }

  return Array.from(selected)
}

/**
 * Obtiene un mazo de exactamente `deckSize` (40 por defecto) Pokémon únicos
 * consultando PokéAPI en lotes de 8 con Promise.allSettled y reintentando con
 * nuevos IDs si alguna petición individual falla. Si un lote completo falla
 * (ej. sin conexión a internet), aborta inmediatamente lanzando un error.
 * @param {number} deckSize Cantidad de cartas a generar (40 por defecto)
 * @param {(loadedCount: number, total: number) => void} [onProgress] Callback opcional de progreso
 */
export async function fetchRandomDeck(
  deckSize = DEFAULT_DECK_SIZE,
  onProgress = null
) {
  const deck = []
  const triedIds = new Set()

  if (typeof onProgress === 'function') {
    onProgress(0, deckSize)
  }

  while (deck.length < deckSize && triedIds.size < MAX_POKEMON_ID) {
    const needed = deckSize - deck.length
    const currentBatchSize = Math.min(BATCH_SIZE, needed)
    const batchIds = generateUniqueRandomIds(currentBatchSize, triedIds)

    if (batchIds.length === 0) break
    batchIds.forEach((id) => triedIds.add(id))

    const results = await Promise.allSettled(
      batchIds.map((id) => fetchPokemonById(id))
    )

    let fulfilledInBatch = 0
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        deck.push(result.value)
        fulfilledInBatch++
        if (typeof onProgress === 'function') {
          onProgress(deck.length, deckSize)
        }
      }
    }

    if (fulfilledInBatch === 0) {
      throw new Error('No se pudo conectar con PokéAPI.')
    }
  }

  if (deck.length < deckSize) {
    throw new Error(
      `No fue posible completar las ${deckSize} cartas del mazo (se obtuvieron ${deck.length}).`
    )
  }

  return deck
}
