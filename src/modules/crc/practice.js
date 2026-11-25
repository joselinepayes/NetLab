// Preguntas de práctica guiada y generación de ejercicios de examen (lógica pura, con reglas locales).
import {
  buildFrame, checkFrame, divide, xorColumns, parsePolynomialTerms, onesPowers, termText, flipAt, randomPositions, applyFlips,
  GENERATOR_EXAMPLES, stageIndex,
} from './engine.js'

const clean = (s) => String(s ?? '').replace(/\s+/g, '')
const ok = { ok: true, msg: '¡Correcto!' }
const bad = (msg) => ({ ok: false, msg })

function polyCheck(ans, bits, label) {
  const r = parsePolynomialTerms(ans)
  if (!r.ok) return bad(r.error)
  const want = new Set(onesPowers(bits))
  const extra = [...r.exps].filter((p) => !want.has(p)).sort((a, b) => b - a)
  const missing = [...want].filter((p) => !r.exps.has(p))
  if (!extra.length && !missing.length) return ok
  if (r.exps.size && Math.max(...r.exps) > bits.length - 1) return bad(`La mayor potencia de ${label} es x${bits.length - 1}: ${label} tiene ${bits.length} bits y el bit de la izquierda es x${bits.length - 1}.`)
  if (extra.length) return bad(`Escribiste ${termText(extra[0])}, pero el bit de esa posición vale 0 (los ceros no se escriben).`)
  return bad(`Te falta${missing.length > 1 ? 'n términos' : ' un término'}: revisa las posiciones donde el bit vale 1 (recuerda que el bit de la derecha es x⁰).`)
}

function bitsCheck(ans, want, hint = '') {
  const a = clean(ans)
  if (!/^[01]+$/.test(a)) return bad('Escribe solo 0 y 1.')
  if (a.length !== want.length) return bad(`Debe tener ${want.length} bits y escribiste ${a.length}. ${hint}`.trim())
  if (a === want) return ok
  let k = 0
  while (a[k] === want[k]) k++
  return bad(`Los primeros ${k} bit(s) están bien; revisa el bit número ${k + 1}. ${hint}`.trim())
}

