import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  ClearFiltersButton,
  FilterCard,
  PageHeader,
  RowActions,
  SearchInput,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TablePagination,
  TableRow,
  tableClass,
  tableColumns,
} from '@/shared/components/DataTable'
import { ExcelIcon, ProgramIcon } from '@/shared/components/icons/AppIcons'
import { useAssignedPrograms } from '@/modules/materiales-formacion/lib/useAssignedPrograms'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import { usePagination } from '@/shared/lib/table'

export default function MaterialesFormacionPage() {
  const { can } = useFormacionAccess()
  const { canSeePrograms, programs, loading, error, retry } = useAssignedPrograms()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const puedeLista = can('listas', 'view')

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Mis programas | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return programs
    return programs.filter((programa) =>
      `${programa.codigo} ${programa.nombre} ${programa.nivel?.nombre ?? ''} ${
        programa.redConocimiento?.nombre ?? ''
      } ${programa.lineaTematica?.nombre ?? ''}`
        .toLowerCase()
        .includes(query),
    )
  }, [programs, search])

  const { pageRows, from, to, totalPages, currentPage } = usePagination(filtered, page)

  if (!canSeePrograms) return null

  return (
    <AppLayout title="Mis programas">
      <PageHeader
        icon={<ProgramIcon />}
        title="Mis programas"
        description="Estos son los programas que te asignaron. Desde Acciones cargas o editas la lista de materiales: por Excel o uno a uno."
      />

      {error ? (
        <div className="mb-4 flex flex-col gap-3 rounded-[18px] bg-sena-danger-soft px-5 py-3.5 text-sm text-sena-danger-text ring-1 ring-sena-danger-line sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={retry}
            className="w-fit shrink-0 rounded-full bg-white/70 px-4 py-1.5 font-semibold transition hover:bg-white"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <FilterCard>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Buscar por código, programa, red o línea..."
        />
        <ClearFiltersButton
          onClick={() => {
            setSearch('')
            setPage(1)
          }}
          disabled={!search}
        />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando tus programas…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader>Programa</TableHeader>
                    <TableHeader>Red / Línea</TableHeader>
                    <TableHeader>Nivel</TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={4}>
                      {programs.length === 0
                        ? 'Aún no tienes programas asignados. Un administrador debe asignártelos en Formación → Asignar programas.'
                        : 'No hay programas que coincidan con la búsqueda.'}
                    </TableEmpty>
                  ) : (
                    pageRows.map((programa) => (
                      <TableRow key={programa.id}>
                        <td>
                          <p className="font-semibold text-sena-text">{programa.nombre}</p>
                          <p className="text-xs text-sena-strong">{programa.codigo}</p>
                        </td>
                        <td>
                          <p className="text-sena-text">{programa.redConocimiento?.nombre ?? '—'}</p>
                          <p className="text-xs text-sena-strong">{programa.lineaTematica?.nombre ?? '—'}</p>
                        </td>
                        <td>{programa.nivel?.nombre ?? '—'}</td>
                        <td>
                          {puedeLista ? (
                            <RowActions>
                              <Link
                                to={`/formacion/listas-maestras-material?programaId=${programa.id}`}
                                title="Lista de materiales"
                                aria-label="Lista de materiales"
                                className="grid size-10 place-items-center rounded-lg text-sena-dark transition duration-150 hover:text-sena focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena"
                              >
                                <ExcelIcon className="size-[18px]" />
                              </Link>
                            </RowActions>
                          ) : null}
                        </td>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              from={from}
              to={to}
              total={filtered.length}
              noun="programas"
            />
          </>
        )}
      </TableCard>
    </AppLayout>
  )
}
