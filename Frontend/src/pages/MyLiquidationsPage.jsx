import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Card } from '../components/ui/Card'
import { useToast } from '../context/ToastContext'
import { downloadMyPayslip, getMyLiquidations } from '../features/liquidations/liquidationService'

const formatPeriod = (value) => new Date(value).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
const formatAmount = (value) => Number(value ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

export function MyLiquidationsPage() {
  const [liquidations, setLiquidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const { toast } = useToast()

  const loadLiquidations = useCallback(async () => {
    setLoading(true)
    try {
      setLiquidations((await getMyLiquidations()) ?? [])
    } catch (loadError) {
      toast.error(loadError.message || 'No se pudieron cargar tus liquidaciones.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadLiquidations() }, [loadLiquidations])

  async function handleDownload(item) {
    setDownloadingId(item.id)
    try {
      const pdf = await downloadMyPayslip(item.id)
      const url = URL.createObjectURL(pdf)
      const link = document.createElement('a')
      link.href = url
      link.download = `recibo_${item.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (downloadError) {
      toast.error(downloadError.message || 'No se pudo descargar el recibo.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div><h1 className="text-xl font-bold">Mis liquidaciones</h1></div>
          <button onClick={loadLiquidations} disabled={loading} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">{loading ? 'Actualizando...' : 'Actualizar'}</button>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <div className="mb-6"><h2 className="text-2xl font-bold">Historial de haberes</h2><p className="mt-1 text-slate-500">Consultá tus períodos liquidados y descargá cada recibo.</p></div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs text-slate-500"><tr><th className="pb-3 font-medium">Período</th><th className="pb-3 font-medium">Horas liquidadas</th><th className="pb-3 font-medium">Monto</th><th className="pb-3 text-right font-medium">Recibo</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={4} className="py-8 text-center text-slate-400">Cargando tus liquidaciones...</td></tr>
                    : liquidations.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-slate-500">Todavía no hay liquidaciones cerradas para mostrar.</td></tr>
                      : liquidations.map((item) => <tr key={item.id} className="border-b border-slate-100 last:border-0"><td className="py-4 font-semibold first-letter:uppercase">{formatPeriod(item.liquidationDate)}</td><td className="py-4">{Number(item.totalHours ?? 0).toLocaleString('es-AR')} h</td><td className="py-4 font-semibold">{formatAmount(item.amount)}</td><td className="py-4 text-right"><button type="button" onClick={() => handleDownload(item)} disabled={downloadingId !== null} className="rounded-lg border border-primary-700 px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50 disabled:opacity-50">{downloadingId === item.id ? 'Descargando...' : 'Descargar PDF'}</button></td></tr>)}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
