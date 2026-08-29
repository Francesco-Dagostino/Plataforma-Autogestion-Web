import { Sidebar } from '../components/layout/Sidebar'
import { Card } from '../components/ui/Card'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '../features/auth/authService'
import { getMyWorkdays, createWorkday } from '../features/workdays/workdayService'

const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// Colores por estado según el enum del backend
const STATUS_STYLES = {
  Pendiente:   'bg-amber-100 text-amber-700',
  Aprobada:    'bg-emerald-100 text-emerald-700',
  Desaprobada: 'bg-red-100 text-red-700',
}

function Status({ children }) {
  const style = STATUS_STYLES[children] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {children}
    </span>
  )
}

// Formatea fecha ISO a texto legible en español
function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Compara si la fecha ISO es hoy
function isToday(isoString) {
  const today = new Date()
  const date = new Date(isoString)
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

// Obtiene el rango de lunes a domingo de la semana actual
function getWeekRange(currentDate = new Date()) {
  const date = new Date(currentDate)
  const day = date.getDay() // 0: Domingo, 1: Lunes, ...
  const diffToMonday = (day === 0 ? -6 : 1) - day
  
  const monday = new Date(date)
  monday.setDate(date.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { monday, sunday }
}

export function HomePage() {
  const [user, setUser] = useState(null)
  const [workdays, setWorkdays] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    hoursWorked: 8,
    dateEntry: new Date().toISOString().split('T')[0],
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Carga inicial de datos de usuario y jornadas
  async function loadData() {
    try {
      const [currentUser, myWorkdays] = await Promise.all([
        getCurrentUser(),
        getMyWorkdays(),
      ])
      setUser(currentUser)
      setWorkdays(myWorkdays ?? [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Enviar nueva jornada laboral
  async function handleRegisterWorkday(e) {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)

    try {
      await createWorkday(formData)
      setIsModalOpen(false)
      setFormData({
        hoursWorked: 8,
        dateEntry: new Date().toISOString().split('T')[0],
      })
      await loadData()
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar jornada')
    } finally {
      setSubmitting(false)
    }
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '--'

  // Suma horas de jornadas de hoy que no estén Desaprobadas
  const horasHoy = workdays
    .filter((w) => isToday(w.dateEntry) && w.estado !== 'Desaprobada')
    .reduce((acc, w) => acc + (w.hoursWorked ?? 0), 0)

  // Cálculo de horas por cada día de la semana actual (L a D)
  const { monday, sunday } = getWeekRange()
  const weeklyHours = [0, 0, 0, 0, 0, 0, 0] // [L, M, M, J, V, S, D]

  workdays.forEach((w) => {
    if (w.estado === 'Desaprobada') return
    const entryDate = new Date(w.dateEntry)
    if (entryDate >= monday && entryDate <= sunday) {
      const dayIndex = (entryDate.getDay() + 6) % 7 // Ajuste a 0=Lunes, 6=Domingo
      weeklyHours[dayIndex] += Number(w.hoursWorked ?? 0)
    }
  })

  // Total de horas acumuladas en la semana
  const horasEstaSemana = weeklyHours.reduce((acc, h) => acc + h, 0)
  const metaSemanal = 40
  const horasFaltantes = Math.max(0, metaSemanal - horasEstaSemana)

  // Cálculo de datos de próxima liquidación mensual
  const today = new Date()
  const mesActualNombre = today.toLocaleDateString('es-AR', { month: 'long' })
  const anioActual = today.getFullYear()
  const ultimoDiaMes = new Date(anioActual, today.getMonth() + 1, 0).getDate()
  const tituloLiquidacion = `${mesActualNombre.charAt(0).toUpperCase() + mesActualNombre.slice(1)} ${anioActual}`
  const detalleCierre = `Cierre estimado: ${ultimoDiaMes} de ${mesActualNombre}`

  const maxHourForChart = Math.max(9, ...weeklyHours)

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Mi panel</p>
            <h1 className="text-xl font-bold">¡Buen día, {user?.name?.split(' ')[0] ?? ''}!</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative grid size-10 place-items-center rounded-full bg-slate-100 text-lg" aria-label="Notificaciones">
              ♢<span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name ?? 'Cargando...'}</p>
              <p className="text-xs text-slate-500">{user?.role ?? ''}</p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-[#d8eadf] font-bold text-emerald-800">{initials}</span>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Resumen de jornada</h2>
              <p className="mt-1 text-slate-500">
                {today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              + Registrar horas
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {/* Horas de hoy calculadas dinámicamente */}
            <Card>
              <p className="text-sm font-medium text-slate-500">Horas de hoy</p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-4xl font-bold">
                  {horasHoy}<span className="ml-1 text-lg text-slate-400">/ 8 h</span>
                </p>
                <span className="rounded-lg bg-sky-50 px-2 py-1 text-sm font-semibold text-sky-700">
                  {horasHoy > 0 ? 'Registradas' : 'Por cargar'}
                </span>
              </div>
            </Card>

            {/* Horas esta semana dinámicas */}
            <Card>
              <p className="text-sm font-medium text-slate-500">Horas esta semana</p>
              <p className="mt-3 text-4xl font-bold">
                {horasEstaSemana}<span className="ml-1 text-lg text-slate-400">h</span>
              </p>
              <p className="mt-2 text-sm text-emerald-600">
                {horasFaltantes > 0 ? `▲ ${horasFaltantes} h para completar (meta 40h)` : '✓ Meta semanal alcanzada'}
              </p>
            </Card>

            {/* Próxima liquidación dinámica */}
            <Card>
              <p className="text-sm font-medium text-slate-500">Próxima liquidación</p>
              <p className="mt-3 text-2xl font-bold">{tituloLiquidacion}</p>
              <p className="mt-2 text-sm text-slate-500">{detalleCierre}</p>
            </Card>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-5">
            {/* Actividad semanal dinámica */}
            <Card className="xl:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Actividad semanal</h3>
                  <p className="text-sm text-slate-500">Horas registradas por día</p>
                </div>
                <span className="text-lg font-bold text-emerald-600">{horasEstaSemana} h</span>
              </div>
              <div className="mt-7 flex h-44 items-end justify-between gap-3 border-b border-slate-200 px-1">
                {weeklyHours.map((hour, index) => (
                  <div key={weekDays[index]} className="flex h-full flex-1 flex-col justify-end gap-2 text-center">
                    <div
                      className="rounded-t-md bg-[#1e8567] transition-all duration-300"
                      style={{
                        height: `${(hour / maxHourForChart) * 100}%`,
                        minHeight: hour > 0 ? '12px' : '2px',
                      }}
                      title={`${hour} horas el ${weekDays[index]}`}
                    />
                    <span className="text-xs font-medium text-slate-500">{weekDays[index]}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="xl:col-span-2">
              <h3 className="font-bold">Recordatorios</h3>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <span className={`mt-1 size-2 shrink-0 rounded-full ${horasHoy > 0 ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <div>
                    <p className="text-sm font-semibold">Horas de hoy</p>
                    <p className="text-sm text-slate-500">
                      {horasHoy === 0 ? 'Aún no registraste tu jornada de hoy.' : `Registraste ${horasHoy} horas hoy.`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold">Período actual</p>
                    <p className="text-sm text-slate-500">La liquidación de {mesActualNombre} cierra el {ultimoDiaMes}.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabla de jornadas reales desde la API */}
          <Card className="mt-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">Mis últimas horas registradas</h3>
                <p className="text-sm text-slate-500">Seguimiento de tus jornadas recientes</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Fecha</th>
                    <th className="pb-3 font-medium">Horas</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {workdays.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">
                        No hay jornadas registradas.
                      </td>
                    </tr>
                  ) : (
                    workdays.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-4 font-medium">{formatDate(item.dateEntry)}</td>
                        <td className="py-4 font-semibold">{item.hoursWorked} h</td>
                        <td className="py-4"><Status>{item.estado}</Status></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal para registrar horas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Registrar horas trabajadas</h3>
            <p className="mt-1 text-sm text-slate-500">Declaración de jornada laboral para aprobación.</p>

            {errorMsg && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegisterWorkday} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Fecha de jornada</label>
                <input
                  type="date"
                  required
                  value={formData.dateEntry}
                  onChange={(e) => setFormData({ ...formData, dateEntry: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Horas trabajadas (0 a 24)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  value={formData.hoursWorked}
                  onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar jornada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
