// Motor de codificación convolucional — diagrama de estados del repaso.
// Estado = "AB" (2 bits). Entrada = E. Etiqueta de flecha = entrada/salida.

export const INITIAL_STATE = '00'
export const STATES = ['00', '10', '01', '11']

// Tabla oficial obtenida del diagrama. NO modificar.
export const TRANSITIONS = Object.freeze([
  { from: '00', input: '0', output: '00', next: '00' },
  { from: '00', input: '1', output: '11', next: '10' },
  { from: '10', input: '0', output: '01', next: '01' },
  { from: '10', input: '1', output: '10', next: '11' },
  { from: '01', input: '0', output: '11', next: '00' },
  { from: '01', input: '1', output: '00', next: '10' },
  { from: '11', input: '0', output: '10', next: '01' },
  { from: '11', input: '1', output: '01', next: '11' },
])

export const edgeId = (from, input) => `${from}|${input}`
export const EDGES = TRANSITIONS.map((t) => ({ ...t, id: edgeId(t.from, t.input), label: `${t.input}/${t.output}` }))

// La entrada se procesa de DERECHA a IZQUIERDA (método de la profesora): se invierte el orden
// de los bits antes de codificar. `processed` es esa secuencia invertida y `expected` la salida,
// escrita en el orden en que se genera (primer par calculado a la izquierda).
export const OFFICIAL_EXERCISES = Object.freeze([
  { bits: '10101101', processed: '10110101', expected: '1101001010000100' },
  { bits: '00110100', processed: '00101100', expected: '0000110100101011' },
  { bits: '10011001', processed: '10011001', expected: '1101111110101111' },
])

/** Orden en que se procesa una entrada: de derecha a izquierda (bits invertidos). */
export const reverseBits = (s) => s.split('').reverse().join('')

export const LEVELS = Object.freeze([
  { id: 'basic', name: 'Básico', min: 4, max: 4 },
  { id: 'mid', name: 'Intermedio', min: 6, max: 6 },
  { id: 'adv', name: 'Avanzado', min: 8, max: 8 },
  { id: 'expert', name: 'Experto', min: 12, max: 16 },
])

export const MAX_BITS = 64

export function validateBits(raw, max = MAX_BITS) {
  const value = String(raw ?? '').replace(/\s+/g, '')
  if (!value) return { ok: false, value, error: 'Escribe una secuencia binaria (solo 0 y 1).' }
  if (!/^[01]+$/.test(value)) return { ok: false, value, error: 'Solo se permiten los dígitos 0 y 1.' }
  if (value.length > max) return { ok: false, value, error: `Máximo ${max} bits.` }
  return { ok: true, value, error: null }
}

export function randomBits(len, rng = Math.random) {
  let s = ''
  for (let i = 0; i < len; i++) s += rng() < 0.5 ? '0' : '1'
  return s
}

export function randomForLevel(levelId, rng = Math.random) {
  const lv = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0]
  const len = lv.min + Math.floor(rng() * (lv.max - lv.min + 1))
  return randomBits(len, rng)
}

function run(original, initial, fn, method) {
  const bits = reverseBits(original) // se procesa de derecha a izquierda
  let state = initial
  const steps = []
  for (let i = 0; i < bits.length; i++) {
    const input = bits[i]
    const r = fn(state, input)
    steps.push({
      index: i, // orden de procesamiento (0 = bit del extremo derecho)
      origIndex: original.length - 1 - i, // posición del bit en la entrada original (0 = izquierda)
      method, state, input, output: r.output, next: r.next, edgeId: edgeId(state, input), detail: r.detail,
    })
    state = r.next
  }
  return { original, processed: bits, steps, output: steps.map((s) => s.output).join(''), finalState: state }
}

// Método 1 — seguir flechas del diagrama (aristas salientes de cada estado)
const OUT_EDGES = Object.fromEntries(STATES.map((s) => [s, EDGES.filter((e) => e.from === s)]))
export function followArrow(state, input) {
  const e = OUT_EDGES[state].find((x) => x.input === input)
  if (!e) throw new Error(`No existe flecha desde ${state} con entrada ${input}`)
  return e
}
export const encodeByDiagram = (bits, initial = INITIAL_STATE) =>
  run(bits, initial, (s, b) => {
    const e = followArrow(s, b)
    return { output: e.output, next: e.next, detail: e }
  }, 'diagram')

// Método 2 — consultar la tabla de transiciones (matriz estado × entrada)
export const TABLE = Object.fromEntries(
  STATES.map((s) => [s, Object.fromEntries(TRANSITIONS.filter((t) => t.from === s).map((t) => [t.input, { output: t.output, next: t.next }]))]),
)
export const encodeByTable = (bits, initial = INITIAL_STATE) =>
  run(bits, initial, (s, b) => ({ ...TABLE[s][b], detail: { row: s, col: b } }), 'table')

// Método 3 — XOR: S1 = E⊕B, S2 = E⊕A⊕B, nuevo estado = E A
export function xorStep(state, input) {
  const E = Number(input), A = Number(state[0]), B = Number(state[1])
  const o1 = E ^ B
  const ea = E ^ A
  const o2 = ea ^ B
  return { E, A, B, o1, ea, o2, output: `${o1}${o2}`, next: `${E}${A}` }
}
export const encodeByXor = (bits, initial = INITIAL_STATE) =>
  run(bits, initial, (s, b) => {
    const x = xorStep(s, b)
    return { output: x.output, next: x.next, detail: x }
  }, 'xor')

export function compareMethods(bits, initial = INITIAL_STATE) {
  const diagram = encodeByDiagram(bits, initial)
  const table = encodeByTable(bits, initial)
  const xor = encodeByXor(bits, initial)
  const match =
    diagram.output === table.output && table.output === xor.output &&
    diagram.finalState === table.finalState && table.finalState === xor.finalState
  return { diagram, table, xor, match }
}

export const encode = encodeByDiagram

export function explainStep(step, total) {
  const n = step.index + 1
  const label = `${step.input}/${step.output}`
  const bitTxt = step.index === 0
    ? `el bit del extremo derecho de la entrada es ${step.input}`
    : `el siguiente bit hacia la izquierda (el ${n}.º contando desde la derecha) es ${step.input}`
  const intro = step.index === 0
    ? `Comenzamos en el estado ${step.state} y leemos la entrada de derecha a izquierda. Como ${bitTxt}, `
    : `Seguimos en el estado ${step.state} (al que llegamos en el paso anterior). Ahora ${bitTxt}, por lo que `
  const end = n === total ? ' Este era el último bit: el del extremo izquierdo de la entrada.' : ''
  return `${intro}buscamos la flecha que sale de este estado y comienza con ${step.input}. Seguimos la flecha ${label}, escribimos ${step.output} como salida y llegamos al estado ${step.next}.${end}`
}

export function procedureText(bits, result) {
  const lines = [
    `Entrada original: ${bits}`,
    `Se procesa de derecha a izquierda → orden de procesamiento: ${reverseBits(bits)}`,
    `Estado inicial: ${INITIAL_STATE}`,
    '',
    'Paso | Estado actual | Entrada (bit procesado) | Salida | Nuevo estado',
  ]
  result.steps.forEach((s) => lines.push(`${s.index + 1} | ${s.state} | ${s.input} | ${s.output} | ${s.next}`))
  lines.push('', `Salida (en el orden en que se genera): ${result.output}`, `Estado final: ${result.finalState}`)
  return lines.join('\n')
}
