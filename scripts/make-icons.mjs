// Genera los iconos PNG de la PWA a partir de public/favicon.svg
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
const svg = readFileSync('public/favicon.svg')
const out = async (name, size, pad = 0) => {
  const inner = Math.round(size * (1 - pad * 2))
  const img = await sharp(svg).resize(inner, inner).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: '#0b1e4a' } })
    .composite([{ input: img, gravity: 'center' }]).png().toFile(`public/${name}`)
}
await out('icon-192.png', 192)
await out('icon-512.png', 512)
await out('icon-180.png', 180)
await out('icon-maskable-512.png', 512, 0.12)
console.log('Iconos generados')
