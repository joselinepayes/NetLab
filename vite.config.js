import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// En GitHub Pages la app vive en https://USUARIO.github.io/NOMBRE-REPO/
// El workflow define BASE_PATH con el nombre real del repositorio.
// Por defecto se asume que el repositorio se llama "NetLab".
const base = process.env.BASE_PATH || '/NetLab/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-180.png'],
      manifest: {
        name: 'NetLab — Simuladores de Redes',
        short_name: 'NetLab',
        description: 'Simuladores interactivos de Redes de Computadoras: codificación convolucional paso a paso.',
        lang: 'es',
        theme_color: '#0b1e4a',
        background_color: '#0b1e4a',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: base + 'index.html',
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.js'] },
})
