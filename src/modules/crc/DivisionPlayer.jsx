import { useEffect, useMemo, useReducer, useState } from 'react'
import { Expand, Minimize2, Sigma } from 'lucide-react'
import LongDivision from './LongDivision.jsx'
import { buildStages, divide, xorColumns } from './engine.js'
import { initialSim, simReducer } from '../../shared/playerState.js'
import PlayerControls, { SPEEDS } from '../../shared/PlayerControls.jsx'

export function MethodSelect({ method, setMethod }) {
  const opts = [
    ['detailed', 'Detallado', 'Un bit a la vez; XOR con G o con ceros'],
    ['fast', 'Rápido (de clase)', 'Omite ceros iniciales y baja varios bits'],
  ]
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Método de división">
      {opts.map(([id, name, desc]) => (
        <button key={id} role="radio" aria-checked={method === id} onClick={() => setMethod(id)}
          className="rounded-xl border-2 p-3 text-left transition-colors"
          style={{ borderColor: method === id ? 'var(--c-blue)' : 'var(--c-border)', background: method === id ? 'var(--c-blue-soft)' : 'transparent' }}>
          <div className="font-bold">{name}</div>
          <div className="muted text-xs">{desc}</div>
        </button>
      ))}
    </div>
  )
}

export function XorExplain({ a, b }) {
  const cols = xorColumns(a, b)
  return (
    <div className="space-y-3 rounded-xl border border-[var(--c-border)] p-3 text-sm">
      <p className="font-bold">XOR columna por columna: <span className="mono">{a} ⊕ {b}</span></p>
      <div className="scroll-x">
        <div className="mono inline-flex gap-2">
          {cols.map((c, i) => (
            <div key={i} className="rounded-lg border border-[var(--c-border)] p-2 text-center">
              <div className="text-xs muted">col. {i + 1}</div>
              <div className="font-bold">{c.a} ⊕ {c.b}</div>
              <div className="text-lg font-extrabold text-[var(--c-green)]">= {c.r}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="mono">Resultado: <b className="text-[var(--c-green)]">{cols.map((c) => c.r).join('')}</b></p>
      <table className="mono w-full max-w-[240px] text-center">
        <thead><tr className="muted"><th>X</th><th>Y</th><th>X ⊕ Y</th></tr></thead>
        <tbody>
          {[[0, 0], [0, 1], [1, 0], [1, 1]].map(([x, y]) => {
            const used = cols.some((c) => +c.a === x && +c.b === y)
            return <tr key={`${x}${y}`} className={used ? 'chip-yellow font-extrabold' : ''}><td className="p-1">{x}</td><td>{y}</td><td>{x ^ y}</td></tr>
          })}
        </tbody>
      </table>
      <p className="muted text-xs">XOR da 1 solo si los bits son distintos. <b>No usa préstamos ni acarreos</b>: cada columna es independiente. (Las filas resaltadas son las que aparecen en esta operación.)</p>
    </div>
  )
}

/**
 * Reproductor completo de una división: controles + división larga + explicación dinámica.
 * Se reinicia al cambiar dividendo, divisor o método.
 */
export default function DivisionPlayer({ dividend, gen, method, colTones, title, onEnd, autoFinish = false }) {
  const trace = useMemo(() => divide(dividend, gen, method), [dividend, gen, method])
  const stages = useMemo(() => buildStages(trace), [trace])
  const [sim, dispatch] = useReducer(simReducer, stages.length, initialSim)
  const [speed, setSpeed] = useState('normal')
  const [full, setFull] = useState(false)
  const [xorOpen, setXorOpen] = useState(false)
  const [xorAuto, setXorAuto] = useState(false)

  useEffect(() => { dispatch({ type: 'load', total: stages.length }); if (autoFinish) dispatch({ type: 'last' }) }, [stages, autoFinish])
  useEffect(() => {
    if (!sim.playing) return
    const id = setInterval(() => dispatch({ type: 'tick' }), SPEEDS[speed].ms)
    return () => clearInterval(id)
  }, [sim.playing, speed])
  useEffect(() => { if (sim.idx === sim.total - 1 && sim.total > 0) onEnd?.(trace) }, [sim.idx, sim.total]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!full) return
    const onKey = (e) => e.key === 'Escape' && setFull(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [full])

  const started = sim.idx >= 0
  const stage = stages[Math.max(0, sim.idx)]
  const showXor = stage.xor && (xorOpen || xorAuto)

  const body = (big) => (
    <>
      <LongDivision trace={trace} stage={started ? stage : { kind: 'intro', iter: -1, text: '' }} colTones={colTones} big={big} />
      <div className="mt-3 rounded-xl bg-[var(--c-bg)] p-3 text-sm leading-relaxed" aria-live="polite">
        {started ? <p key={sim.idx} className="pop">{stage.text}</p> : <p className="muted">Pulsa <b>Iniciar simulación</b> para ver la división paso a paso. Divisor G = <span className="mono">{gen}</span> ({gen.length} bits).</p>}
      </div>
      {started && stage.xor && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button className="btn text-sm" onClick={() => setXorOpen(!xorOpen)} aria-expanded={xorOpen}><Sigma size={16} /> {xorOpen ? 'Ocultar' : 'Ver'} XOR columna por columna</button>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={xorAuto} onChange={(e) => setXorAuto(e.target.checked)} /> Expandir siempre</label>
        </div>
      )}
      {showXor && <div className="mt-2"><XorExplain a={stage.xor.a} b={stage.xor.b} /></div>}
    </>
  )

  const legend = (
    <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs muted">
      {[['var(--c-blue)', 'Mensaje / operación activa'], ['var(--c-violet)', 'Ceros agregados'], ['var(--c-yellow)', 'Bit que baja'], ['var(--c-green)', 'Residuo'], ['var(--c-red)', 'Bit alterado'], ['var(--c-muted)', 'Descartado / pendiente']].map(([c, t]) => (
        <span key={t} className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ background: c }} />{t}</span>
      ))}
    </div>
  )

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">{title}</h3>
        <button className="btn text-sm" onClick={() => setFull(true)}><Expand size={16} /> Ampliar</button>
      </div>
      {legend}
      {body(false)}
      <div className="mt-3"><PlayerControls sim={sim} dispatch={dispatch} speed={speed} setSpeed={setSpeed} /></div>

      {full && (
        <div className="fixed inset-0 z-50 overflow-auto bg-[var(--c-bg)] p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="División a pantalla completa">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-bold">{title}</h3>
              <button className="btn" onClick={() => setFull(false)}><Minimize2 size={18} /> Cerrar</button>
            </div>
            {legend}
            {body(true)}
            <div className="mt-3"><PlayerControls sim={sim} dispatch={dispatch} speed={speed} setSpeed={setSpeed} /></div>
          </div>
        </div>
      )}
    </div>
  )
}
