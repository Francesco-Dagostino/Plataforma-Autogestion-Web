import { Link, NavLink, useNavigate } from 'react-router-dom'
import { clearSession } from '../../features/auth/authStorage'

const navigation = [
  { label: 'Inicio', icon: 'home', path: '/inicio' },
  { label: 'Mis horas', icon: 'clock', path: '/mis-horas' },
  { label: 'Liquidaciones', icon: 'receipt', path: '/mis-liquidaciones' },
  { label: 'Reportes', icon: 'chart', path: '/reportes' },
]

function Icon({ name }) {
  const paths = {
    home: (
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export function Sidebar() {
  const navigate = useNavigate()

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex w-full shrink-0 flex-row bg-[#102848] px-4 py-3 text-slate-300 lg:min-h-screen lg:w-60 lg:flex-col lg:px-5 lg:py-7">
      <Link to="/inicio" className="mr-auto flex items-center gap-3 lg:mb-12">
        <div className="grid size-10 place-items-center rounded-xl bg-emerald-400 text-xl font-black text-[#102848]">
          A
        </div>

        <div>
          <p className="font-bold tracking-wide text-white">AUTOGESTIÓN</p>
          <p className="text-xs text-slate-400">Portal de empleados</p>
        </div>
      </Link>

      <nav className="flex gap-2 lg:flex-col">
        {navigation.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/20'
                  : 'hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="size-5">
              <Icon name={item.icon} />
            </span>

            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 lg:mt-auto lg:ml-0 lg:flex-col lg:items-stretch">
        <Link
          to="/perfil"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/10 hover:text-white"
        >
          <span className="grid size-7 place-items-center rounded-full bg-slate-500 text-xs font-bold text-white">
            FD
          </span>
          <span className="hidden sm:inline">Mi perfil</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-white/10 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}