import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../features/auth/authService'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isInvalidLink = !token || !email

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    try {
      setIsSubmitting(true)
      await resetPassword(email, token, newPassword)
      setSuccess(true)
    } catch (requestError) {
      setError(requestError.message || 'El enlace es inválido o ha expirado.')
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
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Restablecer contraseña</h1>
          <p className="mt-2 text-sm text-slate-500">
            {email ? `Para la cuenta: ${email}` : 'Ingresá tu nueva clave para acceder.'}
          </p>
        </div>

        {isInvalidLink ? (
          <div className="space-y-6 text-center">
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Enlace inválido o incompleto</p>
              <p className="mt-1">
                El enlace de recuperación no contiene todos los datos necesarios. Asegurate de abrir el enlace completo que llegó a tu correo.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="inline-block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Solicitar un nuevo enlace
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-6 text-center">
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">¡Contraseña actualizada!</p>
              <p className="mt-1">
                Tu clave fue cambiada con éxito. Ya podés iniciar sesión con tus nuevas credenciales.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="newPassword">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-20 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus:outline-none"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="confirmPassword">
                Confirmar nueva contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="Repetí la nueva contraseña"
                disabled={isSubmitting}
              />
            </div>

            {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
