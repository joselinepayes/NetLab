import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ClipboardCheck, Repeat, Timer } from 'lucide-react'
import { EXAM_LEVELS, gradeExercise, makeExercise } from './practice.js'
import { divide, polyToString } from './engine.js'
import LongDivision, { tonesFor } from './LongDivision.jsx'
import { Section } from '../../shared/ui.jsx'
import { useStored } from '../../shared/storage.js'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function Exam() {
  const [level, setLevel] = useState('basic')
  const [count, setCount] = useState(3)
  const [phase, setPhase] = useState('setup')
  const [exs, setExs] = useState([])
  const [ans, setAns] = useState([])
  const [idx, setIdx] = useState(0)
  const [secs, setSecs] = useState(0)
  const [report, setReport] = useState(null)
  const [, setHistory] = useStored('crc.history.exam', [])
  const t0 = useRef(0)

  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => setSecs(Math.floor((Date.now() - t0.current) / 1000)), 500)
    return () => clearInterval(id)
  }, [phase])

  const begin = (list, lvl) => {
    setExs(list); setAns(list.map(() => ({ remainder: '', T: '', detected: '' }))); setIdx(0); setSecs(0); setLevel(lvl); setReport(null)
    t0.current = Date.now(); setPhase('running')
  }
  const upd = (k, v) => setAns(ans.map((a, i) => (i === idx ? { ...a, [k]: v } : a)))

  const finish = () => {
    const seconds = Math.floor((Date.now() - t0.current) / 1000)
    const items = exs.map((e, i) => ({ ex: e, ans: ans[i], ...gradeExercise(e, ans[i]) }))
    const correct = items.reduce((s, x) => s + x.correct, 0)
    const total = items.length * 3
    const score = Math.round((correct / total) * 100)
    setReport({ items, correct, total, score, seconds })
    setHistory((h) => [{ date: new Date().toISOString(), level, exercises: items.length, correct, total, score, seconds }, ...h].slice(0, 40))
    setPhase('review')
  }

  if (phase === 'setup') {
    return (
      <Section title="Modo examen CRC" icon={ClipboardCheck}>
        <p className="muted mb-3 text-sm">Ejercicios aleatorios con distintos mensajes y polinomios. Para cada uno calcula el <b>residuo</b>, la <b>trama T</b> y decide si el receptor <b>detecta un error</b>. No se muestran respuestas hasta finalizar. Resuelve en papel y escribe los resultados.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">Nivel
            <select className="field mt-1" value={level} onChange={(e) => setLevel(e.target.value)}>
              {EXAM_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.desc}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">Ejercicios
            <select className="field mt-1" value={count} onChange={(e) => setCount(+e.target.value)}>{[3, 5, 8].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
        </div>
        <button className="btn btn-primary mt-4" onClick={() => begin(Array.from({ length: count }, () => makeExercise(level)), level)}><Timer size={18} /> Comenzar examen</button>
      </Section>
    )
  }

  if (phase === 'running') {
    const e = exs[idx], a = ans[idx]
    const L = e.msg.length + e.gen.length - 1
    const answered = ans.filter((x) => x.remainder && x.T && x.detected).length
    return (
      <Section title={`Ejercicio ${idx + 1} de ${exs.length}`} icon={ClipboardCheck} right={<span className="chip chip-blue mono text-base"><Timer size={16} className="mr-1" />{fmt(secs)}</span>}>
        <div className="grid gap-2 rounded-xl bg-[var(--c-bg)] p-3 text-sm sm:grid-cols-3">
          <p>Mensaje M<br /><b className="mono text-lg tracking-widest">{e.msg}</b></p>
          <p>Generador G<br /><b className="mono text-lg">{e.gen}</b> <span className="muted">= {polyToString(e.gen)}</span></p>
          <p>Trama recibida<br /><b className="mono break-all text-lg tracking-wider">{e.received}</b></p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">Residuo R ({e.gen.length - 1} bits)
            <input className="field mono mt-1 text-lg tracking-widest" inputMode="numeric" autoComplete="off" value={a.remainder} onChange={(ev) => upd('remainder', ev.target.value.replace(/[^01]/g, ''))} />
          </label>
          <label className="text-sm font-bold">Trama transmitida T ({L} bits)
            <input className="field mono mt-1 text-lg tracking-widest" inputMode="numeric" autoComplete="off" value={a.T} onChange={(ev) => upd('T', ev.target.value.replace(/[^01]/g, ''))} />
          </label>
        </div>
        <div className="mt-3">
          <p className="text-sm font-bold">Al dividir la trama recibida entre G, ¿el receptor detecta un error?</p>
          <div className="mt-1 flex gap-2">
            {[['yes', 'Sí, error detectado'], ['no', 'No se detectan errores']].map(([v, l]) => (
              <button key={v} className="btn flex-1" aria-pressed={a.detected === v} style={a.detected === v ? { background: 'var(--c-blue)', color: '#fff' } : undefined} onClick={() => upd('detected', v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {exs.map((_, i) => <button key={i} className="btn mono" onClick={() => setIdx(i)} aria-label={`Ir al ejercicio ${i + 1}`} style={i === idx ? { background: 'var(--c-blue)', color: '#fff' } : ans[i].remainder && ans[i].T && ans[i].detected ? { background: 'var(--c-green-soft)' } : undefined}>{i + 1}</button>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ChevronLeft size={18} /> Anterior</button>
          <button className="btn" disabled={idx === exs.length - 1} onClick={() => setIdx(idx + 1)}>Siguiente <ChevronRight size={18} /></button>
          <button className="btn btn-green sm:ml-auto" onClick={() => (answered === exs.length || confirm(`Hay ${exs.length - answered} ejercicio(s) incompletos; sus partes vacías cuentan como incorrectas. ¿Finalizar?`)) && finish()}>Finalizar examen</button>
        </div>
      </Section>
    )
  }

  const wrong = report.items.filter((x) => x.correct < 3)
  return (
    <div className="space-y-4">
      <Section title="Resultado" icon={ClipboardCheck} className="pop">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-[var(--c-border)] p-3"><div className="text-xs muted">Calificación</div><div className="mono text-3xl font-extrabold text-[var(--c-blue)]">{report.score}<span className="text-base">/100</span></div></div>
          <div className="rounded-xl border border-[var(--c-border)] p-3"><div className="text-xs muted">Aciertos</div><div className="mono text-3xl font-extrabold text-[var(--c-green)]">{report.correct}/{report.total}</div></div>
          <div className="rounded-xl border border-[var(--c-border)] p-3"><div className="text-xs muted">Tiempo</div><div className="mono text-3xl font-extrabold">{fmt(report.seconds)}</div></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => setPhase('setup')}>Nuevo examen</button>
          <button className="btn" disabled={!wrong.length} onClick={() => begin(wrong.map((w) => w.ex), level)}><Repeat size={18} /> Repetir {wrong.length} ejercicio(s) con errores</button>
        </div>
      </Section>
      <Section title="Revisión detallada">
        <div className="space-y-4">
          {report.items.map((it, i) => {
            const f = it.solution.frame
            const trace = divide(f.extended, f.gen, 'fast')
            const row = (label, mine, right, ok) => (
              <tr className="border-t border-[var(--c-border)]"><td className="p-1 font-semibold">{label}</td>
                <td className="mono p-1 break-all" style={{ color: ok ? 'var(--c-green)' : 'var(--c-red)' }}>{mine || '—'}</td><td className="mono p-1 break-all text-[var(--c-green)]">{right}</td></tr>
            )
            return (
              <div key={i} className="rounded-xl border-2 p-3" style={{ borderColor: it.correct === 3 ? 'var(--c-green)' : 'var(--c-red)' }}>
                <p className="font-bold">Ejercicio {i + 1}: M = <span className="mono">{it.ex.msg}</span>, G = <span className="mono">{it.ex.gen}</span> · {it.correct}/3</p>
                <div className="scroll-x"><table className="mt-2 w-full min-w-[300px] text-left text-sm">
                  <thead><tr className="muted text-xs uppercase"><th className="p-1"></th><th className="p-1">Tu respuesta</th><th className="p-1">Correcta</th></tr></thead>
                  <tbody>
                    {row('Residuo R', it.ans.remainder, f.remainder, it.parts.remainder)}
                    {row('Trama T', it.ans.T, f.T, it.parts.T)}
                    {row('¿Error detectado?', it.ans.detected === 'yes' ? 'Sí' : it.ans.detected === 'no' ? 'No' : '', it.solution.detected ? 'Sí' : 'No', it.parts.detected)}
                  </tbody></table></div>
                <p className="muted mt-2 text-xs">Mensaje extendido: {f.extended} · T(x) = {f.Tx}</p>
                <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold">Ver la división completa (método rápido)</summary>
                  <div className="mt-2"><LongDivision trace={trace} colTones={tonesFor({ msgLen: f.msg.length, total: f.extended.length, zerosLen: f.deg })} /></div>
                </details>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
