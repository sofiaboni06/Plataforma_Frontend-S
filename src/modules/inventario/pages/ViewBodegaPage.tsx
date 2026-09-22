import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import {
  createStand,
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
  const [standName, setStandName] = useState('')
  const [creatingStand, setCreatingStand] = useState(false)
  const [error, setError] = useState('')

  async function loadBodega() {
    if (!id) return

    try {
      setLoading(true)
      setError('')

      const result = await getBodega(id)

      if (!result) {
        navigate('/inventario/bodegas', { replace: true })
        return
      }

      setBodega(result)
    } catch (loadError) {
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

  async function handleCreateStand() {
    if (!id || !standName.trim()) return

    try {
      setCreatingStand(true)
      setError('')

      await createStand(id, {
        nombre: standName.trim(),
        estado: true,
      })

      setStandName('')
      await loadBodega()
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'No se pudo crear el stand.',
      )
    } finally {
      setCreatingStand(false)
    }
  }

  async function handleDeleteStand(stand: StandApi) {
    const confirmed = window.confirm(
      `¿Deseas eliminar el stand "${stand.nombre}"?`,
    )

    if (!confirmed) return

    try {
      await deleteStand(stand.id)
      await loadBodega()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se pudo eliminar el stand.',
      )
    }
  }

  if (loading) {
    return (
      <AppLayout title="Ver bodega">
        <div className="py-12 text-center text-sm text-sena-text/50">
          Cargando bodega...
        </div>
      </AppLayout>
    )
  }

  if (!bodega) {
    return null
  }

  return (
    <AppLayout title="Ver bodega">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sena/90">Inventario</p>
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
              onClick={() => navigate('/inventario/bodegas')}
            >
              Volver
            </Button>

            <Button
              onClick={() =>
                navigate(`/inventario/bodegas/${bodega.id}/editar`)
              }
            >
              Editar
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

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
              value={bodega.estado ? 'Activa' : 'Inactiva'}
            />
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/8">
          <div className="border-b border-sena-dark/8 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-semibold text-sena-text">
              Stands
            </h2>
            <p className="mt-1 text-sm text-sena-text/55">
              Esta bodega tiene {bodega.totalStands} stand
              {bodega.totalStands === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-b border-sena-dark/8 bg-sena-muted/40 p-5 sm:flex-row">
            <input
              value={standName}
              onChange={(event) => setStandName(event.target.value)}
              placeholder="Nombre del nuevo stand"
              maxLength={150}
              className="h-11 flex-1 rounded-lg border border-sena-dark/10 bg-white px-3.5 text-sm outline-none focus:border-sena focus:ring-2 focus:ring-sena/15"
            />

            <Button
              disabled={creatingStand || !standName.trim()}
              onClick={() => void handleCreateStand()}
            >
              {creatingStand ? 'Creando...' : 'Agregar stand'}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="bg-sena-muted/70 text-left text-xs font-semibold uppercase tracking-wide text-sena-text/55">
                  <th className="px-5 py-4">Stand</th>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4 text-center">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {bodega.stands.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-sena-text/50"
                    >
                      Esta bodega todavía no tiene stands.
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
                          {stand.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/inventario/bodegas/${bodega.id}/stands/${stand.id}`}
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-sena-dark hover:bg-sena-muted"
                          >
                            Ver
                          </Link>

                          <button
                            type="button"
                            onClick={() => void handleDeleteStand(stand)}
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
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