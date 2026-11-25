import { useEffect, useMemo, useState } from 'react'
import { Dices, Lightbulb, Target, UserRound } from 'lucide-react'
import { buildFrame, flipAt, randomBits } from './engine.js'
import { buildQuestions, revealStage } from './practice.js'
import { MESSAGE_EXAMPLES } from './InputPanel.jsx'
import { buildStages, GENERATOR_EXAMPLES } from './engine.js'
import LongDivision, { tonesFor } from './LongDivision.jsx'
import { MethodSelect } from './DivisionPlayer.jsx'
import { Section } from '../../shared/ui.jsx'
import { useStored } from '../../shared/storage.js'

const OFFICIAL = [{ msg: '10100', gen: '10011', label: 'Ejercicio 1' }, { msg: '1100111', gen: '10011', label: 'Ejercicio 2' }]

function withReceived(ex) {
  const f = buildFrame(ex.msg, ex.gen)
  const received = Math.random() < 0.5 ? f.T : flipAt(f.T, Math.floor(Math.random() * f.T.length))
  return { ...ex, received }
}
const empty = { ok: 0, bad: 0, hints: 0, groups: {} }

function adviceFor(st) {
  const tries = st.ok + st.bad
  if (!tries) return ''
  const acc = Math.round((st.ok / tries) * 100)
  const worst = Object.entries(st.groups).sort((a, b) => b[1] - a[1])[0]
  const tips = [acc >= 90 ? '¡Excelente dominio del procedimiento!' : acc >= 70 ? 'Vas bien; cuida los detalles.' : 'Repasa la pestaña Aprender y vuelve a intentarlo.']
  if (worst && worst[1] > 0) {
    const g = worst[0]
    tips.push(`Donde más fallaste: ${g}. ${g.startsWith('Paso') ? 'Revisa: bloque que empieza en 1 → XOR con G; el resultado empieza en 0; baja bits para completar el bloque.' : g === 'Polinomios' ? 'Recuerda que el bit de la derecha es x⁰ y solo se escriben los unos.' : g === 'Ceros' ? 'Los ceros agregados son iguales al grado de G.' : g === 'Residuo' ? 'El residuo tiene tantos bits como el grado de G.' : g === 'Trama' ? 'T es el mensaje seguido del residuo.' : 'Un residuo cero significa que no se detectaron errores.'}`)
  }
  return tips.join(' ')
}

