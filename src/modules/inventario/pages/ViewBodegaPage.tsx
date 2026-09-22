import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import { getStand } from '@/modules/inventario/data/bodega'
import type { StandApi } from '@/modules/inventario/types/bodega'

export default function ViewStandPage() {
  const navigate = useNavigate()

  const { bodegaId, standId } = useParams<{
    bodegaId: string
    standId: string
  }>()

  const [stand, setStand] = useState<StandApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!standId) {
      setError('No se encontró el identificador del stand.')
      console.error('No se encontró el identificador del stand.')
      setLoading(false)
      return
    }

    async function load(currentStandId: string) {
      try {
        setLoading(true)
        setError('')

        const result = await getStand(currentStandId)

        setStand(result)
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar el stand.',
        )
      } finally {
        setLoading(false)
      }
    }

    void load(standId)
  }, [standId])

  function goToBodega() {
    navigate(`/inventario/bodegas/${bodegaId ?? ''}`)
  }

  function goToEdit() {
    if (!bodegaId || !standId) return

    navigate(
      `/inventario/bodegas/${bodegaId}/stands/${standId}/editar`,
    )
  }

  return (
    <AppLayout title="Ver stand">
      <div className="mx-auto w-full max-w-3xl">
        {/* Encabezado */}
        <div className="mb-5">
          <p className="text-sm font-medium text-sena/90">
            Inventario
          </p>

          <h1 className="mt-1 text-2xl font-bold text-sena-text">
            Detalle del stand
          </h1>

          <p className="mt-1 text-sm text-sena-text/55">
            Consulta la información del stand.
          </p>
        </div>

        {/* Error */}
        {error && !loading ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Cargando */}
        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-sena-text/50 shadow-sm ring-1 ring-sena-dark/8">
            Cargando stand...
          </div>
        ) : !stand ? (
          /* Stand no encontrado */
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-sena-dark/8">
            <p className="text-sm text-sena-text/55">
              No se encontró el stand.
            </p>

            <div className="mt-5">
              <Button onClick={goToBodega}>
                Volver a la bodega
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Información del stand */}
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sena-dark/8 sm:p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <Info
                  label="Nombre"
                  value={stand.nombre}
                />

                <Info
                  label="ID del stand"
                  value={String(stand.idStand)}
                />

                <Info
                  label="Estado"
                  value={stand.estado ? 'Activo' : 'Inactivo'}
                />

                <Info
                  label="Bodega"
                  value={stand.bodega?.nombre ?? '—'}
                />
              </div>
            </section>

            {/* Acciones */}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={goToBodega}
              >
                Volver a la bodega
              </Button>

              <Button onClick={goToEdit}>
                Editar
              </Button>
            </div>
          </>
        )}
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