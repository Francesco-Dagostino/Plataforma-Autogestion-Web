import { SORT_LABELS } from '../../features/pagination/sortByStatus'

// Selector para ordenar un historial por estado. `options` son las claves de SORT_LABELS que aplican a esa lista.
export function StatusSortSelect({ value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-500">
      <span>Ordenar</span>
      <select
        aria-label="Ordenar el historial"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        {options.map((key) => (
          <option key={key} value={key}>{SORT_LABELS[key]}</option>
        ))}
      </select>
    </label>
  )
}
