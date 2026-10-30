import { AuthLayout } from '../components/layout/AuthLayout'
import { Logo } from '../components/Logo'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../features/auth/authService'
import { useToast } from '../context/ToastContext'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const { toast } = useToast()
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      toast.error('Por favor, ingresá tu correo electrónico.')
      return
    }

    try {
      setIsSubmitting(true)
      await forgotPassword(trimmedEmail)
      setSuccess(true)
    } catch (requestError) {
      toast.error(requestError.message || 'No se pudo procesar la solicitud.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <Logo className="lg:hidden" markHeight={32} />
          <h1 className="mt-6 text-2xl font-bold text-slate-900 lg:mt-0">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ingresá tu correo para recibir las instrucciones de restablecimiento.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="rounded-xl bg-primary-50 p-4 text-sm text-primary-800">
              <p className="font-semibold">¡Correo enviado!</p>
              <p className="mt-1">
                Te enviamos un enlace para restablecer tu contraseña. Revisá también tu carpeta de spam.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full rounded-xl bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-primary-700"
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
                placeholder="ejemplo@empresa.com"
                disabled={isSubmitting}
              />
            </div>


            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-400"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary-700">
                Volver a Iniciar sesión
              </Link>
            </div>
          </form>
        )}
      </section>
    </AuthLayout>
  )
}
