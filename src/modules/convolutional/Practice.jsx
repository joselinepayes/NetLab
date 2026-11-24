import { useMemo, useState } from 'react'
import { Dices, Lightbulb, RotateCcw, Target } from 'lucide-react'
import StateDiagram from './StateDiagram.jsx'
import { encodeByDiagram, OFFICIAL_EXERCISES, randomBits, STATES, validateBits } from './engine.js'
import { BitStrip, Section } from '../../shared/ui.jsx'
import { useStored } from '../../shared/storage.js'

const PHASES = ['state', 'arrow', 'output', 'next']
const PHASE_Q = {
  state: '¿Cuál es el estado actual?',
  arrow: 'Toca en el diagrama la flecha correcta',
  output: '¿Cuáles son los bits de salida?',
  next: '¿Cuál es el nuevo estado?',
}
const PHASE_NAME = { state: 'estado actual', arrow: 'selección de flecha', output: 'bits de salida', next: 'nuevo estado' }

const emptyStats = { ok: 0, bad: 0, hints: 0, byPhase: { state: 0, arrow: 0, output: 0, next: 0 } }

function grade(st) {
  const tries = st.ok + st.bad
  const acc = tries ? Math.round((st.ok / tries) * 100) : 0
  return { tries, acc, score: Math.max(0, acc - st.hints) }
}

function feedback(st) {
  const { tries, acc } = grade(st)
  if (!tries) return 'Responde algunas preguntas para recibir retroalimentación.'
  const worst = Object.entries(st.byPhase).sort((a, b) => b[1] - a[1])[0]
  const tips = []
  if (acc >= 95) tips.push('¡Excelente! Pasa al modo examen.')
  else if (acc >= 80) tips.push('Muy bien, ya dominas el procedimiento; cuida los detalles.')
  else if (acc >= 60) tips.push('Vas por buen camino. Repasa el procedimiento en el modo Aprender.')
  else tips.push('Conviene repasar los conceptos básicos antes de seguir practicando.')
  if (worst[1] > 0) {
    const adv = {
      state: 'Recuerda: cada paso empieza en el estado al que llegó la flecha anterior.',
      arrow: 'Al elegir la flecha, primero fija el estado y luego busca la que empieza con el bit de entrada.',
      output: 'La salida es lo que va después de la «/» de la etiqueta y siempre son 2 bits.',
      next: 'El nuevo estado es donde termina la punta de la flecha seguida.',
    }[worst[0]]
    tips.push(`Tu punto débil: ${PHASE_NAME[worst[0]]} (${worst[1]} errores). ${adv}`)
  }
  if (st.hints > tries / 2) tips.push('Usas muchas pistas; intenta primero sin ellas.')
  return tips.join(' ')
}

