import { useSyncExternalStore } from 'react'
import { getTheme, subscribeToTheme, toggleTheme } from '../features/theme/theme'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  )
}

// Botón para alternar entre tema claro y oscuro. Con `showLabel` muestra también el texto (menú lateral).
export function ThemeToggle({ showLabel = false, className = '' }) {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, () => 'light')
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={showLabel ? undefined : 'Modo oscuro'}
      title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 ${className}`}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {showLabel && <span className="hidden sm:inline">Modo oscuro</span>}
    </button>
  )
}
