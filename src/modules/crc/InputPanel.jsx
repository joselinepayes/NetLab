import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { GENERATOR_EXAMPLES, parseGenerator, polyToString, validateMessage } from './engine.js'
import { Section } from '../../shared/ui.jsx'

export const MESSAGE_EXAMPLES = ['10100', '1100111', '10110101', '00110100']

/** Entrada del mensaje y del polinomio generador (binario o polinomial). Controla el estado compartido del módulo. */
export default function InputPanel({ msg, setMsg, gen, setGen }) {
  const [mDraft, setMDraft] = useState(msg)
  const [gDraft, setGDraft] = useState(gen)
  const mv = validateMessage(mDraft)
  const gv = parseGenerator(gDraft)

  const onMsg = (v) => {
    const clean = v.replace(/[^01\s]/g, '').slice(0, 40)
    setMDraft(clean)
    const r = validateMessage(clean)
    if (r.ok) setMsg(r.value)
  }
  const onGen = (v) => {
    setGDraft(v)
    const r = parseGenerator(v)
    if (r.ok) setGen(r.bits)
  }
  const pickGen = (bits) => { setGDraft(bits); setGen(bits) }

  return (
    <Section title="Mensaje y polinomio generador" icon={Settings2}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-bold" htmlFor="crc-msg">Mensaje binario M</label>
          <input id="crc-msg" className="field mono mt-1 text-lg tracking-widest" inputMode="numeric" autoComplete="off" spellCheck={false}
            value={mDraft} onChange={(e) => onMsg(e.target.value)} aria-invalid={!mv.ok} />
          <p className={`mt-1 min-h-5 text-xs ${mv.ok ? 'muted' : 'text-[var(--c-red)]'}`}>
            {mv.ok ? `${mv.value.length} bits · se conservan los ceros iniciales` : mv.error}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {MESSAGE_EXAMPLES.map((e) => (
              <button key={e} className="btn mono text-sm" aria-pressed={msg === e} onClick={() => { setMDraft(e); setMsg(e) }}>{e}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-bold" htmlFor="crc-gen">Generador G (binario o polinomio)</label>
          <input id="crc-gen" className="field mono mt-1 text-lg" autoComplete="off" spellCheck={false}
            value={gDraft} onChange={(e) => onGen(e.target.value)} aria-invalid={!gv.ok} placeholder="10011 ó x^4 + x + 1" />
          <p className={`mt-1 min-h-5 text-xs ${gv.ok ? (gv.warn ? 'text-[var(--c-muted)]' : 'muted') : 'text-[var(--c-red)]'}`}>
            {gv.ok ? `G = ${gv.bits} · G(x) = ${polyToString(gv.bits)} · grado ${gv.degree}${gv.warn ? ` — ${gv.warn}` : ''}` : gv.error}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {GENERATOR_EXAMPLES.map((g) => (
              <button key={g} className="btn text-sm" aria-pressed={gen === g} onClick={() => pickGen(g)}>
                <span>{polyToString(g)}</span><span className="mono muted">= {g}</span>
              </button>
            ))}
          </div>
          <p className="muted mt-1 text-xs">Predeterminado: x⁴ + x + 1 = 10011. Puedes escribir «x^4 + x + 1», «x⁴+x+1» o «10011».</p>
        </div>
      </div>
      {(!mv.ok || !gv.ok) && <p className="mt-3 rounded-xl p-2 text-sm chip-red" style={{ display: 'block' }}>Se sigue usando el último valor válido: M = <b className="mono">{msg}</b>, G = <b className="mono">{gen}</b>.</p>}
    </Section>
  )
}
