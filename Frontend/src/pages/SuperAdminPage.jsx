import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { useToast } from '../context/ToastContext'
import { createCompany, createCompanyAdmin, deleteCompany, getCompanies, getCompanyUsers, updateCompany } from '../features/companies/companyService'

const todayAsInput = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const emptyAdmin = { name: '', email: '', userName: '', password: '' }
const emptyCompany = () => ({ name: '', cuit: '', dateHigh: todayAsInput() })
const dateInputValue = (value) => String(value).slice(0, 10)
const formatDate = (value) => new Date(`${dateInputValue(value)}T12:00:00`).toLocaleDateString('es-AR')
const superAdminNavigation = [{ label: 'Empresas', icon: 'home', path: '/super-admin' }]

export function SuperAdminPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const [admins, setAdmins] = useState({})
  const [companyToDelete, setCompanyToDelete] = useState(null)
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
      const usersByCompany = await Promise.all(list.map((company) => getCompanyUsers(company.id).catch(() => [])))
      setAdmins(Object.fromEntries(list.map((company, index) => [company.id, (usersByCompany[index] ?? []).filter((user) => user.role === 'Admin').map((user) => user.name)])))
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

  async function removeCompany(company) {
    setBusy(true)
    try {
      await deleteCompany(company.id)
      setCompanies((items) => items.filter((item) => item.id !== company.id))
      setCompanyToDelete(null)
      toast.success('Empresa eliminada correctamente.')
    } catch (deleteError) {
      toast.error(deleteError.message || 'No se pudo eliminar la empresa.')
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
          <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">SuperAdmin</p><h1 className="mt-1 text-2xl font-bold">Administración global</h1><p className="mt-1 text-slate-500">Gestioná las empresas registradas en la plataforma.</p></div>
          <div className="flex gap-2"><button onClick={loadCompanies} disabled={loading} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">↻ {loading ? 'Actualizando...' : 'Actualizar'}</button><button onClick={openCreate} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">+ Nueva empresa</button></div>
        </header>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">Empresas</h2><p className="text-sm text-slate-500">{companies.length} {companies.length === 1 ? 'empresa registrada' : 'empresas registradas'}</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-medium">Empresa</th><th className="px-5 py-3 font-medium">CUIT</th><th className="px-5 py-3 font-medium">Alta</th><th className="px-5 py-3 font-medium">Admin</th><th className="px-5 py-3 text-right font-medium">Acciones</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Cargando empresas...</td></tr>
                  : companies.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Todavía no hay empresas registradas.</td></tr>
                    : companies.map((company) => <tr key={company.id} className="border-t border-slate-100"><td className="px-5 py-4 font-semibold">{company.name}</td><td className="px-5 py-4">{company.cuit}</td><td className="px-5 py-4">{formatDate(company.dateHigh)}</td><td className="px-5 py-4">{admins[company.id]?.length ? admins[company.id].join(", ") : <span className="text-slate-400">Sin Admin</span>}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => setAdminCompany(company)} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Crear Admin</button><button type="button" disabled={busy} onClick={() => openEdit(company)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Editar</button><button type="button" disabled={busy} onClick={() => setCompanyToDelete(company)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Eliminar</button></div></td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="company-form-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="company-form-title" className="text-xl font-bold">{editingCompany ? 'Editar empresa' : 'Nueva empresa'}</h2>
            <p className="mt-1 text-sm text-slate-500">Completá los datos de la empresa.</p>
            <form onSubmit={saveCompany} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Nombre<input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">CUIT<input required inputMode="numeric" pattern="[0-9]{11}" title="Ingresá los 11 dígitos del CUIT, sin guiones" value={form.cuit} onChange={(event) => setForm({ ...form, cuit: event.target.value.replace(/\D/g, '').slice(0, 11) })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">Fecha de alta<input required type="date" value={form.dateHigh} onChange={(event) => setForm({ ...form, dateHigh: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => { setIsFormOpen(false); setEditingCompany(null); setForm(emptyCompany()) }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Guardando...' : editingCompany ? 'Guardar cambios' : 'Crear empresa'}</button></div>
            </form>
          </section>
        </div>
      )}

      {adminCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="admin-form-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="admin-form-title" className="text-xl font-bold">Crear administrador</h2>
            <p className="mt-1 text-sm text-slate-500">Será el Admin de {adminCompany.name}.</p>
            <form onSubmit={saveAdmin} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Nombre<input required maxLength={100} value={adminForm.name} onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">Correo<input required type="email" maxLength={150} value={adminForm.email} onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">Usuario<input required maxLength={50} value={adminForm.userName} onChange={(event) => setAdminForm({ ...adminForm, userName: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">Contraseña
                <div className="relative mt-1.5"><input required minLength={6} maxLength={100} type={showAdminPassword ? 'text' : 'password'} value={adminForm.password} onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-20" /><button type="button" onClick={() => setShowAdminPassword((visible) => !visible)} aria-label={showAdminPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showAdminPassword} className="absolute inset-y-0 right-3 text-xs font-semibold text-emerald-700 focus:outline-none focus-visible:underline focus-visible:underline-offset-4">{showAdminPassword ? 'Ocultar' : 'Mostrar'}</button></div>
              </label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={closeAdminForm} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Creando...' : 'Crear Admin'}</button></div>
            </form>
          </section>
        </div>
      )}

      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-company-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-company-title" className="text-lg font-bold">Eliminar empresa</h2>
            <p className="mt-1 text-sm text-slate-500">¿Eliminar la empresa «{companyToDelete.name}»? Esta acción no se puede deshacer.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => setCompanyToDelete(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
              <button type="button" disabled={busy} onClick={() => removeCompany(companyToDelete)} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{busy ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
