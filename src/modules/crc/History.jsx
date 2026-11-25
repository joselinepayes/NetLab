import { History as HistoryIcon, Trash2 } from 'lucide-react'
import { EXAM_LEVELS } from './practice.js'
import { Section } from '../../shared/ui.jsx'
import { useStored } from '../../shared/storage.js'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const when = (d) => new Date(d).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })

export default function History() {
  const [exams, , clearExams] = useStored('crc.history.exam', [])
  const [prac, , clearPrac] = useStored('crc.history.practice', [])
  const Clear = ({ on, n }) => n > 0 && <button className="btn text-sm" onClick={() => confirm('¿Borrar este historial?') && on()}><Trash2 size={16} /> Borrar</button>
  return (
    <div className="space-y-4">
      <Section title="Exámenes" icon={HistoryIcon} right={<Clear on={clearExams} n={exams.length} />}>
        {exams.length === 0 ? <p className="muted text-sm">Aún no has hecho exámenes CRC.</p> : (
          <div className="scroll-x"><table className="w-full min-w-[340px] text-left text-sm">
            <thead><tr className="muted text-xs uppercase"><th className="p-1">Fecha</th><th>Nivel</th><th>Ejercicios</th><th>Aciertos</th><th>Nota</th><th>Tiempo</th></tr></thead>
            <tbody>{exams.map((h, i) => (
              <tr key={i} className="border-t border-[var(--c-border)]"><td className="p-1">{when(h.date)}</td><td>{EXAM_LEVELS.find((l) => l.id === h.level)?.name ?? h.level}</td><td>{h.exercises}</td><td>{h.correct}/{h.total}</td><td className="font-bold">{h.score}</td><td className="mono">{fmt(h.seconds)}</td></tr>
            ))}</tbody></table></div>
        )}
      </Section>
      <Section title="Práctica guiada" right={<Clear on={clearPrac} n={prac.length} />}>
        {prac.length === 0 ? <p className="muted text-sm">Aún no has terminado ejercicios de práctica.</p> : (
          <div className="scroll-x"><table className="w-full min-w-[360px] text-left text-sm">
            <thead><tr className="muted text-xs uppercase"><th className="p-1">Fecha</th><th>M</th><th>G</th><th>Aciertos</th><th>Errores</th><th>Pistas</th><th>Nota</th></tr></thead>
            <tbody>{prac.map((h, i) => (
              <tr key={i} className="border-t border-[var(--c-border)]"><td className="p-1">{when(h.date)}</td><td className="mono">{h.msg}</td><td className="mono">{h.gen}</td><td>{h.ok}</td><td>{h.bad}</td><td>{h.hints}</td><td className="font-bold">{h.score}</td></tr>
            ))}</tbody></table></div>
        )}
      </Section>
    </div>
  )
}
