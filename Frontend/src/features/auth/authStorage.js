const TOKEN_KEY = 'autogestion_token'
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getTokenPayload(token = getToken()) {
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))

    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

export function getUserRole(token = getToken()) {
  const payload = getTokenPayload(token)
  return payload?.[ROLE_CLAIM] ?? payload?.role ?? null
}

export function hasValidSession() {
  const payload = getTokenPayload()
  return Boolean(payload?.exp && payload.exp * 1000 > Date.now())
}

export function getHomePathForRole(role = getUserRole()) {
  const paths = {
    Empleado: '/inicio',
    Admin: '/admin',
    SuperAdmin: '/super-admin',
  }

  return paths[role] ?? '/login'
}
