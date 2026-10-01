import { useMemo, useState } from 'react'

export const PAGE_SIZE = 8

export const filterSelectClass =
  'h-[56px] w-full cursor-pointer appearance-none rounded-2xl border border-sena-line bg-glass-strong bg-[linear-gradient(45deg,transparent_50%,rgba(7,59,42,0.55)_50%),linear-gradient(135deg,rgba(7,59,42,0.55)_50%,transparent_50%)] bg-[length:5px_5px,5px_5px] bg-[position:calc(100%-18px)_calc(50%-2px),calc(100%-13px)_calc(50%-2px)] bg-no-repeat pr-10 pl-5 text-[0.9375rem] text-sena-text shadow-hairline backdrop-blur-glass-sm outline-none transition duration-150 hover:border-sena-line hover:bg-white/90 focus:border-sena focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,166,81,0.12)]'

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
