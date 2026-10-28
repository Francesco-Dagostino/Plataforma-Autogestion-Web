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

export function createCompanyAdmin(companyId, admin) {
  return apiClient('/User', { method: 'POST', body: JSON.stringify({ ...admin, role: 'Admin', idCompany: companyId }) })
}

export function getCompanyUsers(companyId) {
  return apiClient(`/User/company/${companyId}`)
}
