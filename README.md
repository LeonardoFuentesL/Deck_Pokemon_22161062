# Deck Pokémon TCG — 22161062

- **Número de control:** 22161062
- **Materia:** Desarrollo de Servicios Web
- **Institución:** Instituto Tecnológico de Oaxaca (TecNM)

---

## Descripción

Aplicación web desarrollada con **Vue 3**, **Vite** y **Bootstrap 5** que genera un mazo de **40 cartas Pokémon aleatorias sin repetir** en una sola vista, con diseño inspirado en las cartas del juego de cartas coleccionables (**Pokémon TCG**) y datos obtenidos en tiempo real desde la [PokéAPI](https://pokeapi.co/).

---

## Qué muestra cada carta (`PokemonCard.vue`)

Cada carta del mazo incluye los 6 elementos solicitados en la actividad, completamente en español y sin inventar datos ajenos a la API:

1. **Nombre:** nombre oficial del Pokémon en español (obtenido de `/pokemon-species/{id}`).
2. **ID:** número de la Pokédex Nacional en la franja central (`N.º 25`) y en el pie de colección (`0025/1025`).
3. **Características:**
   - **PS** (Puntos de Salud) en la esquina superior derecha.
   - **Altura** (m) y **Peso** (kg) en la franja dorada bajo la ilustración.
   - **Ataque**, **Defensa** y **Velocidad** en el pie de la carta.
4. **Tipo(s):** traducidos al español (los 18 tipos oficiales), definiendo la paleta de color del marco y fondo de cada carta.
5. **2 Habilidades:** nombre y descripción oficial en español (consultados en `/ability/{id}`). Si un Pokémon solo cuenta con 1 habilidad en la API, el segundo espacio se completa con un movimiento real del Pokémon (`/move/{id}`) identificado con la etiqueta `Movimiento`.
6. **Imagen:** ilustración oficial (`official-artwork`), con respaldo a `front_default` o un placeholder SVG si el recurso no está disponible.

---

## Funcionalidades principales

- **40 cartas únicas garantizadas:** generación aleatoria entre los IDs `1` y `1025` usando `Set` y peticiones en lotes de 8 con `Promise.allSettled`, reemplazando automáticamente cualquier petición fallida hasta completar las 40 cartas.
- **Escalado proporcional tipo carta física:** uso de proporción `63 / 88` y unidades relativas al contenedor (`container-type: inline-size` y `cqw`) para que ninguna carta se deforme ni recorte texto en pantallas móviles, tablets o escritorio.
- **Caché de traducciones:** almacenamiento en `sessionStorage` (con respaldo en memoria) para evitar pedir dos veces la misma especie, habilidad o movimiento al generar nuevos mazos.
- **Estados de interfaz:** indicador de carga con progreso en tiempo real (`X de 40 cartas listas`), botón **Nuevo mazo** y alerta de error con botón **Reintentar** en caso de fallo de conexión.

---

## Tecnologías utilizadas

- **Vue 3** (Composition API con `<script setup>`)
- **Vite**
- **Bootstrap 5** (sistema de grilla responsiva y utilidades de layout)
- **CSS3** (Variables CSS, Flexbox y Container Queries)
- **JavaScript (ES6+)** y `fetch` nativo
- **PokéAPI v2** (`https://pokeapi.co/api/v2/`)

---

## Estructura del proyecto

```text
Deck_Pokemon_22161062/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js                     # Punto de entrada e importación de Bootstrap 5
    ├── App.vue                     # Componente raíz que monta DeckView
    ├── style.css                   # Estilos globales y fondo de la aplicación
    ├── components/
    │   └── PokemonCard.vue         # Componente de carta estilo Pokémon TCG
    ├── views/
    │   └── DeckView.vue            # Vista principal con barra superior, estados y grilla de 40 cartas
    └── services/
        └── pokeapi.js              # Servicio de consumo de PokéAPI, lotes, traducciones y caché
```

---

## Instalación y ejecución

Asegúrate de tener instalado [Node.js](https://nodejs.org/) (v18 o superior).

1. **Clonar el repositorio y entrar a la carpeta del proyecto:**
   ```bash
   git clone https://github.com/<TU_USUARIO>/Deck_Pokemon_22161062.git
   cd Deck_Pokemon_22161062
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre en el navegador la URL indicada en la terminal (por defecto `http://localhost:5173`).

4. **Generar la versión de producción (opcional):**
   ```bash
   npm run build
   ```