/** Construye la lista de preguntas guiadas para un ejercicio. */
export function buildQuestions({ msg, gen, method, received }) {
  const f = buildFrame(msg, gen)
  const trace = divide(f.extended, gen, method)
  const verify = checkFrame(received, gen, method)
  const qs = []
  const add = (q) => qs.push({ id: qs.length, ...q })

  add({ group: 'Polinomios', prompt: `¿Cuál es M(x) para M = ${msg}?`, kind: 'text', placeholder: 'x⁴ + x²  ó  x^4 + x^2', answer: f.Mx, reveal: null,
    check: (a) => polyCheck(a, msg, 'M(x)'),
    hints: ['Cada bit es el coeficiente de una potencia; el bit de la derecha es x⁰.', `El mensaje tiene ${msg.length} bits: el de la izquierda es x${msg.length - 1}.`, `Solo se escriben las potencias con bit 1: hay ${onesPowers(msg).length} término(s).`] })
  add({ group: 'Polinomios', prompt: `¿Cuál es G(x) para G = ${gen}?`, kind: 'text', placeholder: 'x⁴ + x + 1', answer: f.Gx, reveal: null,
    check: (a) => polyCheck(a, gen, 'G(x)'),
    hints: ['Mismo procedimiento que con M: bit 1 → se escribe el término.', `G tiene ${gen.length} bits, así que su mayor potencia es x${gen.length - 1}.`, 'Recuerda: x¹ se escribe x y x⁰ se escribe 1.'] })
  add({ group: 'Ceros', prompt: '¿Cuántos ceros debes agregar al mensaje?', kind: 'number', placeholder: 'n.º de ceros', answer: String(f.deg), reveal: null,
    check: (a) => {
      const v = Number(clean(a))
      if (!Number.isInteger(v)) return bad('Escribe un número entero.')
      if (v === f.deg) return ok
      if (v === gen.length) return bad('Ese es el número de bits de G. Se agregan tantos ceros como el GRADO (bits − 1).')
      return bad(v > f.deg ? 'Son demasiados: el número de ceros es igual al grado de G.' : 'Son pocos: el número de ceros es igual al grado de G (su mayor potencia).')
    },
    hints: ['Mira el grado de G(x): su mayor potencia.', `El grado es el número de bits de G menos 1 (G tiene ${gen.length} bits).`, 'Equivale a multiplicar M(x) por x elevado al grado.'] })

  trace.iterations.forEach((it, i) => {
    const tag = `Paso ${i + 1}`
    add({ group: tag, prompt: `${tag}: ¿cuál es el siguiente bloque de ${gen.length} bits que debes procesar?`, kind: 'bits', placeholder: '0'.repeat(gen.length), answer: it.block,
      reveal: i === 0 ? { iter: -1, kind: 'intro' } : { iter: i - 1, kind: 'drop' },
      check: (a) => bitsCheck(a, it.block, i === 0 ? 'Toma los primeros bits del dividendo.' : 'Es el resultado anterior sin los ceros tachados, más los bits que bajan.'),
      hints: i === 0
        ? [`El primer bloque son los primeros ${gen.length} bits del mensaje extendido.`, method === 'fast' && trace.initialSkip ? 'Recuerda omitir los ceros iniciales hasta el primer 1.' : 'No te saltes ninguna cifra.', `Empieza con «${it.block[0]}».`]
        : ['Toma el resultado anterior, quita los ceros iniciales y baja bits del dividendo.', `Debe tener ${gen.length} bits.`, `Empieza con «${it.block[0]}» y termina con «${it.block.slice(-1)}».`] })
    add({ group: tag, prompt: `${tag}: el bloque ${it.block} comienza con ${it.block[0]}. ¿Con qué haces el XOR?`, kind: 'choice', options: [['gen', `Con el generador ${gen}`], ['zeros', `Con ${'0'.repeat(gen.length)}`]], answer: it.op === 'gen' ? `Con el generador ${gen}` : `Con ${'0'.repeat(gen.length)}`, answer_value: it.op,
      reveal: { iter: i, kind: 'select' },
      check: (a) => (a === it.op ? ok : bad(it.block[0] === '1' ? 'El bloque comienza con 1: el cociente es 1 y se resta (XOR) el generador.' : 'El bloque comienza con 0: el cociente es 0 y se hace XOR con un bloque de ceros.')),
      hints: ['Mira el primer bit del bloque.', 'Si es 1 → generador; si es 0 → ceros.', `El primer bit es ${it.block[0]}.`] })
    add({ group: tag, prompt: `${tag}: ¿cuál es el resultado de ${it.block} ⊕ ${it.operand}?`, kind: 'bits', placeholder: '0'.repeat(gen.length), answer: it.result,
      reveal: { iter: i, kind: 'select' },
      check: (a) => {
        const v = clean(a)
        if (/^[01]+$/.test(v) && v.length === it.result.length && v !== it.result) {
          const cols = xorColumns(it.block, it.operand)
          const k = cols.findIndex((c, j) => c.r !== v[j])
          return bad(`En la columna ${k + 1} (de izquierda a derecha) hiciste ${cols[k].a} ⊕ ${cols[k].b}: XOR da 1 solo si los bits son distintos, y 0 si son iguales.`)
        }
        return bitsCheck(a, it.result)
      },
      hints: ['XOR columna por columna, sin acarreos: iguales → 0, distintos → 1.', 'El primer bit del resultado siempre es 0.', `Termina en «${it.result.slice(-1)}».`] })
    add({ group: tag, prompt: `${tag}: ¿cuántos bits debes bajar del dividendo?`, kind: 'number', placeholder: 'n.º de bits', answer: String(it.brought.length),
      reveal: { iter: i, kind: 'xor' },
      check: (a) => {
        const v = Number(clean(a))
        if (!Number.isInteger(v)) return bad('Escribe un número entero.')
        if (v === it.brought.length) return ok
        if (it.brought.length === 0 && v > 0) return bad('Ya no quedan bits en el dividendo: no se inventan bits.')
        return bad(method === 'fast'
          ? (v < it.brought.length ? 'Faltan bits: cuenta los ceros iniciales del resultado; hay que volver a completar el bloque (y no bajar más de los disponibles).' : 'Son demasiados: solo se bajan los necesarios para completar de nuevo el bloque, y no más de los que quedan.')
          : 'En el método detallado se baja un solo bit en cada paso (y ninguno al final).')
      },
      hints: method === 'fast' ? ['Cuenta cuántos ceros iniciales tiene el resultado: esos se omiten.', 'Debes bajar tantos bits como ceros omitiste, mientras queden bits en el dividendo.', `Se omiten ${it.struck} cero(s).`] : ['En este método bajas exactamente un bit por paso.', 'Si ya no quedan bits en el dividendo, no bajas ninguno.', `Quedan ${Math.max(0, f.extended.length - it.col - gen.length)} bit(s) por bajar.`] })
  })

  add({ group: 'Residuo', prompt: `¿Cuál es el residuo R? (${f.deg} bits, con ceros a la izquierda si hace falta)`, kind: 'bits', placeholder: '0'.repeat(f.deg), answer: f.remainder,
    reveal: { iter: trace.iterations.length, kind: 'final' },
    check: (a) => bitsCheck(a, f.remainder, 'El residuo siempre tiene tantos bits como el grado de G; completa con ceros a la izquierda.'),
    hints: ['Es lo que queda después del último XOR, ya sin los ceros tachados.', `Tiene exactamente ${f.deg} bits.`, `Empieza con «${f.remainder[0]}».`] })
  add({ group: 'Trama', prompt: '¿Cuál es T(x), el polinomio de la trama transmitida?', kind: 'text', placeholder: 'x⁸ + …', answer: f.Tx, reveal: { iter: trace.iterations.length, kind: 'final' },
    check: (a) => polyCheck(a, f.T, 'T(x)'),
    hints: ['T = mensaje original + residuo (reemplazan a los ceros agregados).', `T = ${msg}${f.remainder}`, `T tiene ${f.T.length} bits: la mayor potencia es x${f.T.length - 1}.`] })
  const detected = !verify.ok
  add({ group: 'Verificación', prompt: `El receptor recibe ${received}. Al dividir entre G sin agregar ceros, ¿se detectó un error?`, kind: 'choice', options: [['yes', 'Sí, se detectó un error'], ['no', 'No se detectaron errores']], answer: detected ? 'Sí, se detectó un error' : 'No se detectaron errores', answer_value: detected ? 'yes' : 'no', reveal: null,
    check: (a) => ((a === 'yes') === detected ? ok : bad(detected ? 'Compara la trama recibida con T: hay bits alterados y el residuo da distinto de cero.' : 'La trama recibida es exactamente T: el residuo de la verificación es cero, por lo que no se detectan errores.')),
    hints: ['Si el residuo de la división de comprobación es 0, no se detectan errores.', received === f.T ? 'Compara la trama recibida con T.' : 'Compara cada bit de la trama recibida con T.', detected ? 'Sí hay bits alterados.' : 'No hay bits alterados.'] })
  return { questions: qs, frame: f, trace }
}

