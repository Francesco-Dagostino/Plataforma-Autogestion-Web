import { Navigate, useLocation } from 'react-router-dom'
import { getHomePathForRole, getUserRole, hasValidSession, isHistoryOnlyAdmin } from '../features/auth/authStorage'

export function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation()

  if (!hasValidSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const role = getUserRole()
  if (isHistoryOnlyAdmin() && location.pathname !== '/admin/historial') {
    return <Navigate to="/admin/historial" replace />
  }
  if (!allowedRoles.includes(role)) {
    return <Navigate to={getHomePathForRole(role)} replace />
  }

  return children
}
