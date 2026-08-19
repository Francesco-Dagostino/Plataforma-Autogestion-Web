import { apiClient } from '../../services/apiClient'
import { clearSession, getUserRole, saveToken } from './authStorage'

export async function login({ userName, password }) {
  const response = await apiClient('/Auth/login', {
    method: 'POST',
    body: JSON.stringify({ userName, password }),
  })

  if (!response?.token) {
    throw new Error('La API no devolvió un token de acceso.')
  }

  saveToken(response.token)

  const role = getUserRole(response.token)
  if (!role) {
    clearSession()
    throw new Error('El token no contiene un rol válido.')
  }

  return role
}

export function getCurrentUser() {
  return apiClient('/User/me')
}