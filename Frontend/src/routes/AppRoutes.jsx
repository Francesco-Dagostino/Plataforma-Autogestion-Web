import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminDashboardPage } from '../pages/AdminDashboardPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { SuperAdminPage } from '../pages/SuperAdminPage'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { ProfilePage } from '../pages/ProfilePage'
import { MyWorkdaysPage } from '../pages/MyWorkdaysPage'
import { MyLiquidationsPage } from '../pages/MyLiquidationsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/inicio" element={<ProtectedRoute allowedRoles={['Empleado']}><HomePage /></ProtectedRoute>} />
      <Route path="/mis-horas" element={<ProtectedRoute allowedRoles={['Empleado']}><MyWorkdaysPage /></ProtectedRoute>} />
      <Route path="/mis-liquidaciones" element={<ProtectedRoute allowedRoles={['Empleado']}><MyLiquidationsPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/empleados" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboardPage section="empleados" /></ProtectedRoute>} />
      <Route path="/admin/liquidaciones" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboardPage section="liquidaciones" /></ProtectedRoute>} />
      <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><SuperAdminPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/inicio" replace />} />
      <Route path="*" element={<Navigate to="/inicio" replace />} />
      <Route path="/perfil" element={ <ProtectedRoute allowedRoles={['Empleado', 'Admin', 'SuperAdmin']}> <ProfilePage /></ProtectedRoute>}/>
    </Routes>
  )
}
