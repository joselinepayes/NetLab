import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyText } from './storage.js'

export function CopyButton({ text, label = 'Copiar', className = '' }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className={`btn ${className}`}
      onClick={async () => {
        if (await copyText(typeof text === 'function' ? text() : text)) {
          setDone(true)
          setTimeout(() => setDone(false), 1800)
        }
      }}
    >
      {done ? <Check size={18} /> : <Copy size={18} />}
      {done ? '¡Copiado!' : label}
    </button>
  )
}

/** Cadena de bits con resaltado: highlight = índice amarillo; doneUntil = bits ya procesados */
export function BitStrip({ bits, highlight = -1, tone = 'yellow', group = 1, dimAfter = false, size = 'text-xl' }) {
  const chars = bits.split('')
  const out = []
  chars.forEach((c, i) => {
    const g = Math.floor(i / group)
    const active = group === 1 ? i === highlight : g === highlight
    const shown = !dimAfter || (group === 1 ? i <= highlight : g <= highlight)
    out.push(
      <span
        key={i}
        className={`mono font-bold ${size} inline-flex h-9 w-7 items-center justify-center rounded-md transition-all ${
          active ? (tone === 'yellow' ? 'chip-yellow scale-110' : 'chip-green scale-110') : ''
        } ${!shown ? 'opacity-25' : ''} ${group > 1 && i % group === group - 1 ? 'mr-1.5' : ''}`}
      >
        {c}
      </span>,
    )
  })
  return <span className="inline-flex flex-wrap items-center">{out}</span>
}

export function Section({ title, icon: Icon, children, right, className = '' }) {
  return (
    <section className={`card p-4 sm:p-5 ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold sm:text-lg">
            {Icon && <Icon size={20} className="text-[var(--c-blue)]" />}
            {title}
          </h2>
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function Legend() {
  const items = [
    ['var(--c-blue)', 'Estado actual / flecha'],
    ['var(--c-green)', 'Nuevo estado / salida'],
    ['var(--c-yellow)', 'Bit de entrada'],
  ]
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs muted">
      {items.map(([c, t]) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: c }} />
          {t}
        </span>
      ))}
    </div>
  )
}
