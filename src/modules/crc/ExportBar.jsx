import { Printer } from 'lucide-react'
import { CopyButton } from '../../shared/ui.jsx'
import { buildFrame, checkFrame, procedureTextCrc } from './engine.js'

/** Copiar resultado / procedimiento completo / imprimir (guardar como PDF con la impresión del navegador). */
export default function ExportBar({ msg, gen, method, received }) {
  const frame = buildFrame(msg, gen)
  const procedure = () => procedureTextCrc({ frame, method, received: received ?? frame.T, check: checkFrame(received ?? frame.T, gen, method) })
  const result = () => `M = ${msg}\nG = ${gen}\nR = ${frame.remainder}\nT = ${frame.T}\nT(x) = ${frame.Tx}`
  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton text={result} label="Copiar resultado" />
      <CopyButton text={procedure} label="Copiar procedimiento completo" />
      <button className="btn" onClick={() => window.print()}><Printer size={18} /> Imprimir / Guardar PDF</button>
    </div>
  )
}
