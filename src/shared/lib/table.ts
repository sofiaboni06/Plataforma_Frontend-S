import { useMemo, useState } from 'react'

export const PAGE_SIZE = 8

export const filterSelectClass =
  'h-11 w-full rounded-xl border border-sena-dark/10 bg-white px-3 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20'

/**
 * Recorta la lista a la página visible. `page` se corrige solo cuando los
 * filtros dejan menos páginas de las que había.
 */
export function usePagination<T>(rows: T[], page: number, pageSize = PAGE_SIZE) {
  return useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
    const currentPage = Math.min(page, totalPages)
    const start = (currentPage - 1) * pageSize
    const pageRows = rows.slice(start, start + pageSize)

    return {
      pageRows,
      totalPages,
      currentPage,
      from: rows.length === 0 ? 0 : start + 1,
      to: start + pageRows.length,
      total: rows.length,
    }
  }, [rows, page, pageSize])
}

/** Búsqueda y página. Escribir en el buscador siempre vuelve a la página 1. */
export function useTableState() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  return {
    search,
    setSearch: (value: string) => {
      setSearch(value)
      setPage(1)
    },
    page,
    setPage,
    resetPage: () => setPage(1),
  }
}
