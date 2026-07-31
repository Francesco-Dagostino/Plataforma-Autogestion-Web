import { Sidebar } from '../components/layout/Sidebar'
import { Card } from '../components/ui/Card'

const hours = [6, 8, 7, 8.5, 6.5, 0, 0]
const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const recentHours = [
  { date: 'Hoy, 30 jul.', description: 'Desarrollo frontend', hours: '8 h', state: 'Pendiente' },
  { date: 'Mar., 29 jul.', description: 'Desarrollo frontend', hours: '8 h', state: 'Aprobado' },
  { date: 'Lun., 28 jul.', description: 'Reunión y planificación', hours: '7 h', state: 'Aprobado' },
]

function Status({ children }) {
  const pending = children === 'Pendiente'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{children}</span>
}

export function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Mi panel</p><h1 className="text-xl font-bold">¡Buen día, Francisco!</h1></div>
          <div className="flex items-center gap-3"><button className="relative grid size-10 place-items-center rounded-full bg-slate-100 text-lg" aria-label="Notificaciones">♢<span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" /></button><div className="hidden text-right sm:block"><p className="text-sm font-semibold">Francisco Díaz</p><p className="text-xs text-slate-500">Empleado</p></div><span className="grid size-10 place-items-center rounded-full bg-[#d8eadf] font-bold text-emerald-800">FD</span></div>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">Resumen de jornada</h2><p className="mt-1 text-slate-500">Miércoles, 30 de julio de 2026</p></div><button className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">+ Registrar horas</button></div>

          <div className="grid gap-5 md:grid-cols-3">
            <Card><p className="text-sm font-medium text-slate-500">Horas de hoy</p><div className="mt-3 flex items-end justify-between"><p className="text-4xl font-bold">0<span className="ml-1 text-lg text-slate-400">/ 8 h</span></p><span className="rounded-lg bg-sky-50 px-2 py-1 text-sm font-semibold text-sky-700">Por cargar</span></div></Card>
            <Card><p className="text-sm font-medium text-slate-500">Horas esta semana</p><p className="mt-3 text-4xl font-bold">29.5<span className="ml-1 text-lg text-slate-400">h</span></p><p className="mt-2 text-sm text-emerald-600">▲ 5.5 h para completar</p></Card>
            <Card><p className="text-sm font-medium text-slate-500">Próxima liquidación</p><p className="mt-3 text-2xl font-bold">Agosto 2026</p><p className="mt-2 text-sm text-slate-500">Cierre estimado: 31 de agosto</p></Card>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-5">
            <Card className="xl:col-span-3"><div className="flex items-center justify-between"><div><h3 className="font-bold">Actividad semanal</h3><p className="text-sm text-slate-500">Horas registradas por día</p></div><span className="text-lg font-bold text-emerald-600">29.5 h</span></div><div className="mt-7 flex h-44 items-end justify-between gap-3 border-b border-slate-200 px-1">{hours.map((hour, index) => <div key={weekDays[index]} className="flex h-full flex-1 flex-col justify-end gap-2 text-center"><div className="rounded-t-md bg-[#1e8567]" style={{ height: `${(hour / 9) * 100}%`, minHeight: hour ? '12px' : '2px' }} title={`${hour} horas`} /><span className="text-xs font-medium text-slate-500">{weekDays[index]}</span></div>)}</div></Card>
            <Card className="xl:col-span-2"><h3 className="font-bold">Recordatorios</h3><div className="mt-4 space-y-4"><div className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-amber-400" /><div><p className="text-sm font-semibold">Horas pendientes</p><p className="text-sm text-slate-500">Aún no registraste tu jornada de hoy.</p></div></div><div className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" /><div><p className="text-sm font-semibold">Período actual</p><p className="text-sm text-slate-500">La liquidación de julio cierra mañana.</p></div></div></div></Card>
          </div>

          <Card className="mt-5"><div className="flex items-center justify-between"><div><h3 className="font-bold">Mis últimas horas registradas</h3><p className="text-sm text-slate-500">Seguimiento de tus jornadas recientes</p></div><button className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Ver todas</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-3 font-medium">Fecha</th><th className="pb-3 font-medium">Descripción</th><th className="pb-3 font-medium">Horas</th><th className="pb-3 font-medium">Estado</th></tr></thead><tbody>{recentHours.map((item) => <tr key={item.date} className="border-b border-slate-100 last:border-0"><td className="py-4 font-medium">{item.date}</td><td className="py-4 text-slate-600">{item.description}</td><td className="py-4 font-semibold">{item.hours}</td><td className="py-4"><Status>{item.state}</Status></td></tr>)}</tbody></table></div></Card>
        </div>
      </div>
    </main>
  )
}
