import { useState } from 'react'
import { AlertTriangle, ArrowRight, BookOpen, Circle, Layers, Play, Tag } from 'lucide-react'
import StateDiagram from './StateDiagram.jsx'
import { followArrow, STATES } from './engine.js'
import { Section } from '../../shared/ui.jsx'

export default function Learn({ onGoSimulator }) {
  const [state, setState] = useState('00')
  const [input, setInput] = useState('1')
  const [n, setN] = useState(8)
  const e = followArrow(state, input)

  return (
    <div className="space-y-4">
      <Section title="1. ¿Qué es un estado?" icon={Circle}>
        <p className="text-sm leading-relaxed">
          El codificador tiene una pequeña <b>memoria</b>: recuerda los últimos bits que entraron. Esa memoria es el <b>estado</b>, un par de bits <span className="mono">AB</span>. Con dos bits existen exactamente cuatro estados:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATES.map((s) => <span key={s} className="chip chip-blue mono px-4 py-2 text-xl">{s}</span>)}
        </div>
        <p className="muted mt-3 text-sm">En el diagrama son los círculos. Cuando entra un bit nuevo <b>E</b>, la memoria se actualiza: el nuevo estado es <span className="mono">E A</span> (el bit nuevo entra por la izquierda y el viejo B se descarta).</p>
      </Section>

      <Section title="2. Flechas y etiquetas: prueba tú mismo" icon={Tag}>
        <p className="mb-3 text-sm leading-relaxed">Una flecha va de un estado a otro. Su etiqueta tiene la forma <b className="mono">entrada/salida</b>. Elige un estado y un bit de entrada y mira qué flecha se sigue:</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm font-bold">Estado actual</p>
              <div className="flex gap-2">
                {STATES.map((s) => (
                  <button key={s} className="btn mono flex-1" aria-pressed={s === state} style={s === state ? { background: 'var(--c-blue)', color: '#fff' } : undefined} onClick={() => setState(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm font-bold">Bit de entrada</p>
              <div className="flex gap-2">
                {['0', '1'].map((b) => (
                  <button key={b} className="btn mono flex-1" aria-pressed={b === input} style={b === input ? { background: 'var(--c-yellow)', color: '#111' } : undefined} onClick={() => setInput(b)}>{b}</button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--c-bg)] p-3 text-sm leading-relaxed">
              Etiqueta: <b className="mono text-lg">{e.label}</b>
              <ul className="mt-1 space-y-1">
                <li><span className="chip chip-yellow mono">{e.input}</span> antes de la «/» → <b>entrada</b></li>
                <li><span className="chip chip-green mono">{e.output}</span> después de la «/» → <b>salida</b> (2 bits)</li>
                <li><span className="chip chip-green mono">{e.next}</span> adonde apunta la flecha → <b>nuevo estado</b></li>
              </ul>
            </div>
          </div>
          <StateDiagram current={state} next={e.next} selectedEdge={e.id} particleKey={e.id} particleMs={900} />
        </div>
      </Section>

      <Section title="3. ¿Por qué empezamos en 00?" icon={Play}>
        <p className="text-sm leading-relaxed">Antes de que entre el primer bit no hay historia: la memoria está <b>vacía</b>, es decir, todo ceros. Por eso el codificador siempre arranca en <b className="mono">00</b>. Si el enunciado no dice lo contrario, ése es el punto de partida.</p>
      </Section>

      <Section title="4. ¿Por qué 8 bits de entrada dan 16 de salida?" icon={Layers}>
        <p className="text-sm leading-relaxed">Cada bit que entra hace que el codificador emita <b>2 bits</b> (cada etiqueta tiene salida de dos dígitos). Es un código de razón <b>1/2</b>.</p>
        <label className="mt-3 block text-sm font-bold">Bits de entrada: {n}
          <input type="range" min={1} max={16} value={n} onChange={(ev) => setN(+ev.target.value)} className="mt-1 block h-8 w-full accent-[var(--c-blue)]" />
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg border border-[var(--c-border)] p-1">
              <span className="chip chip-yellow mono h-7 w-7">·</span><ArrowRight size={14} />
              <span className="chip chip-green mono h-7 px-1">··</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-sm font-bold">{n} bits de entrada × 2 = <span className="text-[var(--c-green)]">{n * 2} bits de salida</span></p>
      </Section>

      <Section title="5. Procedimiento en 4 pasos" icon={BookOpen}>
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">
          <li>Parte del estado actual (al inicio, <b className="mono">00</b>).</li>
          <li>Lee el siguiente bit de entrada.</li>
          <li>Sigue la flecha que sale de ese estado y empieza con ese bit; escribe su salida.</li>
          <li>El nuevo estado es donde termina la flecha. Repite hasta agotar la entrada.</li>
        </ol>
        <button className="btn btn-primary mt-3" onClick={onGoSimulator}><Play size={18} /> Ver un ejemplo en el simulador</button>
      </Section>

      <Section title="6. Errores comunes" icon={AlertTriangle}>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>Confundir <b>entrada</b> con <b>salida</b>: lo que va antes de la «/» es la entrada; lo de después, la salida.</li>
          <li>Olvidar actualizar el estado: el siguiente paso comienza donde terminó la flecha anterior, no en <span className="mono">00</span>.</li>
          <li>Eliminar los ceros iniciales: <span className="mono">00110100</span> tiene 8 bits, no 6.</li>
          <li>Escribir la salida con un solo dígito: cada paso aporta <b>dos</b> bits.</li>
          <li>Equivocarse con los lazos (<span className="mono">0/00</span> en 00 y <span className="mono">1/01</span> en 11): salen y llegan al mismo estado.</li>
          <li>Comprobación final: longitud de la salida = 2 × longitud de la entrada.</li>
        </ul>
      </Section>
    </div>
  )
}
