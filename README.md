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

Para agregar un simulador: crea `src/modules/<nombre>/index.jsx` y añádelo a `registry.js` con `status: 'ready'`. No se toca el módulo existente.

---

## Guía paso a paso (Windows, PowerShell)

Los comandos suponen que estás dentro de la carpeta del proyecto.

### 1. Ejecutar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:5173/NetLab/` (la base `/NetLab/` es intencional, coincide con GitHub Pages).

### 2. Verificar que no hay errores

```bash
npm test
npm run build
npm run preview
```

`npm test` debe mostrar todas las pruebas en verde; `npm run build` debe terminar sin errores; `npm run preview` sirve la versión de producción en `http://localhost:4173/NetLab/`.

### 3. Crear el repositorio en GitHub

En <https://github.com/new>: nombre **NetLab**, visibilidad Public, **sin** README/.gitignore/licencia (ya existen aquí). Pulsa *Create repository*.

> Si usas otro nombre de repositorio no necesitas cambiar nada: el workflow toma el nombre real automáticamente. Para pruebas locales con otro nombre: `$env:BASE_PATH="/otro-nombre/"; npm run build`.

### 4. Inicializar Git

```bash
git init
git branch -M main
git add .
git commit -m "NetLab: simulador de codificación convolucional"
```

(Si Git pide identidad: `git config --global user.name "Tu Nombre"` y `git config --global user.email "tu@correo.com"`.)

### 5. Subir el código

Reemplaza `TU_USUARIO`:

```bash
git remote add origin https://github.com/TU_USUARIO/NetLab.git
git push -u origin main
```

### 6. Configurar GitHub Pages

En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**. (Solo se hace una vez.)

### 7. Ejecutar el despliegue

El push a `main` ya lanzó el workflow `.github/workflows/deploy.yml` (instala, prueba, compila y publica). Revisa la pestaña **Actions**; también puedes lanzarlo a mano con *Run workflow*. Tarda 1–2 minutos. Si falló la primera vez por activar Pages tarde, usa *Re-run all jobs*.

### 8. Obtener el enlace público

```
https://TU_USUARIO.github.io/NetLab/
```

También aparece en Settings → Pages y en el job *deploy*.

### 9. Abrirla desde el teléfono

Escribe o envíate ese enlace y ábrelo en Chrome (Android) o Safari (iPhone). Espera a que cargue por completo **una vez con internet**.

### 10. Instalarla en la pantalla de inicio

- **Android (Chrome):** menú ⋮ → *Instalar aplicación* / *Agregar a pantalla de inicio*.
- **iPhone (Safari):** botón Compartir → *Agregar a pantalla de inicio*.
- **Windows/macOS/Linux (Chrome/Edge):** icono de instalar en la barra de direcciones.

Después abre NetLab desde el icono; funcionará sin conexión.

### 11. Publicar futuras actualizaciones

```bash
git add .
git commit -m "Describe tu cambio"
git push
```

GitHub Actions recompila y publica solo. La PWA se actualiza automáticamente: la próxima vez que abras la app con internet descargará la versión nueva (puede requerir cerrar y reabrir una vez).

---

## Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm test` | pruebas automatizadas |
| `npm run build` | compilación de producción (`dist/`) |
| `npm run preview` | previsualizar la compilación |
| `npm run icons` | regenerar iconos PWA desde `public/favicon.svg` |

## Privacidad

Nada sale de tu dispositivo: sin backend, sin analítica, sin API Keys. Borrar los datos del sitio en el navegador reinicia el progreso.
