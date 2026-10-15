import { apiClient } from '../../services/apiClient'
import { getWorkdayDateString } from './workdayDate'

// Obtiene las jornadas del empleado autenticado
export function getMyWorkdays() {
  return apiClient('/Workday/mis-horas')
}

// Registra una nueva jornada laboral
export function createWorkday({ hoursWorked, dateEntry }) {
  return apiClient('/Workday/cargar', {
    method: 'POST',
    body: JSON.stringify({
      hoursWorked: Number(hoursWorked),
      // Las jornadas son fechas de calendario: convertimos la medianoche
      // argentina a UTC para conservar el día elegido al guardarlo.
      dateEntry: new Date(`${getWorkdayDateString(dateEntry)}T00:00:00-03:00`).toISOString(),
    }),
  })
}
