import { Logo, LogoMark } from '../Logo'
import { ThemeToggle } from '../ThemeToggle'

// Marco de las pantallas de acceso: panel de marca a la izquierda (solo en pantallas grandes) y el formulario a la derecha.
export function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[5fr_6fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary-600 p-12 lg:flex dark:border-r dark:bg-surface">
        <Logo variant="negative" markHeight={44} />

        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-12 opacity-[0.12]">
          <LogoMark variant="negative" height={440} />
        </div>

        <p className="relative max-w-xs text-4xl font-bold leading-tight tracking-tight text-white">
          Autogestión de horas y nómina
        </p>
      </aside>

      <div className="relative grid min-h-screen place-items-center p-6 lg:min-h-0">
        <ThemeToggle className="absolute right-5 top-5" />
        {children}
      </div>
    </main>
  )
}
