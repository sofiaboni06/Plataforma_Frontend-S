import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import {
  deleteBodega,
  getBodegas,
} from '@/modules/inventario/data/bodega'
import type { BodegaApi } from '@/modules/inventario/types/bodega'

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

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  )
}

export default function BodegasPage() {
  const navigate = useNavigate()

  const [bodegas, setBodegas] = useState<BodegaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [bodegaToDelete, setBodegaToDelete] = useState<BodegaApi | null>(null)

  async function loadBodegas() {
    try {
      setLoading(true)
      setError('')

      const result = await getBodegas()
      setBodegas(
        [...result].sort(
          (a, b) => b.id_bodega - a.id_bodega,
        ),
      )
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
    const normalizedSearch = search.trim().toLowerCase()

    return bodegas.filter((bodega) => {
      const matchesSearch =
        !normalizedSearch ||
        bodega.nombre.toLowerCase().includes(normalizedSearch) ||
        (bodega.ubicacion ?? '').toLowerCase().includes(normalizedSearch) ||
        (bodega.centroFormacion?.nombre ?? '')
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesStatus =
        status === 'all' ||
        (status === 'active' && bodega.estado) ||
        (status === 'inactive' && !bodega.estado)

      return matchesSearch && matchesStatus
    })
  }, [bodegas, search, status])

  async function handleDelete(bodega: BodegaApi) {
    try {
      setDeletingId(bodega.id)

      await deleteBodega(bodega.id)

      setBodegas((current) =>
        current.filter((item) => item.id !== bodega.id),
      )
    } catch (deleteError) {
      window.alert(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se pudo eliminar la bodega.',
      )
    } finally {
      setDeletingId(null)
      setBodegaToDelete(null)
    }
  }

  return (
    <AppLayout title="Bodegas">
      <div className="mx-auto w-full max-w-350">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-sena-text sm:text-[2rem]">
              Gestión de Bodegas
            </h1>
            <p className="mt-1 text-[0.95rem] text-sena-text/60">
              Administra las bodegas y sus stands para organizar tu inventario.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              icon={<DownloadIcon />}
              className="h-11 rounded-lg px-5"
            >
              Exportar
            </Button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,70,35,0.08)] ring-1 ring-sena-dark/8">
          <div className="border-b border-sena-dark/8 px-5 py-4.5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="w-full xl:max-w-86">
                <label htmlFor="buscar-bodega" className="sr-only">
                  Buscar bodega
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sena-text/40">
                    <SearchIcon />
                  </span>
                  <input
                    id="buscar-bodega"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar bodega..."
                    className="h-11 w-full rounded-xl border border-sena-dark/10 bg-sena-muted/25 pl-11 pr-4 text-sm text-sena-text outline-none transition placeholder:text-sena-text/35 focus:border-sena focus:ring-2 focus:ring-sena/15"
                  />
                </div>
              </div>

              <div className="hidden">
                <p className="mb-2 text-sm font-semibold text-sena-text">
                  Estado
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['all', 'Todas'],
                    ['active', 'Activas'],
                    ['inactive', 'Inactivas'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setStatus(
                          value as 'all' | 'active' | 'inactive',
                        )
                      }
                      className={[
                        'rounded-lg px-4 py-2 text-sm font-semibold transition',
                        status === value
                          ? 'bg-sena-dark text-white shadow-sm'
                          : 'bg-sena-muted text-sena-text/65 hover:bg-sena-muted/80 hover:text-sena-text',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                icon={<PlusIcon />}
                onClick={() => navigate('/inventario/bodegas/crear')}
                className="h-11 rounded-lg bg-sena-dark px-5 hover:bg-sena-forest"
              >
                Nueva Bodega
              </Button>
            </div>
          </div>

          {error ? (
            <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-245">
              <thead>
                <tr className="border-b border-sena-dark/8 bg-sena-muted/55 text-left">
                  <th className="w-24 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.06em] text-sena-text/55 sm:px-6">
                    ID
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.06em] text-sena-text/55">
                    BODEGA
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.06em] text-sena-text/55">
                    UBICACIÓN
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.06em] text-sena-text/55">
                    STANDS
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.06em] text-sena-text/55">
                    ESTADO
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.06em] text-sena-text/55 sm:px-6">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center text-sm text-sena-text/50"
                    >
                      Cargando bodegas...
                    </td>
                  </tr>
                ) : filteredBodegas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center sm:px-6"
                    >
                      <div className="mx-auto max-w-md">
                        <p className="text-sm font-semibold text-sena-text">
                          No hay bodegas para mostrar
                        </p>
                        <p className="mt-1 text-sm text-sena-text/50">
                          Prueba con otro criterio de búsqueda o crea una nueva bodega.
                        </p>
                        {!search && status === 'all' ? (
                          <button
                            type="button"
                            onClick={() => navigate('/inventario/bodegas/crear')}
                            className="mt-4 text-sm font-semibold text-sena-dark hover:underline"
                          >
                            Crear primera bodega
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBodegas.map((bodega) => (
                    <tr
                      key={bodega.id}
                      className="border-b border-sena-dark/6 transition last:border-b-0 hover:bg-sena-muted/25"
                    >
                      <td className="px-5 py-3.5 sm:px-6">
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-sena-dark">
                          B{String(bodega.id_bodega).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sena-dark">
                            <WarehouseIcon />
                          </span>
                          <p className="font-semibold text-sena-text">
                            {bodega.nombre}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-sena-text/65">
                        <span className="inline-flex items-center gap-2">
                          <LocationIcon />
                          {bodega.centroFormacion?.nombre ?? bodega.ubicacion ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-center">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-emerald-50 px-2 py-1 text-sm font-semibold text-sena-dark">
                            {bodega.totalStands}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={[
                            'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                            bodega.estado
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500',
                          ].join(' ')}
                        >
                          {bodega.estado ? 'Disponible' : 'No disponible'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            title="Ver bodega"
                            aria-label={`Ver ${bodega.nombre}`}
                            onClick={() => navigate(`/inventario/bodegas/${bodega.id}`)}
                            className="grid size-9 place-items-center rounded-lg text-blue-500 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            type="button"
                            title="Editar bodega"
                            aria-label={`Editar ${bodega.nombre}`}
                            onClick={() => navigate(`/inventario/bodegas/${bodega.id}/editar`)}
                            className="grid size-9 place-items-center rounded-lg text-sena-text/50 transition hover:bg-sena-muted hover:text-sena-dark"
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            title="Eliminar bodega"
                            aria-label={`Eliminar ${bodega.nombre}`}
                            disabled={deletingId === bodega.id}
                            onClick={() => setBodegaToDelete(bodega)}
                            className="grid size-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-sena-dark/6 px-5 py-4 text-sm text-sena-text/55 sm:px-6">
            Mostrando{' '}
            <span className="font-semibold text-sena-text/60">
              {filteredBodegas.length}
            </span>{' '}
            de{' '}
            <span className="font-semibold text-sena-text/60">
              {bodegas.length}
            </span>{' '}
            bodegas
          </div>
        </section>

        {bodegaToDelete ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => {
              if (!deletingId) setBodegaToDelete(null)
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
                  <TrashIcon />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-sena-dark">
                    Eliminar bodega
                  </h2>
                  <p className="mt-1 text-sm text-sena-text/55">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-sena-text/70">
                ¿Deseas eliminar la bodega{' '}
                <strong>{bodegaToDelete.nombre}</strong>?
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={deletingId === bodegaToDelete.id}
                  onClick={() => setBodegaToDelete(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={deletingId === bodegaToDelete.id}
                  onClick={() => void handleDelete(bodegaToDelete)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletingId === bodegaToDelete.id
                    ? 'Eliminando...'
                    : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  )
}
