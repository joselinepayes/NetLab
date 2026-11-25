import { ArrowDown, ArrowLeft } from 'lucide-react'
import { reverseBits } from './engine.js'

/** Flecha encima de la entrada: se lee de derecha a izquierda. */
export function DirectionArrow() {
  return (
    <div className="flex min-w-[15rem] items-center gap-2" style={{ color: 'var(--c-blue)' }} aria-label="Sentido de lectura: de derecha a izquierda">
      <ArrowLeft size={26} strokeWidth={3} className="shrink-0" />
      <span className="h-[3px] flex-1 rounded bg-current" />
      <span className="whitespace-nowrap text-xs font-extrabold uppercase tracking-wide">Se lee de derecha a izquierda</span>
    </div>
  )
}

function Cell({ bit, state, label }) {
  // state: current | done | pending | plain
  return (
    <span className="flex w-8 flex-col items-center">
      <span className={`mono inline-flex h-10 w-8 items-center justify-center rounded-md text-xl font-extrabold transition-all ${state === 'current' ? 'chip-yellow scale-110' : 'bg-[var(--c-bg)]'} ${state === 'pending' ? 'opacity-35' : ''}`}
        style={state === 'done' ? { background: 'var(--c-blue-soft)', color: 'var(--c-blue)' } : undefined}>
        {bit}
      </span>
      <span className="mono mt-0.5 text-[10px] muted">{label}</span>
    </span>
  )
}

/**
 * Explicación gráfica del orden de procesamiento.
 *  - Entrada original (sin invertir visualmente) con la flecha de lectura encima.
 *  - Secuencia invertida, que es la que realmente se codifica.
 * idx = paso actual del simulador (−1 = aún no iniciado).
 */
export default function ProcessingOrder({ bits, idx = -1, showReversed = true }) {
  const n = bits.length
  const proc = reverseBits(bits)
  const cur = idx >= 0 ? n - 1 - idx : -1 // posición actual en la entrada original
  const stateOrig = (i) => (idx < 0 ? 'plain' : i === cur ? 'current' : i > cur ? 'done' : 'pending')
  const stateProc = (k) => (idx < 0 ? 'plain' : k === idx ? 'current' : k < idx ? 'done' : 'pending')

  return (
    <div className="scroll-x pb-1">
      <div className="inline-block min-w-full">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide muted">Entrada original (se conserva tal cual)</p>
        <DirectionArrow />
        <div className="mt-1 inline-flex gap-1">
          {bits.split('').map((b, i) => <Cell key={i} bit={b} state={stateOrig(i)} label={`#${n - i}`} />)}
        </div>
        <p className="muted mb-1 text-[11px]">#k = en qué paso se procesa ese bit</p>
        {showReversed && (
          <>
            <div className="my-1 flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--c-blue)' }}>
              <ArrowDown size={18} /> Se invierte el orden: {bits} → <span className="mono">{proc}</span>
            </div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide muted">Orden de procesamiento (primero el bit de la derecha)</p>
            <div className="inline-flex gap-1">
              {proc.split('').map((b, k) => <Cell key={k} bit={b} state={stateProc(k)} label={`${k + 1}°`} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
