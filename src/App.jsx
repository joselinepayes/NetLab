import { Suspense, useEffect, useState } from 'react'
import { Moon, Network, Sun } from 'lucide-react'
import { MODULES } from './modules/registry.js'
import { useStored } from './shared/storage.js'

export default function App() {
  const ready = MODULES.filter((m) => m.status === 'ready')
  const soon = MODULES.filter((m) => m.status === 'soon')
  const [active, setActive] = useStored('module', ready[0].id)
  const mod = ready.find((m) => m.id === active) ?? ready[0]
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('netlab.theme', dark ? 'dark' : 'light') } catch { /* ignore */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#060d22' : '#0b1e4a')
  }, [dark])

  const Mod = mod.component
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1e4a] text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16">
          <Network className="text-[#60a5fa]" size={26} />
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight">Net<span className="text-[#34d399]">Lab</span></div>
            <div className="hidden text-[11px] text-blue-200 sm:block">Simuladores de Redes de Computadoras</div>
          </div>
          <nav className="ml-3 flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="Módulos">
            {ready.map((m) => (
              <button key={m.id} onClick={() => setActive(m.id)} aria-current={m.id === mod.id}
                className={`min-h-11 whitespace-nowrap rounded-lg px-3 text-sm font-semibold ${m.id === mod.id ? 'bg-white/15' : 'text-blue-200 hover:bg-white/10'}`}>
                {m.short ?? m.name}
              </button>
            ))}
          </nav>
          <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-white/10" onClick={() => setDark(!dark)} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}>
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
        <h1 className="mb-4 text-xl font-extrabold tracking-tight sm:text-2xl">{mod.name}</h1>
        <Suspense fallback={<p className="muted p-8 text-center">Cargando…</p>}>
          <Mod />
        </Suspense>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs muted" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
        <p className="mb-2 font-semibold">Próximos simuladores</p>
        <ul className="mb-3 flex flex-wrap gap-1.5">
          {soon.map((m) => <li key={m.id} className="rounded-lg border border-[var(--c-border)] px-2 py-1">{m.name}</li>)}
        </ul>
        <p>NetLab funciona sin conexión y guarda tu progreso solo en este dispositivo. Sin servidores, sin cuentas, sin IA.</p>
      </footer>
    </div>
  )
}
