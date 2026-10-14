import { apiClient } from '../../services/apiClient'

export function getMyLiquidations() {
  return apiClient('/DetailLiquidation/mis-liquidaciones')
}

export function downloadMyPayslip(detailId) {
  return apiClient(`/reports/mi-recibo/${detailId}`, { responseType: 'blob' })
}
