import { clearSession, getToken } from '../features/auth/authStorage'

const API_URL = import.meta.env.VITE_API_URL

export async function apiClient(endpoint, options = {}) {
  const token = getToken()
  const { responseType, ...fetchOptions } = options

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    clearSession()
    // En /login un 401 son credenciales inválidas; en cualquier otra pantalla es una sesión vencida.
    if (!window.location.pathname.startsWith('/login')) {
      sessionStorage.setItem('autogestion_session_expired', '1')
      window.location.assign('/login')
    }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    let error
    try { error = JSON.parse(text) } catch { error = null }
    const validationError = error?.errors ? Object.values(error.errors).flat()[0] : null
    const plainText = text && text.length < 300 && !text.trimStart().startsWith('<') ? text : null
    const requestError = new Error(
      (typeof error === 'string' ? error : null) || error?.message || error?.error || validationError || plainText || 'Ocurrió un error',
    )
    requestError.status = response.status
    throw requestError
  }

  if (response.status === 204) return null

  if (responseType === 'blob') return response.blob()

  const body = await response.text()
  return body ? JSON.parse(body) : null
}
