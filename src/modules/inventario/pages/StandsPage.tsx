import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  CloseIcon,
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
  deleteStand,
  getBodegas,
} from '@/modules/inventario/data/bodega'
import { getElementos } from '@/modules/inventario/data/elemento'
import type { BodegaApi, StandApi } from '@/modules/inventario/types/bodega'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'

type StandRow = StandApi & {
  bodegaId: number
  bodegaNombre: string
  totalElementos: number
}

function LayersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
      aria-hidden="true"
    >
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  )
}

export default function StandsPage() {
  const navigate = useNavigate()
  const { can } = useInventoryAccess()
  const canCreate = can('stands', 'create')
  const canEdit = can('stands', 'edit')
  const canView = can('stands', 'view')

  const { search, setSearch, page, setPage, resetPage } = useTableState()

  const [stands, setStands] = useState<StandRow[]>([])
  const [bodegas, setBodegas] = useState<BodegaApi[]>([])
  const [bodegaFilter, setBodegaFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newStandBodegaId, setNewStandBodegaId] = useState('')
  const [standToDelete, setStandToDelete] = useState<StandRow | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    document.title = 'Gestionar stands | SENA'
  }, [])

  async function loadStands() {
    try {
      setLoading(true)
      setError('')

      // El conteo de elementos es informativo: si el perfil no alcanza a
      // leerlos, la pantalla de stands igual tiene que cargar.
      const [bodegaList, elementoList] = await Promise.all([
        getBodegas(),
        getElementos().catch(() => []),
      ])

      setBodegas(bodegaList)

      const elementosPorStand = new Map<number, number>()

      for (const elemento of elementoList) {
        elementosPorStand.set(
          elemento.idStand,
          (elementosPorStand.get(elemento.idStand) ?? 0) + 1,
        )
      }

      setStands(
        bodegaList.flatMap((bodega) =>
          (bodega.stands ?? []).map((stand) => ({
            ...stand,
            bodegaId: bodega.id,
            bodegaNombre: bodega.nombre,
            totalElementos:
              elementosPorStand.get(stand.id) ??
              elementosPorStand.get(stand.idStand) ??
              0,
          })),
        ),
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los stands.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStands()
  }, [])

  const filteredStands = useMemo(() => {
    const query = search.trim().toLowerCase()

    return stands.filter((stand) => {
      const matchesSearch =
        !query ||
        `${stand.nombre} ${stand.bodegaNombre} ${stand.id} ${stand.idStand}`
          .toLowerCase()
          .includes(query)

      const matchesBodega = !bodegaFilter || String(stand.bodegaId) === bodegaFilter

      return matchesSearch && matchesBodega
    })
  }, [stands, search, bodegaFilter])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(
    filteredStands,
    page,
  )

  const hasActiveFilters = search.trim() !== '' || bodegaFilter !== ''

  const clearFilters = () => {
    setSearch('')
    setBodegaFilter('')
  }

  function handleCreateStand() {
    if (bodegas.length === 0) {
      setError('No hay bodegas disponibles. Primero debes crear una bodega.')
      return
    }

    if (bodegas.length === 1) {
      navigate(`/inventario/bodegas/${bodegas[0].id}/stands/crear`)
      return
    }

    setNewStandBodegaId('')
    setCreateModalOpen(true)
  }

  function closeCreateModal() {
    setCreateModalOpen(false)
    setNewStandBodegaId('')
  }

  function continueCreateStand() {
    if (!newStandBodegaId) return

    const bodega = bodegas.find((item) => String(item.id) === newStandBodegaId)

    if (!bodega) {
      setError('La bodega seleccionada no existe.')
      return
    }

    closeCreateModal()
    navigate(`/inventario/bodegas/${bodega.id}/stands/crear`)
  }

  async function handleDeleteStand(stand: StandRow) {
    try {
      setDeletingId(stand.id)
      setError('')

      await deleteStand(stand.id)

      setStands((current) =>
        current.filter(
          (item) => !(item.id === stand.id && item.bodegaId === stand.bodegaId),
        ),
      )
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se pudo eliminar el stand.',
      )
    } finally {
      setDeletingId(null)
      setStandToDelete(null)
    }
  }

  return (
    <AppLayout title="Gestionar stands">
      <PageHeader
        title="Gestionar stands"
        description="Consulta y administra los stands registrados en las bodegas."
        action={
          canCreate ? (
            <Button
              type="button"
              icon={<PlusIcon className="size-4" />}
              onClick={handleCreateStand}
            >
              Nuevo stand
            </Button>
          ) : null
        }
      />

      {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}

      <FilterCard>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por stand, bodega o código..."
        />

        <FilterGroup label="Bodega">
          <select
            value={bodegaFilter}
            onChange={(event) => {
              setBodegaFilter(event.target.value)
              resetPage()
            }}
            className={`${filterSelectClass} lg:w-64`}
          >
            <option value="">Todas las bodegas</option>

            {bodegas.map((bodega) => (
              <option key={bodega.id} value={String(bodega.id)}>
                {bodega.nombre}
              </option>
            ))}
          </select>
        </FilterGroup>

        <ClearFiltersButton onClick={clearFilters} disabled={!hasActiveFilters} />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando stands…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width={tableColumns.name}>Stand</TableHeader>
                    <TableHeader width={tableColumns.relation}>Bodega</TableHeader>
                    <TableHeader align="center" width={tableColumns.count}>
                      Elementos
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
                    <TableEmpty colSpan={5}>No se encontraron stands.</TableEmpty>
                  ) : (
                    pageRows.map((stand) => (
                      <TableRow key={`${stand.bodegaId}-${stand.id}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sena-dark">
                              <LayersIcon />
                            </span>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-sena-text">
                                {stand.nombre}
                              </p>
                              <p className="mt-0.5 text-xs text-sena-text/45">
                                ID: {stand.idStand || stand.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="truncate px-5 py-4 font-medium text-sena-dark">
                          {stand.bodegaNombre}
                        </td>

                        <td className="px-5 py-4 text-center text-sena-text/70">
                          {stand.totalElementos}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={stand.estado ? 'ok' : 'danger'}>
                            {stand.estado ? 'Activo' : 'Inactivo'}
                          </StatusPill>
                        </td>

                        <td className="px-5 py-4">
                          <RowActions>
                            {canView ? (
                              <ActionButton
                                title="Ver stand"
                                onClick={() =>
                                  navigate(
                                    `/inventario/bodegas/${stand.bodegaId}/stands/${stand.id}`,
                                  )
                                }
                              >
                                <EyeIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {canEdit ? (
                              <ActionButton
                                title="Editar stand"
                                onClick={() =>
                                  navigate(
                                    `/inventario/bodegas/${stand.bodegaId}/stands/${stand.id}/editar`,
                                  )
                                }
                              >
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {canEdit ? (
                              <ActionButton
                                title="Eliminar stand"
                                danger
                                disabled={deletingId === stand.id}
                                onClick={() => setStandToDelete(stand)}
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
              noun="stands"
            />
          </>
        )}
      </TableCard>

      {createModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeCreateModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-stand-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-sena-dark">
                  <LayersIcon />
                </div>

                <div>
                  <h2 id="create-stand-title" className="text-lg font-bold text-sena-dark">
                    Agregar nuevo stand
                  </h2>

                  <p className="mt-1 text-sm text-sena-text/55">
                    Selecciona la bodega donde deseas crear el stand.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Cerrar"
                onClick={closeCreateModal}
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-sena-dark/8 text-sena-text/60 transition hover:bg-sena-muted hover:text-sena-dark"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>

            <label
              htmlFor="newStandBodega"
              className="mt-5 flex flex-col gap-1.5 text-sm font-medium text-sena-text/75"
            >
              Bodega *
              <select
                id="newStandBodega"
                value={newStandBodegaId}
                onChange={(event) => setNewStandBodegaId(event.target.value)}
                className={filterSelectClass}
              >
                <option value="">Selecciona una bodega</option>

                {bodegas.map((bodega) => (
                  <option key={bodega.id} value={bodega.id}>
                    {bodega.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={closeCreateModal}>
                Cancelar
              </Button>

              <Button
                type="button"
                disabled={!newStandBodegaId}
                onClick={continueCreateStand}
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {standToDelete ? (
        <ConfirmDialog
          title="Eliminar stand"
          subtitle="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          pendingLabel="Eliminando…"
          pending={deletingId === standToDelete.id}
          onConfirm={() => void handleDeleteStand(standToDelete)}
          onCancel={() => setStandToDelete(null)}
        >
          ¿Deseas eliminar el stand <strong>{standToDelete.nombre}</strong> de la bodega{' '}
          <strong>{standToDelete.bodegaNombre}</strong>?
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}
