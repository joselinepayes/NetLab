# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.
Los datos guardados (progreso, historiales, preferencias) viven en `localStorage` bajo el prefijo `netlab.` y **no se tocan** al actualizar.

## [1.1.1] — 2026-11-24

### Corregido (simulador de codificación por estados)
- **La entrada ahora se procesa de derecha a izquierda**, como enseña la profesora: se invierte el orden de los bits antes de codificar (`10101101` → `10110101`, `00110100` → `00101100`, `10011001` → `10011001`, `01011100` → `00111010`). La entrada original se muestra tal cual, sin invertirla.
- Flecha indicadora «Se lee de derecha a izquierda» sobre la entrada, y explicación gráfica con la entrada original y la secuencia invertida (resalta el bit actual desde la derecha).
- Animaciones, explicaciones, tabla de procedimiento (nueva columna «Posición»), métodos de diagrama / tabla / XOR, modo aprender (nueva sección sobre la dirección de lectura), práctica y examen actualizados.
- Ejercicios del repaso recalculados: `10101101` → `1101001010000100`, `00110100` → `0000110100101011`, `10011001` → `1101111110101111`. Las respuestas esperadas anteriores (calculadas de izquierda a derecha) se eliminaron.
- La salida se escribe en el orden en que se genera (primer par calculado a la izquierda). Si el ejemplo resuelto de la profesora usa otro orden, se ajusta en un solo lugar (`engine.js`).
- Pestaña «Árbol»: aviso de que su dirección de lectura se verificará por separado con el material original.

### Sin cambios
- Módulo CRC (algoritmo y dirección de sus divisiones), transiciones del diagrama, estado inicial 00, PWA y despliegue.
- Los historiales de examen/práctica del simulador convolucional guardados antes de esta corrección se conservan, pero sus calificaciones se obtuvieron con la dirección anterior.

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
