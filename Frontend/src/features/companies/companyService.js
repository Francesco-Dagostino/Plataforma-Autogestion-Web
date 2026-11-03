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

export function getCompanyHistory(id) {
  return apiClient(`/Company/${id}/historial`)
}

export function getCompanySummary(id) {
  return apiClient(`/Company/${id}/resumen`)
}

export function downloadCompanyLiquidationDetail(companyId, liquidationId) {
  return apiClient(`/reports/superadmin/${companyId}/recibos/${liquidationId}`, { responseType: 'blob' })
}

export function downloadCompanyLiquidationTxt(companyId, liquidationId) {
  return apiClient(`/reports/superadmin/${companyId}/banco/${liquidationId}`, { responseType: 'blob' })
}

export function createCompanyAdmin(companyId, admin) {
  return apiClient('/User', { method: 'POST', body: JSON.stringify({ ...admin, role: 'Admin', idCompany: companyId }) })
}

export function getCompanyUsers(companyId) {
  return apiClient(`/User/company/${companyId}`)
}
