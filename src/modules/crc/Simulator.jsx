import { useMemo, useState } from 'react'
import { Binary, Braces, FilePlus2, Package, PlusSquare, Split } from 'lucide-react'
import { buildFrame, polyToString, onesPowers } from './engine.js'
import { tonesFor } from './LongDivision.jsx'
import DivisionPlayer, { MethodSelect } from './DivisionPlayer.jsx'
import { BitPowers, BitRow } from './Poly.jsx'
import ExportBar from './ExportBar.jsx'
import { Section } from '../../shared/ui.jsx'

export default function CrcSimulator({ msg, gen, method, setMethod, received }) {
  const f = useMemo(() => buildFrame(msg, gen), [msg, gen])
  const [built, setBuilt] = useState(false)
  const ones = onesPowers(msg)
  const tones = tonesFor({ msgLen: msg.length, total: f.extended.length, zerosLen: f.deg })

  return (
    <div className="space-y-4">
      <Section title="Etapa 1 · Mensaje → polinomio M(x)" icon={Binary}>
        <p className="mb-2 text-sm leading-relaxed">Cada bit del mensaje es el coeficiente de una potencia de x. El bit de la <b>derecha</b> es x⁰ y cada bit hacia la izquierda sube una potencia. Un bit <b>1</b> significa que ese término existe.</p>
        <BitPowers bits={msg} tone="blue" />
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {msg.split('').map((b, i) => {
            const p = msg.length - 1 - i
            return <li key={i} className={b === '1' ? 'font-semibold' : 'muted'}>El bit <span className="mono">{b}</span> corresponde a <span className="mono">x{p}</span>{b === '1' ? ' → se escribe' : ' → no se escribe'}</li>
          })}
        </ul>
        <p className="mt-3 text-sm">Resultado: <span className="mono rounded-lg bg-[var(--c-blue-soft)] px-2 py-1 text-base font-extrabold text-[var(--c-blue)]">M(x) = {polyToString(msg)}</span></p>
        <p className="muted mt-2 text-xs">Los términos con coeficiente 0 no se escriben porque «0·xᵏ» vale 0 y no aporta nada a la suma. {ones.length === 0 && 'Este mensaje solo tiene ceros, por eso M(x) = 0.'}</p>
      </Section>

      <Section title="Etapa 2 · Polinomio generador G(x)" icon={Braces}>
        <BitPowers bits={gen} tone="blue" />
        <p className="mt-3 text-sm">Conversión: <span className="mono font-bold">G = {gen}</span> → <span className="mono rounded-lg bg-[var(--c-blue-soft)] px-2 py-1 font-extrabold text-[var(--c-blue)]">G(x) = {polyToString(gen)}</span></p>
        <p className="mt-2 text-sm leading-relaxed">
          El <b>grado</b> de un polinomio es su mayor potencia de x. Se identifica contando los bits y restando 1: G tiene {gen.length} bits → grado {gen.length} − 1 = <b>{f.deg}</b> (la potencia más alta con coeficiente 1 es x{f.deg}). El grado determina cuántos ceros se agregan y cuántos bits tiene el residuo.
        </p>
      </Section>

      <Section title="Etapa 3 · Agregar ceros" icon={PlusSquare}>
        <p className="mb-2 text-sm leading-relaxed">Se agregan tantos ceros como el grado del generador ({f.deg}). Equivale a multiplicar M(x) por x{f.deg}, o sea desplazar el mensaje {f.deg} posiciones a la izquierda.</p>
        <BitRow bits={f.extended} colors={tones} />
        <p className="mt-2 text-sm">Mensaje original: <b className="mono text-[var(--c-blue)]">{msg}</b> · grado del generador: <b>{f.deg}</b> · mensaje extendido: <b className="mono"><span className="text-[var(--c-blue)]">{msg}</span><span className="text-[var(--c-violet)]">{'0'.repeat(f.deg)}</span></b></p>
        <p className="muted mt-1 text-xs">Azul = mensaje original · violeta (discontinuo) = ceros agregados.</p>
      </Section>

      <Section title="Etapa 4 · División binaria (módulo 2)" icon={Split}>
        <p className="mb-3 text-sm">Divide el mensaje extendido entre G. Elige el método que te enseña tu profesora; ambos dan el mismo residuo.</p>
        <MethodSelect method={method} setMethod={setMethod} />
        <div className="mt-4">
          <DivisionPlayer dividend={f.extended} gen={gen} method={method} colTones={tones} title={`${f.extended} ÷ ${gen}`} onEnd={() => setBuilt(true)} />
        </div>
      </Section>

      <Section title="Etapa 5 · Construcción de la trama transmitida T" icon={Package}
        right={<button className="btn text-sm" onClick={() => setBuilt(!built)}>{built ? 'Volver a los ceros' : 'Sustituir ceros por el residuo'}</button>}>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Residuo: <b className="mono text-[var(--c-green)]">R = {f.remainder}</b> ({f.deg} bits)</p>
          <p>Polinomio: <b className="mono">R(x) = {f.Rx}</b></p>
        </div>
        <div className="my-3"><BitRow bits={built ? f.T : f.extended} colors={Array.from({ length: f.extended.length }, (_, i) => (i < msg.length ? 'msg' : built ? 'rem' : 'pad'))} /></div>
        <p className="text-sm leading-relaxed">
          Los {f.deg} ceros agregados se <b>sustituyen</b> por el residuo: T = M seguido de R = <b className="mono"><span className="text-[var(--c-blue)]">{msg}</span><span className="text-[var(--c-green)]">{f.remainder}</span></b> = <b className="mono">{f.T}</b>.
        </p>
        <p className="mt-2 text-sm">Polinomio de la trama: <span className="mono rounded-lg bg-[var(--c-green-soft)] px-2 py-1 font-extrabold text-[var(--c-green)]">T(x) = {f.Tx}</span></p>
        <p className="muted mt-2 text-xs">T(x) siempre es divisible entre G(x): por eso el receptor puede comprobar la trama dividiéndola entre G. Continúa en la pestaña «Verificación».</p>
      </Section>

      <Section title="Exportar" icon={FilePlus2}>
        <ExportBar msg={msg} gen={gen} method={method} received={received} />
      </Section>
    </div>
  )
}
