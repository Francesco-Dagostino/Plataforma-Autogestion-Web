import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { useToast } from '../context/ToastContext'
import { createCompany, createCompanyAdmin, getCompanies, getCompanySummary, setCompanyActive, setCompanyHistoryAccess, updateCompany } from '../features/companies/companyService'

const todayAsInput = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const emptyAdmin = { name: '', email: '', userName: '', password: '' }
const emptyCompany = () => ({ name: '', cuit: '', dateHigh: todayAsInput() })
const dateInputValue = (value) => String(value).slice(0, 10)
const formatDate = (value) => new Date(`${dateInputValue(value)}T12:00:00`).toLocaleDateString('es-AR')
const superAdminNavigation = [{ label: 'Empresas', icon: 'building', path: '/super-admin' }]

export function SuperAdminPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const [companyToToggle, setCompanyToToggle] = useState(null)
  const [companyAccessToToggle, setCompanyAccessToToggle] = useState(null)
  const [companyHistory, setCompanyHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [adminCompany, setAdminCompany] = useState(null)
  const [adminForm, setAdminForm] = useState(emptyAdmin)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState(emptyCompany)

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const list = (await getCompanies()) ?? []
      setCompanies(list)
    } catch (loadError) {
      toast.error(loadError.message || 'No se pudieron cargar las empresas.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadCompanies() }, [loadCompanies])

  function openCreate() {
    setEditingCompany(null)
    setForm(emptyCompany())
    setIsFormOpen(true)
  }

  function openEdit(company) {
    setEditingCompany(company)
    setIsFormOpen(true)
    setForm({
      name: company.name ?? '',
      cuit: String(company.cuit ?? ''),
      dateHigh: dateInputValue(company.dateHigh),
    })
  }

  async function saveCompany(event) {
    event.preventDefault()
    setBusy(true)
    const payload = {
      name: form.name.trim(),
      cuit: Number(form.cuit),
      dateHigh: new Date(`${form.dateHigh}T12:00:00`).toISOString(),
    }

    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, payload)
        toast.success('Empresa actualizada correctamente.')
      } else {
        await createCompany(payload)
        toast.success('Empresa creada correctamente.')
      }
      setEditingCompany(null)
      setIsFormOpen(false)
      await loadCompanies()
    } catch (saveError) {
      toast.error(saveError.message || 'No se pudo guardar la empresa.')
    } finally {
      setBusy(false)
    }
  }

  function closeAdminForm() {
    setAdminCompany(null)
    setAdminForm(emptyAdmin)
    setShowAdminPassword(false)
  }

  async function saveAdmin(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await createCompanyAdmin(adminCompany.id, { ...adminForm, name: adminForm.name.trim(), email: adminForm.email.trim(), userName: adminForm.userName.trim() })
      toast.success(`Admin creado para ${adminCompany.name}.`)
      closeAdminForm()
      await loadCompanies()
    } catch (saveError) {
      toast.error(saveError.message || 'No se pudo crear el administrador.')
    } finally {
      setBusy(false)
    }
  }

  async function openCompanyHistory(company) {
    setHistoryLoading(true)
    setCompanyHistory({ company })
    try {
      setCompanyHistory(await getCompanySummary(company.id))
    } catch (historyError) {
      setCompanyHistory(null)
      toast.error(historyError.message || 'No se pudo consultar el historial de la empresa.')
    } finally {
      setHistoryLoading(false)
    }
  }

  async function requestCompanyStateChange(company) {
    if (!company.isActive) {
      setCompanyToToggle(company)
      return
    }
    setHistoryLoading(true)
    try {
      const summary = await getCompanySummary(company.id)
      setCompanyToToggle({ ...company, summary })
    } catch (historyError) {
      toast.error(historyError.message || 'No se pudieron contar los datos asociados.')
    } finally {
      setHistoryLoading(false)
    }
  }

  async function confirmCompanyStateChange() {
    if (!companyToToggle) return
    setBusy(true)
    try {
      await setCompanyActive(companyToToggle.id, !companyToToggle.isActive)
      toast.success(companyToToggle.isActive ? 'Empresa desactivada. Su información quedó conservada.' : 'Empresa reactivada correctamente.')
      setCompanyToToggle(null)
      setCompanyHistory(null)
      await loadCompanies()
    } catch (stateError) {
      toast.error(stateError.message || 'No se pudo cambiar el estado de la empresa.')
    } finally {
      setBusy(false)
    }
  }

  function requestHistoryAccessChange(company) {
    setCompanyAccessToToggle(company)
  }

  async function confirmHistoryAccessChange() {
    if (!companyAccessToToggle) return
    const company = companyAccessToToggle
    const enabled = !company.historyAccessEnabled
    setBusy(true)
    try {
      await setCompanyHistoryAccess(company.id, enabled)
      toast.success(enabled ? 'El Admin podrá cerrar sesión e ingresar nuevamente en modo consulta.' : 'Se revocó el acceso de consulta del Admin.')
      setCompanyAccessToToggle(null)
      await loadCompanies()
      if (companyHistory?.company?.id === company.id) {
        setCompanyHistory(await getCompanySummary(company.id))
      }
    } catch (accessError) {
      toast.error(accessError.message || 'No se pudo cambiar el permiso de consulta.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar navigation={superAdminNavigation} homePath="/super-admin" subtitle="Administración global" />
      <div className="min-w-0 flex-1 p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="mt-1 text-2xl font-bold">Administración global</h1><p className="mt-1 text-slate-500">Gestioná las empresas registradas en la plataforma.</p></div>
          <div className="flex gap-2"><button onClick={loadCompanies} disabled={loading} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{loading ? 'Actualizando...' : 'Actualizar'}</button><button onClick={openCreate} className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">+ Nueva empresa</button></div>
        </header>

        <section className="overflow-hidden rounded-2xl bg-white border border-slate-200">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">Empresas</h2><p className="text-sm text-slate-500">{companies.length} {companies.length === 1 ? 'empresa registrada' : 'empresas registradas'}</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3 font-medium">Empresa</th><th className="px-5 py-3 font-medium">CUIT</th><th className="px-5 py-3 font-medium">Alta</th><th className="px-5 py-3 font-medium">Acceso</th><th className="px-5 py-3 font-medium">Estado</th><th className="px-5 py-3 text-right font-medium">Acciones</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Cargando empresas...</td></tr>
                  : companies.length === 0 ? <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Todavía no hay empresas registradas.</td></tr>
                    : companies.map((company) => <tr key={company.id} className="border-t border-slate-100"><td className="px-5 py-4 font-semibold">{company.name}</td><td className="px-5 py-4">{company.cuit}</td><td className="px-5 py-4">{formatDate(company.dateHigh)}</td><td className="px-5 py-4">{company.isActive ? 'Operación normal' : company.historyAccessEnabled ? 'Consulta habilitada' : 'Sin acceso'}</td><td className="px-5 py-4"><span className={company.isActive ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700' : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'}>{company.isActive ? 'Activa' : 'Desactivada'}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" disabled={busy || historyLoading} onClick={() => openCompanyHistory(company)} className="rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50">Ver resumen</button>{company.isActive ? <button type="button" disabled={busy} onClick={() => setAdminCompany(company)} className="rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50">Crear Admin</button> : <button type="button" disabled={busy} onClick={() => requestHistoryAccessChange(company)} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">{company.historyAccessEnabled ? 'Revocar consulta' : 'Permitir consulta'}</button>}<button type="button" disabled={busy} onClick={() => openEdit(company)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Editar</button><button type="button" disabled={busy || historyLoading} onClick={() => requestCompanyStateChange(company)} className={company.isActive ? 'rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50' : 'rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50'}>{historyLoading ? 'Consultando...' : company.isActive ? 'Desactivar' : 'Reactivar'}</button></div></td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="company-form-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="company-form-title" className="text-xl font-bold">{editingCompany ? 'Editar empresa' : 'Nueva empresa'}</h2>
            <p className="mt-1 text-sm text-slate-500">Completá los datos de la empresa.</p>
            <form onSubmit={saveCompany} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Nombre<input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">CUIT<input required inputMode="numeric" pattern="[0-9]{11}" title="Ingresá los 11 dígitos del CUIT, sin guiones" value={form.cuit} onChange={(event) => setForm({ ...form, cuit: event.target.value.replace(/\D/g, '').slice(0, 11) })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">Fecha de alta<input required type="date" value={form.dateHigh} onChange={(event) => setForm({ ...form, dateHigh: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => { setIsFormOpen(false); setEditingCompany(null); setForm(emptyCompany()) }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={busy} className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">{busy ? 'Guardando...' : editingCompany ? 'Guardar cambios' : 'Crear empresa'}</button></div>
            </form>
          </section>
        </div>
      )}

      {adminCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="admin-form-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="admin-form-title" className="text-xl font-bold">Crear administrador</h2>
            <p className="mt-1 text-sm text-slate-500">Será el Admin de {adminCompany.name}.</p>
            <form onSubmit={saveAdmin} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Nombre<input required maxLength={100} value={adminForm.name} onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">Correo<input required type="email" maxLength={150} value={adminForm.email} onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">Usuario<input required maxLength={50} value={adminForm.userName} onChange={(event) => setAdminForm({ ...adminForm, userName: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">Contraseña
                <div className="relative mt-1.5"><input required minLength={6} maxLength={100} type={showAdminPassword ? 'text' : 'password'} value={adminForm.password} onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-20" /><button type="button" onClick={() => setShowAdminPassword((visible) => !visible)} aria-label={showAdminPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showAdminPassword} className="absolute inset-y-0 right-3 text-xs font-semibold text-primary-700 focus:outline-none focus-visible:underline focus-visible:underline-offset-4">{showAdminPassword ? 'Ocultar' : 'Mostrar'}</button></div>
              </label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={closeAdminForm} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={busy} className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">{busy ? 'Creando...' : 'Crear Admin'}</button></div>
            </form>
          </section>
        </div>
      )}

      {companyToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="company-state-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="company-state-title" className="text-lg font-bold">{companyToToggle.isActive ? 'Desactivar empresa' : 'Reactivar empresa'}</h2>
            <p className="mt-2 text-sm text-slate-600">{companyToToggle.isActive ? <>¿Desactivar «{companyToToggle.name}»? Los usuarios asociados ya no podrán ingresar ni operar. Se conservarán los datos para futuras consultas del SuperAdmin.</> : <>¿Reactivar «{companyToToggle.name}»? Sus usuarios volverán a poder ingresar y operar.</>}</p>
            {companyToToggle.isActive && <div className="mt-3 space-y-3"><div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3"><p>Empleados: <strong>{companyToToggle.summary?.counts?.employees ?? 0}</strong></p><p>Gestiones: <strong>{companyToToggle.summary?.counts?.notifications ?? 0}</strong></p><p>Jornadas: <strong>{companyToToggle.summary?.counts?.workdays ?? 0}</strong></p><p>Liquidaciones: <strong>{companyToToggle.summary?.counts?.liquidations ?? 0}</strong></p><p>Detalles liquidados: <strong>{companyToToggle.summary?.counts?.liquidationDetails ?? 0}</strong></p></div><p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Los registros permanecerán asociados a «{companyToToggle.name}» en estado desactivado y se conservarán para futuras consultas del SuperAdmin.</p></div>}
            <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setCompanyToToggle(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="button" disabled={busy} onClick={confirmCompanyStateChange} className={companyToToggle.isActive ? 'rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50' : 'rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50'}>{busy ? 'Guardando...' : companyToToggle.isActive ? 'Desactivar empresa' : 'Reactivar empresa'}</button></div>
          </section>
        </div>
      )}
      {companyAccessToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="company-history-access-title" aria-describedby="company-history-access-description" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${companyAccessToToggle.historyAccessEnabled ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`} aria-hidden="true">{companyAccessToToggle.historyAccessEnabled ? '−' : '✓'}</div>
              <div>
                <h2 id="company-history-access-title" className="text-lg font-bold">{companyAccessToToggle.historyAccessEnabled ? 'Revocar acceso de consulta' : 'Habilitar consulta del historial'}</h2>
                <p className="mt-1 text-sm text-slate-500">{companyAccessToToggle.name}</p>
              </div>
            </div>
            <p id="company-history-access-description" className="mt-4 text-sm leading-6 text-slate-600">
              {companyAccessToToggle.historyAccessEnabled
                ? 'El Admin dejará de poder ingresar al modo de consulta histórica. La empresa seguirá desactivada y sus datos se conservarán.'
                : 'El Admin podrá volver a ingresar para consultar y descargar jornadas, liquidaciones y otros registros anteriores. El acceso será de solo lectura: no podrá cargar, editar, aprobar ni cerrar operaciones. La empresa seguirá desactivada.'}
            </p>
            <p className={`mt-4 rounded-xl border p-3 text-sm ${companyAccessToToggle.historyAccessEnabled ? 'border-red-100 bg-red-50 text-red-800' : 'border-amber-100 bg-amber-50 text-amber-900'}`}>
              {companyAccessToToggle.historyAccessEnabled
                ? 'El cambio se aplicará cuando el Admin vuelva a iniciar sesión.'
                : 'El Admin deberá cerrar sesión y volver a ingresar para acceder a la consulta.'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => setCompanyAccessToToggle(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="button" disabled={busy} onClick={confirmHistoryAccessChange} className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${companyAccessToToggle.historyAccessEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>{busy ? 'Guardando...' : companyAccessToToggle.historyAccessEnabled ? 'Revocar acceso' : 'Permitir consulta'}</button>
            </div>
          </section>
        </div>
      )}
      {companyHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-6">
          <section role="dialog" aria-modal="true" aria-labelledby="company-history-title" className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><h2 id="company-history-title" className="text-xl font-bold">Resumen de {companyHistory.company?.name}</h2><p className="mt-1 text-sm text-slate-500">Vista general de actividad; el detalle de jornadas y liquidaciones queda reservado al Admin autorizado.</p></div><button type="button" onClick={() => setCompanyHistory(null)} className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100" aria-label="Cerrar">✕</button></div>
            {historyLoading ? <p className="py-12 text-center text-slate-500">Cargando resumen...</p> : <div className="mt-5 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{[['Empleados', companyHistory.counts?.employees], ['Usuarios', companyHistory.counts?.users], ['Jornadas', companyHistory.counts?.workdays], ['Liquidaciones', companyHistory.counts?.liquidations], ['Detalles', companyHistory.counts?.liquidationDetails], ['Gestiones', companyHistory.counts?.notifications]].map(([label, count]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold">{count ?? 0}</p></div>)}</div>
            </div>}
            <div className="mt-6 flex justify-end"><button type="button" onClick={() => setCompanyHistory(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cerrar</button></div>
          </section>
        </div>
      )}
    </main>
  )
}
