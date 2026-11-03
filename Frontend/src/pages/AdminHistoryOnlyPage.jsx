import { useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { getAdminHistoricalConsultation } from '../features/companies/companyService'
import { downloadBankBatch, downloadLiquidationReceipts } from '../features/admin/adminService'
import { useToast } from '../context/ToastContext'

const dateLabel = (value) => value ? new Date(value).toLocaleDateString('es-AR') : '—'
const moneyLabel = (value) => Number(value ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function AdminHistoryOnlyPage() {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    getAdminHistoricalConsultation()
      .then(setHistory)
      .catch((error) => toast.error(error.message || 'No se pudo cargar el historial.'))
      .finally(() => setLoading(false))
  }, [toast])

  async function download(liquidation, kind) {
    setDownloading(`${kind}-${liquidation.id}`)
    try {
      const file = kind === 'pdf'
        ? await downloadLiquidationReceipts(liquidation.id)
        : await downloadBankBatch(liquidation.id)
      saveBlob(file, kind === 'pdf' ? `liquidacion_${liquidation.id}_detalle.pdf` : `liquidacion_${liquidation.id}_lote.txt`)
      toast.success(kind === 'pdf' ? 'Detalle PDF descargado.' : 'Lote TXT descargado.')
    } catch (error) {
      toast.error(error.message || 'No se pudo descargar el archivo.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar navigation={[]} homePath="/admin/historial" subtitle="Consulta histórica" />
      <main className="mx-auto w-full max-w-6xl p-5 sm:p-8">
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Acceso temporal de solo lectura. No podés crear, editar, aprobar ni cerrar operaciones. Las descargas quedan disponibles para consultar el historial.
        </div>
        {loading ? <p className="py-16 text-center text-slate-500">Cargando historial...</p> : !history ? <p className="rounded-2xl bg-white p-6 text-slate-600">No se pudo cargar el historial de la empresa.</p> : (
          <div className="space-y-6">
            <header><h1 className="text-2xl font-bold">Historial de {history.company?.name}</h1><p className="mt-1 text-sm text-slate-500">Consulta de jornadas, liquidaciones y valores históricos.</p></header>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold">Empleados y usuarios</h2>
              <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="p-3">Nombre</th><th className="p-3">Usuario</th><th className="p-3">Rol</th><th className="p-3">Estado</th></tr></thead><tbody>{(history.users ?? []).map((user) => <tr key={user.id} className="border-t"><td className="p-3">{user.name}</td><td className="p-3">{user.userName}</td><td className="p-3">{user.role}</td><td className="p-3">{user.isActive ? 'Activo' : 'Baja'}</td></tr>)}{!history.users?.length && <tr><td colSpan={4} className="p-3 text-slate-500">Sin usuarios asociados.</td></tr>}</tbody></table></div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold">Jornadas registradas</h2>
              <div className="max-h-80 overflow-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-slate-500"><tr><th className="p-3">Fecha</th><th className="p-3">Empleado</th><th className="p-3">Horas</th><th className="p-3">Estado</th><th className="p-3">Observación</th></tr></thead><tbody>{(history.workdays ?? []).map((day) => <tr key={day.id} className="border-t"><td className="p-3">{dateLabel(day.dateEntry)}</td><td className="p-3">{day.employee ?? '—'}</td><td className="p-3">{day.hoursWorked} h</td><td className="p-3">{day.state}</td><td className="p-3">{day.motivoRechazo || '—'}</td></tr>)}{!history.workdays?.length && <tr><td colSpan={5} className="p-3 text-slate-500">Sin jornadas registradas.</td></tr>}</tbody></table></div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold">Liquidaciones y archivos</h2>
              <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="p-3">Período</th><th className="p-3">Cierre</th><th className="p-3">Total</th><th className="p-3">Estado</th><th className="p-3">Descargas</th></tr></thead><tbody>{(history.liquidations ?? []).map((item) => <tr key={item.id} className="border-t"><td className="p-3">{dateLabel(item.liquidationDate)}</td><td className="p-3">{dateLabel(item.executionDate)}</td><td className="p-3 font-semibold">{moneyLabel(item.total)}</td><td className="p-3">{item.isClosed ? 'Cerrada' : 'Simulada'}</td><td className="p-3">{item.isClosed ? <div className="flex gap-2"><button type="button" disabled={downloading !== null} onClick={() => download(item, 'pdf')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50">{downloading === `pdf-${item.id}` ? 'Descargando…' : 'Detalle PDF'}</button><button type="button" disabled={downloading !== null} onClick={() => download(item, 'txt')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50">{downloading === `txt-${item.id}` ? 'Descargando…' : 'Lote TXT'}</button></div> : 'Disponible al cerrar'}</td></tr>)}{!history.liquidations?.length && <tr><td colSpan={5} className="p-3 text-slate-500">Sin liquidaciones registradas.</td></tr>}</tbody></table></div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold">Detalle de liquidaciones por empleado</h2>
              <div className="max-h-80 overflow-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-slate-500"><tr><th className="p-3">Período</th><th className="p-3">Empleado</th><th className="p-3">Horas</th><th className="p-3">Importe</th></tr></thead><tbody>{(history.details ?? []).map((detail) => <tr key={detail.id} className="border-t"><td className="p-3">{dateLabel(detail.period)}</td><td className="p-3">{detail.employee ?? '—'}</td><td className="p-3">{detail.totalHours} h</td><td className="p-3 font-semibold">{moneyLabel(detail.amount)}</td></tr>)}{!history.details?.length && <tr><td colSpan={4} className="p-3 text-slate-500">Sin detalles de liquidación.</td></tr>}</tbody></table></div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold">Historial de valores</h2>
              <div className="space-y-2">{(history.rateHistory ?? []).map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm"><p className="font-medium">{item.rateType}: {item.previousValue ?? '—'} → {item.value ?? '—'}</p><p className="mt-1 text-xs text-slate-500">{dateLabel(item.changedAt)} · {item.userName ?? 'Sistema'}</p></article>)}{!history.rateHistory?.length && <p className="text-sm text-slate-500">Sin cambios de valores registrados.</p>}</div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold">Gestiones y avisos</h2>
              <div className="space-y-2">{(history.notifications ?? []).map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm"><p className="font-medium">{item.type}: {item.message}</p><p className="mt-1 text-xs text-slate-500">{dateLabel(item.createdAt)} · {item.isRead ? 'Leída' : 'Pendiente'}</p></article>)}{!history.notifications?.length && <p className="text-sm text-slate-500">Sin gestiones registradas.</p>}</div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
