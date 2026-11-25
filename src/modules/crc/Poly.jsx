import { sup, polyToString } from './engine.js'

/** Fila de bits con la potencia de x que le corresponde a cada uno. */
export function BitPowers({ bits, tone = 'blue', highlightOnes = true, extra = 0, extraTone = 'violet' }) {
  const total = bits.length + extra
  const arr = (bits + '0'.repeat(extra)).split('')
  return (
    <div className="scroll-x pb-1">
      <div className="inline-flex gap-1.5">
        {arr.map((b, i) => {
          const p = total - 1 - i
          const isExtra = i >= bits.length
          const on = b === '1' && highlightOnes
          const color = isExtra ? extraTone : tone
          return (
            <div key={i} className="flex w-9 flex-col items-center sm:w-11">
              <span className="mono text-[11px] font-bold sm:text-xs" style={{ color: on ? `var(--c-${color})` : 'var(--c-muted)' }}>{p === 0 ? 'x⁰' : p === 1 ? 'x¹' : `x${sup(p)}`}</span>
              <span className="mono mt-1 flex h-10 w-full items-center justify-center rounded-lg text-xl font-extrabold transition-colors sm:h-11"
                style={{
                  background: on ? `var(--c-${color}-soft)` : 'var(--c-bg)',
                  color: on ? `var(--c-${color})` : 'var(--c-muted)',
                  border: `2px ${isExtra ? 'dashed' : 'solid'} ${on || isExtra ? `var(--c-${color})` : 'var(--c-border)'}`,
                }}>{b}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const Poly = ({ bits, name }) => (
  <span className="mono inline-block rounded-lg bg-[var(--c-bg)] px-2 py-1 font-bold">{name ? `${name}(x) = ` : ''}{polyToString(bits)}</span>
)

/** Bits de una trama; permite marcar alterados (rojo) y pulsar para invertir. */
export function BitRow({ bits, colors, onToggle, powers = false, size = 'normal' }) {
  const L = bits.length
  return (
    <div className="scroll-x pb-1">
      <div className="inline-flex gap-1">
        {bits.split('').map((b, i) => {
          const c = colors?.[i] ?? 'plain'
          const style = {
            msg: { background: 'var(--c-blue-soft)', color: 'var(--c-blue)', border: '2px solid var(--c-blue)' },
            rem: { background: 'var(--c-green-soft)', color: 'var(--c-green)', border: '2px solid var(--c-green)' },
            pad: { background: 'var(--c-violet-soft)', color: 'var(--c-violet)', border: '2px dashed var(--c-violet)' },
            err: { background: 'var(--c-red)', color: '#fff', border: '2px solid var(--c-red)' },
            plain: { background: 'var(--c-bg)', border: '2px solid var(--c-border)' },
          }[c]
          const Tag = onToggle ? 'button' : 'span'
          return (
            <span key={i} className="flex flex-col items-center">
              {powers && <span className="mono text-[10px] muted">{L - 1 - i}</span>}
              <Tag type={onToggle ? 'button' : undefined} onClick={onToggle ? () => onToggle(i) : undefined}
                aria-label={onToggle ? `Invertir bit ${i + 1} (x${L - 1 - i})` : undefined}
                className={`mono flex items-center justify-center rounded-lg font-extrabold transition-all ${size === 'big' ? 'h-12 w-10 text-2xl' : 'h-11 w-9 text-xl'} ${onToggle ? 'cursor-pointer hover:scale-110' : ''}`} style={style}>
                {b}
              </Tag>
            </span>
          )
        })}
      </div>
    </div>
  )
}
