import { apiClient } from '../../services/apiClient'

export function getMyLiquidations() {
  return apiClient('/DetailLiquidation/mis-liquidaciones')
}

export function downloadMyPayslip(detailId) {
  return apiClient(`/reports/mi-recibo/${detailId}`, { responseType: 'blob' })
}

export function getMyEstimate({ userId, month, year }) {
  return apiClient(`/Liquidation/empleado/${userId}/simular?month=${Number(month)}&year=${Number(year)}`)
}
