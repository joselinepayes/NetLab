import { useState } from 'react'
import { BookOpen, ClipboardCheck, GitFork, Layers, Play, Target } from 'lucide-react'
import Simulator from './Simulator.jsx'
import Methods from './Methods.jsx'
import Learn from './Learn.jsx'
import Practice from './Practice.jsx'
import Exam from './Exam.jsx'
import TreeModule from './TreeModule.jsx'
import { OFFICIAL_EXERCISES, validateBits } from './engine.js'
import { useStored } from '../../shared/storage.js'

const TABS = [
  { id: 'sim', name: 'Simulador', icon: Play },
  { id: 'methods', name: 'Métodos', icon: Layers },
  { id: 'learn', name: 'Aprender', icon: BookOpen },
  { id: 'practice', name: 'Práctica', icon: Target },
  { id: 'exam', name: 'Examen', icon: ClipboardCheck },
  { id: 'tree', name: 'Árbol', icon: GitFork },
]

export default function ConvolutionalModule() {
  const [tab, setTab] = useStored('conv.tab', 'sim')
  const [saved, setBits] = useStored('conv.bits', OFFICIAL_EXERCISES[0].bits)
  const bits = validateBits(saved).ok ? saved : OFFICIAL_EXERCISES[0].bits
  const current = TABS.some((t) => t.id === tab) ? tab : 'sim'

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-4 bg-[var(--c-bg)]/95 px-4 py-2 backdrop-blur sm:top-16" role="tablist" aria-label="Secciones">
        <div className="scroll-x no-scrollbar flex gap-1 rounded-2xl border border-[var(--c-border)] bg-[var(--c-card)] p-1">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={current === t.id} className="tab" onClick={() => setTab(t.id)}>
              <t.icon size={18} /> {t.name}
            </button>
          ))}
        </div>
      </div>
      {current === 'sim' && <Simulator bits={bits} setBits={setBits} />}
      {current === 'methods' && <Methods bits={bits} />}
      {current === 'learn' && <Learn onGoSimulator={() => setTab('sim')} />}
      {current === 'practice' && <Practice />}
      {current === 'exam' && <Exam />}
      {current === 'tree' && <TreeModule />}
    </div>
  )
}
