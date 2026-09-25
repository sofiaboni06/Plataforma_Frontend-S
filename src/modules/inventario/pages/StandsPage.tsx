import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AppLayout from '@/shared/components/layout/AppLayout'

import {
  deleteStand,
  getBodegas,
} from '@/modules/inventario/data/bodega'

import type {
  BodegaApi,
  StandApi,
} from '@/modules/inventario/types/bodega'

type StandRow = StandApi & {
  bodegaId: number
  bodegaNombre: string
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l.8 13h8.4L17 7" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  )
}

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

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
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
      <path d="m12 4 8 4-8 4-8-4 8-4Z" />
      <path d="m4 12 8 4 8-4" />
      <path d="m4 16 8 4 8-4" />
    </svg>
  )
}

export default function StandsPage() {
  const navigate = useNavigate()

  const [stands, setStands] = useState<StandRow[]>([])
  const [bodegas, setBodegas] = useState<BodegaApi[]>([])
  const [search, setSearch] = useState('')
  const [selectedBodega, setSelectedBodega] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal para crear stand
  const [createModalOpen, setCreateModalOpen] =
    useState(false)

  const [newStandBodegaId, setNewStandBodegaId] =
    useState('')

  // Modal para eliminar stand
  const [standToDelete, setStandToDelete] =
    useState<StandRow | null>(null)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  async function loadStands() {
    try {
      setLoading(true)
      setError('')

      const bodegaList = await getBodegas()

      setBodegas(bodegaList)

      const allStands: StandRow[] = []

      for (const bodega of bodegaList) {
        const bodegaStands = bodega.stands ?? []

        for (const stand of bodegaStands) {
          allStands.push({
            ...stand,
            bodegaId: bodega.id,
            bodegaNombre: bodega.nombre,
          })
        }
      }

      setStands(allStands)
    } catch (loadError) {
      console.error(
        'Error cargando stands:',
        loadError,
      )

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
    const normalizedSearch =
      search.trim().toLowerCase()

    return stands.filter((stand) => {
      const matchesSearch =
        !normalizedSearch ||
        stand.nombre
          .toLowerCase()
          .includes(normalizedSearch) ||
        stand.bodegaNombre
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(stand.id).includes(
          normalizedSearch,
        ) ||
        String(stand.idStand).includes(
          normalizedSearch,
        )

      const matchesBodega =
        !selectedBodega ||
        String(stand.bodegaId) ===
          selectedBodega

      return (
        matchesSearch &&
        matchesBodega
      )
    })
  }, [
    stands,
    search,
    selectedBodega,
  ])

  function handleCreateStand() {
    if (bodegas.length === 0) {
      setError(
        'No hay bodegas disponibles. Primero debes crear una bodega.',
      )
      return
    }

    if (bodegas.length === 1) {
      navigate(
        `/inventario/bodegas/${bodegas[0].id}/stands/crear`,
      )
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
    if (!newStandBodegaId) {
      return
    }

    const bodega = bodegas.find(
      (item) =>
        String(item.id) ===
        newStandBodegaId,
    )

    if (!bodega) {
      setError(
        'La bodega seleccionada no existe.',
      )
      return
    }

    closeCreateModal()

    navigate(
      `/inventario/bodegas/${bodega.id}/stands/crear`,
    )
  }

  async function handleDeleteStand(
    stand: StandRow,
  ) {
    try {
      setDeletingId(stand.id)
      setError('')

      await deleteStand(stand.id)

      setStands((current) =>
        current.filter(
          (item) =>
            !(
              item.id === stand.id &&
              item.bodegaId ===
                stand.bodegaId
            ),
        ),
      )
    } catch (deleteError) {
      console.error(
        'Error eliminando stand:',
        deleteError,
      )

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
      <div className="mx-auto w-full max-w-7xl">

        {/* ENCABEZADO */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sena/90">
              Inventario / Stands
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-sena-text sm:text-3xl">
              Gestionar stands
            </h1>

            <p className="mt-1 text-sm text-sena-text/55">
              Consulta y administra los stands registrados en las bodegas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateStand}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sena px-4 text-sm font-semibold text-white transition hover:bg-sena-dark"
          >
            <PlusIcon />
            Nuevo stand
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError('')}
              className="font-semibold text-red-700 hover:text-red-900"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* FILTROS */}
        <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sena-dark/8 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-sena-text/75">
                Buscar
              </span>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sena-text/40">
                  <SearchIcon />
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar por stand, bodega o código..."
                  className="h-11 w-full rounded-lg border border-sena-dark/10 bg-white pl-9 pr-3 text-sm text-sena-text outline-none placeholder:text-sena-text/35 focus:border-sena focus:ring-2 focus:ring-sena/20"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-sena-text/75">
                Bodega
              </span>

              <select
                value={selectedBodega}
                onChange={(event) =>
                  setSelectedBodega(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-lg border border-sena-dark/10 bg-white px-3 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20"
              >
                <option value="">
                  Todas las bodegas
                </option>

                {bodegas.map(
                  (bodega) => (
                    <option
                      key={bodega.id}
                      value={bodega.id}
                    >
                      {bodega.nombre}
                    </option>
                  ),
                )}
              </select>
            </label>

          </div>
        </section>

        {/* TABLA */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/8">

          <div className="flex items-center justify-between border-b border-sena-dark/8 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-sena-text">
                Stands registrados
              </h2>

              <p className="mt-0.5 text-xs text-sena-text/50">
                {filteredStands.length}{' '}
                {filteredStands.length ===
                1
                  ? 'stand'
                  : 'stands'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-14 text-center text-sm text-sena-text/50">
              Cargando stands...
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-212.5 text-left">

                <thead className="border-b border-sena-dark/8 bg-sena-muted/50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-sena-text/50">
                      #
                    </th>

                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-sena-text/50">
                      Stand
                    </th>

                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-sena-text/50">
                      Bodega
                    </th>

                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-sena-text/50">
                      Estado
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-sena-text/50">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-sena-dark/8">

                  {filteredStands.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-14 text-center"
                      >
                        <div className="mx-auto flex max-w-md flex-col items-center">

                          <div className="mb-3 grid size-12 place-items-center rounded-full bg-sena-muted text-sena-dark">
                            <WarehouseIcon />
                          </div>

                          <p className="text-sm font-semibold text-sena-text">
                            No hay stands para mostrar
                          </p>

                          <p className="mt-1 text-xs text-sena-text/50">
                            Crea un stand o cambia los filtros de búsqueda.
                          </p>

                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStands.map(
                      (stand, index) => (
                        <tr
                          key={`${stand.bodegaId}-${stand.id}`}
                          className="transition hover:bg-sena-muted/20"
                        >

                          <td className="px-5 py-4">
                            <span className="grid size-7 place-items-center rounded-md bg-emerald-50 text-xs font-bold text-sena-dark">
                              {index + 1}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-semibold text-sena-text">
                                {stand.nombre}
                              </p>

                              <p className="mt-0.5 text-xs text-sena-text/45">
                                ID:{' '}
                                {stand.idStand ||
                                  stand.id}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">

                              <span className="grid size-8 place-items-center rounded-lg bg-sena-muted text-sena-dark">
                                <WarehouseIcon />
                              </span>

                              <span className="text-sm font-medium text-sena-text/75">
                                {stand.bodegaNombre}
                              </span>

                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={[
                                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                                stand.estado
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500',
                              ].join(' ')}
                            >
                              {stand.estado
                                ? 'Disponible'
                                : 'Inactivo'}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-1">

                              <button
                                type="button"
                                title="Ver stand"
                                onClick={() =>
                                  navigate(
                                    `/inventario/bodegas/${stand.bodegaId}/stands/${stand.id}`,
                                  )
                                }
                                className="grid size-9 place-items-center rounded-lg text-sky-500 transition hover:bg-sky-50"
                              >
                                <EyeIcon />
                              </button>

                              <button
                                type="button"
                                title="Editar stand"
                                onClick={() =>
                                  navigate(
                                    `/inventario/bodegas/${stand.bodegaId}/stands/${stand.id}/editar`,
                                  )
                                }
                                className="grid size-9 place-items-center rounded-lg text-sena-text/45 transition hover:bg-sena-muted hover:text-sena-dark"
                              >
                                <EditIcon />
                              </button>

                              <button
                                type="button"
                                title="Eliminar stand"
                                onClick={() =>
                                  setStandToDelete(
                                    stand,
                                  )
                                }
                                className="grid size-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                              >
                                <TrashIcon />
                              </button>

                            </div>
                          </td>

                        </tr>
                      ),
                    )
                  )}

                </tbody>
              </table>

            </div>
          )}

        </section>
      </div>

      {/* ====================================================== */}
      {/* MODAL CREAR STAND                                      */}
      {/* ====================================================== */}

      {createModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-sena-forest/35 px-4 py-6 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCreateModal()
            }
          }}
        >
          <div
            className="flex max-h-[calc(100svh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sena-dark/10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-stand-title"
          >
            <div className="flex items-start justify-between border-b border-sena-dark/8 px-7 py-6">

              <div className="flex items-start gap-3">

                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-sena-dark">
                  <LayersIcon />
                </div>

                <div>
                  <h2
                    id="create-stand-title"
                    className="text-xl font-bold text-sena-text"
                  >
                    Agregar nuevo stand
                  </h2>

                  <p className="mt-1 text-sm text-sena/75">
                    Selecciona la bodega donde deseas crear el stand.
                  </p>
                </div>

              </div>

              <button
                type="button"
                aria-label="Cerrar"
                onClick={
                  closeCreateModal
                }
                className="grid size-9 place-items-center rounded-lg border border-sena-dark/8 text-sena-text/60 transition hover:bg-sena-muted hover:text-sena-dark"
              >
                <CloseIcon />
              </button>

            </div>

            <div className="overflow-y-auto px-7 py-6">

              <label
                htmlFor="newStandBodega"
                className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75"
              >
                Bodega *

                <select
                  id="newStandBodega"
                  value={
                    newStandBodegaId
                  }
                  onChange={(event) =>
                    setNewStandBodegaId(
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-lg border border-sena-dark/10 bg-white px-3.5 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20"
                >
                  <option value="">
                    Selecciona una bodega
                  </option>

                  {bodegas.map(
                    (bodega) => (
                      <option
                        key={bodega.id}
                        value={bodega.id}
                      >
                        {bodega.nombre}
                      </option>
                    ),
                  )}
                </select>
              </label>

            </div>

            <div className="flex justify-end gap-3 border-t border-sena-dark/8 px-7 py-4">

              <button
                type="button"
                onClick={
                  closeCreateModal
                }
                className="inline-flex h-10 items-center justify-center rounded-lg border border-sena-dark/10 bg-white px-4 text-sm font-semibold text-sena-text transition hover:bg-sena-muted"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  continueCreateStand
                }
                disabled={
                  !newStandBodegaId
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sena-dark px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sena-forest disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PlusIcon />
                Continuar
              </button>

            </div>
          </div>
        </div>
      ) : null}

      {/* ====================================================== */}
      {/* MODAL ELIMINAR STAND                                   */}
      {/* ====================================================== */}

      {standToDelete ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            if (!deletingId) {
              setStandToDelete(null)
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-stand-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ENCABEZADO */}
            <div className="flex items-center gap-3">

              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-red-100 text-red-500">
                <TrashIcon />
              </div>

              <div>
                <h2
                  id="delete-stand-title"
                  className="text-lg font-bold text-sena-dark"
                >
                  Eliminar stand
                </h2>

                <p className="mt-1 text-sm text-sena-text/55">
                  Esta acción no se puede deshacer.
                </p>
              </div>

            </div>

            {/* MENSAJE */}
            <p className="mt-5 text-sm leading-6 text-sena-text/70">
              ¿Deseas eliminar el stand{' '}
              <strong className="font-semibold text-sena-text">
                {standToDelete.nombre}
              </strong>
              ?
            </p>

            {/* BODEGA */}
            <p className="mt-2 text-sm text-sena-text/55">
              Bodega:{' '}
              <strong className="font-semibold text-sena-text/70">
                {
                  standToDelete.bodegaNombre
                }
              </strong>
            </p>

            {/* BOTONES */}
            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                disabled={
                  deletingId ===
                  standToDelete.id
                }
                onClick={() =>
                  setStandToDelete(null)
                }
                className="h-10 rounded-lg border border-sena/25 bg-white px-5 text-sm font-semibold text-sena-dark transition hover:bg-sena-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  deletingId ===
                  standToDelete.id
                }
                onClick={() =>
                  void handleDeleteStand(
                    standToDelete,
                  )
                }
                className="h-10 rounded-lg bg-sena px-5 text-sm font-semibold text-white transition hover:bg-sena-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId ===
                standToDelete.id
                  ? 'Eliminando...'
                  : 'Eliminar'}
              </button>

            </div>

          </div>
        </div>
      ) : null}

    </AppLayout>
  )
}