import { useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { NotificationBell } from '../components/NotificationBell'
import { RateHistory } from '../components/admin/RateHistory'
import { StatisticsPanel } from '../components/admin/StatisticsPanel'
import { useToast } from '../context/ToastContext'
import { formatWorkdayDate } from '../features/workdays/workdayDate'
import {
  approveWorkday,
  closeLiquidationMonth,
  createEmployee,
  deleteEmployee,
  downloadBankBatch,
  downloadLiquidationReceipts,
  getCompanyUsers,
  getMyCompany,
  getMonthlyClosure,
  getPendingWorkdays,
  getRateHistory,
  getResolvedWorkdays,
  rejectWorkday,
  simulateLiquidation,
  updateDailyLimit,
  updateHolidayRate,
  updateHourlyRate,
  updateEmployee,
  updateMyCompany,
} from '../features/admin/adminService'

const now = new Date()
const emptyEmployee = { name: '', email: '', userName: '', password: '' }
const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal normal-case text-slate-900'
const date = (value) => formatWorkdayDate(value, { day: '2-digit', month: 'short' })
const historyDate = (value) => formatWorkdayDate(value, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const statusStyles = {
  Aprobada: 'bg-emerald-100 text-emerald-700',
  Desaprobada: 'bg-red-100 text-red-700',
}

function saveDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const sections = {
  aprobaciones: { label: 'Aprobaciones', title: 'Monitor de aprobación' },
  empleados: { label: 'Empleados', title: 'Gestión de empleados' },
  liquidaciones: { label: 'Liquidaciones', title: 'Liquidaciones de haberes' },
  estadisticas: { label: 'Estadísticas', title: 'Estadísticas de horas y costos' },
  miEmpresa: { label: 'Mi empresa', title: 'Datos de la empresa' },
}

const adminNavigation = [
  { label: 'Aprobaciones', icon: 'home', path: '/admin' },
  { label: 'Empleados', icon: 'clock', path: '/admin/empleados' },
  { label: 'Liquidaciones', icon: 'receipt', path: '/admin/liquidaciones' },
  { label: 'Estadísticas', icon: 'chart', path: '/admin/estadisticas' },
  { label: 'Mi empresa', icon: 'home', path: '/admin/mi-empresa' },
]

export function AdminDashboardPage({ section = 'aprobaciones' }) {
  const current = sections[section] ?? sections.aprobaciones
  const [pending, setPending] = useState([])
  const [resolved, setResolved] = useState([])
  const [hourlyRate, setHourlyRate] = useState('')
  const [holidayRate, setHolidayRate] = useState('')
  const [effectiveHolidayRate, setEffectiveHolidayRate] = useState(null)
  const [rateHistory, setRateHistory] = useState([])
  const [dailyLimit, setDailyLimit] = useState('')
  const [companyForm, setCompanyForm] = useState({ name: '', cuit: '' })
  const [employees, setEmployees] = useState([])
  const [employee, setEmployee] = useState(emptyEmployee)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [editForm, setEditForm] = useState(emptyEmployee)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const { toast } = useToast()
  const [rejecting, setRejecting] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [showEmployeePassword, setShowEmployeePassword] = useState(false)
  const [total, setTotal] = useState(null)
  const [closedLiquidation, setClosedLiquidation] = useState(null)
  const [downloadedReports, setDownloadedReports] = useState({ pdf: false, txt: false })

  async function load() {
    setLoadingData(true)
    try {
      if (section === 'aprobaciones') {
        const [pendingWorkdays, resolvedWorkdays] = await Promise.all([getPendingWorkdays(), getResolvedWorkdays()])
        setPending(pendingWorkdays ?? [])
        setResolved(resolvedWorkdays ?? [])
      }
      if (section === 'empleados') setEmployees((await getCompanyUsers()) ?? [])
      if (section === 'miEmpresa') {
        const company = await getMyCompany()
        setCompanyForm({ name: company.name ?? '', cuit: String(company.cuit ?? '') })
        setDailyLimit(String(company.dailyHoursLimit ?? ''))
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoadingData(false)
    }
  }

  function applyRates(company) {
    setHourlyRate(String(company.parameterSystem ?? ''))
    setHolidayRate(String(company.holidayHourlyRate ?? ''))
    setEffectiveHolidayRate(company.effectiveHolidayRate ?? null)
  }

  // Vuelve a leer los valores vigentes y su historial después de un cambio.
  async function refreshRates() {
    applyRates(await getMyCompany())
    setRateHistory((await getRateHistory()) ?? [])
  }

  async function refreshLiquidation() {
    setLoadingData(true)
    try {
      const closure = await getMonthlyClosure(period)
      setClosedLiquidation(closure)
      setTotal(closure.total)
      setDownloadedReports({ pdf: false, txt: false })
    } catch (requestError) {
      if (requestError.status === 404) {
        setClosedLiquidation(null)
        setTotal(null)
        setDownloadedReports({ pdf: false, txt: false })
        toast.info('No hay una liquidación cerrada para este período.')
      } else {
        toast.error(requestError.message)
      }
    } finally {
      setLoadingData(false)
    }
  }

  function resetLiquidationView() {
    setClosedLiquidation(null)
    setTotal(null)
    setDownloadedReports({ pdf: false, txt: false })
  }

  useEffect(() => {
    if (section === 'liquidaciones') {
      getMyCompany()
        .then(applyRates)
        .catch((e) => toast.error(e.message))
      getRateHistory()
        .then((items) => setRateHistory(items ?? []))
        .catch((e) => toast.error(e.message))
    }
    if (section !== 'liquidaciones') load()
  }, [section])

  useEffect(() => {
    if (section !== 'liquidaciones') return undefined

    setClosedLiquidation(null)
    setTotal(null)
    setDownloadedReports({ pdf: false, txt: false })
  }, [section, period.month, period.year])

  async function approve(item) {
    setBusy(true)
    try {
      await approveWorkday(item.id)
      setPending((items) => items.filter((pendingItem) => pendingItem.id !== item.id))
      getResolvedWorkdays().then((items) => setResolved(items ?? [])).catch(() => {})
      toast.success(`Jornada de ${item.userName} aprobada.`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  function closeRejectModal() {
    setRejecting(null)
    setMotivoRechazo('')
  }

  async function reject(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await rejectWorkday(rejecting.id, motivoRechazo.trim())
      setPending((items) => items.filter((item) => item.id !== rejecting.id))
      getResolvedWorkdays().then((items) => setResolved(items ?? [])).catch(() => {})
      toast.success(`Jornada de ${rejecting.userName} rechazada.`)
      closeRejectModal()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function add(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const user = await createEmployee(employee)
      setEmployees((items) => [...items, user])
      setEmployee(emptyEmployee)
      setShowEmployeePassword(false)
      toast.success('Empleado creado correctamente.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  function openEditEmployee(user) {
    setEditingEmployee(user)
    setEditForm({ name: user.name ?? '', email: user.email ?? '', userName: user.userName ?? '', password: '' })
  }

  async function saveEmployee(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await updateEmployee(editingEmployee.id, { ...editForm, password: editForm.password || null })
      setEmployees((await getCompanyUsers()) ?? [])
      setEditingEmployee(null)
      toast.success('Empleado actualizado correctamente.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeEmployee() {
    setBusy(true)
    try {
      const result = await deleteEmployee(employeeToDelete.id)
      setEmployees((items) => items.filter((item) => item.id !== employeeToDelete.id))
      toast.success(result?.dadoDeBaja ? 'Empleado dado de baja. Se conserva su historial de horas y liquidaciones.' : 'Empleado eliminado correctamente.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setEmployeeToDelete(null)
      setBusy(false)
    }
  }

  async function saveCompany(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await updateMyCompany({ name: companyForm.name.trim(), cuit: companyForm.cuit })
      toast.success('Datos de la empresa actualizados.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveHourlyRate(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await updateHourlyRate(hourlyRate)
      await refreshRates()
      toast.success('Valor por hora actualizado.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveDailyLimit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await updateDailyLimit(dailyLimit)
      toast.success('Tope de horas diarias actualizado.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveHolidayRate(event, useDefault = false) {
    event?.preventDefault()
    setBusy(true)
    try {
      await updateHolidayRate(useDefault ? '' : holidayRate)
      await refreshRates()
      toast.success(useDefault ? 'Los feriados y fines de semana se pagan el doble.' : 'Valor por hora de feriados actualizado.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function liquidate(close) {
    setBusy(true)
    try {
      const result = close ? await closeLiquidationMonth(period) : await simulateLiquidation(period)
      setTotal(close ? result.data?.total : result.total)
      if (close) {
        setDownloadedReports({ pdf: false, txt: false })
        setClosedLiquidation({
          liquidationId: result.data?.liquidacionId,
          total: result.data?.total,
          liquidationDate: result.data?.periodoLiquidado,
        })
      }
      toast.success(close ? (result.mensaje || 'Mes cerrado.') : 'Simulación generada.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function downloadReport(kind) {
    if (!closedLiquidation?.liquidationId) return
    setBusy(true)
    try {
      const file = kind === 'pdf'
        ? await downloadLiquidationReceipts(closedLiquidation.liquidationId)
        : await downloadBankBatch(closedLiquidation.liquidationId)
      const periodName = `${period.year}-${String(period.month).padStart(2, '0')}`
      saveDownload(file, kind === 'pdf' ? `recibos_${periodName}.pdf` : `lote_bancario_${periodName}.txt`)
      setDownloadedReports((reports) => ({ ...reports, [kind]: true }))
      toast.success(kind === 'pdf' ? 'Recibos descargados.' : 'Lote bancario descargado.')
    } catch (requestError) {
      toast.error(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar navigation={adminNavigation} homePath="/admin" subtitle="Panel de administración" />

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b bg-white px-5 py-4 sm:px-8">
          <div><p className="text-xs font-semibold uppercase text-emerald-600">Mi panel</p><h1 className="text-xl font-bold">{current.label}</h1></div>
          <div className="flex items-center gap-2"><NotificationBell onNew={section === 'aprobaciones' ? load : undefined} />{section !== 'estadisticas' && <button onClick={section === 'liquidaciones' ? resetLiquidationView : load} disabled={loadingData || busy} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50"><span aria-hidden="true" className="mr-2">↻</span>{loadingData ? 'Actualizando...' : 'Actualizar datos'}</button>}</div>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          {section === 'aprobaciones' && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-2xl font-bold">Monitor de aprobación</h2>
                <p className="text-sm text-slate-500">Jornadas pendientes de validación de tus empleados</p>
                <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="pb-3">EMPLEADO</th><th>FECHA</th><th>HORAS</th><th className="text-right">ACCIONES</th></tr></thead>
                  <tbody>{pending.length ? pending.map((workday) => <tr key={workday.id} className="border-b border-slate-100"><td className="py-3">{workday.userName}</td><td>{date(workday.dateEntry)}</td><td>{workday.hoursWorked} h</td><td className="text-right"><button disabled={busy} onClick={() => approve(workday)} className="mr-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white disabled:opacity-50">Aprobar</button><button disabled={busy} onClick={() => setRejecting(workday)} className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 disabled:opacity-50">Rechazar</button></td></tr>) : <tr><td colSpan={4} className="py-6 text-center text-slate-400">No hay jornadas pendientes.</td></tr>}</tbody>
                </table>
                </div>
            </section>
          )}

          {section === 'aprobaciones' && (
            <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Historial de jornadas</h2>
              <p className="text-sm text-slate-500">Jornadas aprobadas y rechazadas.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b text-xs uppercase text-slate-500"><tr><th className="pb-3">Empleado</th><th>Fecha</th><th>Horas</th><th>Estado</th></tr></thead>
                  <tbody>{loadingData && !resolved.length ? <tr><td colSpan={4} className="py-6 text-center text-slate-400">Cargando historial...</td></tr> : resolved.length ? resolved.map((item) => <tr key={item.id} className="border-b border-slate-100 last:border-0"><td className="py-4">{item.userName}</td><td className="py-4 font-medium">{historyDate(item.dateEntry)}</td><td className="py-4 font-semibold">{item.hoursWorked} h</td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.estado] ?? 'bg-slate-100 text-slate-600'}`}>{item.estado}</span>{item.estado === 'Desaprobada' && item.motivoRechazo && <p className="mt-1 max-w-xs text-xs text-slate-500">Motivo: {item.motivoRechazo}</p>}</td></tr>) : <tr><td colSpan={4} className="py-6 text-center text-slate-400">Todavía no hay jornadas aprobadas o rechazadas.</td></tr>}</tbody>
                </table>
              </div>
            </section>
          )}

          {section === 'estadisticas' && <StatisticsPanel />}

          {section === 'miEmpresa' && (
            <section className="max-w-2xl rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold">Datos de la empresa</h2>
              <p className="mt-1 text-sm text-slate-500">Editá el nombre y el CUIT de tu empresa.</p>
              <form onSubmit={saveCompany} className="mt-5 space-y-4">
                <label className="block text-xs font-semibold uppercase text-slate-500">Nombre<input required maxLength={150} value={companyForm.name} onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal normal-case text-slate-900" /></label>
                <label className="block text-xs font-semibold uppercase text-slate-500">CUIT<input required inputMode="numeric" pattern="[0-9]{11}" title="Ingresá los 11 dígitos del CUIT, sin guiones" value={companyForm.cuit} onChange={(event) => setCompanyForm({ ...companyForm, cuit: event.target.value.replace(/\D/g, '').slice(0, 11) })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal normal-case text-slate-900" /></label>
                <button disabled={busy || loadingData} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Guardando...' : 'Guardar cambios'}</button>
              </form>

              <form onSubmit={saveDailyLimit} className="mt-8 space-y-4 border-t border-slate-100 pt-6">
                <div><h3 className="text-lg font-bold">Tope de horas diarias</h3><p className="mt-1 text-sm text-slate-500">Máximo de horas que un empleado puede declarar en un solo día. Si carga más, el sistema lo rechaza.</p></div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Horas por día<input required type="number" step="0.5" min="0.5" max="24" value={dailyLimit} onChange={(event) => setDailyLimit(event.target.value)} className={fieldClass} /></label>
                <button disabled={busy || loadingData} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Guardando...' : 'Guardar tope'}</button>
              </form>
            </section>
          )}

          {section === 'empleados' && (
            <section className="grid gap-5 xl:grid-cols-5">
              <div className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm xl:col-span-3"><h2 className="text-2xl font-bold">Empleados de la empresa</h2>
                <table className="mt-4 w-full text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="pb-3">NOMBRE</th><th>USUARIO</th><th>CORREO</th><th className="text-right">ACCIONES</th></tr></thead><tbody>{employees.length ? employees.map((user) => <tr key={user.id} className="border-b border-slate-100"><td className="py-3">{user.name}</td><td>{user.userName}</td><td>{user.email}</td><td className="py-3 text-right">{user.role === 'Empleado' && <><button type="button" disabled={busy} onClick={() => openEditEmployee(user)} className="mr-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Editar</button><button type="button" disabled={busy} onClick={() => setEmployeeToDelete(user)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Eliminar</button></>}</td></tr>) : <tr><td colSpan={4} className="py-6 text-center text-slate-400">Todavía no hay empleados para mostrar.</td></tr>}</tbody></table>
              </div>
              <form onSubmit={add} className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2"><h2 className="text-xl font-bold">Dar de alta empleado</h2>
                {Object.entries({ name: ['Nombre', 'text'], email: ['Correo', 'email'], userName: ['Usuario', 'text'], password: ['Contraseña', 'password'] }).map(([key, [label, type]]) => <label key={key} className="mt-3 block text-xs font-semibold">{label}{key === 'password' ? <div className="relative mt-1"><input required minLength={6} type={showEmployeePassword ? 'text' : type} value={employee[key]} onChange={(event) => setEmployee({ ...employee, [key]: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-20" /><button type="button" onClick={() => setShowEmployeePassword((visible) => !visible)} aria-label={showEmployeePassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showEmployeePassword} className="absolute inset-y-0 right-3 text-xs font-semibold text-emerald-700 focus:outline-none focus-visible:underline focus-visible:underline-offset-4">{showEmployeePassword ? 'Ocultar' : 'Mostrar'}</button></div> : <input required type={type} value={employee[key]} onChange={(event) => setEmployee({ ...employee, [key]: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />}</label>)}
                <button disabled={busy} className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50">Crear empleado</button>
              </form>
            </section>
          )}

          {section === 'liquidaciones' && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold">Liquidaciones de haberes</h2><p className="text-sm text-slate-500">Simulá o cerrá el mes con jornadas aprobadas.</p>
              <form onSubmit={saveHourlyRate} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="text-xs font-semibold uppercase text-slate-500">Valor por hora (ARS)<input required type="number" min="0.01" max="999999" step="0.01" value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} className="mt-1 block w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-900" /></label>
                <button disabled={busy || loadingData} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Guardar valor</button>
              </form>
              <form onSubmit={saveHolidayRate} className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="text-xs font-semibold uppercase text-slate-500">Valor por hora en feriados y fines de semana (ARS)<input type="number" min="0.01" max="999999" step="0.01" value={holidayRate} onChange={(event) => setHolidayRate(event.target.value)} placeholder={effectiveHolidayRate ? `Doble: ${effectiveHolidayRate}` : 'Doble del valor hora'} className="mt-1 block w-60 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-900" /></label>
                <button disabled={busy || loadingData || !holidayRate} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Guardar valor</button>
                <button type="button" disabled={busy || loadingData || !holidayRate} onClick={() => saveHolidayRate(null, true)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50">Usar el doble</button>
                <p className="basis-full text-xs text-slate-500">{holidayRate ? 'Se paga este valor por hora trabajada en sábados, domingos y feriados.' : `Sin valor propio: sábados, domingos y feriados se pagan ${effectiveHolidayRate ? `$${effectiveHolidayRate}` : 'el doble'} por hora (el doble del valor hora).`}</p>
              </form>
              <RateHistory items={rateHistory} />
              <div className="mt-4 flex flex-wrap gap-3">
                <select aria-label="Mes" disabled={loadingData || busy} value={period.month} onChange={(event) => setPeriod({ ...period, month: Number(event.target.value) })} className="rounded-xl border p-2 disabled:opacity-50">{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(now.getFullYear(), index).toLocaleDateString('es-AR', { month: 'long' })}</option>)}</select>
                <input aria-label="Año" type="number" disabled={loadingData || busy} value={period.year} onChange={(event) => setPeriod({ ...period, year: Number(event.target.value) })} className="w-24 rounded-xl border p-2 disabled:opacity-50" />
                <button disabled={busy || loadingData} onClick={() => liquidate(false)} className="rounded-xl border border-emerald-600 px-4 text-sm text-emerald-700 disabled:opacity-50">Simular liquidación</button>
                <button disabled={busy || loadingData} onClick={() => liquidate(true)} className="rounded-xl bg-[#102848] px-4 text-sm text-white disabled:opacity-50">Cerrar mes</button>
                <button disabled={busy || loadingData} onClick={refreshLiquidation} className="rounded-xl border border-slate-300 px-4 text-sm text-slate-700 disabled:opacity-50">{loadingData ? 'Consultando...' : 'Consultar'}</button>
              </div>
              {total !== null && !downloadedReports.pdf && !downloadedReports.txt && <p className="mt-4 rounded-xl bg-slate-50 p-4 font-bold">Total calculado: ${total}</p>}
              {closedLiquidation?.liquidationId && (!downloadedReports.pdf || !downloadedReports.txt) && (
                <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="font-semibold text-emerald-900">Liquidación cerrada para este período</p>
                  <p className="mt-1 text-sm text-emerald-800">Ya podés descargar los recibos individuales en un PDF o el archivo para el banco.</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {!downloadedReports.pdf && <button disabled={busy} onClick={() => downloadReport('pdf')} className="rounded-xl border border-emerald-700 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50">{busy ? 'Preparando archivo...' : 'Descargar recibos PDF'}</button>}
                    {!downloadedReports.txt && <button disabled={busy} onClick={() => downloadReport('txt')} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{busy ? 'Preparando archivo...' : 'Descargar lote bancario TXT'}</button>}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={saveEmployee} role="dialog" aria-modal="true" aria-labelledby="edit-employee-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="edit-employee-title" className="text-lg font-bold">Editar empleado</h2>
            <label className="mt-5 block text-xs font-semibold uppercase text-slate-500">Nombre<input required maxLength={100} value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} className={fieldClass} /></label>
            <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">Correo<input required type="email" maxLength={150} value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} className={fieldClass} /></label>
            <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">Usuario<input required maxLength={50} value={editForm.userName} onChange={(event) => setEditForm({ ...editForm, userName: event.target.value })} className={fieldClass} /></label>
            <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">Nueva contraseña (opcional)<input type="password" minLength={6} maxLength={100} autoComplete="new-password" placeholder="Dejala vacía para no cambiarla" value={editForm.password} onChange={(event) => setEditForm({ ...editForm, password: event.target.value })} className={fieldClass} /></label>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => setEditingEmployee(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-employee-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-employee-title" className="text-lg font-bold">Eliminar empleado</h2>
            <p className="mt-1 text-sm text-slate-500">¿Eliminar a {employeeToDelete.name}? Si ya tiene horas o liquidaciones, se lo da de baja y se conserva su historial.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => setEmployeeToDelete(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
              <button type="button" disabled={busy} onClick={removeEmployee} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{busy ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </section>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={reject} role="dialog" aria-modal="true" aria-labelledby="reject-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="reject-title" className="text-lg font-bold">Rechazar jornada</h2>
            <p className="mt-1 text-sm text-slate-500">{rejecting.userName} · {date(rejecting.dateEntry)} · {rejecting.hoursWorked} h</p>
            <label className="mt-5 block text-xs font-semibold uppercase text-slate-500">Motivo del rechazo
              <textarea required autoFocus minLength={3} maxLength={250} rows={4} value={motivoRechazo} onChange={(event) => setMotivoRechazo(event.target.value)} placeholder="Explicá por qué se rechaza esta jornada" className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm normal-case font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <p className="mt-1 text-right text-xs text-slate-400">{motivoRechazo.length}/250</p>
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={closeRejectModal} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={busy || motivoRechazo.trim().length < 3} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{busy ? 'Rechazando...' : 'Rechazar jornada'}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
