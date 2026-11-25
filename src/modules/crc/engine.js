// Motor CRC — aritmética módulo 2 (XOR). Todo se calcula con el algoritmo real.

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }
const UNSUP = Object.fromEntries(Object.entries(SUP).map(([k, v]) => [v, k]))
export const sup = (n) => String(n).split('').map((c) => SUP[c]).join('')

export const DEFAULT_GENERATOR = '10011'
export const MAX_MESSAGE = 32
export const MAX_DEGREE = 16

export const GENERATOR_EXAMPLES = ['1011', '10011', '11001', '100101']

/* ───────────── Validación ───────────── */
export function validateMessage(raw, max = MAX_MESSAGE) {
  const value = String(raw ?? '').replace(/\s+/g, '')
  if (!value) return { ok: false, value, error: 'Escribe un mensaje binario (solo 0 y 1).' }
  if (!/^[01]+$/.test(value)) return { ok: false, value, error: 'El mensaje solo puede tener los dígitos 0 y 1.' }
  if (value.length > max) return { ok: false, value, error: `Máximo ${max} bits.` }
  return { ok: true, value, error: null }
}

export function randomBits(len, rng = Math.random) {
  return Array.from({ length: len }, () => (rng() < 0.5 ? '0' : '1')).join('')
}

/** Convierte "x^4 + x + 1", "x⁴+x+1", "x4 + x + 1" en un conjunto de exponentes. */
export function parsePolynomialTerms(text) {
  let s = String(text ?? '').toLowerCase().replace(/\s+/g, '')
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => `^${UNSUP[c]}`).replace(/\^\^/g, '^').replace(/[−–-]/g, '+').replace(/\*\*/g, '^')
  // "x^1" + "^2" tras reemplazo de superíndices: unir dígitos consecutivos (x¹⁰ → x^1^0)
  s = s.replace(/\^(\d)\^(\d)/g, '^$1$2').replace(/\^(\d)\^(\d)/g, '^$1$2')
  if (!s) return { ok: false, exps: new Set(), error: 'Escribe un polinomio, por ejemplo x⁴ + x + 1.' }
  const exps = new Set()
  for (const t of s.split('+')) {
    let p
    if (t === '1') p = 0
    else if (t === '0') continue
    else {
      const m = /^x(?:\^?(\d+))?$/.exec(t)
      if (!m) return { ok: false, exps, error: `No entiendo el término «${t}». Usa términos como x⁴, x^3, x o 1.` }
      p = m[1] === undefined ? 1 : Number(m[1])
    }
    if (exps.has(p)) return { ok: false, exps, error: `El término de potencia ${p} está repetido.` }
    exps.add(p)
  }
  return { ok: true, exps, error: null }
}

export function expsToBits(exps) {
  if (!exps.size) return '0'
  const max = Math.max(...exps)
  return Array.from({ length: max + 1 }, (_, i) => (exps.has(max - i) ? '1' : '0')).join('')
}

/** Valida un generador escrito en binario (10011) o en forma polinomial (x⁴ + x + 1). */
export function parseGenerator(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return { ok: false, error: 'Escribe el generador en binario (10011) o como polinomio (x⁴ + x + 1).' }
  let bits
  if (/^[01\s]+$/.test(text)) bits = text.replace(/\s+/g, '')
  else {
    const r = parsePolynomialTerms(text)
    if (!r.ok) return { ok: false, error: r.error }
    bits = expsToBits(r.exps)
  }
  if (bits[0] !== '1') return { ok: false, error: 'El generador debe comenzar con 1 (el término de mayor grado).' }
  if (bits.length < 2) return { ok: false, error: 'El generador debe tener grado 1 o mayor (al menos 2 bits).' }
  if (bits.length - 1 > MAX_DEGREE) return { ok: false, error: `El grado máximo permitido es ${MAX_DEGREE}.` }
  const warn = bits.endsWith('0') ? 'Aviso: sin término 1 (x⁰) el CRC detecta peor los errores; normalmente G termina en 1.' : null
  return { ok: true, bits, degree: bits.length - 1, warn, error: null }
}

