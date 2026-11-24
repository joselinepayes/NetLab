import { describe, it, expect } from 'vitest'
import {
  TRANSITIONS, OFFICIAL_EXERCISES, encodeByDiagram, encodeByTable, encodeByXor, compareMethods,
  validateBits, randomBits, randomForLevel, xorStep, LEVELS, STATES,
} from './engine.js'
import { simReducer, initialSim } from './simulatorState.js'

describe('ejercicios oficiales', () => {
  for (const ex of OFFICIAL_EXERCISES) {
    it(`${ex.bits} → ${ex.expected} (los 3 métodos)`, () => {
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
    expect(r.steps.map((s) => s.input).join('')).toBe('0001')
    expect(r.output.slice(0, 6)).toBe('000000')
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
