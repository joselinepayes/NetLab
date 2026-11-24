import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, GitBranch, Grid3x3, Sigma } from 'lucide-react'
import StateDiagram from './StateDiagram.jsx'
import { compareMethods, STATES, TABLE, xorStep } from './engine.js'
import { Section } from '../../shared/ui.jsx'

const METHODS = [
  { id: 'diagram', name: '1 · Diagrama', icon: GitBranch },
  { id: 'table', name: '2 · Tabla', icon: Grid3x3 },
  { id: 'xor', name: '3 · XOR', icon: Sigma },
]

export default function Methods({ bits }) {
  const [method, setMethod] = useState('diagram')
  const [idx, setIdx] = useState(0)
  const cmp = useMemo(() => compareMethods(bits), [bits])
  useEffect(() => setIdx(0), [bits])
  const step = cmp[method].steps[idx]
  const total = bits.length

  return (
    <div className="space-y-4">
      <Section title="Tres formas de llegar al mismo resultado" icon={CheckCircle2}>
        <p className="muted mb-3 text-sm">Secuencia actual: <b className="mono text-[var(--c-text)]">{bits}</b> (cámbiala en la pestaña Simulador).</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {METHODS.map((m) => (
            <div key={m.id} className="rounded-xl border border-[var(--c-border)] p-3 text-sm">
              <div className="font-bold">{m.name}</div>
              <div className="mono break-all text-[var(--c-green)]">{cmp[m.id].output}</div>
            </div>
          ))}
        </div>
        <p className={`mt-3 flex items-center gap-2 text-sm font-bold ${cmp.match ? 'text-[var(--c-green)]' : 'text-[var(--c-red)]'}`}>
          <CheckCircle2 size={18} /> {cmp.match ? 'Los tres métodos coinciden exactamente (salida y estado final).' : 'Los métodos NO coinciden: revisa el motor.'}
        </p>
      </Section>

      <div className="scroll-x no-scrollbar flex gap-1 rounded-2xl border border-[var(--c-border)] bg-[var(--c-card)] p-1" role="tablist">
        {METHODS.map((m) => (
          <button key={m.id} role="tab" aria-selected={method === m.id} className="tab flex-1 justify-center" onClick={() => setMethod(m.id)}>
            <m.icon size={18} /> {m.name}
          </button>
        ))}
      </div>

      <Section
        title={`Paso ${idx + 1} de ${total}`}
        right={
          <div className="flex gap-2">
            <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)} aria-label="Paso anterior"><ChevronLeft size={20} /></button>
            <button className="btn" disabled={idx === total - 1} onClick={() => setIdx(idx + 1)} aria-label="Paso siguiente"><ChevronRight size={20} /></button>
          </div>
        }
      >
        <input type="range" min={0} max={total - 1} value={idx} onChange={(e) => setIdx(+e.target.value)} className="mb-4 h-8 w-full accent-[var(--c-blue)]" aria-label="Elegir paso" />
        {method === 'diagram' && <MethodDiagram step={step} />}
        {method === 'table' && <MethodTable step={step} />}
        {method === 'xor' && <MethodXor step={step} />}
      </Section>
    </div>
  )
}

function MethodDiagram({ step }) {
  return (
    <div className="grid items-center gap-4 md:grid-cols-2">
      <StateDiagram current={step.state} next={step.next} selectedEdge={step.edgeId} particleKey={step.index + step.edgeId} particleMs={900} />
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
        <li>Ubica el estado actual: <b className="chip chip-blue mono">{step.state}</b></li>
        <li>De ese estado salen dos flechas; elige la que empieza con el bit <b className="chip chip-yellow mono">{step.input}</b>.</li>
        <li>La etiqueta de esa flecha es <b className="mono">{step.input}/{step.output}</b>: lo que sigue a la «/» es la salida <b className="chip chip-green mono">{step.output}</b>.</li>
        <li>La punta de la flecha llega al nuevo estado: <b className="chip chip-green mono">{step.next}</b>.</li>
      </ol>
    </div>
  )
}

