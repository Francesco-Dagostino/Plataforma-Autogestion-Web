import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Card } from '../components/ui/Card'
import { getCurrentUser } from '../features/auth/authService'
import { createWorkday, getMyWorkdays } from '../features/workdays/workdayService'
import { formatWorkdayDate, getArgentinaToday, getWorkdayDate } from '../features/workdays/workdayDate'

const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const statusStyles = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Aprobada: 'bg-emerald-100 text-emerald-700',
  Desaprobada: 'bg-red-100 text-red-700',
}

function formatDate(value) {
  return formatWorkdayDate(value, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function getWeekRange(date = new Date()) {
  const monday = new Date(date)
  const offset = monday.getUTCDay() === 0 ? -6 : 1 - monday.getUTCDay()
  monday.setUTCDate(monday.getUTCDate() + offset)
  monday.setUTCHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 7)
  return { monday, sunday }
}

function WorkdayChart({ workdays }) {
  const [period, setPeriod] = useState('week')
  const today = getWorkdayDate(getArgentinaToday())
  const { monday, sunday } = getWeekRange(today)
  const weekly = Array.from({ length: 7 }, (_, index) => ({ label: weekDays[index], approved: 0, pending: 0 }))

  workdays.forEach((workday) => {
    if (workday.estado !== 'Aprobada' && workday.estado !== 'Pendiente') return
    const date = getWorkdayDate(workday.dateEntry)
    if (date < monday || date >= sunday) return
    const index = (date.getUTCDay() + 6) % 7
    const status = workday.estado === 'Aprobada' ? 'approved' : 'pending'
    weekly[index][status] += Number(workday.hoursWorked ?? 0)
  })

  const daysInMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)).getUTCDate()
  const monthly = Array.from({ length: Math.ceil(daysInMonth / 7) }, (_, index) => ({
    label: `${index * 7 + 1}–${Math.min((index + 1) * 7, daysInMonth)}`,
    approved: 0,
    pending: 0,
  }))

  workdays.forEach((workday) => {
    if (workday.estado !== 'Aprobada' && workday.estado !== 'Pendiente') return
    const date = getWorkdayDate(workday.dateEntry)
    if (date.getUTCFullYear() !== today.getUTCFullYear() || date.getUTCMonth() !== today.getUTCMonth()) return
    const index = Math.floor((date.getUTCDate() - 1) / 7)
    const status = workday.estado === 'Aprobada' ? 'approved' : 'pending'
    monthly[index][status] += Number(workday.hoursWorked ?? 0)
  })

  const data = period === 'week' ? weekly : monthly
  const approvedTotal = data.reduce((total, item) => total + item.approved, 0)
  const pendingTotal = data.reduce((total, item) => total + item.pending, 0)
  const maxHours = Math.max(9, ...data.map((item) => item.approved + item.pending))

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Actividad {period === 'week' ? 'semanal' : 'mensual'}</h2>
          <p className="text-sm text-slate-500">{period === 'week' ? 'Horas por día' : 'Horas por bloque de siete días'}</p>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-1" aria-label="Período de la gráfica">
          <button type="button" aria-pressed={period === 'week'} onClick={() => setPeriod('week')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${period === 'week' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>Semana</button>
          <button type="button" aria-pressed={period === 'month'} onClick={() => setPeriod('month')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${period === 'month' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>Mes</button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[#1e8567]" />Aprobadas: {approvedTotal} h</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-amber-400" />Pendientes: {pendingTotal} h</span>
      </div>
      <div className="mt-7 flex h-48 items-end justify-between gap-2 border-b border-slate-200 px-1 sm:gap-3">
        {data.map((item) => {
          const hours = item.approved + item.pending
          return (
            <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2 text-center">
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-t-md" style={{ height: `${(hours / maxHours) * 100}%`, minHeight: hours > 0 ? '12px' : '2px' }} title={`${item.approved} h aprobadas, ${item.pending} h pendientes`}>
                {item.pending > 0 && <div className="w-full bg-amber-400" style={{ height: `${(item.pending / hours) * 100}%`, minHeight: '3px' }} />}
                {item.approved > 0 && <div className="w-full bg-[#1e8567]" style={{ height: `${(item.approved / hours) * 100}%`, minHeight: '3px' }} />}
              </div>
              <span className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">{period === 'week' ? item.label : `días ${item.label}`}</span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-right text-sm font-semibold text-slate-700">Total del período: {approvedTotal + pendingTotal} h</p>
    </Card>
  )
}

export function MyWorkdaysPage() {
  const [user, setUser] = useState(null)
  const [workdays, setWorkdays] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ hoursWorked: 8, dateEntry: getArgentinaToday() })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadData = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [currentUser, myWorkdays] = await Promise.all([getCurrentUser(), getMyWorkdays()])
      setUser(currentUser)
      setWorkdays(myWorkdays ?? [])
    } catch (loadError) {
      setError(loadError.message || 'No se pudieron cargar tus jornadas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleRegister(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      await createWorkday(formData)
      setIsModalOpen(false)
      setFormData({ hoursWorked: 8, dateEntry: getArgentinaToday() })
      setNotice('Jornada registrada y enviada para aprobación.')
      await loadData()
    } catch (submitError) {
      setError(submitError.message || 'Error al registrar jornada.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Mis horas</p><h1 className="text-xl font-bold">Mis jornadas</h1></div>
          <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user?.name ?? 'Cargando...'}</p><p className="text-xs text-slate-500">{user?.role ?? ''}</p></div>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="text-2xl font-bold">Horas registradas</h2><p className="mt-1 text-slate-500">Consultá tu actividad y el estado de cada jornada.</p></div>
            <div className="flex gap-2">
              <button onClick={loadData} disabled={loading} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50">↻ {loading ? 'Actualizando...' : 'Actualizar'}</button>
              <button onClick={() => { setError(''); setNotice(''); setIsModalOpen(true) }} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">+ Registrar horas</button>
            </div>
          </div>

          {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

          <WorkdayChart workdays={workdays} />

          <Card className="mt-5">
            <div><h2 className="text-lg font-bold">Historial de jornadas</h2><p className="text-sm text-slate-500">Tus horas y su estado de aprobación.</p></div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-3 font-medium">Fecha</th><th className="pb-3 font-medium">Horas</th><th className="pb-3 font-medium">Estado</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={3} className="py-6 text-center text-slate-400">Cargando jornadas...</td></tr>
                    : workdays.length === 0 ? <tr><td colSpan={3} className="py-6 text-center text-slate-400">Todavía no registraste jornadas.</td></tr>
                      : workdays.map((item) => <tr key={item.id} className="border-b border-slate-100 last:border-0"><td className="py-4 font-medium">{formatDate(item.dateEntry)}</td><td className="py-4 font-semibold">{item.hoursWorked} h</td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.estado] ?? 'bg-slate-100 text-slate-600'}`}>{item.estado}</span></td></tr>)}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Registrar horas trabajadas</h2><p className="mt-1 text-sm text-slate-500">La jornada quedará pendiente de aprobación.</p>
            {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <form onSubmit={handleRegister} className="mt-5 space-y-4">
              <label className="block text-xs font-semibold uppercase text-slate-500">Fecha de jornada<input type="date" required value={formData.dateEntry} onChange={(event) => setFormData({ ...formData, dateEntry: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" /></label>
              <label className="block text-xs font-semibold uppercase text-slate-500">Horas trabajadas<input type="number" step="0.5" min="0.5" max="24" required value={formData.hoursWorked} onChange={(event) => setFormData({ ...formData, hoursWorked: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" /></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={submitting} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{submitting ? 'Guardando...' : 'Guardar jornada'}</button></div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
