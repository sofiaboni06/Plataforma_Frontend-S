// src/modules/vigencias/pages/VigenciasPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@/shared/components/icons/AppIcons'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog'
import {
  ActionButton,
  ClearFiltersButton,
  ErrorBanner,
  FilterCard,
  FilterGroup,
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
import { filterSelectClass, usePagination, useTableState } from '@/shared/lib/table'
import { deleteVigencia, getVigencias } from '@/modules/vigencias/data/vigencia'
import type { VigenciaApi } from '@/modules/vigencias/types/vigencia'

type StatusFilter = 'Todos' | 'Activa' | 'Inactiva'

// Un icono rápido para vigencias (puedes cambiarlo por uno de AppIcons si existe)
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
      <path d="M4 7h16M4 7v13h16V7M4 7l2-3h12l2 3M9 3v4M15 3v4" />
    </svg>
  )
}

export default function VigenciasPage() {
  const navigate = useNavigate()
  const { search, setSearch, page, setPage, resetPage } = useTableState()

  const [vigencias, setVigencias] = useState<VigenciaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [vigenciaToDelete, setVigenciaToDelete] = useState<VigenciaApi | null>(null)

  useEffect(() => {
    document.title = 'Gestionar vigencias | SENA'
  }, [])

  async function loadVigencias() {
    try {
      setLoading(true)
      setError('')
      const result = await getVigencias()
      // Ordenamos por año descendente
      setVigencias([...result].sort((a, b) => b.anio - a.anio))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las vigencias.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadVigencias()
  }, [])

  const filteredVigencias = useMemo(() => {
    const query = search.trim().toLowerCase()

    return vigencias.filter((vigencia) => {
      const matchesSearch = !query || `${vigencia.anio}`.includes(query)
      
      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activa' && vigencia.activa) ||
        (statusFilter === 'Inactiva' && !vigencia.activa)

      return matchesSearch && matchesStatus
    })
  }, [vigencias, search, statusFilter])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(filteredVigencias, page)

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'Todos'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('Todos')
  }

  async function handleDelete(vigencia: VigenciaApi) {
    try {
      setDeletingId(vigencia.anio)
      await deleteVigencia(vigencia.anio)
      setVigencias((current) => current.filter((item) => item.anio !== vigencia.anio))
      setVigenciaToDelete(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la vigencia.')
      setVigenciaToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AppLayout title="Gestionar vigencias" showCenterBanner={false}>
      <PageHeader
        icon={<CalendarIcon />}
        title="Gestionar vigencias"
        description="Administra los años fiscales y sus fechas de apertura y cierre."
        action={
          <Button
            type="button"
            icon={<PlusIcon className="size-4" />}
            onClick={() => navigate('/vigencias/crear')}
          >
            Nueva vigencia
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}

      <FilterCard>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por año..." />

        <FilterGroup label="Estado">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter)
              resetPage()
            }}
            className={`${filterSelectClass} lg:w-40`}
          >
            <option value="Todos">Todos</option>
            <option value="Activa">Activa</option>
            <option value="Inactiva">Inactiva</option>
          </select>
        </FilterGroup>

        <ClearFiltersButton onClick={clearFilters} disabled={!hasActiveFilters} />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando vigencias…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width={tableColumns.name}>Año</TableHeader>
                    <TableHeader width={tableColumns.relation}>Fecha Apertura</TableHeader>
                    <TableHeader width={tableColumns.relation}>Fecha Cierre</TableHeader>
                    <TableHeader align="center" width={tableColumns.status}>Estado</TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>Acciones</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={5}>No se encontraron vigencias.</TableEmpty>
                  ) : (
                    pageRows.map((vigencia) => (
                      <TableRow key={vigencia.anio}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sena-dark">
                              <CalendarIcon />
                            </span>
                            <p className="truncate font-semibold text-sena-text">
                              {vigencia.anio}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-sena-dark">
                          {vigencia.fechaApertura || '—'}
                        </td>
                        <td className="px-5 py-4 font-medium text-sena-dark">
                          {vigencia.fechaCierre || '—'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={vigencia.activa ? 'ok' : 'danger'}>
                            {vigencia.activa ? 'Activa' : 'Inactiva'}
                          </StatusPill>
                        </td>
                        <td className="px-5 py-4">
                          <RowActions>
                            <ActionButton title="Editar vigencia" onClick={() => navigate(`/vigencias/${vigencia.anio}/editar`)}>
                              <PencilIcon className="size-[18px]" />
                            </ActionButton>
                            <ActionButton
                              title="Eliminar vigencia"
                              danger
                              disabled={deletingId === vigencia.anio}
                              onClick={() => setVigenciaToDelete(vigencia)}
                            >
                              <TrashIcon className="size-[18px]" />
                            </ActionButton>
                          </RowActions>
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
              total={total}
              noun="vigencias"
            />
          </>
        )}
      </TableCard>

      {vigenciaToDelete ? (
        <ConfirmDialog
          title="Eliminar vigencia"
          subtitle="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          pendingLabel="Eliminando…"
          pending={deletingId === vigenciaToDelete.anio}
          onConfirm={() => void handleDelete(vigenciaToDelete)}
          onCancel={() => setVigenciaToDelete(null)}
        >
          ¿Deseas eliminar la vigencia del año <strong>{vigenciaToDelete.anio}</strong>?
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}