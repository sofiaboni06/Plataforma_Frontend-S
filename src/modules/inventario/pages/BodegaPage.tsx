import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  EyeIcon,
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
import {
  deleteBodega,
  getBodegas,
} from '@/modules/inventario/data/bodega'
import type { BodegaApi } from '@/modules/inventario/types/bodega'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'

type StatusFilter = 'Todos' | 'Activa' | 'Inactiva'

function WarehouseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M4 20V7l8-4 8 4v13H4Z" />
      <path d="M8 20v-5h8v5M8 9h.01M12 9h.01M16 9h.01" />
    </svg>
  )
}

export default function BodegasPage() {
  const navigate = useNavigate()
  const { can } = useInventoryAccess()
  const canCreate = can('bodegas', 'create')
  const canEdit = can('bodegas', 'edit')
  const canView = can('bodegas', 'view')

  const { search, setSearch, page, setPage, resetPage } = useTableState()

  const [bodegas, setBodegas] = useState<BodegaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [bodegaToDelete, setBodegaToDelete] = useState<BodegaApi | null>(null)

  useEffect(() => {
    document.title = 'Gestionar bodegas | SENA'
  }, [])

  async function loadBodegas() {
    try {
      setLoading(true)
      setError('')

      const result = await getBodegas()
      setBodegas([...result].sort((a, b) => b.id_bodega - a.id_bodega))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar las bodegas.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBodegas()
  }, [])

  const filteredBodegas = useMemo(() => {
    const query = search.trim().toLowerCase()

    return bodegas.filter((bodega) => {
      const matchesSearch =
        !query ||
        `${bodega.nombre} ${bodega.ubicacion ?? ''} ${bodega.centroFormacion?.nombre ?? ''}`
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activa' && bodega.estado) ||
        (statusFilter === 'Inactiva' && !bodega.estado)

      return matchesSearch && matchesStatus
    })
  }, [bodegas, search, statusFilter])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(
    filteredBodegas,
    page,
  )

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'Todos'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('Todos')
  }

  async function handleDelete(bodega: BodegaApi) {
    try {
      setDeletingId(bodega.id)

      await deleteBodega(bodega.id)

      setBodegas((current) => current.filter((item) => item.id !== bodega.id))
      setBodegaToDelete(null)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se pudo eliminar la bodega.',
      )
      setBodegaToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AppLayout title="Gestionar bodegas">
      <PageHeader
        title="Gestionar bodegas"
        description="Administra las bodegas y sus stands para organizar el inventario."
        action={
          canCreate ? (
            <Button
              type="button"
              icon={<PlusIcon className="size-4" />}
              onClick={() => navigate('/inventario/bodegas/crear')}
            >
              Nueva bodega
            </Button>
          ) : null
        }
      />

      {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}

      <FilterCard>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar bodega..." />

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
          <TableLoading label="Cargando bodegas…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width={tableColumns.name}>Bodega</TableHeader>
                    <TableHeader width={tableColumns.relation}>Ubicación</TableHeader>
                    <TableHeader align="center" width={tableColumns.count}>
                      Stands
                    </TableHeader>
                    <TableHeader align="center" width={tableColumns.status}>
                      Estado
                    </TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={5}>No se encontraron bodegas.</TableEmpty>
                  ) : (
                    pageRows.map((bodega) => (
                      <TableRow key={bodega.id}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sena-dark">
                              <WarehouseIcon />
                            </span>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-sena-text">
                                {bodega.nombre}
                              </p>
                              <p className="mt-0.5 text-xs text-sena-text/45">
                                B{String(bodega.id_bodega).padStart(3, '0')}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="truncate px-5 py-4 font-medium text-sena-dark">
                          {bodega.centroFormacion?.nombre ?? bodega.ubicacion ?? '—'}
                        </td>

                        <td className="px-5 py-4 text-center text-sena-text/70">
                          {bodega.totalStands}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={bodega.estado ? 'ok' : 'danger'}>
                            {bodega.estado ? 'Activa' : 'Inactiva'}
                          </StatusPill>
                        </td>

                        <td className="px-5 py-4">
                          <RowActions>
                            {canView ? (
                              <ActionButton
                                title="Ver bodega"
                                onClick={() => navigate(`/inventario/bodegas/${bodega.id}`)}
                              >
                                <EyeIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {canEdit ? (
                              <ActionButton
                                title="Editar bodega"
                                onClick={() =>
                                  navigate(`/inventario/bodegas/${bodega.id}/editar`)
                                }
                              >
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {canEdit ? (
                              <ActionButton
                                title="Eliminar bodega"
                                danger
                                disabled={deletingId === bodega.id}
                                onClick={() => setBodegaToDelete(bodega)}
                              >
                                <TrashIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
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
              noun="bodegas"
            />
          </>
        )}
      </TableCard>

      {bodegaToDelete ? (
        <ConfirmDialog
          title="Eliminar bodega"
          subtitle="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          pendingLabel="Eliminando…"
          pending={deletingId === bodegaToDelete.id}
          onConfirm={() => void handleDelete(bodegaToDelete)}
          onCancel={() => setBodegaToDelete(null)}
        >
          ¿Deseas eliminar la bodega <strong>{bodegaToDelete.nombre}</strong>?
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}
