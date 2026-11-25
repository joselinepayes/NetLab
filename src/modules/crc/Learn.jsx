import { useState } from 'react'
import { AlertTriangle, BookOpen, Braces, Calculator, Shield, Sigma, Split } from 'lucide-react'
import { BitPowers } from './Poly.jsx'
import { XorExplain } from './DivisionPlayer.jsx'
import { polyToString } from './engine.js'
import { Section } from '../../shared/ui.jsx'

export default function Learn({ onGoSim }) {
  const [bits, setBits] = useState('10100')
  const flip = (i) => setBits(bits.slice(0, i) + (bits[i] === '1' ? '0' : '1') + bits.slice(i + 1))
  return (
    <div className="space-y-4">
      <Section title="1. ¿Qué es el CRC?" icon={Shield}>
        <p className="text-sm leading-relaxed">El <b>CRC</b> (Comprobación de Redundancia Cíclica) es un código para <b>detectar errores</b> en la transmisión. El emisor calcula unos bits extra —el <b>residuo</b>— a partir del mensaje y los pega al final. El receptor repite una división: si todo salió bien, el residuo de la comprobación es cero.</p>
        <p className="muted mt-2 text-sm">Todo se hace con números binarios y una operación especial, el XOR; no hay números decimales ni acarreos.</p>
      </Section>

      <Section title="2. Un mensaje es un polinomio" icon={Braces}>
        <p className="mb-2 text-sm leading-relaxed">Prueba tú mismo: toca los bits para cambiarlos. El bit de la derecha es x⁰; hacia la izquierda sube la potencia. Solo se escriben los términos cuyo bit vale 1.</p>
        <div className="mb-2 flex flex-wrap gap-1">
          {bits.split('').map((b, i) => <button key={i} className="btn mono !min-w-11 text-lg" onClick={() => flip(i)} aria-label={`Cambiar bit ${i + 1}`}>{b}</button>)}
        </div>
        <BitPowers bits={bits} />
        <p className="mt-3 text-sm">M = <span className="mono font-bold">{bits}</span> → <span className="mono rounded-lg bg-[var(--c-blue-soft)] px-2 py-1 font-extrabold text-[var(--c-blue)]">M(x) = {polyToString(bits)}</span></p>
        <p className="muted mt-2 text-xs">Los ceros no se escriben porque 0·xᵏ = 0 no aporta nada. Un mensaje que empieza con ceros (00110100) conserva esos ceros al transmitir, aunque en el polinomio no se vean.</p>
      </Section>

      <Section title="3. El polinomio generador y su grado" icon={Sigma}>
        <p className="text-sm leading-relaxed">Emisor y receptor acuerdan un polinomio <b>G(x)</b>. Ejemplo: <span className="mono">G(x) = x⁴ + x + 1 = 10011</span> (bits 1,0,0,1,1 para x⁴,x³,x²,x¹,x⁰).</p>
        <p className="mt-2 text-sm leading-relaxed">El <b>grado</b> es la mayor potencia: aquí 4. Se obtiene contando los bits y restando uno (5 − 1 = 4). Ese número manda en todo: se agregan <b>4 ceros</b> al mensaje y el residuo tiene <b>4 bits</b>. Por eso G debe empezar con 1.</p>
      </Section>

      <Section title="4. Agregar ceros" icon={Calculator}>
        <p className="text-sm leading-relaxed">Al mensaje se le agregan tantos ceros como el grado de G. Con M = 10100 y grado 4 queda <span className="mono"><b className="text-[var(--c-blue)]">10100</b><b className="text-[var(--c-violet)]">0000</b></span>. Esos ceros son el «espacio» donde después se colocará el residuo.</p>
      </Section>

      <Section title="5. XOR: la «resta» binaria" icon={Sigma}>
        <p className="mb-2 text-sm leading-relaxed">XOR compara columna por columna: <b>bits iguales → 0</b>, <b>bits distintos → 1</b>. No hay préstamos ni acarreos: cada columna se resuelve sola. Ejemplo con 10100 ⊕ 10011:</p>
        <XorExplain a="10100" b="10011" />
      </Section>

      <Section title="6. La división larga módulo 2" icon={Split}>
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">
          <li>Toma los primeros bits del dividendo, tantos como tiene el divisor (bloque).</li>
          <li>Si el bloque empieza con <b>1</b>, haz XOR con el generador. Si empieza con <b>0</b>, XOR con ceros.</li>
          <li>El primer bit del resultado siempre es 0: se tacha.</li>
          <li>Baja el siguiente bit del dividendo (método detallado), o —en el método rápido— omite todos los ceros iniciales y baja los bits necesarios para volver a completar el bloque.</li>
          <li>Repite hasta que no queden bits por bajar. Lo que queda es el <b>residuo</b>, siempre de (grado) bits, completado con ceros a la izquierda si hace falta.</li>
        </ol>
        <button className="btn btn-primary mt-3" onClick={onGoSim}>Verlo animado en el simulador</button>
      </Section>

      <Section title="7. La trama y la verificación" icon={Shield}>
        <p className="text-sm leading-relaxed">La trama transmitida es <b>T = mensaje + residuo</b> (el residuo reemplaza a los ceros agregados). T(x) siempre es divisible entre G(x). El receptor divide T entre G <b>sin agregar ceros</b>: residuo 0 → «no se detectaron errores»; residuo distinto de 0 → «se detectó un error».</p>
        <p className="mt-2 text-sm leading-relaxed">Ojo: residuo cero <b>no garantiza</b> que no haya errores. Si el error cambió bits de forma que e(x) es múltiplo de G(x), pasa desapercibido. Puedes probarlo en la pestaña «Verificación».</p>
      </Section>

      <Section title="Errores comunes" icon={AlertTriangle}>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>Contar mal las potencias: el bit de la <b>derecha</b> es x⁰.</li>
          <li>Agregar ceros de más o de menos: son el <b>grado</b> de G, no su número de bits.</li>
          <li>Olvidar el cero a la izquierda del residuo (debe tener exactamente «grado» bits).</li>
          <li>Hacer XOR con G cuando el bloque empieza en 0 (debe ser con ceros).</li>
          <li>Inventar bits cuando ya no quedan en el dividendo.</li>
          <li>Agregar ceros otra vez al verificar: en la verificación se divide T tal cual.</li>
        </ul>
      </Section>
    </div>
  )
}
