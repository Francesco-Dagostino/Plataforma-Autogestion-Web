// Orden del historial de jornadas por estado. "recientes" deja la lista como viene (más nueva primero).
// Los otros modos suben al principio las jornadas de ese estado y conservan el orden de fecha dentro de cada grupo.
export const SORT_LABELS = {
  recientes: 'Más recientes primero',
  Pendiente: 'Pendientes primero',
  Aprobada: 'Aprobadas primero',
  Desaprobada: 'Rechazadas primero',
}

export function sortByStatus(items, mode) {
  if (!mode || mode === 'recientes') return items
  // Array.prototype.sort es estable: dentro de cada grupo se mantiene el orden original.
  return [...items].sort((a, b) => Number(b.estado === mode) - Number(a.estado === mode))
}
