import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AppLayout from '@/shared/components/layout/AppLayout'
import {
  getBodega,
} from '@/modules/inventario/data/bodega'
import type {
  BodegaApi,
} from '@/modules/inventario/types/bodega'
import Button from '@/shared/components/ui/Button'
import { PlusIcon } from '@/shared/components/icons/AppIcons'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'

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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

export default function ViewBodegaPage() {
  const navigate = useNavigate()
  const { can } = useInventoryAccess()
  const canEdit = can('bodegas', 'edit')
  const canCreateStand = can('stands', 'create')

  // IMPORTANTE:
  // BodegasPage navega a /inventario/bodegas/${bodega.id}
  const { id } = useParams<{
    id: string
  }>()

  const [bodega, setBodega] = useState<BodegaApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setError('No se encontró el identificador de la bodega.')
      setLoading(false)
      return
    }

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
          setBodega(null)
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

    void loadBodega()
  }, [id])

  function handleBack() {
    navigate('/inventario/bodegas')
  }

  function handleEdit() {
    if (!id) {
      return
    }

    navigate(`/inventario/bodegas/${id}/editar`)
  }

  function handleNewStand() {
    if (!id) {
      return
    }

    navigate(`/inventario/bodegas/${id}/stands/crear`)
  }

  if (loading) {
    return (
      <AppLayout title="Información de la bodega">
        <div className="mx-auto w-full max-w-5xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-sena-dark/8">
            <p className="text-sm text-sena-text/50">
              Cargando información de la bodega...
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!bodega) {
    return (
      <AppLayout title="Información de la bodega">
        <div className="mx-auto w-full max-w-5xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-sena-dark/8">
            <p className="text-sm text-red-600">
              {error || 'No se encontró la bodega.'}
            </p>

            <button
              type="button"
              onClick={handleBack}
              className="mt-5 rounded-lg border border-sena/25 px-5 py-2.5 text-sm font-semibold text-sena-dark hover:bg-sena/5"
            >
              Volver
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Información de la bodega">
      <div className="mx-auto w-full max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sena hover:text-sena-dark"
          >
            Inicio
          </button>

          <span className="text-sena-text/30">›</span>

          <button
            type="button"
            onClick={handleBack}
            className="text-sena hover:text-sena-dark"
          >
            Bodegas
          </button>

          <span className="text-sena-text/30">›</span>

          <span className="font-semibold text-sena-text">
            {bodega.nombre}
          </span>
        </div>

        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-sena-text">
            Información de la bodega
          </h1>

          <p className="mt-1 text-sm text-sena-text/55">
            Consulta la información registrada de esta bodega.
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Información */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sena-dark/8 sm:p-8">
          {/* Encabezado */}
          <div className="flex items-center gap-3 border-b border-sena-dark/10 pb-5">
            <div className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-sena-dark">
              <WarehouseIcon />
            </div>

            <h2 className="text-lg font-bold text-sena-dark">
              Información de la bodega
            </h2>
          </div>

          {/* Datos */}
          <div className="grid gap-x-12 gap-y-7 border-b border-sena-dark/10 py-7 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sena-text/50">
                Nombre de la bodega
              </p>

              <p className="mt-2 text-sm font-semibold text-sena-text">
                {bodega.nombre}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sena-text/50">
                Ubicación
              </p>

              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-sena-text">
                <LocationIcon />
                {bodega.ubicacion ||
                  bodega.centroFormacion?.nombre ||
                  'Sin ubicación registrada'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sena-text/50">
                Centro de formación
              </p>

              <p className="mt-2 text-sm font-semibold text-sena-text">
                {bodega.centroFormacion?.nombre || 'No registrado'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sena-text/50">
                Estado
              </p>

              <div className="mt-2">
                <span
                  className={[
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                    bodega.estado
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  {bodega.estado ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>

          {/* Stands */}
          <div className="pt-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-sena-dark">
                Stands
              </h3>

             
            </div>

            {bodega.stands.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sena-dark/15 px-5 py-8 text-center">
                <p className="text-sm font-semibold text-sena-text">
                  Esta bodega todavía no tiene stands.
                </p>

                <p className="mt-1 text-sm text-sena-text/50">
                  {canCreateStand
                    ? 'Puedes crear el primer stand desde aquí.'
                    : 'Cuando se registren stands, aparecerán en esta bodega.'}
                </p>

                {canCreateStand ? (
                <Button
                  icon={<PlusIcon />}
                  onClick={handleNewStand}
                  className="mt-5 h-11 rounded-lg bg-sena-dark px-5 hover:bg-sena-forest"
                >
                  Nuevo stand
                </Button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-sena-dark/10">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sena-dark/10 bg-sena-muted/40 text-left">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sena-text/50">
                        ID
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sena-text/50">
                        Stand
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-sena-text/50">
                        Estado
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {bodega.stands.map((stand) => (
                      <tr
                        key={stand.id}
                        className="border-b border-sena-dark/8 last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-sena-dark">
                            {stand.idStand}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm font-semibold text-sena-text">
                          {stand.nombre}
                        </td>

                        <td className="px-4 py-3">
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
                              : 'No disponible'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="mt-7 flex justify-end gap-3 border-t border-sena-dark/10 pt-6">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-sena/25 bg-white px-5 py-2.5 text-sm font-semibold text-sena-dark hover:bg-sena/5"
            >
              Volver
            </button>

            {canEdit ? (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-lg bg-sena px-5 py-2.5 text-sm font-semibold text-white hover:bg-sena-dark"
            >
              Editar bodega
            </button>
            ) : null}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}