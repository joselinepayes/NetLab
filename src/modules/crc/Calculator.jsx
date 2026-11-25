import { useMemo, useState } from 'react'
import { Calculator as CalcIcon } from 'lucide-react'
import { buildFrame, checkFrame, divide, polyToString } from './engine.js'
import LongDivision, { tonesFor } from './LongDivision.jsx'
import { MethodSelect } from './DivisionPlayer.jsx'
import ExportBar from './ExportBar.jsx'
import { Section, CopyButton } from '../../shared/ui.jsx'

export default function Calculator({ msg, gen, method, setMethod }) {
  const f = useMemo(() => buildFrame(msg, gen), [msg, gen])
  const [rxText, setRxText] = useState('')
  const rxClean = rxText.replace(/[^01]/g, '')
  const rx = rxClean.length >= gen.length ? rxClean : f.T
  const chk = useMemo(() => checkFrame(rx, gen, method), [rx, gen, method])
  const enc = useMemo(() => divide(f.extended, gen, method), [f, gen, method])
  const rows = [
    ['M', msg], ['M(x)', f.Mx], ['G', gen], ['G(x)', f.Gx], ['Grado de G', String(f.deg)], ['Mensaje extendido', f.extended],
    ['Cociente (no se usa)', f.quotient], ['Residuo R', f.remainder], ['R(x)', f.Rx], ['Trama T = M + R', f.T], ['T(x)', f.Tx],
  ]
  return (
    <div className="space-y-4">
      <Section title="Resultados" icon={CalcIcon}>
        <dl className="grid gap-2 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--c-border)] p-2">
              <div className="min-w-0"><dt className="text-xs muted">{k}</dt><dd className="mono break-all font-bold" style={{ color: k.startsWith('Residuo') || k.startsWith('Trama') ? 'var(--c-green)' : undefined }}>{v}</dd></div>
              <CopyButton text={v} label="" className="!min-h-9 !min-w-9 !px-2" />
            </div>
          ))}
        </dl>
        <div className="mt-3"><ExportBar msg={msg} gen={gen} method={method} /></div>
      </Section>

      <Section title="División de codificación">
        <MethodSelect method={method} setMethod={setMethod} />
        <p className="muted my-2 text-xs">Resultado completo (sin animación). Desliza horizontalmente si es larga.</p>
        <LongDivision trace={enc} colTones={tonesFor({ msgLen: msg.length, total: f.extended.length, zerosLen: f.deg })} />
      </Section>

      <Section title="Verificar una trama recibida">
        <label className="text-sm font-bold" htmlFor="rx">Trama recibida (vacío = la trama T sin errores)</label>
        <input id="rx" className="field mono mt-1 text-lg tracking-widest" inputMode="numeric" value={rxText} placeholder={f.T} onChange={(e) => setRxText(e.target.value.replace(/[^01\s]/g, '').slice(0, 64))} />
        {rxClean && rxClean.length < gen.length && <p className="mt-1 text-xs text-[var(--c-red)]">La trama debe tener al menos {gen.length} bits.</p>}
        <p className="mt-3 text-sm">Residuo de verificación: <b className="mono">{chk.remainder}</b> — <b style={{ color: chk.ok ? 'var(--c-green)' : 'var(--c-red)' }}>{chk.ok ? 'No se detectaron errores durante la transmisión.' : 'Se detectó un error durante la transmisión.'}</b></p>
        <div className="mt-3"><LongDivision trace={chk.trace} colTones={tonesFor({ msgLen: rx.length - f.deg, total: rx.length, remainderLen: f.deg })} /></div>
        <p className="muted mt-2 text-xs">Residuo cero no garantiza ausencia total de errores (hay patrones que el CRC no detecta). T(x) recibido: {polyToString(rx)}</p>
      </Section>
    </div>
  )
}
