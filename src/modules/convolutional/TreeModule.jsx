import { GitFork, ImageUp } from 'lucide-react'
import { TREE_DEFINITION } from './treeDefinition.js'
import { Section } from '../../shared/ui.jsx'

/**
 * Árbol de codificación.
 * Esta sección queda preparada pero NO inventa su funcionamiento: se activará cuando
 * se complete src/modules/convolutional/treeDefinition.js con las ramas del árbol original.
 */
export default function TreeModule() {
  if (!TREE_DEFINITION) {
    return (
      <Section title="Árbol de codificación" icon={GitFork}>
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--c-border)] p-6 text-center">
          <ImageUp size={40} className="text-[var(--c-blue)]" />
          <p className="max-w-prose text-sm leading-relaxed">
            Esta sección está <b>preparada, pero aún sin activar</b>. El árbol de codificación puede tener entradas y salidas distintas a las del diagrama de estados, por eso no se inventó ninguna rama.
          </p>
          <p className="muted max-w-prose text-sm leading-relaxed">
            Cuando se proporcione la imagen original del árbol, se transcribirán sus ramas (entrada, salida y nodo destino) en <code className="mono">treeDefinition.js</code> y esta pestaña mostrará el recorrido animado, los niveles según la longitud de la entrada y la salida acumulada.
          </p>
        </div>
      </Section>
    )
  }
  return null
}
