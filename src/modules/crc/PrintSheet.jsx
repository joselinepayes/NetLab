import { buildFrame, checkFrame, diffPositions, divide } from './engine.js'
import LongDivision, { tonesFor } from './LongDivision.jsx'

/** Hoja de resolución completa, visible solo al imprimir / guardar como PDF. */
export default function PrintSheet({ msg, gen, method, received }) {
  const f = buildFrame(msg, gen)
  const rx = received && received.length === f.T.length ? received : f.T
  const enc = divide(f.extended, gen, method)
  const chk = checkFrame(rx, gen, method)
  const errs = diffPositions(f.T, rx)
  const items = [
    ['Mensaje M', msg], ['M(x)', f.Mx], ['Generador G', gen], ['G(x)', f.Gx], ['Grado de G', String(f.deg)],
    ['Mensaje extendido', f.extended], ['Residuo R', f.remainder], ['R(x)', f.Rx], ['Trama T = M + R', f.T], ['T(x)', f.Tx],
  ]
  return (
    <div className="print-only print-sheet" style={{ padding: '8mm' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 800 }}>NetLab — CRC: resolución completa</h1>
      <p style={{ fontSize: '12px' }}>Método de división: {method === 'detailed' ? 'detallado (un bit a la vez)' : 'rápido (de clase)'} · {new Date().toLocaleDateString('es')}</p>
      <section style={{ margin: '10px 0' }}>
        <table style={{ fontSize: '13px', borderCollapse: 'collapse', width: '100%' }}>
          <tbody>{items.map(([k, v]) => <tr key={k}><td style={{ border: '1px solid #bbb', padding: '3px 6px', fontWeight: 700, width: '35%' }}>{k}</td><td className="mono" style={{ border: '1px solid #bbb', padding: '3px 6px', wordBreak: 'break-all' }}>{v}</td></tr>)}</tbody>
        </table>
      </section>
      <section style={{ margin: '14px 0' }}>
        <h2 style={{ fontWeight: 800 }}>División de codificación: {f.extended} ÷ {gen}</h2>
        <LongDivision trace={enc} colTones={tonesFor({ msgLen: msg.length, total: f.extended.length, zerosLen: f.deg })} />
        <p style={{ fontSize: '13px' }}>Residuo = <b className="mono">{f.remainder}</b></p>
      </section>
      <section style={{ margin: '14px 0' }}>
        <h2 style={{ fontWeight: 800 }}>Verificación en el receptor: {rx} ÷ {gen}</h2>
        {errs.length > 0 && <p style={{ fontSize: '13px' }}>Bits alterados: {errs.length} (posiciones {errs.map((i) => i + 1).join(', ')} desde la izquierda).</p>}
        <LongDivision trace={chk.trace} colTones={tonesFor({ msgLen: msg.length, total: rx.length, remainderLen: f.deg, errors: errs })} />
        <p style={{ fontSize: '13px' }}>Residuo de verificación = <b className="mono">{chk.remainder}</b> → <b>{chk.ok ? 'No se detectaron errores durante la transmisión.' : 'Se detectó un error durante la transmisión.'}</b></p>
        <p style={{ fontSize: '11px' }}>Un residuo cero no garantiza ausencia absoluta de errores: existen patrones de error que el CRC no detecta.</p>
      </section>
    </div>
  )
}
