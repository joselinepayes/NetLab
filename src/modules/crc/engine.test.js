import { describe, it, expect } from 'vitest'
import {
  buildFrame, checkFrame, divideDetailed, divideFast, parseGenerator, parsePolynomialTerms, polyToString,
  validateMessage, flipAt, undetectableError, buildStages, stageIndex, xorColumns, applyFlips, randomPositions,
  GENERATOR_EXAMPLES, DEFAULT_GENERATOR, procedureTextCrc, diffPositions,
} from './engine.js'

const G = '10011'
const rnd = (len) => Array.from({ length: len }, () => (Math.random() < 0.5 ? '0' : '1')).join('')

describe('ejercicios oficiales del repaso (calculados con el algoritmo)', () => {
  it('Ejercicio 1: M = 10100', () => {
    const f = buildFrame('10100', G)
    expect(polyToString('10100')).toBe('x⁴ + x²')
    expect(polyToString(G)).toBe('x⁴ + x + 1')
    expect(f.extended).toBe('101000000')
    expect(f.remainder).toBe('1001')
    expect(f.Rx).toBe('x³ + 1')
    expect(f.T).toBe('101001001')
    expect(f.Tx).toBe('x⁸ + x⁶ + x³ + 1')
    expect(checkFrame(f.T, G).remainder).toBe('0000')
    const bad = flipAt(f.T, f.T.length - 1)
    expect(bad).toBe('101001000')
    expect(checkFrame(bad, G).remainder).toBe('0001')
  })
  it('Ejercicio 2: M = 1100111', () => {
    const f = buildFrame('1100111', G)
    expect(polyToString('1100111')).toBe('x⁶ + x⁵ + x² + x + 1')
    expect(f.extended).toBe('11001110000')
    expect(f.remainder).toBe('0100')
    expect(f.Rx).toBe('x²')
    expect(f.T).toBe('11001110100')
    expect(f.Tx).toBe('x¹⁰ + x⁹ + x⁶ + x⁵ + x⁴ + x²')
    expect(checkFrame(f.T, G).remainder).toBe('0000')
    const bad = flipAt(f.T, f.T.length - 1)
    expect(bad).toBe('11001110101')
    expect(checkFrame(bad, G).remainder).toBe('0001')
  })
  it('el ejemplo de clase: resultado parcial 00111 + bits 00 → bloque 11100', () => {
    const t = divideFast('101000000', G)
    expect(t.iterations[0].result).toBe('00111')
    expect(t.iterations[0].struck).toBe(2)
    expect(t.iterations[0].nextBlock).toBe('11100')
    expect(t.iterations[0].brought.map((b) => b.bit).join('')).toBe('00')
  })
})

describe('exactitud y coincidencia de métodos', () => {
  it('detallado = rápido (residuo y cociente) para muchos casos aleatorios', () => {
    for (let i = 0; i < 1500; i++) {
      const gen = '1' + rnd(1 + (i % 8))
      const msg = rnd(1 + (i % 20))
      const dividend = msg + '0'.repeat(gen.length - 1)
      const a = divideDetailed(dividend, gen), b = divideFast(dividend, gen)
      expect(b.remainder).toBe(a.remainder)
      expect(b.quotient).toBe(a.quotient)
      expect(a.remainder).toHaveLength(gen.length - 1)
    }
  })
  it('la trama generada siempre verifica con residuo 0 (ambos métodos)', () => {
    for (let i = 0; i < 500; i++) {
      const gen = GENERATOR_EXAMPLES[i % 4]
      const f = buildFrame(rnd(1 + (i % 16)), gen)
      expect(checkFrame(f.T, gen, 'detailed').ok).toBe(true)
      expect(checkFrame(f.T, gen, 'fast').ok).toBe(true)
    }
  })
  it('detecta todo error de un solo bit', () => {
    for (const gen of GENERATOR_EXAMPLES) {
      const f = buildFrame('1011001110', gen)
      for (let i = 0; i < f.T.length; i++) expect(checkFrame(flipAt(f.T, i), gen).ok).toBe(false)
    }
  })
  it('conserva ceros iniciales y mensaje todo ceros', () => {
    const f = buildFrame('00110100', G)
    expect(f.T.startsWith('00110100')).toBe(true)
    expect(f.T).toHaveLength(8 + 4)
    const z = buildFrame('0000', G)
    expect(z.remainder).toBe('0000')
    expect(divideFast('000000000', G).iterations).toHaveLength(0)
    expect(divideFast('000000000', G).quotient).toBe('00000')
  })
  it('no inventa bits y el residuo del método rápido se completa con ceros a la izquierda', () => {
    const t = divideFast('11001110000', G)
    expect(t.iterations.every((it) => it.brought.every((b) => b.col < t.m))).toBe(true)
    expect(t.remainder).toHaveLength(4)
  })
  it('un error múltiplo de G no se detecta (limitación del CRC)', () => {
    const f = buildFrame('10100', G)
    const { received, positions } = undetectableError(f.T, G, 2)
    expect(received).not.toBe(f.T)
    expect(positions.length).toBeGreaterThan(1)
    expect(checkFrame(received, G).ok).toBe(true)
  })
  it('flips aleatorios', () => {
    const f = buildFrame('10100', G)
    const pos = randomPositions(f.T.length, 3)
    expect(pos).toHaveLength(3)
    expect(diffPositions(f.T, applyFlips(f.T, pos))).toEqual(pos)
  })
})

