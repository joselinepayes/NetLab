import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ClipboardCheck, History, Repeat, Timer, Trash2 } from 'lucide-react'
import { encodeByDiagram, LEVELS, OFFICIAL_EXERCISES, randomForLevel } from './engine.js'
import { Section } from '../../shared/ui.jsx'
import { useStored } from '../../shared/storage.js'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const LEVEL_OPTS = [...LEVELS.map((l) => ({ id: l.id, name: `${l.name} (${l.min === l.max ? l.min : `${l.min}–${l.max}`} bits)` })), { id: 'official', name: 'Repaso oficial (3 ejercicios)' }]

function makeExam(levelId, count) {
  if (levelId === 'official') return OFFICIAL_EXERCISES.map((e) => e.bits)
  return Array.from({ length: count }, () => randomForLevel(levelId))
}

export default function Exam() {
  const [level, setLevel] = useState('basic')
  const [count, setCount] = useState(5)
  const [phase, setPhase] = useState('setup') // setup | running | review
  const [exercises, setExercises] = useState([])
  const [answers, setAnswers] = useState([])
  const [idx, setIdx] = useState(0)
  const [secs, setSecs] = useState(0)
  const [report, setReport] = useState(null)
  const [history, setHistory, resetHistory] = useStored('exam.history', [])
  const t0 = useRef(0)

  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => setSecs(Math.floor((Date.now() - t0.current) / 1000)), 500)
    return () => clearInterval(id)
  }, [phase])

  const begin = (list, lvl) => {
    setExercises(list); setAnswers(list.map(() => '')); setIdx(0); setSecs(0); setReport(null)
    setLevel(lvl); t0.current = Date.now(); setPhase('running')
  }

  const finish = () => {
    const seconds = Math.floor((Date.now() - t0.current) / 1000)
    const items = exercises.map((bits, i) => {
      const r = encodeByDiagram(bits)
      const given = answers[i].trim()
      return { bits, given, correct: r.output, ok: given === r.output, steps: r.steps }
    })
    const okN = items.filter((x) => x.ok).length
    const score = Math.round((okN / items.length) * 100)
    setReport({ items, okN, score, seconds })
    setHistory([{ date: new Date().toISOString(), level, total: items.length, ok: okN, score, seconds }, ...history].slice(0, 30))
    setPhase('review')
  }

  if (phase === 'setup') {
    return (
      <div className="space-y-4">
        <Section title="Modo examen" icon={ClipboardCheck}>
          <p className="muted mb-3 text-sm">Resuelve sin ayudas: no se muestran respuestas ni diagrama. Escribe la salida completa de cada secuencia.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">Nivel
              <select className="field mt-1" value={level} onChange={(e) => setLevel(e.target.value)}>
                {LEVEL_OPTS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">Cantidad de ejercicios
              <select className="field mt-1" value={count} disabled={level === 'official'} onChange={(e) => setCount(+e.target.value)}>
                {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <button className="btn btn-primary mt-4" onClick={() => begin(makeExam(level, count), level)}><Timer size={18} /> Comenzar examen</button>
        </Section>
        <HistoryList history={history} onClear={resetHistory} />
      </div>
    )
  }

  if (phase === 'running') {
    const bits = exercises[idx]
    const val = answers[idx]
    const answered = answers.filter(Boolean).length
    return (
      <Section title={`Ejercicio ${idx + 1} de ${exercises.length}`} icon={ClipboardCheck} right={<span className="chip chip-blue mono text-base"><Timer size={16} className="mr-1" />{fmt(secs)}</span>}>
        <p className="muted text-sm">Codifica esta secuencia (estado inicial 00):</p>
        <p className="mono my-2 break-all text-2xl font-extrabold tracking-widest">{bits}</p>
        <label className="text-sm font-bold" htmlFor="ans">Tu respuesta ({bits.length * 2} bits esperados)</label>
        <input id="ans" className="field mono mt-1 text-lg tracking-widest" inputMode="numeric" autoComplete="off" value={val}
          onChange={(e) => setAnswers(answers.map((a, i) => (i === idx ? e.target.value.replace(/[^01]/g, '') : a)))} />
        <p className="muted mt-1 text-xs">{val.length} / {bits.length * 2} bits</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {exercises.map((_, i) => (
            <button key={i} className="btn mono" onClick={() => setIdx(i)} aria-label={`Ir al ejercicio ${i + 1}`}
              style={i === idx ? { background: 'var(--c-blue)', color: '#fff' } : answers[i] ? { background: 'var(--c-green-soft)' } : undefined}>{i + 1}</button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ChevronLeft size={18} /> Anterior</button>
          <button className="btn" disabled={idx === exercises.length - 1} onClick={() => setIdx(idx + 1)}>Siguiente <ChevronRight size={18} /></button>
          <button className="btn btn-green sm:ml-auto" onClick={() => { if (answered === exercises.length || confirm(`Te faltan ${exercises.length - answered} ejercicios sin responder; contarán como incorrectos. ¿Finalizar?`)) finish() }}>Finalizar examen</button>
        </div>
      </Section>
    )
  }

  const wrong = report.items.filter((x) => !x.ok)
  return (
    <div className="space-y-4">
      <Section title="Resultado" icon={ClipboardCheck} className="pop">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-[var(--c-border)] p-3"><div className="text-xs muted">Calificación</div><div className="mono text-3xl font-extrabold text-[var(--c-blue)]">{report.score}<span className="text-base">/100</span></div></div>
          <div className="rounded-xl border border-[var(--c-border)] p-3"><div className="text-xs muted">Correctos</div><div className="mono text-3xl font-extrabold text-[var(--c-green)]">{report.okN}/{report.items.length}</div></div>
          <div className="rounded-xl border border-[var(--c-border)] p-3"><div className="text-xs muted">Tiempo</div><div className="mono text-3xl font-extrabold">{fmt(report.seconds)}</div></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => setPhase('setup')}>Nuevo examen</button>
          <button className="btn" disabled={!wrong.length} onClick={() => begin(wrong.map((w) => w.bits), level)}><Repeat size={18} /> Repetir los {wrong.length} incorrectos</button>
        </div>
      </Section>

      <Section title="Revisión detallada">
        <div className="space-y-4">
          {report.items.map((it, i) => <Review key={i} it={it} n={i + 1} />)}
        </div>
      </Section>
      <HistoryList history={history} onClear={resetHistory} />
    </div>
  )
}

function Review({ it, n }) {
  const firstBad = it.ok ? -1 : (() => {
    for (let k = 0; k < it.steps.length; k++) if ((it.given.slice(k * 2, k * 2 + 2)) !== it.steps[k].output) return k
    return -1
  })()
  return (
    <div className={`rounded-xl border-2 p-3 ${it.ok ? 'border-[var(--c-green)]' : 'border-[var(--c-red)]'}`}>
      <div className="flex items-center justify-between">
        <b>Ejercicio {n}: <span className="mono">{it.bits}</span></b>
        <span className={`chip ${it.ok ? 'chip-green' : 'chip-red'}`}>{it.ok ? 'Correcto' : 'Incorrecto'}</span>
      </div>
      <p className="mono mt-2 break-all text-sm">Tu respuesta: <span className={it.ok ? '' : 'text-[var(--c-red)]'}>{it.given || '(vacía)'}</span></p>
      <p className="mono break-all text-sm">Correcta: <span className="text-[var(--c-green)]">{it.correct}</span></p>
      {!it.ok && firstBad >= 0 && (
        <p className="mt-2 text-sm">
          El primer error está en el <b>paso {firstBad + 1}</b>: estado {it.steps[firstBad].state}, entrada {it.steps[firstBad].input} → la flecha es{' '}
          <b className="mono">{it.steps[firstBad].input}/{it.steps[firstBad].output}</b> y llegas a {it.steps[firstBad].next}. Tú escribiste <b className="mono">{it.given.slice(firstBad * 2, firstBad * 2 + 2) || '—'}</b>.
          {it.given.length !== it.correct.length && ` Además, la longitud debía ser ${it.correct.length} bits y escribiste ${it.given.length}.`}
        </p>
      )}
      <details className="mt-2">
        <summary className="cursor-pointer text-sm font-semibold">Ver procedimiento</summary>
        <div className="scroll-x">
          <table className="mono mt-2 w-full min-w-[300px] text-center text-sm">
            <thead><tr className="muted"><th>Paso</th><th>Estado</th><th>Entrada</th><th>Salida</th><th>Nuevo</th></tr></thead>
            <tbody>
              {it.steps.map((s) => (
                <tr key={s.index} className={s.index === firstBad ? 'bg-[var(--c-red-soft)]' : ''}><td>{s.index + 1}</td><td>{s.state}</td><td>{s.input}</td><td>{s.output}</td><td>{s.next}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

function HistoryList({ history, onClear }) {
  return (
    <Section title="Historial de resultados" icon={History} right={history.length > 0 && <button className="btn text-sm" onClick={() => confirm('¿Borrar todo el historial?') && onClear()}><Trash2 size={16} /> Borrar</button>}>
      {history.length === 0 ? <p className="muted text-sm">Aún no has realizado exámenes.</p> : (
        <div className="scroll-x">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead><tr className="muted text-xs uppercase"><th className="p-1">Fecha</th><th>Nivel</th><th>Aciertos</th><th>Nota</th><th>Tiempo</th></tr></thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-t border-[var(--c-border)]">
                  <td className="p-1">{new Date(h.date).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{LEVEL_OPTS.find((o) => o.id === h.level)?.name.split(' (')[0] ?? h.level}</td>
                  <td>{h.ok}/{h.total}</td><td className="font-bold">{h.score}</td><td className="mono">{fmt(h.seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}
