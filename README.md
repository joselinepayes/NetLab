# NetLab — Simuladores de Redes de Computadoras

Aplicación web **gratuita, sin servidor, sin cuentas y sin IA** para estudiar Redes de Computadoras. Primer módulo completo: **codificación convolucional** con diagrama de estados interactivo, simulación paso a paso, tres métodos de resolución (diagrama, tabla, XOR), modo aprender, práctica y examen.

- React + Vite + Tailwind CSS 4 + SVG + Lucide
- PWA instalable y **funciona sin conexión** tras la primera carga
- Progreso guardado en `localStorage` (solo en tu dispositivo)
- Pruebas automatizadas con Vitest (incluye los 3 ejercicios oficiales)

## Diagrama usado

| Estado | Entrada | Salida | Nuevo estado |
|---|---|---|---|
| 00 | 0 / 1 | 00 / 11 | 00 / 10 |
| 10 | 0 / 1 | 01 / 10 | 01 / 11 |
| 01 | 0 / 1 | 11 / 00 | 00 / 10 |
| 11 | 0 / 1 | 10 / 01 | 01 / 11 |

XOR equivalente: `S1 = E⊕B`, `S2 = E⊕A⊕B`, nuevo estado = `E A`. Estado inicial `00`.

> **Árbol de codificación:** la pestaña está preparada pero sin activar; no se inventó ninguna rama. Cuando tengas la imagen original, se transcribe en `src/modules/convolutional/treeDefinition.js`.

## Estructura

```
src/
  App.jsx                    encabezado, tema claro/oscuro, carga de módulos
  modules/
    registry.js              registro de módulos (añadir CRC, VLAN, etc. aquí)
    convolutional/
      engine.js              algoritmos (3 métodos), validación, ejercicios, niveles
      simulatorState.js      reducer puro del reproductor
      StateDiagram.jsx       diagrama SVG reutilizable
      Simulator / Methods / Learn / Practice / Exam / TreeModule .jsx
      engine.test.js         pruebas
  shared/                    almacenamiento local, componentes UI comunes
```