/* ───────────── Polinomios ───────────── */
export const onesPowers = (bits) => bits.split('').map((b, i) => (b === '1' ? bits.length - 1 - i : -1)).filter((p) => p >= 0)
export const termText = (p, ascii = false) => (p === 0 ? '1' : p === 1 ? 'x' : ascii ? `x^${p}` : `x${sup(p)}`)
export function polyToString(bits, ascii = false) {
  const ps = onesPowers(bits)
  return ps.length ? ps.map((p) => termText(p, ascii)).join(' + ') : '0'
}

/* ───────────── XOR ───────────── */
export function xorBits(a, b) {
  if (a.length !== b.length) throw new Error('XOR requiere cadenas de igual longitud')
  let r = ''
  for (let i = 0; i < a.length; i++) r += a[i] === b[i] ? '0' : '1'
  return r
}
export const xorColumns = (a, b) => a.split('').map((x, i) => ({ a: x, b: b[i], r: x === b[i] ? '0' : '1' }))
export const leadingZeros = (s) => { let k = 0; while (k < s.length && s[k] === '0') k++; return k }

/* ───────────── División larga módulo 2 ───────────── */
function assertDims(dividend, gen) {
  const n = gen.length, m = dividend.length
  if (m < n) throw new Error('El dividendo debe tener al menos tantos bits como el divisor')
  return { n, m, L: m - n + 1 }
}

/** Método detallado: baja un bit a la vez; XOR con G si el bloque empieza en 1, con ceros si empieza en 0. */
export function divideDetailed(dividend, gen) {
  const { n, m, L } = assertDims(dividend, gen)
  const zeros = '0'.repeat(n)
  const iterations = []
  let block = dividend.slice(0, n)
  for (let i = 0; i < L; i++) {
    const q = block[0]
    const op = q === '1' ? 'gen' : 'zeros'
    const operand = op === 'gen' ? gen : zeros
    const result = xorBits(block, operand)
    const pos = i + n
    const brought = pos < m ? [{ col: pos, bit: dividend[pos], kind: 'used' }] : []
    const nextBlock = brought.length ? result.slice(1) + brought[0].bit : null
    iterations.push({ index: i, col: i, block, q, op, operand, result, struck: 1, brought, nextBlock, nextCol: i + 1 })
    if (nextBlock) block = nextBlock
  }
  return {
    method: 'detailed', dividend, gen, n, m, L, iterations, initialSkip: 0,
    quotient: iterations.map((x) => x.q).join(''),
    remainder: iterations[L - 1].result.slice(1),
  }
}

/** Método rápido (de clase): omite los ceros iniciales y baja los bits necesarios para volver a n bits. */
export function divideFast(dividend, gen) {
  const { n, m, L } = assertDims(dividend, gen)
  let w = ''
  let pos = 0
  const fill = () => {
    const brought = []
    while (w.length < n && pos < m) {
      if (w === '' && dividend[pos] === '0') brought.push({ col: pos, bit: '0', kind: 'skipped' })
      else { brought.push({ col: pos, bit: dividend[pos], kind: 'used' }); w += dividend[pos] }
      pos++
    }
    return brought
  }
  const initial = fill()
  const initialSkip = initial.filter((b) => b.kind === 'skipped').length
  const iterations = []
  const quotient = Array(L).fill('0')
  while (w.length === n) {
    const block = w
    const col = pos - n
    const result = xorBits(block, gen)
    const z = leadingZeros(result)
    w = result.slice(z)
    const brought = fill()
    const nextBlock = w.length === n ? w : null
    quotient[col] = '1'
    iterations.push({ index: iterations.length, col, block, q: '1', op: 'gen', operand: gen, result, struck: z, brought, nextBlock, nextCol: nextBlock ? pos - n : L })
  }
  return {
    method: 'fast', dividend, gen, n, m, L, iterations, initialSkip,
    quotient: quotient.join(''),
    remainder: w.padStart(n - 1, '0'),
    remainderPad: n - 1 - w.length,
  }
}

export const divide = (dividend, gen, method = 'fast') => (method === 'detailed' ? divideDetailed(dividend, gen) : divideFast(dividend, gen))

