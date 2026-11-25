// Reducer puro del simulador (fácil de probar). idx = -1 → no iniciado.
export const initialSim = (total = 0) => ({ total, idx: -1, playing: false })

export function simReducer(s, a) {
  const last = s.total - 1
  switch (a.type) {
    case 'load': return initialSim(a.total)
    case 'start': return s.total ? { ...s, idx: 0, playing: false } : s
    case 'next':
      if (!s.total) return s
      if (s.idx < 0) return { ...s, idx: 0 }
      if (s.idx >= last) return { ...s, playing: false }
      return { ...s, idx: s.idx + 1, playing: s.playing && s.idx + 1 < last }
    case 'prev': return s.idx <= 0 ? s : { ...s, idx: s.idx - 1, playing: false }
    case 'last': return s.total ? { ...s, idx: last, playing: false } : s
    case 'reset': return initialSim(s.total)
    case 'play':
      if (!s.total) return s
      if (s.idx < 0 || s.idx >= last) return { ...s, idx: 0, playing: last > 0 }
      return { ...s, playing: true }
    case 'pause': return { ...s, playing: false }
    case 'tick':
      if (!s.playing) return s
      if (s.idx >= last) return { ...s, playing: false }
      return { ...s, idx: s.idx + 1, playing: s.idx + 1 < last }
    default: return s
  }
}