export default function Practice({ msg: curMsg, gen: curGen, method, setMethod }) {
  const [ex, setEx] = useState(() => withReceived({ msg: curMsg, gen: curGen }))
  const [qi, setQi] = useState(0)
  const [value, setValue] = useState('')
  const [fb, setFb] = useState(null)
  const [tries, setTries] = useState(0)
  const [hintLvl, setHintLvl] = useState(0)
  const [hintText, setHintText] = useState('')
  const [stats, setStats] = useState(empty)
  const [stageIdx, setStageIdx] = useState(null)
  const [log, setLog] = useState([])
  const [, setHistory] = useStored('crc.history.practice', [])
  const [custom, setCustom] = useState('')

  const built = useMemo(() => buildQuestions({ ...ex, method }), [ex, method])
  const { questions, trace } = built
  const stages = useMemo(() => buildStages(trace), [trace])
  const done = qi >= questions.length
  const q = questions[Math.min(qi, questions.length - 1)]

  const reset = (next) => {
    setEx(next); setQi(0); setValue(''); setFb(null); setTries(0); setHintLvl(0); setHintText(''); setStats(empty); setStageIdx(null); setLog([])
  }
  useEffect(() => { reset(withReceived({ msg: ex.msg, gen: ex.gen })) }, [method]) // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (st) => {
    const total = st.ok + st.bad
    const acc = total ? Math.round((st.ok / total) * 100) : 0
    setHistory((h) => [{ date: new Date().toISOString(), msg: ex.msg, gen: ex.gen, method, ok: st.ok, bad: st.bad, hints: st.hints, score: Math.max(0, acc - st.hints) }, ...h].slice(0, 40))
  }
  const advance = (st) => {
    setValue(''); setFb(null); setTries(0); setHintLvl(0); setHintText('')
    if (qi + 1 >= questions.length) finish(st)
    setQi(qi + 1)
  }
  const submit = (a) => {
    const r = q.check(a)
    if (r.ok) {
      const st = { ...stats, ok: stats.ok + 1 }
      setStats(st)
      const s = revealStage(trace, q.reveal)
      if (s !== null) setStageIdx(s)
      setLog((l) => [...l, `${q.group}: ${q.answer}`])
      setFb({ ok: true, msg: r.msg })
      setTimeout(() => advance(st), 650)
    } else {
      setStats({ ...stats, bad: stats.bad + 1, groups: { ...stats.groups, [q.group]: (stats.groups[q.group] ?? 0) + 1 } })
      setTries(tries + 1)
      setFb(r)
    }
  }
  const showAnswer = () => {
    const st = { ...stats }
    setLog((l) => [...l, `${q.group}: ${q.answer} (mostrada)`])
    const s = revealStage(trace, q.reveal)
    if (s !== null) setStageIdx(s)
    advance(st)
  }
  const hint = () => {
    const l = Math.min(3, hintLvl + 1)
    setHintLvl(l)
    setHintText(q.hints[l - 1])
    if (l > hintLvl) setStats({ ...stats, hints: stats.hints + 1 })
  }

  const total = stats.ok + stats.bad
  const acc = total ? Math.round((stats.ok / total) * 100) : 0
  const score = Math.max(0, acc - stats.hints)
  const f = built.frame
  const tones = tonesFor({ msgLen: ex.msg.length, total: f.extended.length, zerosLen: f.deg })
  const customMsg = custom.replace(/[^01]/g, '')

  return (
    <div className="space-y-4">
      <Section title="Elige el ejercicio" icon={Target}>
        <div className="flex flex-wrap gap-2">
          {OFFICIAL.map((o) => <button key={o.label} className="btn" onClick={() => reset(withReceived(o))}>{o.label}: <span className="mono">{o.msg}</span></button>)}
          <button className="btn" onClick={() => { const g = GENERATOR_EXAMPLES[Math.floor(Math.random() * 4)]; reset(withReceived({ msg: randomBits(5 + Math.floor(Math.random() * 6)), gen: g })) }}><Dices size={18} /> Aleatorio</button>
          <button className="btn" onClick={() => reset(withReceived({ msg: curMsg, gen: curGen }))}><UserRound size={18} /> Mi mensaje y G actuales</button>
        </div>
        <div className="mt-2 flex gap-2">
          <input className="field mono" placeholder="Práctica libre: escribe tu mensaje" value={custom} inputMode="numeric" onChange={(e) => setCustom(e.target.value.replace(/[^01]/g, '').slice(0, 24))} aria-label="Mensaje propio" list="msg-examples" />
          <datalist id="msg-examples">{MESSAGE_EXAMPLES.map((m) => <option key={m} value={m} />)}</datalist>
          <button className="btn" disabled={!customMsg} onClick={() => reset(withReceived({ msg: customMsg, gen: curGen }))}>Usar con G = {curGen}</button>
        </div>
        <p className="mt-2 text-sm">Ejercicio actual: M = <b className="mono">{ex.msg}</b> · G = <b className="mono">{ex.gen}</b></p>
        <div className="mt-3"><MethodSelect method={method} setMethod={setMethod} /></div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-5">
        <Section title={done ? '¡Ejercicio terminado!' : `Pregunta ${qi + 1} de ${questions.length}`} className="lg:col-span-2">
          {done ? (
            <div className="pop space-y-2 text-sm">
              <p>Calificación: <b className="mono text-2xl text-[var(--c-blue)]">{score}/100</b></p>
              <p>Residuo: <b className="mono text-[var(--c-green)]">{f.remainder}</b> · T = <b className="mono">{f.T}</b></p>
              <p className="rounded-xl bg-[var(--c-bg)] p-3 leading-relaxed">{adviceFor(stats)}</p>
              <button className="btn btn-primary" onClick={() => reset(withReceived({ msg: ex.msg, gen: ex.gen }))}>Repetir este ejercicio</button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide muted">{q.group}</p>
              <p className="text-base font-bold leading-snug">{q.prompt}</p>
              {q.kind === 'choice' ? (
                <div className="grid gap-2">{q.options.map(([id, label]) => <button key={id} className="btn justify-start text-left" onClick={() => submit(id)}>{label}</button>)}</div>
              ) : (
                <div className="flex gap-2">
                  <input className="field mono text-lg" autoComplete="off" inputMode={q.kind === 'text' ? 'text' : 'numeric'} placeholder={q.placeholder} value={value} aria-label="Tu respuesta"
                    onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && value.trim() && submit(value)} />
                  <button className="btn btn-primary" disabled={!value.trim()} onClick={() => submit(value)}>Comprobar</button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button className="btn text-sm" onClick={hint} disabled={hintLvl >= 3}><Lightbulb size={18} /> Pista {hintLvl}/3 (−1 punto)</button>
                {tries >= 3 && <button className="btn text-sm" onClick={showAnswer}>Mostrar respuesta y seguir</button>}
              </div>
              {hintText && <p className="rounded-xl p-3 text-sm chip-yellow" style={{ display: 'block', fontWeight: 600 }}>💡 {hintText}</p>}
              {fb && <p className={`pop rounded-xl p-3 text-sm leading-relaxed ${fb.ok ? 'chip-green' : 'chip-red'}`} style={{ display: 'block', fontWeight: 600 }} role="status">{fb.msg}</p>}
            </div>
          )}
          {log.length > 0 && (
            <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold">Lo que llevas ({log.length})</summary>
              <ul className="mono mt-1 space-y-0.5 text-xs">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
            </details>
          )}
        </Section>

        <Section title="División" className="lg:col-span-3">
          {stageIdx === null ? <p className="muted text-sm">La división se irá dibujando conforme respondas las preguntas.</p>
            : <LongDivision trace={trace} stage={stages[stageIdx]} colTones={tones} />}
        </Section>
      </div>

      <Section title="Tu desempeño">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[['Aciertos', stats.ok, 'green'], ['Errores', stats.bad, 'red'], ['Intentos', total], ['Precisión', `${acc}%`], ['Calificación', `${score}/100`, 'blue']].map(([l, v, t]) => (
            <div key={l} className="rounded-xl border border-[var(--c-border)] p-2 text-center">
              <div className="text-xs muted">{l}</div>
              <div className="mono text-xl font-extrabold" style={{ color: t ? `var(--c-${t})` : undefined }}>{v}</div>
            </div>
          ))}
        </div>
        <p className="muted mt-2 text-xs">Calificación = precisión − 1 punto por pista. Al terminar cada ejercicio se guarda en el historial.</p>
        {total > 0 && <p className="mt-2 rounded-xl bg-[var(--c-bg)] p-3 text-sm leading-relaxed">{adviceFor(stats)}</p>}
      </Section>
    </div>
  )
}