export default function Practice() {
  const [bits, setBits] = useState(OFFICIAL_EXERCISES[0].bits)
  const [custom, setCustom] = useState('')
  const [len, setLen] = useState(6)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState('state')
  const [msg, setMsg] = useState(null) // {kind:'ok'|'bad'|'hint', text}
  const [hintLvl, setHintLvl] = useState(0)
  const [pickBad, setPickBad] = useState(null)
  const [outText, setOutText] = useState('')
  const [session, setSession] = useState(emptyStats)
  const [total, setTotal, resetTotal] = useStored('practice.total', emptyStats)

  const result = useMemo(() => encodeByDiagram(bits), [bits])
  const done = step >= bits.length
  const cur = result.steps[Math.min(step, bits.length - 1)]

  const record = (ok, ph) => {
    const f = (s) => ({ ...s, ok: s.ok + (ok ? 1 : 0), bad: s.bad + (ok ? 0 : 1), byPhase: { ...s.byPhase, [ph]: s.byPhase[ph] + (ok ? 0 : 1) } })
    setSession(f)
    setTotal(f)
  }
  const good = (text) => {
    record(true, phase)
    setMsg({ kind: 'ok', text })
    setHintLvl(0); setPickBad(null); setOutText('')
    const i = PHASES.indexOf(phase)
    if (i === PHASES.length - 1) { setStep(step + 1); setPhase('state') } else setPhase(PHASES[i + 1])
  }
  const bad = (text) => { record(false, phase); setMsg({ kind: 'bad', text }) }

  const answerState = (s) => (s === cur.state ? good(`Correcto: estamos en ${s}.`) : bad(
    step === 0 ? 'Al comenzar la memoria está vacía. ¿Con qué estado se empieza siempre?' : `Ese no es. Mira dónde terminó la flecha del paso anterior (paso ${step}).`))
  const answerArrow = (e) => {
    setPickBad(null)
    if (e.id === cur.edgeId) return good(`¡Esa es! La flecha ${e.label} sale de ${e.from} y empieza con ${e.input}.`)
    setPickBad(e.id)
    if (e.from !== cur.state) bad(`Esa flecha sale del estado ${e.from}, pero ahora estamos en otro estado. Busca las flechas que salen del estado actual.`)
    else bad(`Esa flecha sí sale del estado correcto, pero su entrada es ${e.input} y el bit actual es otro. Revisa el bit de entrada.`)
  }
  const answerOutput = () => {
    const v = outText.trim()
    if (v === cur.output) return good(`Correcto: la salida es ${v}.`)
    if (!/^[01]{2}$/.test(v)) return bad('La salida debe tener exactamente 2 bits (0 o 1).')
    const n = [0, 1].filter((i) => v[i] !== cur.output[i]).length
    bad(n === 2 ? 'Los dos bits son incorrectos. Mira de nuevo la etiqueta de la flecha: la salida va después de la «/».' : 'Uno de los dos bits es correcto. Revisa la etiqueta de la flecha otra vez.')
  }
  const answerNext = (s) => (s === cur.next ? good(`Correcto: llegamos a ${s}.`) : bad('Ese no es. El nuevo estado es donde termina la punta de la flecha que seguiste.'))

  const hint = () => {
    const lvl = hintLvl + 1
    setHintLvl(lvl)
    setSession((s) => ({ ...s, hints: s.hints + 1 }))
    setTotal((s) => ({ ...s, hints: s.hints + 1 }))
    const t = {
      state: lvl === 1 ? 'El estado actual es el nuevo estado del paso anterior (o 00 al inicio).' : `Empieza por «${cur.state[0]}».`,
      arrow: lvl === 1 ? `Busca las dos flechas que salen del estado actual y elige la que empieza con ${cur.input}.` : `La etiqueta de la flecha empieza con ${cur.input} y su salida empieza con ${cur.output[0]}.`,
      output: lvl === 1 ? 'Lee la etiqueta de la flecha: lo que sigue a la «/».' : `El primer bit de la salida es ${cur.output[0]}.`,
      next: lvl === 1 ? 'Sigue la flecha hasta su punta.' : `El nuevo estado empieza por «${cur.next[0]}».`,
    }[phase]
    setMsg({ kind: 'hint', text: t })
  }

  const load = (b) => {
    setBits(b); setStep(0); setPhase('state'); setMsg(null); setHintLvl(0); setPickBad(null); setOutText(''); setSession(emptyStats)
  }

  const g = grade(session), gt = grade(total)
  const customCheck = validateBits(custom)
  const outputSoFar = result.steps.slice(0, step).map((s) => s.output).join('')

  const status = {}
  if (!done && phase !== 'state' && phase !== 'arrow') status[cur.edgeId] = 'ok'
  if (pickBad) status[pickBad] = 'bad'

  return (
    <div className="space-y-4">
      <Section title="Ejercicio" icon={Target}>
        <div className="flex flex-wrap gap-2">
          {OFFICIAL_EXERCISES.map((ex, i) => (
            <button key={ex.bits} className="btn mono text-sm" onClick={() => load(ex.bits)} aria-pressed={bits === ex.bits}>Repaso {i + 1}</button>
          ))}
          <select className="field !w-auto" value={len} onChange={(e) => setLen(+e.target.value)} aria-label="Longitud del ejercicio aleatorio">
            {[4, 6, 8, 12, 16].map((n) => <option key={n} value={n}>{n} bits</option>)}
          </select>
          <button className="btn" onClick={() => load(randomBits(len))}><Dices size={18} /> Aleatorio</button>
        </div>
        <div className="mt-2 flex gap-2">
          <input className="field mono" placeholder="Tu propia secuencia" inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^01]/g, '').slice(0, 32))} aria-label="Secuencia propia" />
          <button className="btn" disabled={!customCheck.ok} onClick={() => load(customCheck.value)}>Usar</button>
        </div>
        <div className="mt-3"><BitStrip bits={bits} highlight={done ? -1 : step} /></div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-5">
        <Section title="Diagrama" className="lg:col-span-3">
          <StateDiagram
            current={!done && phase !== 'state' ? cur.state : null}
            next={!done && phase === 'next' ? null : null}
            selectedEdge={null}
            edgeStatus={status}
            onEdgeClick={!done && phase === 'arrow' ? answerArrow : undefined}
            dimOthers
          />
          {!done && phase === 'arrow' && <p className="muted mt-1 text-center text-xs">Toca una flecha (o su etiqueta) para elegirla.</p>}
        </Section>

        <Section title={done ? '¡Ejercicio terminado!' : `Paso ${step + 1} de ${bits.length}`} className="lg:col-span-2">
          {done ? (
            <div className="pop space-y-2 text-sm">
              <p>Salida obtenida: <b className="mono break-all text-[var(--c-green)]">{outputSoFar}</b></p>
              <p className="rounded-xl bg-[var(--c-bg)] p-3 leading-relaxed">{feedback(session)}</p>
              <button className="btn btn-primary" onClick={() => load(randomBits(len))}><Dices size={18} /> Otro ejercicio</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                Bit de entrada: <span className="chip chip-yellow mono text-lg">{cur.input}</span>
                {phase !== 'state' && <>Estado actual: <span className="chip chip-blue mono text-lg">{cur.state}</span></>}
              </div>
              <p className="text-base font-bold">{PHASES.indexOf(phase) + 1}. {PHASE_Q[phase]}</p>
              {(phase === 'state' || phase === 'next') && (
                <div className="grid grid-cols-4 gap-2">
                  {STATES.map((s) => <button key={s} className="btn mono text-lg" onClick={() => (phase === 'state' ? answerState(s) : answerNext(s))}>{s}</button>)}
                </div>
              )}
              {phase === 'output' && (
                <div className="flex gap-2">
                  <input className="field mono text-lg tracking-widest" inputMode="numeric" maxLength={2} value={outText} placeholder="00" aria-label="Bits de salida"
                    onChange={(e) => setOutText(e.target.value.replace(/[^01]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && answerOutput()} />
                  <button className="btn btn-primary" onClick={answerOutput}>Comprobar</button>
                </div>
              )}
              {phase === 'arrow' && <p className="muted text-sm">Pulsa directamente sobre la flecha en el diagrama.</p>}
              <button className="btn text-sm" onClick={hint}><Lightbulb size={18} /> Pista (−1 punto)</button>
              {msg && (
                <p className={`pop rounded-xl p-3 text-sm leading-relaxed ${msg.kind === 'ok' ? 'chip-green' : msg.kind === 'bad' ? 'chip-red' : 'chip-yellow'}`} style={{ display: 'block', fontWeight: 600 }} role="status">
                  {msg.text}
                </p>
              )}
            </div>
          )}
        </Section>
      </div>

      <Section title="Tu desempeño" right={<button className="btn text-sm" onClick={() => { setSession(emptyStats); resetTotal() }}><RotateCcw size={16} /> Reiniciar estadísticas</button>}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Stat label="Aciertos" v={session.ok} tone="green" />
          <Stat label="Errores" v={session.bad} tone="red" />
          <Stat label="Intentos" v={g.tries} />
          <Stat label="Precisión" v={`${g.acc}%`} />
          <Stat label="Calificación" v={`${g.score}/100`} tone="blue" />
        </div>
        <p className="muted mt-2 text-xs">Sesión actual. Acumulado guardado en este dispositivo: {total.ok} aciertos, {total.bad} errores, precisión {gt.acc}%. Calificación = precisión − 1 punto por pista.</p>
        <p className="mt-2 rounded-xl bg-[var(--c-bg)] p-3 text-sm leading-relaxed">{feedback(session)}</p>
      </Section>
    </div>
  )
}

function Stat({ label, v, tone }) {
  return (
    <div className="rounded-xl border border-[var(--c-border)] p-2 text-center">
      <div className="text-xs muted">{label}</div>
      <div className={`mono text-xl font-extrabold ${tone === 'green' ? 'text-[var(--c-green)]' : tone === 'red' ? 'text-[var(--c-red)]' : tone === 'blue' ? 'text-[var(--c-blue)]' : ''}`}>{v}</div>
    </div>
  )
}
