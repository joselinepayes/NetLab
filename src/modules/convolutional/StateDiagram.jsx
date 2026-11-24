import { useEffect, useMemo, useRef, useState } from 'react'
import { EDGES, STATES } from './engine.js'

const R = 40
export const NODES = {
  '00': { x: 350, y: 112 },
  '10': { x: 105, y: 290 },
  '01': { x: 595, y: 290 },
  '11': { x: 350, y: 468 },
}
// Curvatura de cada flecha (positivo = abombar hacia afuera en las flechas externas)
const CURV = {
  '00|1': 38, '10|1': 38, '11|0': 38, '01|0': 38, // anillo exterior
  '10|0': -78, '01|1': -78, // cuerdas centrales (una arriba, otra abajo)
}

function geometry(e) {
  const a = NODES[e.from], b = NODES[e.to ?? e.next]
  if (e.from === e.next) {
    const up = e.from === '00'
    const s = up ? 1 : -1
    const x = a.x, y = a.y
    const sx = x - 24, sy = y - s * 34, ex = x + 24, ey = y - s * 34
    const d = `M ${sx} ${sy} C ${x - 64} ${y - s * 112} ${x + 64} ${y - s * 112} ${ex} ${ey}`
    return { d, tip: { x: ex, y: ey }, dir: { x: -40, y: s * 78 }, label: { x, y: y - s * 92 }, push: { x: 0, y: -s }, loop: true }
  }
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy)
  const nx = -dy / len, ny = dx / len
  const c = CURV[e.id] ?? 0
  const cx = mx + nx * c * 2, cy = my + ny * c * 2
  const unit = (px, py) => { const l = Math.hypot(px, py); return { x: px / l, y: py / l } }
  const u0 = unit(cx - a.x, cy - a.y), u1 = unit(cx - b.x, cy - b.y)
  const s = { x: a.x + u0.x * R, y: a.y + u0.y * R }
  const t = { x: b.x + u1.x * (R + 3), y: b.y + u1.y * (R + 3) }
  const d = `M ${s.x} ${s.y} Q ${cx} ${cy} ${t.x} ${t.y}`
  const bx = 0.25 * s.x + 0.5 * cx + 0.25 * t.x, by = 0.25 * s.y + 0.5 * cy + 0.25 * t.y
  const side = Math.sign(c) || 1
  return { d, tip: t, dir: { x: t.x - cx, y: t.y - cy }, label: { x: bx, y: by }, push: { x: nx * side, y: ny * side } }
}

