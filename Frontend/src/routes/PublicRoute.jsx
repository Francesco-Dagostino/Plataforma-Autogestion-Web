import { Navigate } from 'react-router-dom'
import { getHomePathForRole, hasValidSession } from '../features/auth/authStorage'

export function PublicRoute({ children }) {
  return hasValidSession() ? <Navigate to={getHomePathForRole()} replace /> : children
}