describe('validación y polinomios', () => {
  it('mensajes', () => {
    expect(validateMessage('00110100')).toMatchObject({ ok: true, value: '00110100' })
    expect(validateMessage('').ok).toBe(false)
    expect(validateMessage('10a1').ok).toBe(false)
    expect(validateMessage('1'.repeat(40)).ok).toBe(false)
  })
  it('generadores en binario y polinomial son equivalentes', () => {
    for (const [txt, bits] of [['x^4 + x + 1', '10011'], ['x⁴ + x + 1', '10011'], ['x3+x+1', '1011'], ['x⁴ + x³ + 1', '11001'], ['x⁵ + x² + 1', '100101'], ['x^10+1', '10000000001']]) {
      expect(parseGenerator(txt)).toMatchObject({ ok: true, bits })
      expect(parseGenerator(bits)).toMatchObject({ ok: true, bits })
    }
    expect(DEFAULT_GENERATOR).toBe('10011')
  })
  it('rechaza generadores inválidos', () => {
    for (const bad of ['', '0', '1', '01011', '12', 'x^2 + y', 'x^2 + x^2', '2x+1', '1'.repeat(1) + '0'.repeat(20)]) {
      expect(parseGenerator(bad).ok).toBe(false)
    }
    expect(parsePolynomialTerms('x⁴ + x²').exps).toEqual(new Set([4, 2]))
  })
  it('polinomio de 0 y de potencias grandes', () => {
    expect(polyToString('000')).toBe('0')
    expect(polyToString('10000000001')).toBe('x¹⁰ + 1')
  })
})

describe('etapas y exportación', () => {
  it('las etapas cubren cada iteración y terminan en el residuo', () => {
    for (const m of ['detailed', 'fast']) {
      const t = (m === 'fast' ? divideFast : divideDetailed)('101000000', G)
      const st = buildStages(t)
      expect(st).toHaveLength(2 + 3 * t.iterations.length)
      expect(st[st.length - 1].kind).toBe('final')
      expect(st[stageIndex(t, 0, 'xor')].kind).toBe('xor')
    }
  })
  it('xorColumns replica el ejemplo 00111', () => {
    expect(xorColumns('10100', '10011').map((c) => c.r).join('')).toBe('00111')
  })
  it('el procedimiento exportado contiene polinomios y todas las divisiones', () => {
    const f = buildFrame('10100', G)
    const txt = procedureTextCrc({ frame: f, method: 'fast' })
    for (const s of ['M(x) = x^4 + x^2', 'G(x) = x^4 + x + 1', '101000000', 'T(x) = x^8 + x^6 + x^3 + 1', 'Residuo = 1001', 'Residuo de verificación = 0000', 'No se detectaron errores']) expect(txt).toContain(s)
  })
})
