import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Dices, Pause, Play, RotateCcw, Rocket, Table2, Trophy, Footprints,
} from 'lucide-react'
import StateDiagram from './StateDiagram.jsx'
import { simReducer, initialSim } from './simulatorState.js'
import { encodeByDiagram, explainStep, OFFICIAL_EXERCISES, procedureText, randomBits, validateBits, INITIAL_STATE } from './engine.js'
import { BitStrip, CopyButton, Legend, Section } from '../../shared/ui.jsx'

const SPEEDS = { slow: { label: 'Lenta', ms: 3200 }, normal: { label: 'Normal', ms: 1800 }, fast: { label: 'Rápida', ms: 900 } }

export default function Simulator({ bits, setBits }) {
  const [draft, setDraft] = useState(bits)
  const [speed, setSpeed] = useState('normal')
  const result = useMemo(() => encodeByDiagram(bits), [bits])
  const [sim, dispatch] = useReducer(simReducer, bits.length, initialSim)
  const check = validateBits(draft)

  const pendingStart = useRef(false)
  useEffect(() => {
    dispatch({ type: 'load', total: bits.length })
    if (pendingStart.current) { pendingStart.current = false; dispatch({ type: 'start' }) }
  }, [bits])
  useEffect(() => {
    if (!sim.playing) return
    const id = setInterval(() => dispatch({ type: 'tick' }), SPEEDS[speed].ms)
    return () => clearInterval(id)
  }, [sim.playing, speed])

  const started = sim.idx >= 0
  const step = started ? result.steps[sim.idx] : null
  const finished = started && sim.idx === sim.total - 1
  const doneSteps = started ? result.steps.slice(0, sim.idx + 1) : []
  const accumulated = doneSteps.map((s) => s.output).join('')

  const startWith = (value) => {
    const v = validateBits(value)
    if (!v.ok) return
    setDraft(v.value)
    if (v.value === bits) dispatch({ type: 'start' })
    else {
      pendingStart.current = true
      setBits(v.value)
    }
  }

  return (
    <div className="space-y-4">
      <Section title="Secuencia de entrada" icon={Rocket}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <input
              className="field mono text-lg tracking-widest" inputMode="numeric" autoComplete="off" spellCheck={false}
              value={draft} onChange={(e) => setDraft(e.target.value.replace(/[^01\s]/g, '').slice(0, 64))}
              onKeyDown={(e) => e.key === 'Enter' && check.ok && startWith(draft)}
              aria-label="Secuencia binaria de entrada" aria-invalid={!check.ok} placeholder="Ej.: 10101101"
            />
            <p className={`mt-1 min-h-5 text-xs ${check.ok ? 'muted' : 'text-[var(--c-red)]'}`}>
              {check.ok ? `${check.value.length} bits de entrada → ${check.value.length * 2} bits de salida · se conservan los ceros iniciales` : check.error}
            </p>
          </div>
          <button className="btn btn-primary sm:w-auto" disabled={!check.ok} onClick={() => startWith(draft)}>
            <Rocket size={18} /> Iniciar simulación
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {OFFICIAL_EXERCISES.map((ex, i) => (
            <button key={ex.bits} className="btn mono text-sm" onClick={() => { setDraft(ex.bits); startWith(ex.bits) }}>
              Repaso {i + 1}: {ex.bits}
            </button>
          ))}
          <button className="btn text-sm" onClick={() => { const b = randomBits(8); setDraft(b); startWith(b) }}>
            <Dices size={18} /> Aleatorio
          </button>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-5">
        <Section title="Diagrama de estados" className="lg:col-span-3" right={<Legend />}>
          <StateDiagram
            current={step?.state ?? null}
            next={step?.next ?? null}
            selectedEdge={step?.edgeId ?? null}
            particleKey={step ? `${bits}-${sim.idx}` : null}
            particleMs={Math.min(1100, SPEEDS[speed].ms * 0.6)}
          />
        </Section>

        <Section title="Explicación del paso" icon={Footprints} className="lg:col-span-2">
          {!step ? (
            <p className="muted text-sm leading-relaxed">
              Pulsa <b>Iniciar simulación</b> para comenzar. El estado inicial es <b className="mono">{INITIAL_STATE}</b>. En cada paso verás qué flecha se sigue, qué bits salen y a qué estado llegamos.
            </p>
          ) : (
            <div key={sim.idx} className="pop space-y-3">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>Paso {sim.idx + 1} de {sim.total}</span>
                <span className="chip chip-yellow mono">bit {sim.idx + 1}</span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <Fact label="Estado actual" tone="blue" value={step.state} />
                <Fact label="Bit de entrada" tone="yellow" value={step.input} />
                <Fact label="Flecha" tone="blue" value={`${step.input}/${step.output}`} />
                <Fact label="Bits de salida" tone="green" value={step.output} />
                <Fact label="Nuevo estado" tone="green" value={step.next} wide />
              </dl>
              <p className="rounded-xl bg-[var(--c-bg)] p-3 text-sm leading-relaxed">{explainStep(step, sim.total)}</p>
            </div>
          )}
        </Section>
      </div>

      <Section title="Controles">
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-sm font-semibold">
            <span>{started ? `Paso ${sim.idx + 1} de ${sim.total}` : `Paso 0 de ${sim.total}`}</span>
            <span className="muted">{Math.round(((sim.idx + 1) / sim.total) * 100)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--c-bg)]" role="progressbar" aria-valuemin={0} aria-valuemax={sim.total} aria-valuenow={sim.idx + 1}>
            <div className="h-full rounded-full bg-[var(--c-blue)] transition-all duration-300" style={{ width: `${((sim.idx + 1) / sim.total) * 100}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
          <button className="btn" onClick={() => dispatch({ type: 'reset' })} disabled={!started} aria-label="Reiniciar"><RotateCcw size={18} /><span className="hidden sm:inline">Reiniciar</span></button>
          <button className="btn" onClick={() => dispatch({ type: 'prev' })} disabled={sim.idx <= 0} aria-label="Paso anterior"><ChevronLeft size={20} /><span className="hidden sm:inline">Anterior</span></button>
          {sim.playing ? (
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'pause' })}><Pause size={18} /><span className="hidden sm:inline">Pausar</span></button>
          ) : (
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'play' })} aria-label="Reproducir automáticamente"><Play size={18} /><span className="hidden sm:inline">Reproducir</span></button>
          )}
          <button className="btn" onClick={() => dispatch({ type: 'next' })} disabled={finished} aria-label="Paso siguiente"><span className="hidden sm:inline">Siguiente</span><ChevronRight size={20} /></button>
          <button className="btn" onClick={() => dispatch({ type: 'last' })} disabled={finished} aria-label="Ir al último paso"><ChevronLast size={18} /><span className="hidden sm:inline">Último</span></button>
          {!started && (
            <button className="btn btn-green col-span-3 sm:col-auto" onClick={() => dispatch({ type: 'start' })}><Rocket size={18} /> Iniciar</button>
          )}
          <div className="col-span-4 flex items-center gap-2 sm:ml-auto" role="group" aria-label="Velocidad">
            {Object.entries(SPEEDS).map(([k, v]) => (
              <button key={k} className="btn flex-1 sm:flex-none" aria-pressed={speed === k}
                style={speed === k ? { background: 'var(--c-blue-soft)', borderColor: 'var(--c-blue)' } : undefined}
                onClick={() => setSpeed(k)}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{step ? `Paso ${sim.idx + 1}: ${explainStep(step, sim.total)}` : ''}</p>
      </Section>

      <Section title="Entrada y salida acumulada">
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide muted">Entrada ({bits.length} bits)</p>
            <BitStrip bits={bits} highlight={sim.idx} />
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide muted">Salida acumulada ({accumulated.length} de {bits.length * 2} bits)</p>
            <div className="min-h-9">
              {accumulated ? <BitStrip bits={accumulated} highlight={sim.idx} group={2} tone="green" /> : <span className="muted text-sm">— aún vacía —</span>}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Tabla de procedimiento" icon={Table2}>
        <ProcedureTable steps={doneSteps} activeIdx={sim.idx} />
      </Section>

      {finished && (
        <Section title="Resumen final" icon={Trophy} className="pop border-[var(--c-green)]">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="muted">Entrada</dt><dd className="mono break-all text-lg font-bold">{bits}</dd></div>
            <div><dt className="muted">Salida ({result.output.length} bits = 2 × {bits.length})</dt><dd className="mono break-all text-lg font-bold text-[var(--c-green)]">{result.output}</dd></div>
            <div><dt className="muted">Estado final</dt><dd className="mono text-lg font-bold">{result.finalState}</dd></div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={result.output} label="Copiar resultado" />
            <CopyButton text={() => procedureText(bits, result)} label="Copiar procedimiento completo" />
          </div>
        </Section>
      )}
    </div>
  )
}

function Fact({ label, value, tone, wide }) {
  return (
    <div className={`rounded-xl border border-[var(--c-border)] p-2 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-xs muted">{label}</dt>
      <dd><span className={`chip chip-${tone} mono text-lg`}>{value}</span></dd>
    </div>
  )
}

export function ProcedureTable({ steps, activeIdx }) {
  return (
    <div className="scroll-x">
      <table className="w-full min-w-[320px] text-center text-sm">
        <thead>
          <tr className="muted text-xs uppercase">
            <th className="p-2">Paso</th><th className="p-2">Estado actual</th><th className="p-2">Entrada</th><th className="p-2">Salida</th><th className="p-2">Nuevo estado</th>
          </tr>
        </thead>
        <tbody className="mono font-semibold">
          {steps.length === 0 && <tr><td colSpan={5} className="p-4 text-sm muted" style={{ fontFamily: 'inherit' }}>Se completa automáticamente al avanzar la simulación.</td></tr>}
          {steps.map((s) => (
            <tr key={s.index} className={`border-t border-[var(--c-border)] ${s.index === activeIdx ? 'bg-[var(--c-blue-soft)]' : ''}`} aria-current={s.index === activeIdx}>
              <td className="p-2">{s.index + 1}</td>
              <td className="p-2 text-[var(--c-blue)]">{s.state}</td>
              <td className="p-2"><span className="chip chip-yellow">{s.input}</span></td>
              <td className="p-2 text-[var(--c-green)]">{s.output}</td>
              <td className="p-2 text-[var(--c-green)]">{s.next}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
