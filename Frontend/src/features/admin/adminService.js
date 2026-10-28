import { apiClient } from '../../services/apiClient'

export function getPendingWorkdays() { return apiClient('/Workday/PendientesDeAprobacion') }
export function getResolvedWorkdays() { return apiClient('/Workday/Historial') }
export function approveWorkday(id) { return apiClient(`/Workday/aprobar/${id}`, { method: 'PUT' }) }
export function rejectWorkday(id, motivoRechazo) { return apiClient(`/Workday/rechazar/${id}`, { method: 'PUT', body: JSON.stringify({ motivoRechazo }) }) }
export function getCompanyUsers() { return apiClient('/User/Mi%20Empresa') }
export function createEmployee(employee) { return apiClient('/User/CrearEmpleado', { method: 'POST', body: JSON.stringify(employee) }) }
export function simulateLiquidation({ month, year }) { return apiClient('/Liquidation/simular', { method: 'POST', body: JSON.stringify({ month: Number(month), year: Number(year) }) }) }
export function closeLiquidationMonth({ month, year }) { return apiClient('/Liquidation/cerrar-mes', { method: 'POST', body: JSON.stringify({ month: Number(month), year: Number(year) }) }) }
export function getMonthlyClosure({ month, year }) { return apiClient(`/Liquidation/cierre-mes?month=${Number(month)}&year=${Number(year)}`) }
export function downloadLiquidationReceipts(id) { return apiClient(`/reports/recibos/${id}`, { responseType: 'blob' }) }
export function downloadBankBatch(id) { return apiClient(`/reports/banco/${id}`, { responseType: 'blob' }) }
export function getMyCompany() { return apiClient('/Company/mi-empresa') }
export function updateHourlyRate(parameterSystem) { return apiClient('/Company/valor-hora', { method: 'PUT', body: JSON.stringify({ parameterSystem: Number(parameterSystem) }) }) }
export function updateMyCompany({ name, cuit }) { return apiClient('/Company/mi-empresa', { method: 'PUT', body: JSON.stringify({ name, cuit: Number(cuit) }) }) }
export function updateEmployee(id, employee) { return apiClient(`/User/empleado/${id}`, { method: 'PUT', body: JSON.stringify(employee) }) }
export function deleteEmployee(id) { return apiClient(`/User/${id}`, { method: 'DELETE' }) }
