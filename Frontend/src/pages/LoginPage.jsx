import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../features/auth/authService'
import { getHomePathForRole } from '../features/auth/authStorage'

export function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ userName: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.userName.trim() || !form.password) {
      setError('Ingresá tu usuario y contraseña.')
      return
    }

    try {
      setIsSubmitting(true)
      const role = await login({
        userName: form.userName.trim(),
        password: form.password,
      })

      navigate(getHomePathForRole(role), { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-[#102848] text-xl font-black text-emerald-400">A</div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-emerald-600">Autogestión</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-slate-500">Ingresá con las credenciales de tu empresa.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="userName">Usuario</label>
            <input id="userName" name="userName" value={form.userName} onChange={handleChange} autoComplete="username" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="Ej.: empleado" disabled={isSubmitting} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="password">Contraseña</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} autoComplete="current-password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-20 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="Tu contraseña" disabled={isSubmitting} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} className="absolute inset-y-0 right-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:underline focus-visible:underline-offset-4">
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400">
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}
