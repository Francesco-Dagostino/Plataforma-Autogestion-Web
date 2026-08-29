import { apiClient } from '../../services/apiClient'

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
      dateEntry: new Date(dateEntry).toISOString(),
    }),
  })
}
