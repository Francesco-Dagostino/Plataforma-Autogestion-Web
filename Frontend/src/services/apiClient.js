import { clearSession, getToken } from '../features/auth/authStorage'

const API_URL = import.meta.env.VITE_API_URL

export async function apiClient(endpoint, options = {}) {
  const token = getToken()

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    clearSession()
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || error?.error || 'Ocurrió un error')
  }

  if (response.status === 204) return null

  return response.json()
}
