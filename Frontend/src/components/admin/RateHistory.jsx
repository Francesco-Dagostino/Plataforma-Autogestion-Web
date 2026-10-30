const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const dateTime = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const typeLabels = { Normal: 'Valor hora', Feriado: 'Feriados y fines de semana' }

// Siempre se muestra el monto que se pagaba por hora; sin valor anterior (primer registro) se muestra un guion.
function formatValue(value) {
  return value === null || value === undefined ? '—' : money.format(value)
}

// Historial de los valores hora que tuvo la empresa, del más nuevo al más viejo.
export function RateHistory({ items }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-4">
      <h3 className="text-lg font-bold">Historial de valores</h3>
      <p className="text-sm text-slate-500">Cada cambio del valor hora queda registrado con su fecha y quién lo hizo.</p>

      <div className="mt-3 max-h-72 overflow-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-white text-xs text-slate-500">
            <tr><th className="pb-2 font-medium">Fecha</th><th className="pb-2 font-medium">Concepto</th><th className="pb-2 font-medium">Valor</th><th className="pb-2 font-medium">Antes</th><th className="pb-2 font-medium">Lo cambió</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-400">Todavía no hay cambios registrados.</td></tr>}
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 text-slate-600">{dateTime.format(new Date(item.changedAt))}</td>
                <td className="py-2.5">{typeLabels[item.rateType] ?? item.rateType}</td>
                <td className="py-2.5 font-semibold">{formatValue(item.value)}</td>
                <td className="py-2.5 text-slate-500">{formatValue(item.previousValue)}</td>
                <td className="py-2.5 text-slate-500">{item.userName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