function useNarrow() {
  const q = '(max-width: 640px)'
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setN(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return n
}

const GEO = Object.fromEntries(EDGES.map((e) => [e.id, geometry(e)]))

function Arrow({ tip, dir, color, size = 13 }) {
  const l = Math.hypot(dir.x, dir.y)
  const ux = dir.x / l, uy = dir.y / l
  const px = -uy, py = ux
  const p = [
    [tip.x, tip.y],
    [tip.x - ux * size + px * size * 0.5, tip.y - uy * size + py * size * 0.5],
    [tip.x - ux * size - px * size * 0.5, tip.y - uy * size - py * size * 0.5],
  ].map((q) => q.join(',')).join(' ')
  return <polygon points={p} fill={color} className="edge" />
}

/** Partícula animada recorriendo la flecha seleccionada (requestAnimationFrame + getPointAtLength) */
function Particle({ d, duration, runKey }) {
  const pathRef = useRef(null)
  const dotRef = useRef(null)
  useEffect(() => {
    const path = pathRef.current, dot = dotRef.current
    if (!path || !dot) return
    const total = path.getTotalLength()
    let raf, t0
    dot.style.opacity = '1'
    const frame = (t) => {
      t0 ??= t
      const k = Math.min(1, (t - t0) / duration)
      const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
      const p = path.getPointAtLength(total * ease)
      dot.setAttribute('cx', p.x)
      dot.setAttribute('cy', p.y)
      if (k < 1) raf = requestAnimationFrame(frame)
      else dot.style.opacity = '0'
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [d, duration, runKey])
  return (
    <>
      <path ref={pathRef} d={d} fill="none" stroke="none" />
      <circle ref={dotRef} r="9" cx="-50" cy="-50" fill="var(--c-yellow)" stroke="#fff" strokeWidth="2.5" style={{ opacity: 0, filter: 'drop-shadow(0 0 6px var(--c-yellow))' }} />
    </>
  )
}

/**
 * Diagrama de estados interactivo.
 * - current / next: estados resaltados (azul / verde)
 * - selectedEdge: id de la flecha activa
 * - edgeStatus: { [edgeId]: 'ok' | 'bad' | 'pick' } para modo práctica
 * - onEdgeClick: hace las flechas seleccionables
 */
export default function StateDiagram({
  current = null, next = null, selectedEdge = null, edgeStatus = {}, onEdgeClick,
  particleKey = null, particleMs = 1000, dimOthers = true, ariaLabel = 'Diagrama de estados',
}) {
  const big = useNarrow()
  const sel = selectedEdge ? GEO[selectedEdge] : null
  const anyActive = !!selectedEdge || Object.keys(edgeStatus).length > 0
  const edgeColor = (e) => {
    const st = edgeStatus[e.id]
    if (st === 'ok') return 'var(--c-green)'
    if (st === 'bad') return 'var(--c-red)'
    if (st === 'pick') return 'var(--c-yellow)'
    if (e.id === selectedEdge) return 'var(--c-blue)'
    return 'var(--c-edge)'
  }
  const stateList = useMemo(() => STATES, [])

  return (
    <svg viewBox="0 -30 700 660" className="block h-auto w-full select-none" role="img" aria-label={ariaLabel}>
      {EDGES.map((e) => {
        const g = GEO[e.id]
        const active = e.id === selectedEdge || edgeStatus[e.id]
        const color = edgeColor(e)
        const opacity = active || !dimOthers || !anyActive ? 1 : 0.28
        const w = (active ? 6 : 3.2) * (big ? 1.5 : 1)
        const fs = big ? 34 : 20
        const lw = e.label.length * fs * 0.6 + fs
        const lh = fs * 1.6
        const push = g.loop ? (big ? 16 : 0) : (big ? 30 : 20)
        const lx = g.label.x + g.push.x * push, ly = g.label.y + g.push.y * push
        return (
          <g key={e.id} className="edge" style={{ opacity }} data-edge={e.id}>
            <path d={g.d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" className="edge" />
            <Arrow tip={g.tip} dir={g.dir} color={color} size={(active ? 17 : 14) * (big ? 1.5 : 1)} />
            <g transform={`translate(${lx},${ly})`}>
              <rect x={-lw / 2} y={-lh / 2} width={lw} height={lh} rx={10} fill={active ? color : 'var(--c-card)'} stroke={color} strokeWidth="2" />
              <text textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight="800" fill={active ? '#fff' : 'var(--c-text)'} className="mono">
                {e.label}
              </text>
            </g>
            {onEdgeClick && (
              <path
                d={g.d} fill="none" stroke="transparent" strokeWidth="34" style={{ cursor: 'pointer' }}
                role="button" tabIndex={0} aria-label={`Flecha ${e.label} desde ${e.from} hacia ${e.next}`}
                onClick={() => onEdgeClick(e)}
                onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && (ev.preventDefault(), onEdgeClick(e))}
              />
            )}
          </g>
        )
      })}

      {stateList.map((s) => {
        const n = NODES[s]
        const isCur = s === current, isNext = s === next
        const fill = isCur ? 'var(--c-blue)' : isNext ? 'var(--c-green)' : 'var(--c-node)'
        const stroke = isCur ? 'var(--c-blue)' : isNext ? 'var(--c-green)' : 'var(--c-node-stroke)'
        return (
          <g key={s} transform={`translate(${n.x},${n.y})`} className={isCur ? 'glow-blue' : isNext ? 'glow-green' : ''}>
            {isCur && isNext && <circle r={R + 8} fill="none" stroke="var(--c-green)" strokeWidth="5" />}
            <circle r={R} fill={fill} stroke={stroke} strokeWidth="4" style={{ transition: 'fill .3s, stroke .3s' }} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={big ? 36 : 28} fontWeight="800" className="mono" fill={isCur || isNext ? '#fff' : 'var(--c-text)'}>
              {s}
            </text>
          </g>
        )
      })}

      {sel && particleKey != null && <Particle d={sel.d} duration={particleMs} runKey={particleKey} />}
    </svg>
  )
}
