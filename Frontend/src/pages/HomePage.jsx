import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Card } from '../components/ui/Card'
import { getCurrentUser } from '../features/auth/authService'
import { getMyWorkdays } from '../features/workdays/workdayService'

function isToday(value) {
  const date = new Date(value)
  const today = new Date()
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
}

function getWeekStart(date = new Date()) {
  const start = new Date(date)
  const offset = start.getDay() === 0 ? -6 : 1 - start.getDay()
  start.setDate(start.getDate() + offset)
  start.setHours(0, 0, 0, 0)
  return start
}

export function HomePage() {
  const [user, setUser] = useState(null)
  const [workdays, setWorkdays] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getCurrentUser(), getMyWorkdays()])
      .then(([currentUser, myWorkdays]) => {
        setUser(currentUser)
        setWorkdays(myWorkdays ?? [])
      })
      .catch((loadError) => setError(loadError.message || 'No se pudo cargar el resumen.'))
  }, [])

  const todayHours = workdays
    .filter((item) => isToday(item.dateEntry) && item.estado !== 'Desaprobada')
    .reduce((total, item) => total + Number(item.hoursWorked ?? 0), 0)
  const weekStart = getWeekStart()
  const weekHours = workdays
    .filter((item) => {
      if (item.estado === 'Desaprobada') return false
      const date = new Date(item.dateEntry)
      return date >= weekStart && date < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    })
    .reduce((total, item) => total + Number(item.hoursWorked ?? 0), 0)
  const pendingCount = workdays.filter((item) => item.estado === 'Pendiente').length

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Mi panel</p>
          <h1 className="mt-1 text-xl font-bold">¡Buen día, {user?.name?.split(' ')[0] ?? ''}!</h1>
        </header>
        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Resumen</h2>
              <p className="mt-1 text-slate-500">Un vistazo a tus horas y jornadas.</p>
            </div>
            <Link to="/mis-horas" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">+ Registrar horas</Link>
          </div>

          {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="grid gap-5 md:grid-cols-3">
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
            <Link to="/mis-horas" className="rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">Ir a Mis horas</Link>
          </Card>
        </div>
      </div>
    </main>
  )
}
