import { useEffect, useState } from 'react'
import { BookOpen, Calculator as CalcIcon, ClipboardCheck, History as HistoryIcon, ListChecks, Play, ShieldAlert, Target } from 'lucide-react'
import { DEFAULT_GENERATOR, validateMessage, parseGenerator } from './engine.js'
import InputPanel from './InputPanel.jsx'
import Learn from './Learn.jsx'
import CrcSimulator from './Simulator.jsx'
import Verification from './Verification.jsx'
import Calculator from './Calculator.jsx'
import Exercises from './Exercises.jsx'
import Practice from './Practice.jsx'
import Exam from './Exam.jsx'
import History from './History.jsx'
import PrintSheet from './PrintSheet.jsx'
import { useStored } from '../../shared/storage.js'

const TABS = [
  { id: 'learn', name: 'Aprender', icon: BookOpen },
  { id: 'sim', name: 'Simulador', icon: Play },
  { id: 'verify', name: 'Verificación y errores', icon: ShieldAlert },
  { id: 'calc', name: 'Calculadora', icon: CalcIcon },
  { id: 'exercises', name: 'Ejercicios', icon: ListChecks },
  { id: 'practice', name: 'Práctica', icon: Target },
  { id: 'exam', name: 'Examen', icon: ClipboardCheck },
  { id: 'history', name: 'Historial', icon: HistoryIcon },
]

export default function CrcModule() {
  const [tab, setTab] = useStored('crc.tab', 'sim')
  const [savedMsg, setMsg] = useStored('crc.msg', '10100')
  const [savedGen, setGen] = useStored('crc.gen', DEFAULT_GENERATOR)
  const [method, setMethod] = useStored('crc.method', 'fast')
  const [received, setReceived] = useState(null)

  const msg = validateMessage(savedMsg).ok ? savedMsg : '10100'
  const gen = parseGenerator(savedGen).ok ? parseGenerator(savedGen).bits : DEFAULT_GENERATOR
  const current = TABS.some((t) => t.id === tab) ? tab : 'sim'
  useEffect(() => setReceived(null), [msg, gen])

  const load = (m, g, to) => { setMsg(m); setGen(g); setTab(to) }
  const common = { msg, gen, method, setMethod }

  return (
    <div>
      <div className="no-print">
        <div className="sticky top-14 z-20 -mx-4 mb-4 bg-[var(--c-bg)]/95 px-4 py-2 backdrop-blur sm:top-16" role="tablist" aria-label="Secciones CRC">
          <div className="scroll-x no-scrollbar flex gap-1 rounded-2xl border border-[var(--c-border)] bg-[var(--c-card)] p-1">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={current === t.id} className="tab" onClick={() => setTab(t.id)}>
                <t.icon size={18} /> {t.name}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {['sim', 'verify', 'calc'].includes(current) && <InputPanel msg={msg} setMsg={setMsg} gen={gen} setGen={setGen} />}
          {current === 'learn' && <Learn onGoSim={() => setTab('sim')} />}
          {current === 'sim' && <CrcSimulator {...common} received={received} />}
          {current === 'verify' && <Verification {...common} received={received} setReceived={setReceived} />}
          {current === 'calc' && <Calculator {...common} />}
          {current === 'exercises' && <Exercises onSolve={(m, g) => load(m, g, 'sim')} onPractice={(m, g) => load(m, g, 'practice')} />}
          {current === 'practice' && <Practice {...common} />}
          {current === 'exam' && <Exam />}
          {current === 'history' && <History />}
        </div>
      </div>
      <PrintSheet msg={msg} gen={gen} method={method} received={received} />
    </div>
  )
}
