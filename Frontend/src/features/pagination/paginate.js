export const HISTORY_PAGE_SIZE = 10

// Recorta una lista a la página pedida. Si la página ya no existe (por ejemplo, porque se achicó la lista), usa la última.
export function paginate(items, page, pageSize = HISTORY_PAGE_SIZE) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  const start = (current - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageSize,
    totalPages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(total, start + pageSize),
  }
}

// Números de página a mostrar: primera, última y las cercanas a la actual, con "…" donde se salta.
export function pageNumbers(current, totalPages) {
  const wanted = new Set([1, totalPages, current - 1, current, current + 1])
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)

  return pages.flatMap((n, index) => (index > 0 && n - pages[index - 1] > 1 ? ['gap', n] : [n]))
}
