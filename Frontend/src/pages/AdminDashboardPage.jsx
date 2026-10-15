import { useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { formatWorkdayDate, getArgentinaToday } from '../features/workdays/workdayDate'
import { createWorkday } from '../features/workdays/workdayService'
import {
  approveWorkday,
  closeLiquidationMonth,
  createEmployee,
  downloadBankBatch,
  downloadLiquidationReceipts,
  getCompanyUsers,
  getMonthlyClosure,
  getPendingWorkdays,
  rejectWorkday,
  simulateLiquidation,
} from '../features/admin/adminService'

const now = new Date()
const emptyEmployee = { name: '', email: '', userName: '', password: '' }
const emptyWorkday = { dateEntry: getArgentinaToday(), hoursWorked: '' }
const date = (value) => formatWorkdayDate(value, { day: '2-digit', month: 'short' })

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
  registrarHoras: { label: 'Registrar mis horas', title: 'Registrar mis horas' },
  empleados: { label: 'Empleados', title: 'Gestión de empleados' },
  liquidaciones: { label: 'Liquidaciones', title: 'Liquidaciones de haberes' },
}

const adminNavigation = [
  { label: 'Aprobaciones', icon: 'home', path: '/admin' },
  { label: 'Registrar mis horas', icon: 'clock', path: '/admin/registrar-horas' },
  { label: 'Empleados', icon: 'clock', path: '/admin/empleados' },
  { label: 'Liquidaciones', icon: 'receipt', path: '/admin/liquidaciones' },
]

