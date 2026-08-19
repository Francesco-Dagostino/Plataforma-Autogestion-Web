import { Navigate, useLocation } from 'react-router-dom'
import { getHomePathForRole, getUserRole, hasValidSession } from '../features/auth/authStorage'

export function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation()

  if (!hasValidSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const role = getUserRole()
  if (!allowedRoles.includes(role)) {
    return <Navigate to={getHomePathForRole(role)} replace />
  }

  return children
}