function MethodTable({ step }) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed">
        Busca la <b>fila</b> del estado actual <b className="chip chip-blue mono">{step.state}</b> y la <b>columna</b> de la entrada <b className="chip chip-yellow mono">{step.input}</b>. En la celda encuentras <i>salida</i> y <i>nuevo estado</i>.
      </p>
      <div className="scroll-x">
        <table className="w-full min-w-[300px] border-separate border-spacing-1 text-center text-sm">
          <thead>
            <tr>
              <th className="p-2 muted">Estado ↓ / Entrada →</th>
              {['0', '1'].map((c) => (
                <th key={c} className={`rounded-lg p-2 mono ${c === step.input ? 'chip-yellow' : ''}`}>Entrada {c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATES.map((s) => (
              <tr key={s}>
                <th className={`rounded-lg p-2 mono ${s === step.state ? 'chip-blue' : ''}`}>{s}</th>
                {['0', '1'].map((c) => {
                  const hit = s === step.state && c === step.input
                  const rowOrCol = s === step.state || c === step.input
                  return (
                    <td key={c} className={`mono rounded-lg border p-2 ${hit ? 'scale-105 border-[var(--c-green)] bg-[var(--c-green-soft)] font-extrabold' : rowOrCol ? 'border-[var(--c-border)] bg-[var(--c-blue-soft)]' : 'border-[var(--c-border)] opacity-60'}`}>
                      <div>sal. <b>{TABLE[s][c].output}</b></div>
                      <div>→ <b>{TABLE[s][c].next}</b></div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="rounded-xl bg-[var(--c-bg)] p-3 text-sm">
        Fila <b className="mono">{step.state}</b>, columna <b className="mono">{step.input}</b> → salida <b className="mono text-[var(--c-green)]">{step.output}</b>, nuevo estado <b className="mono text-[var(--c-green)]">{step.next}</b>.
      </p>
    </div>
  )
}

const XOR_ROWS = [[0, 0], [0, 1], [1, 0], [1, 1]]

function XorTable({ used }) {
  return (
    <table className="mono w-full max-w-[260px] text-center text-sm">
      <thead><tr className="muted"><th>X</th><th>Y</th><th>X ⊕ Y</th></tr></thead>
      <tbody>
        {XOR_ROWS.map(([x, y]) => {
          const hit = used.some(([a, b]) => a === x && b === y)
          return (
            <tr key={`${x}${y}`} className={hit ? 'chip-yellow font-extrabold' : ''}>
              <td className="p-1">{x}</td><td>{y}</td><td>{x ^ y}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function XorGate({ x, cx, cy, label }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="24" fill="var(--c-card)" stroke="var(--c-blue)" strokeWidth="3" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="26" fontWeight="800" fill="var(--c-blue)">⊕</text>
      <text x={cx} y={cy - 32} textAnchor="middle" fontSize="12" fill="var(--c-muted)">{label}</text>
    </g>
  )
}

function XorVisual({ x }) {
  const I = { E: { y: 40, v: x.E, c: 'var(--c-yellow)' }, A: { y: 120, v: x.A, c: 'var(--c-blue)' }, B: { y: 200, v: x.B, c: 'var(--c-blue)' } }
  const g1 = { x: 230, y: 60 }, g2 = { x: 230, y: 175 }
  const line = (y, g) => `M 70 ${y} L ${g.x - 24} ${g.y}`
  return (
    <svg viewBox="0 0 520 250" className="h-auto w-full max-w-[520px]" role="img" aria-label="Representación de las operaciones XOR">
      {[['E', g1], ['B', g1], ['E', g2], ['A', g2], ['B', g2]].map(([k, g], i) => (
        <path key={i} d={line(I[k].y, g)} stroke={I[k].c} strokeWidth="2.5" fill="none" opacity="0.7" />
      ))}
      {Object.entries(I).map(([k, o]) => (
        <g key={k}>
          <rect x="20" y={o.y - 20} width="50" height="40" rx="10" fill="var(--c-card)" stroke={o.c} strokeWidth="3" />
          <text x="34" y={o.y} dominantBaseline="central" fontSize="14" fontWeight="700" fill="var(--c-muted)">{k}</text>
          <text x="56" y={o.y} dominantBaseline="central" fontSize="22" fontWeight="800" className="mono" fill="var(--c-text)">{o.v}</text>
        </g>
      ))}
      <XorGate cx={g1.x} cy={g1.y} label="E ⊕ B" />
      <XorGate cx={g2.x} cy={g2.y} label="E ⊕ A ⊕ B" />
      {[[g1, x.o1, 'Salida 1'], [g2, x.o2, 'Salida 2']].map(([g, v, t]) => (
        <g key={t}>
          <path d={`M ${g.x + 24} ${g.y} L 380 ${g.y}`} stroke="var(--c-green)" strokeWidth="3" fill="none" />
          <rect x="380" y={g.y - 20} width="110" height="40" rx="10" fill="var(--c-green-soft)" stroke="var(--c-green)" strokeWidth="3" />
          <text x="392" y={g.y} dominantBaseline="central" fontSize="13" fontWeight="700" fill="var(--c-muted)">{t}</text>
          <text x="470" y={g.y} dominantBaseline="central" fontSize="22" fontWeight="800" className="mono" fill="var(--c-green)">{v}</text>
        </g>
      ))}
    </svg>
  )
}

function MethodXor({ step }) {
  const x = xorStep(step.state, step.input)
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[var(--c-bg)] p-3 text-sm leading-relaxed">
        Estado actual <b className="mono">{step.state}</b> = <b className="mono">AB</b> → <b>A = {x.A}</b>, <b>B = {x.B}</b>. Entrada <b>E = {x.E}</b>.
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <XorVisual x={x} />
        <div className="space-y-3 text-sm">
          <Op title="Salida 1 = E ⊕ B" body={`${x.E} ⊕ ${x.B} = ${x.o1}`} />
          <Op title="Salida 2 = E ⊕ A ⊕ B" body={`(${x.E} ⊕ ${x.A}) ⊕ ${x.B} = ${x.ea} ⊕ ${x.B} = ${x.o2}`} />
          <Op title="Nuevo estado = E A" body={`E = ${x.E}, A = ${x.A} → ${x.next}`} />
          <p className="rounded-xl border border-[var(--c-green)] p-3">
            Salida <b className="mono text-[var(--c-green)]">{x.output}</b> · nuevo estado <b className="mono text-[var(--c-green)]">{x.next}</b>
          </p>
        </div>
      </div>
      <div>
        <p className="mb-1 text-sm font-bold">Tabla de verdad de XOR <span className="muted font-normal">(1 solo si los bits son distintos; las filas usadas están resaltadas)</span></p>
        <XorTable used={[[x.E, x.B], [x.E, x.A], [x.ea, x.B]]} />
      </div>
    </div>
  )
}

function Op({ title, body }) {
  return (
    <div className="rounded-xl border border-[var(--c-border)] p-3">
      <div className="font-bold">{title}</div>
      <div className="mono text-base">{body}</div>
    </div>
  )
}
