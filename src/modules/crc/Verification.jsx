import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowRight, CheckCircle2, RotateCcw, ShieldAlert, ShieldCheck, Zap } from 'lucide-react'
import { applyFlips, buildFrame, checkFrame, diffPositions, flipAt, randomPositions, undetectableError, polyToString } from './engine.js'
import { tonesFor } from './LongDivision.jsx'
import DivisionPlayer, { MethodSelect } from './DivisionPlayer.jsx'
import { BitRow } from './Poly.jsx'
import ExportBar from './ExportBar.jsx'
import { Section } from '../../shared/ui.jsx'

export default function Verification({ msg, gen, method, setMethod, received, setReceived }) {
  const f = useMemo(() => buildFrame(msg, gen), [msg, gen])
  const rx = received && received.length === f.T.length ? received : f.T
  const errs = diffPositions(f.T, rx)
  const check = useMemo(() => checkFrame(rx, gen, method), [rx, gen, method])
  const [custom, setCustom] = useState(1)
  const [note, setNote] = useState('')

  const colorsT = Array.from({ length: f.T.length }, (_, i) => (i < msg.length ? 'msg' : 'rem'))
  const colorsRx = colorsT.map((c, i) => (errs.includes(i) ? 'err' : c))
  const tones = tonesFor({ msgLen: msg.length, total: rx.length, remainderLen: f.deg, errors: errs })

  const set = (v, n = '') => { setReceived(v); setNote(n) }
  const L = f.T.length
  const toggle = (i) => set(flipAt(rx, i), `Invertiste el bit ${i + 1} (x${L - 1 - i}).`)

  return (
    <div className="space-y-4">
      <Section title="Emisor → Canal → Receptor" icon={Zap}>
        <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-start">
          <Box title="EMISOR" tone="blue">
            <p className="text-xs muted">Mensaje original M</p>
            <p className="mono break-all font-bold text-[var(--c-blue)]">{msg}</p>
            <p className="mt-1 text-xs muted">CRC (residuo) R</p>
            <p className="mono break-all font-bold text-[var(--c-green)]">{f.remainder}</p>
            <p className="mt-1 text-xs muted">Trama T = M + R</p>
            <BitRow bits={f.T} colors={colorsT} />
          </Box>
          <Arrow />
          <Box title="CANAL DE TRANSMISIÓN" tone={errs.length ? 'red' : 'blue'} wide>
            <p className="mb-1 text-xs muted">Pulsa cualquier bit para invertirlo (los alterados se ven en rojo). El número pequeño es la potencia de x.</p>
            <BitRow bits={rx} colors={colorsRx} onToggle={toggle} powers />
            <p className="mt-2 text-sm font-semibold" style={{ color: errs.length ? 'var(--c-red)' : 'var(--c-green)' }}>
              {errs.length ? `${errs.length} bit(s) alterado(s): ${errs.map((i) => `x${L - 1 - i}`).join(', ')}` : 'Transmisión sin modificaciones'}
            </p>
          </Box>
          <Arrow />
          <Box title="RECEPTOR" tone={check.ok ? 'green' : 'red'}>
            <p className="text-xs muted">Trama recibida ÷ G</p>
            <p className="mono break-all font-bold">{rx}</p>
            <p className="mt-1 text-xs muted">Residuo de verificación</p>
            <p className="mono text-lg font-extrabold" style={{ color: check.ok ? 'var(--c-green)' : 'var(--c-red)' }}>{check.remainder}</p>
          </Box>
        </div>
      </Section>

      <Section title="Simulador de errores" icon={AlertTriangle}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button className="btn" onClick={() => set(f.T, 'Trama original restaurada.')}><RotateCcw size={18} /> Restaurar trama original</button>
          <button className="btn" onClick={() => set(flipAt(f.T, L - 1), 'Se invirtió el último bit del residuo.')}>Invertir el último bit del residuo</button>
          <button className="btn" onClick={() => set(flipAt(f.T, 0), 'Se invirtió el primer bit.')}>Invertir el primer bit</button>
          <button className="btn" onClick={() => { const p = randomPositions(L, 1 + Math.floor(Math.random() * 3)); set(applyFlips(f.T, p), `Errores aleatorios en ${p.length} bit(s).`) }}><Zap size={18} /> Errores aleatorios (1 a 3)</button>
          <button className="btn" onClick={() => { const p = randomPositions(L, 2); set(applyFlips(f.T, p), 'Se introdujeron 2 errores.') }}>Introducir 2 errores</button>
          <button className="btn" onClick={() => { const u = undetectableError(f.T, gen, 0); set(u.received, 'Error construido como un múltiplo de G: el CRC no puede detectarlo.') }}>Ejemplo de error no detectable</button>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm font-bold">Bit personalizado (1 a {L}, de izquierda a derecha)
            <input type="number" min={1} max={L} className="field mono mt-1 !w-28" value={custom} onChange={(e) => setCustom(Math.max(1, Math.min(L, +e.target.value || 1)))} />
          </label>
          <button className="btn" onClick={() => toggle(custom - 1)}>Invertir ese bit</button>
        </div>
        {note && <p className="muted mt-2 text-sm" role="status">{note}</p>}
      </Section>

      <Section title="Verificación en el receptor" icon={check.ok ? ShieldCheck : ShieldAlert}>
        <div className={`mb-3 flex items-start gap-3 rounded-xl border-2 p-3 ${check.ok ? 'border-[var(--c-green)]' : 'border-[var(--c-red)]'}`} role="status">
          {check.ok ? <CheckCircle2 className="shrink-0 text-[var(--c-green)]" /> : <AlertTriangle className="shrink-0 text-[var(--c-red)]" />}
          <div className="text-sm leading-relaxed">
            <p className="text-base font-extrabold" style={{ color: check.ok ? 'var(--c-green)' : 'var(--c-red)' }}>
              {check.ok ? 'No se detectaron errores durante la transmisión.' : 'Se detectó un error durante la transmisión.'}
            </p>
            <p>Se divide la trama recibida entre G <b>sin agregar ceros</b>. Residuo = <b className="mono">{check.remainder}</b> {check.ok ? '(todo ceros).' : '(distinto de cero).'}</p>
            {check.ok && errs.length > 0 && <p className="mt-1 font-semibold text-[var(--c-red)]">¡Atención! La trama sí fue alterada ({errs.length} bits) y el CRC no lo detectó: el patrón de error es divisible entre G.</p>}
            <p className="muted mt-1">Un residuo cero <b>no garantiza</b> la ausencia absoluta de errores: existen patrones de error (múltiplos de G(x)) que el CRC no puede detectar.{gen.endsWith('1') ? ` Como G tiene término 1 y grado ${f.deg}, se detectan todos los errores de 1 bit y todas las ráfagas de hasta ${f.deg} bits.` : ''}</p>
          </div>
        </div>
        <MethodSelect method={method} setMethod={setMethod} />
        <div className="mt-4">
          <DivisionPlayer dividend={rx} gen={gen} method={method} colTones={tones} title={`Comprobación: ${rx} ÷ ${gen}`} />
        </div>
        <p className="muted mt-3 text-xs">T(x) transmitido: {f.Tx}{errs.length ? ` · recibido: ${polyToString(rx)}` : ''}</p>
      </Section>

      <Section title="Exportar">
        <ExportBar msg={msg} gen={gen} method={method} received={rx} />
      </Section>
    </div>
  )
}

function Box({ title, tone, children, wide }) {
  return (
    <div className={`card min-w-0 flex-1 border-2 p-3 ${wide ? 'lg:flex-[2]' : ''}`} style={{ borderColor: `var(--c-${tone})` }}>
      <p className="mb-2 text-xs font-extrabold tracking-wide" style={{ color: `var(--c-${tone})` }}>{title}</p>
      {children}
    </div>
  )
}
const Arrow = () => (
  <div className="flex items-center justify-center self-center text-[var(--c-muted)]">
    <ArrowRight className="hidden lg:block" /><ArrowDown className="lg:hidden" />
  </div>
)
