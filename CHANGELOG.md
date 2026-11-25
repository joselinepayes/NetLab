# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.
Los datos guardados (progreso, historiales, preferencias) viven en `localStorage` bajo el prefijo `netlab.` y **no se tocan** al actualizar.

## [1.1.0] — 2026-11-24

### Añadido
- **Módulo CRC — Comprobación de Redundancia Cíclica** (`src/modules/crc/`), independiente del resto de la app:
  - Aprender desde cero (polinomios interactivos, grado, ceros, XOR, división, trama, errores comunes).
  - Simulador en 5 etapas: mensaje → M(x), generador G(x), ceros agregados, división animada y construcción de T / T(x).
  - **División larga estilo cuaderno** (divisor, dividendo, cociente, XOR, resultados parciales, ceros tachados, flechas de los bits que bajan, residuo), con ampliar a pantalla completa y desplazamiento horizontal interno.
  - Dos métodos seleccionables con el mismo residuo: **detallado** (un bit a la vez) y **rápido/de clase** (omite ceros iniciales, baja varios bits).
  - XOR explicado columna por columna con tabla de verdad.
  - Verificación en el receptor y **simulador de errores** (Emisor → Canal → Receptor): invertir bits, errores aleatorios/múltiples, error no detectable.
  - Calculadora, ejercicios oficiales (G = 10011), práctica guiada con pistas progresivas, examen por niveles con cronómetro e historial.
  - Exportar: copiar resultado, copiar procedimiento completo, imprimir / guardar como PDF.
- **Aviso «Nueva versión disponible»** con botón *Actualizar* (PWA en modo `prompt`); búsqueda de actualizaciones cada hora y al volver a la app.
- Aviso «Listo: ya funciona sin conexión» tras la primera carga.
- Versión visible en el pie de página.
- Pruebas: motor CRC (ejercicios oficiales calculados, detallado = rápido en 1 500 casos, errores de 1 bit, validaciones) y lógica de práctica/examen.

### Cambiado
- El reproductor (`simulatorState`) pasó a `src/shared/playerState.js`; el módulo convolucional lo reexporta, sin cambios de comportamiento.
- Registro del service worker movido a `UpdatePrompt` (antes `autoUpdate`).

### Sin cambios
- Simulador de codificación convolucional, tema claro/oscuro, GitHub Pages y datos guardados.

## [1.0.0] — 2026-11-24
- Primera versión pública: simulador de codificación convolucional (diagrama de estados, tres métodos, aprender, práctica, examen), PWA offline y despliegue en GitHub Pages.
