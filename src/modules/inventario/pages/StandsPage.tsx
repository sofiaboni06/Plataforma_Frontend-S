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
import CreateStandModal from '@/modules/inventario/components/CreateStandModal'
import {
  deleteStand,
  getBodegas,
  getStandsBySubBodega,
} from '@/modules/inventario/data/bodega'
import { getElementos } from '@/modules/inventario/data/elemento'
import type { BodegaApi } from '@/modules/inventario/types/bodega'
import { useInventoryCenterOptional } from '@/modules/inventario/centerScope'
import { useAuth } from '@/modules/auth/context/auth'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'

type StandRow = {
  id: number
  nombre: string
  estado: boolean
  bodegaId: number
  bodegaNombre: string
  subBodegaId: number
  subBodegaNombre: string
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
  const { isAdmin } = useAuth()
  const centerId = useInventoryCenterOptional()?.centerId ?? null
  const { permit } = useInventoryAccess()
  const canCreate = permit('stand.crear', 'stands', 'create')
  const canEdit = permit('stand.editar', 'stands', 'edit')
  const canDelete = permit('stand.eliminar', 'stands', 'edit')
  const canView = permit('stand.ver', 'stands', 'view')

  const { search, setSearch, page, setPage, resetPage } = useTableState()

  const [stands, setStands] = useState<StandRow[]>([])
  const [bodegas, setBodegas] = useState<BodegaApi[]>([])
  const [bodegaFilter, setBodegaFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [subBodegaFilter, setSubBodegaFilter] = useState('')
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
        getBodegas(centerId ? { idCformacion: centerId } : undefined),
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

      const rows: StandRow[] = []
      for (const bodega of bodegaList) {
        for (const sub of bodega.subBodegas ?? []) {
          const nested = sub.stands ?? []
          const stands =
            nested.length > 0 || (sub.totalStands ?? 0) === 0
              ? nested
              : await getStandsBySubBodega(sub.id)
          for (const stand of stands) {
            rows.push({
              id: stand.id,
              nombre: stand.nombre,
              estado: stand.estado,
              bodegaId: bodega.id,
              bodegaNombre: bodega.nombre,
              subBodegaId: sub.id,
              subBodegaNombre: sub.nombre,
              totalElementos: elementosPorStand.get(stand.id) ?? 0,
            })
          }
        }
      }
      setStands(rows)
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
  }, [centerId])

  const filteredStands = useMemo(() => {
    const query = search.trim().toLowerCase()

    return stands.filter((stand) => {
      const matchesSearch =
        !query ||
        `${stand.nombre} ${stand.bodegaNombre} ${stand.subBodegaNombre} ${stand.id}`
          .toLowerCase()
          .includes(query)

      const matchesBodega = !bodegaFilter || String(stand.bodegaId) === bodegaFilter
      const matchesSub = !subBodegaFilter || String(stand.subBodegaId) === subBodegaFilter

      return matchesSearch && matchesBodega && matchesSub
    })
  }, [stands, search, bodegaFilter, subBodegaFilter])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(
    filteredStands,
    page,
  )

  const singleAssignedBodega = !isAdmin && bodegas.length === 1
  const subBodegasFiltro = bodegas
    .filter((bodega) => !bodegaFilter || String(bodega.id) === bodegaFilter)
    .flatMap((bodega) =>
      (bodega.subBodegas ?? []).map((sub) => ({
        id: sub.id,
        nombre: `${bodega.nombre} · ${sub.nombre}`,
      })),
    )
  const hasActiveFilters = search.trim() !== '' || bodegaFilter !== '' || subBodegaFilter !== ''

  const clearFilters = () => {
    setSearch('')
    setBodegaFilter('')
    setSubBodegaFilter('')
  }

  function handleCreateStand() {
    if (bodegas.length === 0) {
      setError('No hay bodegas disponibles. Primero debes crear una bodega.')
      return
    }
    setCreateModalOpen(true)
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
        description="Cada stand pertenece a una sub-bodega. El nombre no se repite dentro de ella."
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
          placeholder="Buscar por stand, sub-bodega o bodega..."
        />

        <FilterGroup label="Bodega">
          {singleAssignedBodega ? (
            <div className={`${filterSelectClass} flex items-center lg:w-64`}>
              {bodegas[0]?.nombre}
            </div>
          ) : (
            <select
              value={bodegaFilter}
              onChange={(event) => {
                setBodegaFilter(event.target.value)
                setSubBodegaFilter('')
                resetPage()
              }}
              className={`${filterSelectClass} lg:w-64`}
            >
              <option value="">{isAdmin ? 'Todas las bodegas' : 'Todas las asignadas'}</option>

              {bodegas.map((bodega) => (
                <option key={bodega.id} value={String(bodega.id)}>
                  {bodega.nombre}
                </option>
              ))}
            </select>
          )}
        </FilterGroup>

        <FilterGroup label="Sub-bodega">
          <select
            value={subBodegaFilter}
            onChange={(event) => {
              setSubBodegaFilter(event.target.value)
              resetPage()
            }}
            className={`${filterSelectClass} lg:w-64`}
          >
            <option value="">Todas</option>
            {subBodegasFiltro.map((sub) => (
              <option key={sub.id} value={String(sub.id)}>
                {sub.nombre}
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
                    <TableHeader width={tableColumns.relation}>Ubicación</TableHeader>
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
                              <p className="mt-0.5 text-xs text-sena-text/45">ID {stand.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="truncate font-medium text-sena-dark">{stand.subBodegaNombre}</p>
                          <p className="mt-0.5 truncate text-xs text-sena-text/45">{stand.bodegaNombre}</p>
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
                                  navigate(`/inventario/stands/${stand.id}`)
                                }
                              >
                                <EyeIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {canEdit ? (
                              <ActionButton
                                title="Editar stand"
                                onClick={() =>
                                  navigate(`/inventario/stands/${stand.id}/editar`)
                                }
                              >
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {canDelete ? (
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
        <CreateStandModal
          bodegas={bodegas}
          initialBodegaId={singleAssignedBodega ? bodegas[0]?.id : undefined}
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            setCreateModalOpen(false)
            void loadStands()
          }}
        />
      ) : null}

      {standToDelete ? (
        <ConfirmDialog
          title="Eliminar stand"
          subtitle="Solo se elimina si ya no tiene elementos."
          confirmLabel="Eliminar"
          pendingLabel="Eliminando…"
          pending={deletingId === standToDelete.id}
          onConfirm={() => void handleDeleteStand(standToDelete)}
          onCancel={() => setStandToDelete(null)}
        >
          ¿Deseas eliminar el stand <strong>{standToDelete.nombre}</strong> de la sub-bodega{' '}
          <strong>{standToDelete.subBodegaNombre}</strong>?
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}
