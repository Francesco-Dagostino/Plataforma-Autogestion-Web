import { useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
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
const date = (value) => new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

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
}

const adminNavigation = [
  { label: 'Aprobaciones', icon: 'home', path: '/admin' },
  { label: 'Empleados', icon: 'clock', path: '/admin/empleados' },
  { label: 'Liquidaciones', icon: 'receipt', path: '/admin/liquidaciones' },
]

export function AdminDashboardPage({ section = 'aprobaciones' }) {
  const current = sections[section] ?? sections.aprobaciones
  const [pending, setPending] = useState([])
  const [employees, setEmployees] = useState([])
  const [employee, setEmployee] = useState(emptyEmployee)
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [total, setTotal] = useState(null)
  const [closedLiquidation, setClosedLiquidation] = useState(null)

  async function load() {
    setError('')
    try {
      if (section === 'aprobaciones') setPending((await getPendingWorkdays()) ?? [])
      if (section === 'empleados') setEmployees((await getCompanyUsers()) ?? [])
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    setNotice('')
    setError('')
    load()
  }, [section])

  useEffect(() => {
    if (section !== 'liquidaciones') return undefined

    let isCurrent = true
    setClosedLiquidation(null)
    setTotal(null)
    setError('')

    getMonthlyClosure(period)
      .then((closure) => {
        if (!isCurrent) return
        setClosedLiquidation(closure)
        setTotal(closure.total)
      })
      .catch((requestError) => {
        if (isCurrent && requestError.status !== 404) setError(requestError.message)
      })

    return () => { isCurrent = false }
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
      setNotice('Empleado creado correctamente.')
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
      setTotal(close ? result.data?.total : result.montoAcumulado)
      if (close) {
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
          {section !== 'liquidaciones' && <button onClick={load} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"><span aria-hidden="true" className="mr-2">↻</span>Actualizar datos</button>}
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
          {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-700">{notice}</p>}

          {section === 'aprobaciones' && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold">Monitor de aprobación</h2>
              <p className="text-sm text-slate-500">Jornadas pendientes de validación</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="pb-3">EMPLEADO</th><th>FECHA</th><th>HORAS</th><th className="text-right">ACCIONES</th></tr></thead>
                  <tbody>{pending.length ? pending.map((workday) => <tr key={workday.id} className="border-b border-slate-100"><td className="py-3">{workday.userName}</td><td>{date(workday.dateEntry)}</td><td>{workday.hoursWorked} h</td><td className="text-right"><button disabled={busy} onClick={() => resolve(workday.id, true)} className="mr-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white disabled:opacity-50">Aprobar</button><button disabled={busy} onClick={() => resolve(workday.id, false)} className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 disabled:opacity-50">Rechazar</button></td></tr>) : <tr><td colSpan={4} className="py-6 text-center text-slate-400">No hay jornadas pendientes.</td></tr>}</tbody>
                </table>
              </div>
            </section>
          )}

          {section === 'empleados' && (
            <section className="grid gap-5 xl:grid-cols-5">
              <div className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm xl:col-span-3"><h2 className="text-2xl font-bold">Empleados de la empresa</h2>
                <table className="mt-4 w-full text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="pb-3">NOMBRE</th><th>USUARIO</th><th>CORREO</th></tr></thead><tbody>{employees.length ? employees.map((user) => <tr key={user.id} className="border-b border-slate-100"><td className="py-3">{user.name}</td><td>{user.userName}</td><td>{user.email}</td></tr>) : <tr><td colSpan={3} className="py-6 text-center text-slate-400">Todavía no hay empleados para mostrar.</td></tr>}</tbody></table>
              </div>
              <form onSubmit={add} className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2"><h2 className="text-xl font-bold">Dar de alta empleado</h2>
                {Object.entries({ name: ['Nombre', 'text'], email: ['Correo', 'email'], userName: ['Usuario', 'text'], password: ['Contraseña', 'password'] }).map(([key, [label, type]]) => <label key={key} className="mt-3 block text-xs font-semibold">{label}<input required minLength={key === 'password' ? 6 : undefined} type={type} value={employee[key]} onChange={(event) => setEmployee({ ...employee, [key]: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>)}
                <button disabled={busy} className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50">Crear empleado</button>
              </form>
            </section>
          )}

          {section === 'liquidaciones' && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold">Liquidaciones de haberes</h2><p className="text-sm text-slate-500">Simulá o cerrá el mes con jornadas aprobadas.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <select aria-label="Mes" value={period.month} onChange={(event) => setPeriod({ ...period, month: Number(event.target.value) })} className="rounded-xl border p-2">{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(now.getFullYear(), index).toLocaleDateString('es-AR', { month: 'long' })}</option>)}</select>
                <input aria-label="Año" type="number" value={period.year} onChange={(event) => setPeriod({ ...period, year: Number(event.target.value) })} className="w-24 rounded-xl border p-2" />
                <button disabled={busy} onClick={() => liquidate(false)} className="rounded-xl border border-emerald-600 px-4 text-sm text-emerald-700 disabled:opacity-50">Simular liquidación</button>
                <button disabled={busy} onClick={() => liquidate(true)} className="rounded-xl bg-[#102848] px-4 text-sm text-white disabled:opacity-50">Cerrar mes</button>
              </div>
              {total !== null && <p className="mt-4 rounded-xl bg-slate-50 p-4 font-bold">Total calculado: ${total}</p>}
              {closedLiquidation?.liquidationId && (
                <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="font-semibold text-emerald-900">Liquidación cerrada para este período</p>
                  <p className="mt-1 text-sm text-emerald-800">Ya podés descargar los recibos individuales en un PDF o el archivo para el banco.</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button disabled={busy} onClick={() => downloadReport('pdf')} className="rounded-xl border border-emerald-700 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50">{busy ? 'Preparando archivo...' : 'Descargar recibos PDF'}</button>
                    <button disabled={busy} onClick={() => downloadReport('txt')} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{busy ? 'Preparando archivo...' : 'Descargar lote bancario TXT'}</button>
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
