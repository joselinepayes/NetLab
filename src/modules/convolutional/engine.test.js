import { describe, it, expect } from 'vitest'
import {
  TRANSITIONS, OFFICIAL_EXERCISES, encodeByDiagram, encodeByTable, encodeByXor, compareMethods,
  validateBits, randomBits, randomForLevel, xorStep, LEVELS, STATES, reverseBits, explainStep,
} from './engine.js'
import { simReducer, initialSim } from './simulatorState.js'

describe('dirección de lectura: de derecha a izquierda', () => {
  it('el orden de procesamiento es la entrada invertida (ejemplos de la profesora)', () => {
    expect(reverseBits('10101101')).toBe('10110101')
    expect(reverseBits('00110100')).toBe('00101100')
    expect(reverseBits('10011001')).toBe('10011001')
    expect(reverseBits('01011100')).toBe('00111010')
    for (const ex of OFFICIAL_EXERCISES) expect(reverseBits(ex.bits)).toBe(ex.processed)
  })
  it('procesa primero el bit del extremo derecho y conserva la entrada original', () => {
    const r = encodeByDiagram('01011100')
    expect(r.original).toBe('01011100')
    expect(r.processed).toBe('00111010')
    expect(r.steps.map((s) => s.input).join('')).toBe('00111010')
    expect(r.steps[0].origIndex).toBe(7)
    expect(r.steps[7].origIndex).toBe(0)
    // calculado a mano desde 00: 0,0,1,1,1,0,1,0
    expect(r.steps.map((s) => s.output).join(' ')).toBe('00 00 11 10 01 10 00 01')
    expect(r.output).toBe('0000111001100001')
    expect(r.finalState).toBe('01')
  })
  it('la tabla y XOR siguen el mismo orden', () => {
    const t = encodeByTable('01011100'), x = encodeByXor('01011100')
    expect(t.output).toBe('0000111001100001')
    expect(x.output).toBe('0000111001100001')
    expect(x.steps[0].input).toBe('0')
  })
  it('la explicación habla de derecha a izquierda', () => {
    const steps = encodeByDiagram('10101101').steps
    expect(explainStep(steps[0], 8)).toContain('extremo derecho')
    expect(explainStep(steps[7], 8)).toContain('extremo izquierdo')
  })
})

describe('ejercicios oficiales', () => {
  for (const ex of OFFICIAL_EXERCISES) {
    it(`${ex.bits} (procesa ${ex.processed}) → ${ex.expected} (los 3 métodos)`, () => {
      expect(encodeByDiagram(ex.bits).output).toBe(ex.expected)
      expect(encodeByTable(ex.bits).output).toBe(ex.expected)
      expect(encodeByXor(ex.bits).output).toBe(ex.expected)
    })
  }
})

describe('transiciones', () => {
  it('hay exactamente 8 transiciones y cada una coincide en los 3 métodos', () => {
    expect(TRANSITIONS).toHaveLength(8)
    for (const t of TRANSITIONS) {
      for (const f of [encodeByDiagram, encodeByTable, encodeByXor]) {
        const r = f(t.input, t.from)
        expect(r.output).toBe(t.output)
        expect(r.finalState).toBe(t.next)
      }
      const x = xorStep(t.from, t.input)
      expect(x.output).toBe(t.output)
      expect(x.next).toBe(t.next)
    }
  })
  it('cada estado tiene una flecha por cada entrada', () => {
    for (const s of STATES) expect(TRANSITIONS.filter((t) => t.from === s).map((t) => t.input).sort()).toEqual(['0', '1'])
  })
})

describe('propiedades', () => {
  it('salida = 2× entrada y métodos coinciden (aleatorio)', () => {
    for (let i = 0; i < 300; i++) {
      const b = randomBits(1 + (i % 32))
      const c = compareMethods(b)
      expect(c.match).toBe(true)
      expect(c.diagram.output).toHaveLength(b.length * 2)
    }
  })
  it('conserva ceros iniciales', () => {
    const r = encodeByDiagram('0001')
    expect(r.original).toBe('0001')
    expect(r.steps.map((s) => s.input).join('')).toBe('1000') // se procesa de derecha a izquierda
    expect(r.steps).toHaveLength(4)
    expect(r.output).toBe('11011100') // 1→11, 0→01, 0→11, 0→00 (calculado a mano)
  })
  it('niveles generan longitudes correctas', () => {
    for (const l of LEVELS) for (let i = 0; i < 50; i++) {
      const n = randomForLevel(l.id).length
      expect(n).toBeGreaterThanOrEqual(l.min)
      expect(n).toBeLessThanOrEqual(l.max)
    }
  })
})

describe('validación', () => {
  it('acepta binarios y conserva ceros', () => expect(validateBits('0010 1')).toMatchObject({ ok: true, value: '00101' }))
  it('rechaza vacío y no binarios', () => {
    expect(validateBits('').ok).toBe(false)
    expect(validateBits('   ').ok).toBe(false)
    expect(validateBits('1021').ok).toBe(false)
    expect(validateBits('1'.repeat(65)).ok).toBe(false)
  })
})

describe('simulador (reducer)', () => {
  const run = (...as) => as.reduce((s, a) => simReducer(s, typeof a === 'string' ? { type: a } : a), initialSim(8))
  it('avanzar, retroceder y límites', () => {
    expect(run('start').idx).toBe(0)
    expect(run('start', 'next', 'next').idx).toBe(2)
    expect(run('start', 'next', 'next', 'prev').idx).toBe(1)
    expect(run('start', 'prev').idx).toBe(0)
    expect(run('last', 'next').idx).toBe(7)
    expect(run('last').idx).toBe(7)
  })
  it('reiniciar', () => expect(run('start', 'next', 'reset')).toMatchObject({ idx: -1, playing: false }))
  it('reproducción automática termina sola en el último paso', () => {
    let s = run('play')
    expect(s).toMatchObject({ idx: 0, playing: true })
    for (let i = 0; i < 20; i++) s = simReducer(s, { type: 'tick' })
    expect(s).toMatchObject({ idx: 7, playing: false })
  })
  it('pausar detiene ticks; retroceder pausa', () => {
    const s = simReducer(run('play'), { type: 'pause' })
    expect(simReducer(s, { type: 'tick' }).idx).toBe(0)
    expect(run('play', 'tick', 'tick', 'prev')).toMatchObject({ idx: 1, playing: false })
  })
  it('play al final reinicia desde el paso 1', () => expect(run('last', 'play')).toMatchObject({ idx: 0, playing: true }))
})
