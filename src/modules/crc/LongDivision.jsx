import { useEffect, useMemo, useRef } from 'react'

const LEVEL = { select: 1, xor: 2, drop: 3 }

/**
 * División larga módulo 2 dibujada como en el cuaderno.
 * Todo se posiciona en una cuadrícula (columnas = bits del dividendo) con tipografía monoespaciada.
 *
 * props:
 *  trace   resultado de divideDetailed / divideFast
 *  stage   etapa actual de buildStages (null → muestra la división completa)
 *  colTones  array con el tono de cada bit del dividendo: msg | pad | rem | err | plain
 *  big     tamaño ampliado (pantalla completa)
 */
export default function LongDivision({ trace, stage = null, colTones, big = false, className = '' }) {
  const { n, m, gen, dividend, iterations, remainder, quotient, L } = trace
  const OFF = n + 1.2
  const boxRef = useRef(null)
  const anchorRef = useRef(null)
  const I = iterations.length
  const tones = colTones ?? Array(m).fill('plain')

  const kind = stage?.kind ?? 'full'
  const si = stage?.iter ?? 0
  const level = (i) => {
    if (!stage || kind === 'final') return 3
    if (kind === 'intro') return 0
    if (i < si) return 3
    if (i > si) return 0
    return LEVEL[kind]
  }
  const showFinal = !stage || kind === 'final'

  // ¿Cuántos dígitos del cociente ya están escritos?
  const filled = useMemo(() => {
    if (!stage || kind === 'final') return L
    if (kind === 'intro') return 0
    const it = iterations[si]
    return kind === 'drop' ? it.nextCol : it.col + 1
  }, [stage, kind, si, iterations, L])

  // Estado de cada columna del dividendo
  const col = useMemo(() => {
    const st = Array(m).fill('')
    for (let c = 0; c < trace.initialSkip; c++) st[c] = 'skipped'
    iterations.forEach((it, i) => {
      const lv = level(i)
      const current = stage && kind !== 'final' && si === i
      if (lv >= 3) it.brought.forEach((b) => { st[b.col] = b.kind === 'skipped' ? 'skipped' : (current ? 'brought' : 'broughtOld') })
      if (i === 0 && lv >= 1 && current && kind === 'select') for (let c = it.col; c < it.col + n; c++) st[c] = st[c] || 'block'
    })
    return st
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace, stage])

  const cellBox = (x, y) => ({ left: `calc(var(--cw) * ${x})`, top: `calc(var(--rh) * ${y})`, width: 'var(--cw)', height: 'var(--rh)' })
  const cells = []
  const push = (key, x, y, bit, cls, extra = {}) =>
    cells.push(<span key={key} className={`dv-cell ${cls}`} style={{ ...cellBox(x, y), ...extra }} data-bit={bit}>{bit}</span>)

  // Divisor
  gen.split('').forEach((b, k) => push(`g${k}`, k, 1, b, 'dv-gen'))
  // Dividendo
  dividend.split('').forEach((b, c) => {
    let cls = { msg: 'dv-msg', pad: 'dv-pad', rem: 'dv-rem', err: 'dv-err', plain: '' }[tones[c]] ?? ''
    if (col[c] === 'skipped') cls = 'dv-struck'
    else if (col[c] === 'brought') cls = 'dv-yellow'
    else if (col[c] === 'block') cls += ' dv-block'
    push(`d${c}`, OFF + c, 1, b, cls)
  })
  // Cociente
  for (let j = 0; j < L; j++) {
    if (j < filled) push(`q${j}`, OFF + j + n - 1, 0, quotient[j], quotient[j] === '1' ? 'dv-op' : '', { fontWeight: 800 })
    else push(`q${j}`, OFF + j + n - 1, 0, '·', 'dv-pending')
  }

  const arrows = []
  const rows = []
  iterations.forEach((it, i) => {
    const lv = level(i)
    if (lv < 1) return
    const yOp = 2 + 2 * i, yRes = 3 + 2 * i
    const current = stage && kind !== 'final' && si === i
    const dim = !current && stage ? 0.55 : 1
    // Operando alineado (divisor o ceros)
    it.operand.split('').forEach((b, k) => push(`o${i}-${k}`, OFF + it.col + k, yOp, b, it.op === 'gen' ? 'dv-op' : 'dv-pending', { opacity: dim }))
    rows.push(
      <span key={`lab${i}`} className="absolute whitespace-nowrap text-right text-[0.55em] font-bold" style={{ left: 0, top: `calc(var(--rh) * ${yOp})`, width: `calc(var(--cw) * ${OFF - 0.3})`, height: 'var(--rh)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--c-blue)', opacity: dim }}>
        ⊕ {it.op === 'gen' ? 'G' : '0…0'}
      </span>,
    )
    if (lv >= 2) {
      cells.push(<span key={`rule${i}`} className="dv-line" style={{ left: `calc(var(--cw) * ${OFF + it.col})`, width: `calc(var(--cw) * ${it.operand.length})`, top: `calc(var(--rh) * ${yRes})`, height: 2, opacity: dim }} />)
      const animate = current && kind === 'xor'
      it.result.split('').forEach((b, k) => {
        const struck = lv >= 3 && k < it.struck
        push(`r${i}-${k}-${animate ? 'a' : 's'}`, OFF + it.col + k, yRes, b, struck ? 'dv-struck' : (current && kind === 'xor' ? 'dv-op' : ''), {
          opacity: dim, ...(animate ? { animation: 'pop .35s ease-out both', animationDelay: `${k * 0.2}s` } : {}),
        })
      })
    }
    if (lv >= 3) {
      it.brought.forEach((b) => {
        const used = b.kind === 'used'
        push(`b${i}-${b.col}`, OFF + b.col, yRes, b.bit, used ? 'dv-yellow' : 'dv-struck', { opacity: dim })
        arrows.push(
          <span key={`ar${i}-${b.col}`} className={`dv-arrow ${used ? '' : 'dv-arrow-skip'}`}
            style={{ left: `calc(var(--cw) * ${OFF + b.col + 0.5})`, top: `calc(var(--rh) * 2 - var(--rh) * 0.1)`, height: `calc(var(--rh) * ${yRes - 2 + 0.1} - var(--rh) * 0.05)`, opacity: dim }} />,
        )
      })
    }
  })

  // Residuo final
  const yRem = 2 + 2 * I
  if (showFinal) {
    remainder.split('').forEach((b, k) => {
      const pad = trace.remainderPad && k < trace.remainderPad
      push(`rem${k}`, OFF + m - (n - 1) + k, yRem, b, 'dv-final', pad ? { outline: '2px dashed #fff', outlineOffset: -4 } : { animation: stage ? 'pop .4s ease-out both' : undefined, animationDelay: `${k * 0.12}s` })
    })
    rows.push(
      <span key="remlab" className="absolute whitespace-nowrap text-[0.5em] font-extrabold" style={{ left: 0, top: `calc(var(--rh) * ${yRem})`, width: `calc(var(--cw) * ${OFF - 0.3})`, height: 'var(--rh)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--c-green)' }}>
        RESIDUO =
      </span>,
    )
  }

  // Ancla para centrar la vista en lo que está pasando
  let ax = OFF + n / 2, ay = 1
  if (stage && kind !== 'intro') {
    if (kind === 'final') { ax = OFF + m - (n - 1) / 2; ay = yRem }
    else {
      const it = iterations[si]
      ax = OFF + it.col + n / 2 + (kind === 'drop' ? it.brought.length / 2 : 0)
      ay = kind === 'select' ? 2 + 2 * si : 3 + 2 * si
    }
  }
  useEffect(() => {
    const box = boxRef.current, a = anchorRef.current
    if (!box || !a) return
    box.scrollTo({ left: Math.max(0, a.offsetLeft - box.clientWidth / 2), top: Math.max(0, a.offsetTop - box.clientHeight / 2), behavior: 'smooth' })
  }, [kind, si, stage?.text])

  const totalRows = 3 + 2 * I + 0.4
  const vars = big ? { '--cw': '3.1rem', '--rh': '3.7rem' } : { '--cw': 'clamp(1.7rem, 7vw, 2.2rem)', '--rh': 'clamp(2.1rem, 8.5vw, 2.75rem)' }

  return (
    <div ref={boxRef} className={`dv-box scroll-x rounded-xl border border-[var(--c-border)] bg-[var(--c-bg)] p-3 ${className}`}
      style={{ ...vars, overflow: 'auto', maxHeight: big ? 'calc(100vh - 9rem)' : '68vh' }} aria-label="División larga módulo 2" role="img">
      <div className="mono relative" style={{ width: `calc(var(--cw) * ${OFF + m + 0.5})`, height: `calc(var(--rh) * ${totalRows})`, fontSize: 'calc(var(--cw) * 0.6)' }}>
        {/* barra de división ┌── */}
        <span className="dv-line" style={{ left: `calc(var(--cw) * ${n + 0.5})`, width: `calc(var(--cw) * ${m + 0.7})`, top: `calc(var(--rh) * 1)`, height: 3 }} />
        <span className="dv-line" style={{ left: `calc(var(--cw) * ${n + 0.5})`, width: 3, top: `calc(var(--rh) * 1)`, height: 'var(--rh)' }} />
        {cells}
        {rows}
        {arrows}
        <span ref={anchorRef} className="absolute" style={{ left: `calc(var(--cw) * ${ax})`, top: `calc(var(--rh) * ${ay})`, width: 1, height: 1 }} />
      </div>
    </div>
  )
}

/** Tonos por columna para el dividendo: mensaje azul, ceros agregados violeta, residuo verde, errores rojos. */
export function tonesFor({ msgLen, total, remainderLen = 0, zerosLen = 0, errors = [] }) {
  const t = Array.from({ length: total }, (_, i) => {
    if (i < msgLen) return 'msg'
    if (zerosLen && i < msgLen + zerosLen) return 'pad'
    if (remainderLen) return 'rem'
    return 'plain'
  })
  errors.forEach((i) => { if (i < total) t[i] = 'err' })
  return t
}