/* ───────────── Trama CRC ───────────── */
export function buildFrame(msg, gen) {
  const deg = gen.length - 1
  const extended = msg + '0'.repeat(deg)
  const trace = divideDetailed(extended, gen)
  const remainder = trace.remainder
  const T = msg + remainder
  return {
    msg, gen, deg, extended, remainder, T, quotient: trace.quotient,
    Mx: polyToString(msg), Gx: polyToString(gen), Rx: polyToString(remainder), Tx: polyToString(T),
  }
}

export function checkFrame(received, gen, method = 'fast') {
  const trace = divide(received, gen, method)
  return { trace, remainder: trace.remainder, ok: /^0*$/.test(trace.remainder) }
}

/* ───────────── Errores de transmisión ───────────── */
export const flipAt = (s, i) => s.slice(0, i) + (s[i] === '1' ? '0' : '1') + s.slice(i + 1)
export const diffPositions = (a, b) => a.split('').map((c, i) => (c !== b[i] ? i : -1)).filter((i) => i >= 0)
export function randomPositions(len, count, rng = Math.random) {
  const set = new Set()
  while (set.size < Math.min(count, len)) set.add(Math.floor(rng() * len))
  return [...set].sort((a, b) => a - b)
}
export const applyFlips = (s, positions) => positions.reduce((acc, i) => flipAt(acc, i), s)

/** Error que CRC NO detecta: patrón e(x) múltiplo de G(x) (aquí G desplazado `shift` posiciones). */
export function undetectableError(T, gen, shift = 0) {
  const len = T.length
  const s = Math.max(0, Math.min(shift, len - gen.length))
  const e = '0'.repeat(s) + gen + '0'.repeat(len - gen.length - s)
  return { received: xorBits(T, e), positions: diffPositions(T, xorBits(T, e)) }
}

/* ───────────── Etapas para la animación ───────────── */
export const stageIndex = (trace, iter, kind) => 1 + 3 * iter + { select: 0, xor: 1, drop: 2 }[kind]

export function buildStages(trace) {
  const { n, gen, dividend, iterations, method } = trace
  const fast = method === 'fast'
  const stages = []
  let intro = `Vamos a dividir el dividendo ${dividend} entre el divisor ${gen} con aritmética módulo 2: la «resta» es XOR, sin préstamos ni acarreos. El divisor tiene ${n} bits, así que cada bloque de trabajo tiene ${n} bits.`
  if (fast && trace.initialSkip) intro += ` Los ${trace.initialSkip} cero(s) iniciales del dividendo no aportan nada: se omiten (tachados) hasta encontrar el primer 1.`
  stages.push({ kind: 'intro', iter: -1, text: intro, xor: null })

  iterations.forEach((it, i) => {
    const num = i + 1
    stages.push({
      kind: 'select', iter: i, xor: null,
      text: fast
        ? `Paso ${num}: el bloque de ${n} bits es ${it.block}. Comienza con 1, así que el cociente lleva 1 en esta posición y alineamos el generador ${gen} debajo.`
        : `Paso ${num}: tomamos el bloque ${it.block}. Comienza con ${it.q}, por lo tanto el cociente lleva ${it.q} y se hace XOR con ${it.op === 'gen' ? `el generador ${gen}` : `un bloque de ${n} ceros (${it.operand})`}.`,
    })
    stages.push({
      kind: 'xor', iter: i, xor: { a: it.block, b: it.operand, r: it.result },
      text: `Paso ${num} · XOR: ${it.block} ⊕ ${it.operand} = ${it.result}. ${it.q === '1' ? 'El primer bit siempre se anula porque 1 ⊕ 1 = 0.' : 'Con ceros el bloque queda igual, y su primer bit (0) se anula.'} Pulsa «Ver XOR columna por columna» para ver cada cifra.`,
    })
    const used = it.brought.filter((b) => b.kind === 'used')
    const skipped = it.brought.filter((b) => b.kind === 'skipped')
    const last = i === iterations.length - 1
    let drop
    if (fast) {
      const tail = it.result.slice(it.struck)
      drop = `Paso ${num} · bajar bits: el resultado ${it.result} tiene ${it.struck} cero(s) inicial(es): se omiten (tachados).`
      if (it.struck === n) drop += ' Todo el resultado era cero.'
      if (skipped.length) drop += ` Los ${skipped.length} cero(s) siguientes del dividendo también se descartan hasta hallar un 1.`
      if (used.length) drop += ` Bajamos ${used.length} bit(s) del dividendo (${used.map((b) => b.bit).join(' ')}) y el nuevo bloque es ${it.nextBlock ?? `${tail}${used.map((b) => b.bit).join('')}`}.`
      if (last) drop += ` No quedan más bits por bajar y ${tail || '0'} tiene grado menor que G: es el residuo${trace.remainderPad ? `, completado con ${trace.remainderPad} cero(s) a la izquierda hasta ${n - 1} bits` : ''}.`
    } else {
      drop = `Paso ${num} · bajar bit: el primer bit del resultado es 0 y se descarta (tachado).`
      if (used.length) drop += ` Bajamos el siguiente bit del dividendo (${used[0].bit}) y el nuevo bloque es ${it.nextBlock}.`
      else drop += ` Ya no quedan bits por bajar: el resultado sin el 0 tachado, ${it.result.slice(1)}, es el residuo.`
    }
    stages.push({ kind: 'drop', iter: i, xor: null, text: drop })
  })

  stages.push({
    kind: 'final', iter: iterations.length, xor: null,
    text: `Residuo final: R = ${trace.remainder}${trace.remainder.length ? ` (${trace.remainder.length} bits = grado de G)` : ''}. Cociente: ${trace.quotient} (no se usa en el CRC).`,
  })
  return stages
}

