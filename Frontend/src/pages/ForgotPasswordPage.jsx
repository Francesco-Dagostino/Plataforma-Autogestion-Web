import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../features/auth/authService'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Por favor, ingresá tu correo electrónico.')
      return
    }

    try {
      setIsSubmitting(true)
      await forgotPassword(trimmedEmail)
      setSuccess(true)
    } catch (requestError) {
      setError(requestError.message || 'No se pudo procesar la solicitud.')
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
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ingresá tu correo para recibir las instrucciones de restablecimiento.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">¡Correo enviado!</p>
              <p className="mt-1">
                Te enviamos un enlace para restablecer tu contraseña. Revisá también tu carpeta de spam.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full rounded-xl bg-[#102848] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0c1f38]"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="ejemplo@empresa.com"
                disabled={isSubmitting}
              />
            </div>

            {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-700">
                ← Volver a Iniciar sesión
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}
