import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Card } from '../components/ui/Card'
import { getCurrentUser } from '../features/auth/authService'
import { getMyEstimate } from '../features/liquidations/liquidationService'
import { getMyWorkdays } from '../features/workdays/workdayService'
import { useToast } from '../context/ToastContext'
import { getArgentinaToday, getWorkdayDateString } from '../features/workdays/workdayDate'

const formatAmount = (value) => Number(value ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

function isToday(value) {
  return getWorkdayDateString(value) === getArgentinaToday()
}

function getWeekStart(date = getArgentinaToday()) {
  const start = new Date(`${date}T00:00:00Z`)
  const offset = start.getUTCDay() === 0 ? -6 : 1 - start.getUTCDay()
  start.setUTCDate(start.getUTCDate() + offset)
  return start.toISOString().slice(0, 10)
}

export function HomePage() {
  const [user, setUser] = useState(null)
  const [workdays, setWorkdays] = useState([])
  const { toast } = useToast()
  const [estimate, setEstimate] = useState(null)

  useEffect(() => {
    Promise.all([getCurrentUser(), getMyWorkdays()])
      .then(([currentUser, myWorkdays]) => {
        setUser(currentUser)
        setWorkdays(myWorkdays ?? [])
        const today = getArgentinaToday()
        return getMyEstimate({ userId: currentUser.id, month: today.slice(5, 7), year: today.slice(0, 4) })
      })
      .then((result) => setEstimate(result))
      .catch((loadError) => toast.error(loadError.message || 'No se pudo cargar el resumen.'))
  }, [toast])

  const todayHours = workdays
    .filter((item) => isToday(item.dateEntry) && item.estado !== 'Desaprobada')
    .reduce((total, item) => total + Number(item.hoursWorked ?? 0), 0)
  const weekStart = getWeekStart()
  const weekEnd = new Date(`${weekStart}T00:00:00Z`)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)
  const weekEndString = weekEnd.toISOString().slice(0, 10)
  const weekHours = workdays
    .filter((item) => {
      if (item.estado === 'Desaprobada') return false
      const date = getWorkdayDateString(item.dateEntry)
      return date >= weekStart && date < weekEndString
    })
    .reduce((total, item) => total + Number(item.hoursWorked ?? 0), 0)
  const pendingCount = workdays.filter((item) => item.estado === 'Pendiente').length

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          
          <h1 className="mt-1 text-xl font-bold">¡Buen día, {user?.name?.split(' ')[0] ?? ''}!</h1>
        </header>
        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Resumen</h2>
              <p className="mt-1 text-slate-500">Un vistazo a tus horas y jornadas.</p>
            </div>
            <Link to="/mis-horas" className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700">+ Registrar horas</Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <p className="text-sm font-medium text-slate-500">Horas de hoy</p>
              <p className="mt-3 text-4xl font-bold">{todayHours}<span className="ml-1 text-lg text-slate-400">h</span></p>
              <p className="mt-2 text-sm text-slate-500">Jornadas registradas para hoy</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-slate-500">Horas esta semana</p>
              <p className="mt-3 text-4xl font-bold">{weekHours}<span className="ml-1 text-lg text-slate-400">h</span></p>
              <p className="mt-2 text-sm text-slate-500">Aprobadas y pendientes</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-slate-500">Sueldo estimado del mes</p>
              <p className="mt-3 text-4xl font-bold">{formatAmount(estimate?.montoAcumulado)}</p>
              <p className="mt-2 text-sm text-slate-500">{estimate?.totalHoras ?? 0} h · incluye jornadas pendientes</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-slate-500">Pendientes de aprobación</p>
              <p className="mt-3 text-4xl font-bold">{pendingCount}</p>
              <p className="mt-2 text-sm text-slate-500">Jornadas esperando revisión</p>
            </Card>
          </div>

          <Card className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold">¿Querés revisar o cargar tus jornadas?</h3>
              <p className="mt-1 text-sm text-slate-500">En Mis horas encontrás la gráfica, el historial y el formulario de carga.</p>
            </div>
            <Link to="/mis-horas" className="rounded-xl border border-primary-700 px-4 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50">Ir a Mis horas</Link>
          </Card>
        </div>
      </div>
    </main>
  )
}