/* ───────────── Exportación de texto ───────────── */
export function asciiDivision(trace) {
  const { dividend, gen, iterations, n } = trace
  const lines = [`Divisor G = ${gen}  |  Dividendo = ${dividend}  |  Cociente = ${trace.quotient}`, '']
  lines.push(dividend)
  iterations.forEach((it, i) => {
    const pad = ' '.repeat(it.col)
    lines.push(`${pad}${it.operand}   ← paso ${i + 1}: ${it.op === 'gen' ? 'XOR con G' : 'XOR con ceros'}`)
    lines.push(`${pad}${'-'.repeat(n)}`)
    const bring = it.brought.map((b) => b.bit).join('')
    lines.push(`${pad}${it.result}${bring ? ` ↓ bajan: ${it.brought.map((b) => b.bit + (b.kind === 'skipped' ? '(omitido)' : '')).join(' ')}` : ''}`)
  })
  lines.push('', `Residuo = ${trace.remainder}`)
  return lines.join('\n')
}

export function procedureTextCrc({ frame, method, received, check }) {
  const f = frame
  const trace = divide(f.extended, f.gen, method)
  const out = [
    'CRC — PROCEDIMIENTO COMPLETO',
    `Método de división: ${method === 'detailed' ? 'detallado (un bit a la vez)' : 'rápido (de clase)'}`,
    '',
    `1) Mensaje M = ${f.msg}`,
    `   M(x) = ${polyToString(f.msg, true)}`,
    `2) Generador G = ${f.gen}`,
    `   G(x) = ${polyToString(f.gen, true)}   (grado ${f.deg})`,
    `3) Ceros a agregar: ${f.deg}  →  mensaje extendido = ${f.extended}`,
    '',
    '4) División módulo 2 (extendido ÷ G):',
    asciiDivision(trace),
    '',
    `5) Residuo R = ${f.remainder}   R(x) = ${polyToString(f.remainder, true)}`,
    `   Trama transmitida T = M + R = ${f.msg} ${f.remainder} = ${f.T}`,
    `   T(x) = ${polyToString(f.T, true)}`,
  ]
  const rx = received ?? f.T
  const c = check ?? checkFrame(rx, f.gen, method)
  out.push('', `6) Verificación en el receptor — trama recibida = ${rx}${rx === f.T ? '' : '  (modificada)'}`, asciiDivision(c.trace), '',
    `   Residuo de verificación = ${c.remainder}`,
    c.ok ? '   → No se detectaron errores durante la transmisión.' : '   → Se detectó un error durante la transmisión.',
    '   (Un residuo cero no garantiza ausencia total de errores: existen patrones de error que el CRC no detecta.)')
  return out.join('\n')
}
