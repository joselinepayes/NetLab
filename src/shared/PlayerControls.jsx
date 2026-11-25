import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Rocket } from 'lucide-react'

export const SPEEDS = { slow: { label: 'Lenta', ms: 3600 }, normal: { label: 'Normal', ms: 2200 }, fast: { label: 'Rápida', ms: 1000 } }

/** Controles de reproducción reutilizables (iniciar, anterior, siguiente, auto, pausa, reiniciar, final, velocidad, progreso). */
export default function PlayerControls({ sim, dispatch, speed, setSpeed, labelPrefix = 'Paso' }) {
  const started = sim.idx >= 0
  const finished = started && sim.idx === sim.total - 1
  const pct = sim.total ? ((sim.idx + 1) / sim.total) * 100 : 0
  return (
    <div>
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-sm font-semibold">
          <span>{labelPrefix} {Math.max(0, sim.idx + 1)} de {sim.total}</span>
          <span className="muted">{Math.round(pct)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--c-bg)]" role="progressbar" aria-valuemin={0} aria-valuemax={sim.total} aria-valuenow={sim.idx + 1}>
          <div className="h-full rounded-full bg-[var(--c-blue)] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
        <button className="btn" onClick={() => dispatch({ type: 'reset' })} disabled={!started} aria-label="Reiniciar"><RotateCcw size={18} /><span className="hidden sm:inline">Reiniciar</span></button>
        <button className="btn" onClick={() => dispatch({ type: 'prev' })} disabled={sim.idx <= 0} aria-label="Paso anterior"><ChevronLeft size={20} /><span className="hidden sm:inline">Anterior</span></button>
        {sim.playing ? (
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'pause' })} aria-label="Pausar"><Pause size={18} /><span className="hidden sm:inline">Pausar</span></button>
        ) : (
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'play' })} aria-label="Reproducir automáticamente"><Play size={18} /><span className="hidden sm:inline">Reproducir</span></button>
        )}
        <button className="btn" onClick={() => dispatch({ type: 'next' })} disabled={finished} aria-label="Paso siguiente"><span className="hidden sm:inline">Siguiente</span><ChevronRight size={20} /></button>
        <button className="btn" onClick={() => dispatch({ type: 'last' })} disabled={finished} aria-label="Ir al resultado final"><ChevronLast size={18} /><span className="hidden sm:inline">Resultado</span></button>
        {!started && <button className="btn btn-green col-span-3 sm:col-auto" onClick={() => dispatch({ type: 'start' })}><Rocket size={18} /> Iniciar simulación</button>}
        <div className="col-span-4 flex items-center gap-2 sm:ml-auto" role="group" aria-label="Velocidad">
          {Object.entries(SPEEDS).map(([k, v]) => (
            <button key={k} className="btn flex-1 sm:flex-none" aria-pressed={speed === k}
              style={speed === k ? { background: 'var(--c-blue-soft)', borderColor: 'var(--c-blue)' } : undefined} onClick={() => setSpeed(k)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
