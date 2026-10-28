import { apiClient } from '../../services/apiClient'
import { getWorkdayDateString } from './workdayDate'

// Las jornadas son fechas de calendario: convertimos la medianoche
// argentina a UTC para conservar el día elegido al guardarlo.
function toWorkdayPayload({ hoursWorked, dateEntry }) {
  return JSON.stringify({
    hoursWorked: Number(hoursWorked),
    dateEntry: new Date(`${getWorkdayDateString(dateEntry)}T00:00:00-03:00`).toISOString(),
  })
}

// Obtiene las jornadas del empleado autenticado
export function getMyWorkdays() {
  return apiClient('/Workday/mis-horas')
}

// Registra una nueva jornada laboral
export function createWorkday(workday) {
  return apiClient('/Workday/cargar', { method: 'POST', body: toWorkdayPayload(workday) })
}

// Modifica una jornada que todavía está pendiente
export function updateWorkday(id, workday) {
  return apiClient(`/Workday/${id}`, { method: 'PUT', body: toWorkdayPayload(workday) })
}
