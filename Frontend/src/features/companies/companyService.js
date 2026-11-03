import { apiClient } from '../../services/apiClient'

export function getCompanies() {
  return apiClient('/Company')
}

export function createCompany(company) {
  return apiClient('/Company', { method: 'POST', body: JSON.stringify(company) })
}

export function updateCompany(id, company) {
  return apiClient(`/Company/${id}`, { method: 'PUT', body: JSON.stringify(company) })
}

export function deleteCompany(id) {
  return apiClient(`/Company/${id}`, { method: 'DELETE' })
}

export function setCompanyActive(id, isActive) {
  return apiClient(`/Company/${id}/estado`, { method: 'PUT', body: JSON.stringify({ isActive }) })
}

export function setCompanyHistoryAccess(id, enabled) {
  return apiClient(`/Company/${id}/acceso-historial`, { method: 'PUT', body: JSON.stringify({ enabled }) })
}

export function getCompanyHistory(id) {
  return apiClient(`/Company/${id}/historial`)
}

export function getCompanySummary(id) {
  return apiClient(`/Company/${id}/resumen`)
}

export function getAdminHistoricalConsultation() {
  return apiClient('/Company/consulta-historial')
}

export function createCompanyAdmin(companyId, admin) {
  return apiClient('/User', { method: 'POST', body: JSON.stringify({ ...admin, role: 'Admin', idCompany: companyId }) })
}
