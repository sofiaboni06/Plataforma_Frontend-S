import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import { getStand } from '@/modules/inventario/data/bodega'
import type { StandApi } from '@/modules/inventario/types/bodega'

export default function ViewStandPage() {
  const { bodegaId, standId } = useParams<{
    bodegaId: string
    standId: string
  }>()

  const [stand, setStand] = useState<StandApi | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!standId) return

    async function load(currentStandId: string) {
      const result = await getStand(currentStandId)
      setStand(result)
      setLoading(false)
    }

    void load(standId)
  }, [standId])

  return (
    <AppLayout title="Ver stand">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5">
          <p className="text-sm font-medium text-sena/90">Inventario</p>
          <h1 className="mt-1 text-2xl font-bold text-sena-text">
            Detalle del stand
          </h1>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-sena-text/50 shadow-sm ring-1 ring-sena-dark/8">
            Cargando stand...
          </div>
        ) : !stand ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-sena-dark/8">
            <p className="text-sm text-sena-text/55">
              No se encontró el stand.
            </p>

            <Link
              to={`/inventario/bodegas/${bodegaId ?? ''}`}
              className="mt-5 inline-flex"
            >
              <Button>Volver a la bodega</Button>
            </Link>
          </div>
        ) : (
          <>
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

            <div className="mt-5">
              <Link to={`/inventario/bodegas/${bodegaId ?? ''}`}>
                <Button variant="secondary">
                  Volver a la bodega
                </Button>
              </Link>
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