import { useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { getCurrentUser } from '../features/auth/authService'

export function ProfilePage() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (requestError) {
        setError(requestError.message)
      }
    }

    loadUser()
  }, [])

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '--'

  const creationDate = user?.creationDate
    ? new Date(user.creationDate).toLocaleDateString('es-AR')
    : ''

  return (
    <main className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar />

      <section className="flex-1 p-5 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Cuenta
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Mi perfil
            </h1>
            <p className="mt-1 text-slate-500">
              Consultá los datos de tu cuenta.
            </p>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {!user && !error && (
            <p className="text-slate-500">Cargando datos...</p>
          )}

          {user && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <div className="grid size-16 place-items-center rounded-full bg-[#d8eadf] text-lg font-bold text-emerald-800">
                  {initials}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {user.name}
                  </h2>
                  <p className="text-sm text-slate-500">{user.role}</p>
                </div>
              </div>

              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Nombre completo
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {user.name}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Correo electrónico
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {user.email}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Usuario
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {user.userName}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Fecha de alta
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {creationDate}
                  </dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}