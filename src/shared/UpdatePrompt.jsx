import { useState } from 'react'
import { RefreshCw, WifiOff, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const HOUR = 60 * 60 * 1000

/**
 * Registra el service worker y avisa cuando hay una versión nueva.
 * El progreso (localStorage) se conserva: solo se reemplazan los archivos de la aplicación.
 */
export default function UpdatePrompt() {
  const [hidden, setHidden] = useState(false)
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return
      // Buscar versiones nuevas cada hora y cada vez que la app vuelve a primer plano.
      setInterval(() => reg.update().catch(() => {}), HOUR)
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}) })
    },
  })

  if (needRefresh && !hidden) {
    return (
      <div role="alert" className="no-print fixed inset-x-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border-2 border-[var(--c-green)] bg-[var(--c-card)] p-3 shadow-xl" style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <RefreshCw className="shrink-0 text-[var(--c-green)]" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-extrabold">Nueva versión disponible</p>
          <p className="muted text-xs">Tu progreso guardado se conserva.</p>
        </div>
        <button className="btn btn-green" onClick={() => updateServiceWorker(true)}>Actualizar</button>
        <button className="btn !px-2" onClick={() => setHidden(true)} aria-label="Más tarde"><X size={18} /></button>
      </div>
    )
  }
  if (offlineReady) {
    return (
      <div role="status" className="no-print fixed inset-x-3 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-card)] p-3 text-sm shadow-xl" style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <WifiOff className="shrink-0 text-[var(--c-blue)]" size={20} />
        <span className="flex-1">Listo: NetLab ya funciona sin conexión.</span>
        <button className="btn !px-2" onClick={() => setOfflineReady(false)} aria-label="Cerrar"><X size={18} /></button>
      </div>
    )
  }
  return null
}
