import { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { useToast } from '../../context/ToastContext'
import { getStatistics } from '../../features/admin/adminService'

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })
const hours = (value) => `${decimal.format(value ?? 0)} h`
const percent = (value) => (value === null || value === undefined ? '—' : `${decimal.format(value)} %`)

function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map((day) => day.approvedHours + day.pendingHours))

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex h-44 min-w-max items-end gap-1.5 border-b border-slate-200 pb-1" role="img" aria-label="Horas por día del mes">
        {daily.map((day) => {
          const total = day.approvedHours + day.pendingHours
          return (
            <div key={day.date} className="flex h-full w-7 flex-col justify-end" title={`${day.date.slice(8)}/${day.date.slice(5, 7)}: ${decimal.format(day.approvedHours)} h aprobadas, ${decimal.format(day.pendingHours)} h pendientes`}>
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-t-md" style={{ height: `${(total / max) * 100}%`, minHeight: total > 0 ? '6px' : '2px' }}>
                <div className="bg-amber-400" style={{ flexGrow: day.pendingHours }} />
                <div className="bg-emerald-500" style={{ flexGrow: day.approvedHours }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex min-w-max gap-1.5">
        {daily.map((day) => <span key={day.date} className="w-7 text-center text-[10px] text-slate-400">{day.date.slice(8)}</span>)}
      </div>
    </div>
  )
}

export function StatisticsPanel() {
  const now = new Date()
  const { toast } = useToast()
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    getStatistics(period)
      .then((result) => { if (!cancelled) setData(result) })
      .catch((error) => { if (!cancelled) toast.error(error.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [period, reloadKey, toast])

  function changePeriod(next) {
    setLoading(true)
    setPeriod(next)
  }

  function refresh() {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  const employees = data?.employees ?? []
  const daily = data?.daily ?? []
  const isEmpty = !loading && employees.length === 0

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Estadísticas de horas y costos</h2>
            <p className="mt-1 text-sm text-slate-500">Rendimiento y costo por empleado en el período elegido.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Mes" value={period.month} disabled={loading} onChange={(event) => changePeriod({ ...period, month: Number(event.target.value) })} className="rounded-xl border border-slate-300 p-2 text-sm disabled:opacity-50">
              {months.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
            </select>
            <input aria-label="Año" type="number" min="2000" max="2100" value={period.year} disabled={loading} onChange={(event) => { const year = Number(event.target.value); if (year >= 2000 && year <= 2100) changePeriod({ ...period, year }) }} className="w-24 rounded-xl border border-slate-300 p-2 text-sm disabled:opacity-50" />
            <button type="button" onClick={refresh} disabled={loading} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-600 hover:bg-primary-50 hover:text-primary-800 disabled:opacity-50">
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Horas aprobadas" value={hours(data?.totalApprovedHours)} hint={`${employees.length} ${employees.length === 1 ? 'empleado' : 'empleados'} con jornadas`} />
        <Kpi label="Horas pendientes" value={hours(data?.totalPendingHours)} hint="Todavía sin aprobar o rechazar" />
        <Kpi label="Costo estimado" value={money.format(data?.totalCost ?? 0)} hint={`Valor hora ${money.format(data?.hourlyRate ?? 0)}; feriados y fines de semana ${money.format(data?.holidayHourlyRate ?? 0)}`} />
        <Kpi label="Tasa de aprobación" value={percent(data?.approvalRate)} hint={`${hours(data?.totalRejectedHours)} rechazadas`} />
      </div>

      {isEmpty ? (
        <Card><p className="py-8 text-center text-sm text-slate-400">No hay jornadas cargadas en {months[period.month - 1].toLowerCase()} de {period.year}.</p></Card>
      ) : (
        <>
          <Card>
            <h3 className="text-lg font-bold">Horas por día</h3>
            <p className="text-sm text-slate-500">Aprobadas <span className="mx-1 inline-block size-2.5 rounded-sm bg-emerald-500 align-middle" /> y pendientes <span className="mx-1 inline-block size-2.5 rounded-sm bg-amber-400 align-middle" /> de toda la empresa.</p>
            {loading && !daily.length ? <p className="py-8 text-center text-sm text-slate-400">Cargando...</p> : <DailyChart daily={daily} />}
          </Card>

          <Card>
            <h3 className="text-lg font-bold">Detalle por empleado</h3>
            <p className="text-sm text-slate-500">Ordenado por horas aprobadas. El costo usa solo las horas aprobadas.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs text-slate-500">
                  <tr><th className="pb-3 font-medium">Empleado</th><th className="pb-3 font-medium">Aprobadas</th><th className="pb-3 font-medium">Pendientes</th><th className="pb-3 font-medium">Rechazadas</th><th className="pb-3 font-medium">Días</th><th className="pb-3 font-medium">Prom./día</th><th className="pb-3 font-medium">Aprobación</th><th className="pb-3 text-right font-medium">Costo</th><th className="pb-3 pl-4 font-medium">% del costo</th></tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.idUser} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium">{employee.name}</td>
                      <td className="py-3 font-semibold text-emerald-700">{hours(employee.approvedHours)}</td>
                      <td className="py-3 text-amber-700">{hours(employee.pendingHours)}</td>
                      <td className="py-3 text-red-700">{hours(employee.rejectedHours)}</td>
                      <td className="py-3">{employee.approvedDays}</td>
                      <td className="py-3">{hours(employee.averageHoursPerDay)}</td>
                      <td className="py-3">{percent(employee.approvalRate)}</td>
                      <td className="py-3 text-right font-semibold">{money.format(employee.cost)}</td>
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, employee.costShare)}%` }} /></div>
                          <span className="text-xs text-slate-500">{percent(employee.costShare)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
