import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { login, mfaSetup, mfaVerify } from '../features/auth/authService'
import { getHomePathForRole } from '../features/auth/authStorage'
import { useToast } from '../context/ToastContext'

export function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ userName: '', password: '' })
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // Segundo paso del SuperAdmin; el token temporal vive solo en memoria.
  const [mfa, setMfa] = useState(null)
  const [mfaCode, setMfaCode] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem('autogestion_session_expired')) {
      sessionStorage.removeItem('autogestion_session_expired')
      toast.info('Tu sesión expiró. Ingresá de nuevo.')
    }
  }, [toast])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.userName.trim() || !form.password) {
      toast.error('Ingresá tu usuario y contraseña.')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await login({
        userName: form.userName.trim(),
        password: form.password,
      })

      if (result.mfa) {
        await startMfaStep(result)
        return
      }

      navigate(getHomePathForRole(result.role), { replace: true })
    } catch (requestError) {
      toast.error(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // El SuperAdmin necesita un segundo paso: configurar el QR (primer ingreso) o ingresar el código.
  async function startMfaStep({ mfa, tempToken }) {
    if (mfa === 'setup') {
      const setup = await mfaSetup(tempToken)
      setMfa({ mode: 'setup', tempToken, otpAuthUri: setup.otpAuthUri, secret: setup.secret })
    } else {
      setMfa({ mode: 'verify', tempToken })
    }
    setForm((currentForm) => ({ ...currentForm, password: '' }))
  }

  async function handleMfaSubmit(event) {
    event.preventDefault()

    if (!/^\d{6}$/.test(mfaCode)) {
      toast.error('Ingresá el código de 6 dígitos.')
      return
    }

    try {
      setIsSubmitting(true)
      const role = await mfaVerify(mfa.tempToken, mfaCode)
      navigate(getHomePathForRole(role), { replace: true })
    } catch (requestError) {
      toast.error(requestError.message)
      setMfaCode('')
    } finally {
      setIsSubmitting(false)
    }
  }

  function cancelMfa() {
    setMfa(null)
    setMfaCode('')
  }

  if (mfa) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-[#102848] text-xl font-black text-emerald-400">A</div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-emerald-600">Verificación en dos pasos</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {mfa.mode === 'setup' ? 'Configurá tu autenticador' : 'Ingresá tu código'}
            </h1>
          </div>

          {mfa.mode === 'setup' ? (
            <div className="mb-6 space-y-4 text-center">
              <p className="text-sm text-slate-500">
                Escaneá este código con Google Authenticator, Microsoft Authenticator o similar y luego ingresá el código de 6 dígitos que muestra la app.
              </p>
              <div className="mx-auto w-fit rounded-xl border border-slate-200 bg-white p-3">
                <QRCodeSVG value={mfa.otpAuthUri} size={176} />
              </div>
              <p className="break-all text-xs text-slate-500">
                ¿No podés escanear? Ingresá esta clave a mano: <span className="font-mono font-semibold text-slate-700">{mfa.secret}</span>
              </p>
            </div>
          ) : (
            <p className="mb-6 text-center text-sm text-slate-500">Abrí tu app de autenticación e ingresá el código de 6 dígitos.</p>
          )}

          <form className="space-y-5" onSubmit={handleMfaSubmit} noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="mfaCode">Código de 6 dígitos</label>
              <input id="mfaCode" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-center text-lg tracking-[0.4em] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="000000" disabled={isSubmitting} />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400">
              {isSubmitting ? 'Verificando...' : mfa.mode === 'setup' ? 'Activar e ingresar' : 'Verificar'}
            </button>
            <button type="button" onClick={cancelMfa} disabled={isSubmitting} className="w-full text-sm font-semibold text-slate-500 hover:text-slate-700">
              Volver al inicio de sesión
            </button>
          </form>
        </section>
      </main>
    )
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


          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400">
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}