export function AdminDashboardPage({ section = 'aprobaciones' }) {
  const current = sections[section] ?? sections.aprobaciones
  const [pending, setPending] = useState([])
  const [employees, setEmployees] = useState([])
  const [employee, setEmployee] = useState(emptyEmployee)
  const [workday, setWorkday] = useState(emptyWorkday)
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [showEmployeePassword, setShowEmployeePassword] = useState(false)
  const [total, setTotal] = useState(null)
  const [closedLiquidation, setClosedLiquidation] = useState(null)
  const [downloadedReports, setDownloadedReports] = useState({ pdf: false, txt: false })

  async function load() {
    setLoadingData(true)
    setError('')
    try {
      if (section === 'aprobaciones') setPending((await getPendingWorkdays()) ?? [])
      if (section === 'empleados') setEmployees((await getCompanyUsers()) ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingData(false)
    }
  }

  async function refreshLiquidation() {
    setLoadingData(true)
    setError('')
    setNotice('')
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
        setNotice('No hay una liquidación cerrada para este período.')
      } else {
        setError(requestError.message)
      }
    } finally {
      setLoadingData(false)
    }
  }

  function resetLiquidationView() {
    setClosedLiquidation(null)
    setTotal(null)
    setDownloadedReports({ pdf: false, txt: false })
    setError('')
    setNotice('')
  }

  useEffect(() => {
    setNotice('')
    setError('')
    if (section !== 'liquidaciones') load()
  }, [section])

  useEffect(() => {
    if (section !== 'liquidaciones') return undefined

    setClosedLiquidation(null)
    setTotal(null)
    setDownloadedReports({ pdf: false, txt: false })
    setError('')
    setNotice('')
  }, [section, period.month, period.year])

  async function resolve(id, ok) {
    setBusy(true)
    setError('')
    try {
      await (ok ? approveWorkday(id) : rejectWorkday(id))
      setPending((items) => items.filter((item) => item.id !== id))
      setNotice(ok ? 'Jornada aprobada.' : 'Jornada rechazada.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function add(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await createEmployee(employee)
      setEmployees((items) => [...items, user])
      setEmployee(emptyEmployee)
      setShowEmployeePassword(false)
      setNotice('Empleado creado correctamente.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function addOwnWorkday(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await createWorkday(workday)
      setWorkday({ ...emptyWorkday, dateEntry: getArgentinaToday() })
      setPending((await getPendingWorkdays()) ?? [])
      setNotice('Tus horas se registraron y quedaron pendientes de aprobación.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function liquidate(close) {
    setBusy(true)
    setError('')
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
      setNotice(close ? (result.mensaje || 'Mes cerrado.') : 'Simulación generada.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function downloadReport(kind) {
    if (!closedLiquidation?.liquidationId) return
    setBusy(true)
    setError('')
    try {
      const file = kind === 'pdf'
        ? await downloadLiquidationReceipts(closedLiquidation.liquidationId)
        : await downloadBankBatch(closedLiquidation.liquidationId)
      const periodName = `${period.year}-${String(period.month).padStart(2, '0')}`
      saveDownload(file, kind === 'pdf' ? `recibos_${periodName}.pdf` : `lote_bancario_${periodName}.txt`)
      setDownloadedReports((reports) => ({ ...reports, [kind]: true }))
      setNotice(kind === 'pdf' ? 'Recibos descargados.' : 'Lote bancario descargado.')
    } catch (requestError) {
      setError(requestError.message)
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
          <button onClick={section === 'liquidaciones' ? resetLiquidationView : load} disabled={loadingData || busy} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50"><span aria-hidden="true" className="mr-2">↻</span>{loadingData ? 'Actualizando...' : 'Actualizar datos'}</button>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
          {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-700">{notice}</p>}

          {section === 'aprobaciones' && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-2xl font-bold">Monitor de aprobación</h2>
                <p className="text-sm text-slate-500">Jornadas pendientes de validación de vos y tus empleados</p>
                <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="pb-3">EMPLEADO</th><th>FECHA</th><th>HORAS</th><th className="text-right">ACCIONES</th></tr></thead>
                  <tbody>{pending.length ? pending.map((workday) => <tr key={workday.id} className="border-b border-slate-100"><td className="py-3">{workday.userName}</td><td>{date(workday.dateEntry)}</td><td>{workday.hoursWorked} h</td><td className="text-right"><button disabled={busy} onClick={() => resolve(workday.id, true)} className="mr-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white disabled:opacity-50">Aprobar</button><button disabled={busy} onClick={() => resolve(workday.id, false)} className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 disabled:opacity-50">Rechazar</button></td></tr>) : <tr><td colSpan={4} className="py-6 text-center text-slate-400">No hay jornadas pendientes.</td></tr>}</tbody>
                </table>
                </div>
            </section>
          )}

          {section === 'registrarHoras' && (
            <section className="max-w-2xl rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold">Registrar mis horas</h2>
              <p className="mt-1 text-sm text-slate-500">Tus horas quedarán pendientes en Aprobaciones para que puedas aprobarlas o rechazarlas.</p>
              <form onSubmit={addOwnWorkday} className="mt-5">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-xs font-semibold">Fecha<input required type="date" value={workday.dateEntry} onChange={(event) => setWorkday({ ...workday, dateEntry: event.target.value })} className="mt-1 block rounded-xl border border-slate-200 p-2" /></label>
                  <label className="text-xs font-semibold">Horas<input required type="number" min="0.5" max="24" step="0.5" value={workday.hoursWorked} onChange={(event) => setWorkday({ ...workday, hoursWorked: event.target.value })} className="mt-1 block w-28 rounded-xl border border-slate-200 p-2" /></label>
                  <button disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Guardando...' : 'Registrar horas'}</button>
                </div>
              </form>
            </section>
          )}

          {section === 'empleados' && (
            <section className="grid gap-5 xl:grid-cols-5">
              <div className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm xl:col-span-3"><h2 className="text-2xl font-bold">Empleados de la empresa</h2>
                <table className="mt-4 w-full text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="pb-3">NOMBRE</th><th>USUARIO</th><th>CORREO</th></tr></thead><tbody>{employees.length ? employees.map((user) => <tr key={user.id} className="border-b border-slate-100"><td className="py-3">{user.name}</td><td>{user.userName}</td><td>{user.email}</td></tr>) : <tr><td colSpan={3} className="py-6 text-center text-slate-400">Todavía no hay empleados para mostrar.</td></tr>}</tbody></table>
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
    </main>
  )
}
