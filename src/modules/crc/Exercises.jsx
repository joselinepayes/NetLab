import { useMemo } from 'react'
import { CheckCircle2, ListChecks } from 'lucide-react'
import { buildFrame, checkFrame, flipAt, polyToString } from './engine.js'
import { Section } from '../../shared/ui.jsx'

const OFFICIAL = [{ n: 1, msg: '10100' }, { n: 2, msg: '1100111' }]
const GEN = '10011'

function compute(msg) {
  const f = buildFrame(msg, GEN)
  const bad = flipAt(f.T, f.T.length - 1)
  return [
    ['M(x)', polyToString(msg)], ['G(x)', f.Gx], ['Mensaje extendido', f.extended], ['Residuo R', f.remainder], ['R(x)', f.Rx],
    ['Trama T', f.T], ['T(x)', f.Tx], ['Verificación correcta (residuo)', checkFrame(f.T, GEN).remainder],
    ['Trama con último bit invertido', bad], ['Verificación con error (residuo)', checkFrame(bad, GEN).remainder],
  ]
}

export default function Exercises({ onSolve, onPractice }) {
  const data = useMemo(() => OFFICIAL.map((o) => ({ ...o, rows: compute(o.msg) })), [])
  return (
    <div className="space-y-4">
      <Section title="Ejercicios oficiales del repaso" icon={ListChecks}>
        <p className="muted text-sm">Generador <b className="mono">G = 10011</b> (x⁴ + x + 1). Los resultados se calculan en este momento con el algoritmo real. Resuélvelos primero en papel y compara.</p>
      </Section>
      {data.map((d) => (
        <Section key={d.n} title={`Ejercicio ${d.n}: M = ${d.msg}`} icon={CheckCircle2}>
          <div className="scroll-x">
            <table className="w-full min-w-[320px] text-left text-sm">
              <tbody>
                {d.rows.map(([k, v]) => (
                  <tr key={k} className="border-t border-[var(--c-border)]"><td className="p-2 font-semibold">{k}</td><td className="mono p-2 break-all font-bold">{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => onSolve(d.msg, GEN)}>Resolver paso a paso en el simulador</button>
            <button className="btn" onClick={() => onPractice(d.msg, GEN)}>Practicar guiado</button>
          </div>
        </Section>
      ))}
    </div>
  )
}
