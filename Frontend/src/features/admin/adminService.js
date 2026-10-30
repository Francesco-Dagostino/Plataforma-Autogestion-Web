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
// Valor hora en feriados y fines de semana; vacío vuelve al doble del valor hora
export function updateHolidayRate(holidayHourlyRate) { return apiClient('/Company/valor-hora-feriado', { method: 'PUT', body: JSON.stringify({ holidayHourlyRate: holidayHourlyRate === '' || holidayHourlyRate == null ? null : Number(holidayHourlyRate) }) }) }
// Cambios de valor hora de la empresa (normal y de feriado)
export function getRateHistory() { return apiClient('/Company/historial-valores') }
export function updateMyCompany({ name, cuit }) { return apiClient('/Company/mi-empresa', { method: 'PUT', body: JSON.stringify({ name, cuit: Number(cuit) }) }) }
export function updateEmployee(id, employee) { return apiClient(`/User/empleado/${id}`, { method: 'PUT', body: JSON.stringify(employee) }) }
export function deleteEmployee(id) { return apiClient(`/User/${id}`, { method: 'DELETE' }) }

// Tope diario de horas de la empresa
export function updateDailyLimit(dailyHoursLimit) { return apiClient('/Company/tope-horas', { method: 'PUT', body: JSON.stringify({ dailyHoursLimit: Number(dailyHoursLimit) }) }) }

// Avisos internos del Admin
export function getNotifications() { return apiClient('/Notification') }
export function markNotificationRead(id) { return apiClient(`/Notification/${id}/leer`, { method: 'PUT' }) }
export function markAllNotificationsRead() { return apiClient('/Notification/leer-todas', { method: 'PUT' }) }

// Estadísticas de horas y costos de un mes
export function getStatistics({ month, year }) { return apiClient(`/estadisticas?month=${Number(month)}&year=${Number(year)}`) }
