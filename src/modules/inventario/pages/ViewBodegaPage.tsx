import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'

import {
  deleteStand,
  getBodega,
} from '@/modules/inventario/data/bodega'

import type {
  BodegaApi,
  StandApi,
} from '@/modules/inventario/types/bodega'

export default function ViewBodegaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [bodega, setBodega] = useState<BodegaApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadBodega() {
    if (!id) {
      setError('No se encontró el identificador de la bodega.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const result = await getBodega(id)

      if (!result) {
        setError('No se encontró la bodega.')
        return
      }

      setBodega(result)
    } catch (loadError) {
      console.error('Error al cargar la bodega:', loadError)

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudo cargar la bodega.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBodega()
  }, [id])

  async function handleDeleteStand(stand: StandApi) {
    const confirmed = window.confirm(
      `¿Deseas eliminar el stand "${stand.nombre}"?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await deleteStand(stand.id)

      await loadBodega()
    } catch (deleteError) {
      console.error('Error al eliminar el stand:', deleteError)

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se pudo eliminar el stand.',
      )
    }
  }

  function goToCreateStand() {
    if (!id) {
      return
    }

    navigate(`/inventario/bodegas/${id}/stands/crear`)
  }

  function goToEditBodega() {
    if (!id) {
      return
    }

    navigate(`/inventario/bodegas/${id}/editar`)
  }

  if (loading) {
    return (
      <AppLayout title="Ver bodega">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-sena-text/50 shadow-sm ring-1 ring-sena-dark/8">
            Cargando bodega...
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!bodega) {
    return (
      <AppLayout title="Ver bodega">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-sena-dark/8">
            <p className="text-sm text-red-600">
              {error || 'No se encontró la bodega.'}
            </p>

            <div className="mt-5">
              <Button
                onClick={() =>
                  navigate('/inventario/bodegas')
                }
              >
                Volver a bodegas
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Ver bodega">
      <div className="mx-auto w-full max-w-6xl">
        {/* Encabezado */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sena/90">
              Inventario
            </p>

            <h1 className="mt-1 text-2xl font-bold text-sena-text">
              {bodega.nombre}
            </h1>

            <p className="mt-1 text-sm text-sena-text/55">
              Detalle de la bodega y sus stands.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                navigate('/inventario/bodegas')
              }
            >
              Volver
            </Button>

            <Button onClick={goToEditBodega}>
              Editar
            </Button>
          </div>
        </div>

        {/* Error */}
        {error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Información de la bodega */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sena-dark/8 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-3">
            <Info
              label="Nombre"
              value={bodega.nombre}
            />

            <Info
              label="Ubicación"
              value={
                bodega.ubicacion ??
                bodega.centroFormacion?.nombre ??
                '—'
              }
            />

            <Info
              label="Estado"
              value={
                bodega.estado
                  ? 'Activa'
                  : 'Inactiva'
              }
            />
          </div>
        </section>

        {/* Stands */}
        <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/8">
          <div className="flex flex-col gap-4 border-b border-sena-dark/8 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <h2 className="text-lg font-semibold text-sena-text">
                Stands
              </h2>

              <p className="mt-1 text-sm text-sena-text/55">
                Esta bodega tiene {bodega.totalStands}{' '}
                stand
                {bodega.totalStands === 1
                  ? ''
                  : 's'}
                .
              </p>
            </div>

            <Button onClick={goToCreateStand}>
              Crear stand
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-175">
              <thead>
                <tr className="bg-sena-muted/70 text-left text-xs font-semibold uppercase tracking-wide text-sena-text/55">
                  <th className="px-5 py-4">
                    Stand
                  </th>

                  <th className="px-5 py-4">
                    ID
                  </th>

                  <th className="px-5 py-4 text-center">
                    Estado
                  </th>

                  <th className="px-5 py-4 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {bodega.stands.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-sena-text/50"
                    >
                      Esta bodega todavía no tiene
                      stands.
                    </td>
                  </tr>
                ) : (
                  bodega.stands.map((stand) => (
                    <tr
                      key={stand.id}
                      className="border-t border-sena-dark/6"
                    >
                      <td className="px-5 py-4 font-semibold text-sena-text">
                        {stand.nombre}
                      </td>

                      <td className="px-5 py-4 text-sm text-sena-text/60">
                        {stand.idStand}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={[
                            'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                            stand.estado
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500',
                          ].join(' ')}
                        >
                          {stand.estado
                            ? 'Activo'
                            : 'Inactivo'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {/* Ver stand */}
                          <Link
                            to={`/inventario/bodegas/${bodega.id}/stands/${stand.id}`}
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-sena-dark hover:bg-sena-muted"
                            title="Ver stand"
                          >
                            👁️
                          </Link>

                          {/* Editar stand */}
                          <Link
                            to={`/inventario/bodegas/${bodega.id}/stands/${stand.id}/editar`}
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-sena-dark hover:bg-sena-muted"
                            title="Editar stand"
                          >
                            Editar
                          </Link>

                          {/* Eliminar stand */}
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteStand(
                                stand,
                              )
                            }
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            title="Eliminar stand"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-sena-text/45">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-semibold text-sena-text">
        {value}
      </p>
    </div>
  )
}