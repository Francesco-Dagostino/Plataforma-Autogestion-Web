import { Link, NavLink, useNavigate } from 'react-router-dom'
import { clearSession } from '../../features/auth/authStorage'
import { Logo } from '../Logo'
import { ThemeToggle } from '../ThemeToggle'

const employeeNavigation = [
  { label: 'Inicio', icon: 'home', path: '/inicio' },
  { label: 'Mis horas', icon: 'clock', path: '/mis-horas' },
  { label: 'Liquidaciones', icon: 'receipt', path: '/mis-liquidaciones' },
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
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
        <path d="M14 10h5a1 1 0 0 1 1 1v10" />
        <path d="M3 21h18M8 8h2M8 12h2M8 16h2" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20h16" />
        <path d="M7 20v-7M12 20V6M17 20v-10" />
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

export function Sidebar({
  navigation = employeeNavigation,
  homePath = '/inicio',
  subtitle = 'Portal de empleados',
}) {
  const navigate = useNavigate()

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex w-full shrink-0 flex-row flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:min-h-screen lg:w-64 lg:flex-col lg:items-stretch lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
      <Link to={homePath} className="mr-auto flex flex-col gap-1.5 lg:mb-10">
        <Logo markHeight={30} />
        <span className="hidden text-xs text-slate-500 sm:block">{subtitle}</span>
      </Link>

      <nav className="flex gap-1 lg:flex-col">
        {navigation.map((item) => (
          <NavLink
            key={item.label}
            end={item.path === homePath}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-slate-200 dark:text-slate-900!'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="size-5">
                  <Icon name={item.icon} />
                </span>

                <span className="hidden sm:inline">{item.label}</span>

                {isActive && <span aria-hidden="true" className="ml-auto hidden size-2 rounded-full bg-brand-amber lg:block" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 lg:mt-auto lg:ml-0 lg:flex-col lg:items-stretch">
        <ThemeToggle showLabel />

        <Link
          to="/perfil"
          className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <span className="size-5">
            <Icon name="user" />
          </span>
          <span className="hidden sm:inline">Mi perfil</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
