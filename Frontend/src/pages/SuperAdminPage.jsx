import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { createCompany, deleteCompany, getCompanies, updateCompany } from '../features/companies/companyService'

const todayAsInput = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const emptyCompany = () => ({ name: '', cuit: '', dateHigh: todayAsInput(), parameterSystem: '' })
const dateInputValue = (value) => String(value).slice(0, 10)
const formatDate = (value) => new Date(`${dateInputValue(value)}T12:00:00`).toLocaleDateString('es-AR')
const formatAmount = (value) => Number(value ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
const superAdminNavigation = [{ label: 'Empresas', icon: 'home', path: '/super-admin' }]

export function SuperAdminPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingCompany, setEditingCompany] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState(emptyCompany)

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setCompanies((await getCompanies()) ?? [])
    } catch (loadError) {
      setError(loadError.message || 'No se pudieron cargar las empresas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCompanies() }, [loadCompanies])

  function openCreate() {
    setEditingCompany(null)
    setForm(emptyCompany())
    setIsFormOpen(true)
    setError('')
    setNotice('')
  }

  function openEdit(company) {
    setEditingCompany(company)
    setIsFormOpen(true)
    setForm({
      name: company.name ?? '',
      cuit: String(company.cuit ?? ''),
      dateHigh: dateInputValue(company.dateHigh),
      parameterSystem: String(company.parameterSystem ?? ''),
    })
    setError('')
    setNotice('')
  }

  async function saveCompany(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    const payload = {
      name: form.name.trim(),
      cuit: Number(form.cuit),
      dateHigh: new Date(`${form.dateHigh}T12:00:00`).toISOString(),
      parameterSystem: Number(form.parameterSystem),
    }

    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, payload)
        setNotice('Empresa actualizada correctamente.')
      } else {
        await createCompany(payload)
        setNotice('Empresa creada correctamente.')
      }
      setEditingCompany(null)
      setIsFormOpen(false)
      await loadCompanies()
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar la empresa.')
    } finally {
      setBusy(false)
    }
  }

  async function removeCompany(company) {
    const confirmed = window.confirm(`¿Eliminar la empresa «${company.name}»? Esta acción no se puede deshacer.`)
    if (!confirmed) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await deleteCompany(company.id)
      setCompanies((items) => items.filter((item) => item.id !== company.id))
      setNotice('Empresa eliminada correctamente.')
    } catch (deleteError) {
      setError(deleteError.message || 'No se pudo eliminar la empresa.')
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
          <div className="flex gap-2"><button onClick={loadCompanies} disabled={loading} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">↻ Actualizar</button><button onClick={openCreate} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">+ Nueva empresa</button></div>
        </header>

        {error && !isFormOpen && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">Empresas</h2><p className="text-sm text-slate-500">{companies.length} {companies.length === 1 ? 'empresa registrada' : 'empresas registradas'}</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-medium">Empresa</th><th className="px-5 py-3 font-medium">CUIT</th><th className="px-5 py-3 font-medium">Alta</th><th className="px-5 py-3 font-medium">Valor hora</th><th className="px-5 py-3 text-right font-medium">Acciones</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Cargando empresas...</td></tr>
                  : companies.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Todavía no hay empresas registradas.</td></tr>
                    : companies.map((company) => <tr key={company.id} className="border-t border-slate-100"><td className="px-5 py-4 font-semibold">{company.name}</td><td className="px-5 py-4">{company.cuit}</td><td className="px-5 py-4">{formatDate(company.dateHigh)}</td><td className="px-5 py-4">{formatAmount(company.parameterSystem)}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => openEdit(company)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Editar</button><button type="button" disabled={busy} onClick={() => removeCompany(company)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Eliminar</button></div></td></tr>)}
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
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <form onSubmit={saveCompany} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Nombre<input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">CUIT<input required inputMode="numeric" pattern="[0-9]{11}" title="Ingresá los 11 dígitos del CUIT, sin guiones" value={form.cuit} onChange={(event) => setForm({ ...form, cuit: event.target.value.replace(/\D/g, '').slice(0, 11) })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Fecha de alta<input required type="date" value={form.dateHigh} onChange={(event) => setForm({ ...form, dateHigh: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium">Valor por hora<input required type="number" min="1" max="999999" step="1" value={form.parameterSystem} onChange={(event) => setForm({ ...form, parameterSystem: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              </div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => { setIsFormOpen(false); setEditingCompany(null); setForm(emptyCompany()); setError('') }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Guardando...' : editingCompany ? 'Guardar cambios' : 'Crear empresa'}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