export const revealStage = (trace, reveal) => {
  if (!reveal) return null
  if (reveal.kind === 'intro') return 0
  if (reveal.kind === 'final') return 1 + 3 * trace.iterations.length
  return stageIndex(trace, reveal.iter, reveal.kind)
}

/* ───────────── Exámenes ───────────── */
export const EXAM_LEVELS = [
  { id: 'basic', name: 'Básico', desc: 'G = x³ + x + 1 · mensajes de 4–5 bits', gens: ['1011'], min: 4, max: 5, errors: [0, 1] },
  { id: 'mid', name: 'Intermedio', desc: 'G de grado 3 o 4 · mensajes de 6–7 bits', gens: ['1011', '10011'], min: 6, max: 7, errors: [0, 1] },
  { id: 'adv', name: 'Avanzado', desc: 'Generadores variados · mensajes de 8–10 bits', gens: GENERATOR_EXAMPLES, min: 8, max: 10, errors: [0, 1, 2] },
  { id: 'exam', name: 'Nivel examen', desc: 'Todos los generadores · mensajes de 10–12 bits', gens: GENERATOR_EXAMPLES, min: 10, max: 12, errors: [0, 1, 1, 2, 3] },
]
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)]

export function makeExercise(levelId, rng = Math.random) {
  const lv = EXAM_LEVELS.find((l) => l.id === levelId) ?? EXAM_LEVELS[0]
  const len = lv.min + Math.floor(rng() * (lv.max - lv.min + 1))
  const msg = Array.from({ length: len }, () => (rng() < 0.5 ? '0' : '1')).join('')
  const gen = pick(lv.gens, rng)
  const f = buildFrame(msg, gen)
  const nErr = pick(lv.errors, rng)
  const received = nErr === 0 ? f.T : applyFlips(f.T, randomPositions(f.T.length, nErr, rng))
  return { msg, gen, received }
}

export function solveExercise({ msg, gen, received }) {
  const f = buildFrame(msg, gen)
  return { extended: f.extended, remainder: f.remainder, T: f.T, detected: !checkFrame(received, gen).ok, frame: f }
}

export function gradeExercise(ex, ans) {
  const s = solveExercise(ex)
  const a = { remainder: clean(ans.remainder), T: clean(ans.T), detected: ans.detected }
  const parts = { remainder: a.remainder === s.remainder, T: a.T === s.T, detected: a.detected === (s.detected ? 'yes' : 'no') }
  return { parts, correct: Object.values(parts).filter(Boolean).length, total: 3, solution: s }
}

export { flipAt }
