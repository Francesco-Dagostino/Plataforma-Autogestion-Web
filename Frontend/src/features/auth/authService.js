import { apiClient } from '../../services/apiClient'
import { clearSession, getUserRole, saveToken } from './authStorage'

// Guarda el JWT definitivo y devuelve el rol.
function startSession(token) {
  if (!token) {
    throw new Error('La API no devolvió un token de acceso.')
  }

  saveToken(token)

  const role = getUserRole(token)
  if (!role) {
    clearSession()
    throw new Error('El token no contiene un rol válido.')
  }

  return role
}

// Devuelve { role } o, si es SuperAdmin, { mfa: 'setup' | 'verify', tempToken }.
// El token temporal solo vive en memoria y nunca se guarda como sesión.
export async function login({ userName, password }) {
  const response = await apiClient('/Auth/login', {
    method: 'POST',
    body: JSON.stringify({ userName, password }),
  })

  if (response?.mfaSetupRequired) return { mfa: 'setup', tempToken: response.token }
  if (response?.mfaRequired) return { mfa: 'verify', tempToken: response.token }

  return { role: startSession(response?.token) }
}

// Genera el secreto y devuelve la URI otpauth:// para el QR.
export function mfaSetup(tempToken) {
  return apiClient('/Auth/mfa/setup', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tempToken}` },
  })
}

// Valida el código de 6 dígitos; si es correcto inicia la sesión y devuelve el rol.
export async function mfaVerify(tempToken, code) {
  const response = await apiClient('/Auth/mfa/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tempToken}` },
    body: JSON.stringify({ code }),
  })

  return startSession(response?.token)
}

export function getCurrentUser() {
  return apiClient('/User/me')
}

// Envía solicitud para recuperar contraseña
export async function forgotPassword(email) {
  return apiClient('/Auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// Restablece la contraseña con token y nueva clave
export async function resetPassword(email, token, newPassword) {
  return apiClient('/Auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, newPassword }),
  })
}