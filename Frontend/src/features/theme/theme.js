// Tema claro / oscuro: se guarda la elección de la persona y, mientras no elija, se sigue al sistema.
const STORAGE_KEY = 'jornada-theme'
const listeners = new Set()

const prefersDark = () => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) || false

function readStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    // Sin acceso al almacenamiento (modo privado, etc.): se usa la preferencia del sistema.
    return null
  }
}

export function getTheme() {
  return readStoredTheme() ?? (prefersDark() ? 'dark' : 'light')
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function notify() {
  listeners.forEach((listener) => listener())
}

export function setTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Si no se puede guardar, el cambio vale igual para esta sesión.
  }
  applyTheme(theme)
  notify()
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark')
}

export function subscribeToTheme(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Si la persona nunca eligió, acompañar los cambios del sistema operativo.
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!readStoredTheme()) {
      applyTheme(getTheme())
      notify()
    }
  })
}
