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
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    const requestError = new Error(error?.message || error?.error || 'Ocurrió un error')
    requestError.status = response.status
    throw requestError
  }

  if (response.status === 204) return null

  if (responseType === 'blob') return response.blob()

  const body = await response.text()
  return body ? JSON.parse(body) : null
}
