import { pageNumbers } from '../../features/pagination/paginate'

const baseButton =
  'grid h-9 min-w-9 place-items-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

// Paginación para tablas. Recibe lo que devuelve paginate() y avisa con onChange(página).
export function Pagination({ paged, onChange, label = 'Paginación' }) {
  if (paged.total <= paged.pageSize) return null

  return (
    <nav aria-label={label} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <p className="text-sm text-slate-500" aria-live="polite">
        Mostrando {paged.from}–{paged.to} de {paged.total}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(paged.page - 1)}
          disabled={paged.page === 1}
          className={`${baseButton} border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900`}
        >
          Anterior
        </button>

        {pageNumbers(paged.page, paged.totalPages).map((entry, index) =>
          entry === 'gap' ? (
            <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-slate-400">…</span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onChange(entry)}
              aria-label={`Página ${entry}`}
              aria-current={entry === paged.page ? 'page' : undefined}
              className={`${baseButton} ${
                entry === paged.page
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onChange(paged.page + 1)}
          disabled={paged.page === paged.totalPages}
          className={`${baseButton} border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900`}
        >
          Siguiente
        </button>
      </div>
    </nav>
  )
}
