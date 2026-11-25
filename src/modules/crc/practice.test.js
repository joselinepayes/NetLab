import { describe, it, expect } from 'vitest'
import { buildQuestions, makeExercise, gradeExercise, solveExercise, EXAM_LEVELS, revealStage } from './practice.js'
import { flipAt, buildFrame } from './engine.js'

describe('práctica guiada', () => {
  for (const method of ['detailed', 'fast']) {
    it(`la respuesta correcta de cada pregunta se acepta y una incorrecta no (${method})`, () => {
      const f = buildFrame('10100', '10011')
      const { questions, trace } = buildQuestions({ msg: '10100', gen: '10011', method, received: flipAt(f.T, f.T.length - 1) })
      expect(questions.length).toBeGreaterThan(8)
      for (const q of questions) {
        const good = q.answer_value ?? q.answer
        expect(q.check(good).ok, q.prompt).toBe(true)
        expect(q.hints).toHaveLength(3)
        if (q.kind === 'bits') expect(q.check('1'.repeat(q.answer.length + 1)).ok).toBe(false)
        const st = revealStage(trace, q.reveal)
        if (st !== null) expect(st).toBeGreaterThanOrEqual(0)
      }
    })
  }
  it('acepta M(x) en varios formatos y explica el error específico', () => {
    const { questions } = buildQuestions({ msg: '10100', gen: '10011', method: 'fast', received: '101001001' })
    const q = questions[0]
    for (const a of ['x^4 + x^2', 'x⁴+x²', 'X4 + X2', 'x² + x⁴']) expect(q.check(a).ok).toBe(true)
    expect(q.check('x^4 + x^3').msg).toContain('x³')
    expect(q.check('x^4').ok).toBe(false)
  })
  it('la pregunta de detección usa el residuo real', () => {
    const f = buildFrame('1100111', '10011')
    const bad = buildQuestions({ msg: '1100111', gen: '10011', method: 'fast', received: flipAt(f.T, 0) }).questions.at(-1)
    expect(bad.check('yes').ok).toBe(true)
    expect(bad.check('no').ok).toBe(false)
  })
})

describe('examen', () => {
  it('genera ejercicios válidos por nivel y los califica con el algoritmo', () => {
    for (const lv of EXAM_LEVELS) for (let i = 0; i < 30; i++) {
      const ex = makeExercise(lv.id)
      expect(ex.msg.length).toBeGreaterThanOrEqual(lv.min)
      expect(ex.msg.length).toBeLessThanOrEqual(lv.max)
      const s = solveExercise(ex)
      const perfect = gradeExercise(ex, { remainder: s.remainder, T: s.T, detected: s.detected ? 'yes' : 'no' })
      expect(perfect.correct).toBe(3)
      expect(gradeExercise(ex, { remainder: '', T: '', detected: '' }).correct).toBe(0)
    }
  })
})
