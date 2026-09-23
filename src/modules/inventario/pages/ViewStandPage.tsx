import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AppLayout from '@/shared/components/layout/AppLayout'
import { getBodega, getStand } from '@/modules/inventario/data/bodega'
import type { StandApi } from '@/modules/inventario/types/bodega'

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-7" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 4.5 7.2 12 11l7.5-3.8L12 3.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12 7.5 3.8 7.5-3.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 16.5 7.5 3.8 7.5-3.8" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 6-6 6 6 6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}

function HashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path strokeLinecap="round" d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12.2 2.3 2.3 4.7-5" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 8 8-4 8 4v8l-8 4-8-4V8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 8 8 4 8-4M12 12v8" />
    </svg>
  )
}

function AddProductButton() {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center gap-2 rounded-full bg-sena px-4 text-sm font-semibold text-white transition hover:bg-[#009247]"
    >
      <PlusIcon />
      Agregar producto al stand
    </button>
  )
}

export default function ViewStandPage() {
  const navigate = useNavigate()

  const { id_bodega, id_stand } = useParams<{
    id_bodega: string
    id_stand: string
  }>()

  const [stand, setStand] = useState<StandApi | null>(null)
  const [bodegaNombre, setBodegaNombre] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadStand() {
      if (!id_stand) {
        setError('No se encontró el stand.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const [standResult, bodegaResult] = await Promise.all([
          getStand(id_stand),
          id_bodega ? getBodega(id_bodega) : Promise.resolve(null),
        ])

        if (cancelled) return

        if (!standResult) {
          setError('No se encontró el stand.')
          return
        }

        setStand(standResult)
        setBodegaNombre(bodegaResult?.nombre ?? standResult.bodega?.nombre ?? '')
      } catch (loadError) {
        if (cancelled) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar el stand.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadStand()

    return () => {
      cancelled = true
    }
  }, [id_stand, id_bodega])

  function goBack() {
    navigate(id_bodega ? `/inventario/bodegas/${id_bodega}` : '/inventario/bodegas')
  }

  if (loading) {
    return (
      <AppLayout title="Detalle del stand">
        <div className="mx-auto w-full max-w-7xl">
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-sena-text/60 shadow-sm ring-1 ring-sena-dark/8">
            Cargando stand...
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!stand) {
    return (
      <AppLayout title="Detalle del stand">
        <div className="mx-auto w-full max-w-7xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-sena-dark/8">
            <p className="text-sm text-red-600">
              {error || 'No se encontró el stand.'}
            </p>
            <button
              type="button"
              onClick={goBack}
              className="mt-5 rounded-lg bg-sena px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#009247]"
            >
              Volver a la bodega
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const nombreStand = stand.nombre || `Stand ${stand.idStand ?? stand.id}`
  const codigoStand = `S-${String(stand.idStand || stand.id).padStart(3, '0')}`
  const ubicacion = bodegaNombre || 'Bodega'
  const estadoLabel = stand.estado ? 'Disponible' : 'No disponible'

  return (
    <AppLayout title={nombreStand}>
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <section className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_12px_rgba(0,70,35,0.06)] ring-1 ring-sena-dark/8 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-sena">
                <LayersIcon />
              </div>
              <div>
                <p className="text-sm text-sena-text/50">{ubicacion}</p>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-sena-text">
                  {nombreStand}
                </h1>
                <span
                  className={[
                    'mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    stand.estado
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  {estadoLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-sena-dark/10 bg-white px-4 text-sm font-semibold text-sena-text transition hover:bg-sena-muted"
              >
                <ChevronLeftIcon />
                Volver
              </button>
              <AddProductButton />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-y-4 border-t border-sena-dark/8 pt-5 sm:grid-cols-3 lg:grid-cols-5">
            <Stat icon={<HashIcon />} label="Código del stand" value={codigoStand} />
            <Stat
              icon={<CheckIcon />}
              label="Estado"
              value={estadoLabel}
              valueClassName={stand.estado ? 'text-emerald-600' : 'text-slate-500'}
            />
            <Stat icon={<PinIcon />} label="Ubicación" value={ubicacion} />
            <Stat icon={<BoxIcon />} label="Cantidad de productos" value="0 productos" />
            <Stat icon={<BoxIcon />} label="Capacidad" value="—" />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,70,35,0.06)] ring-1 ring-sena-dark/8">
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 className="text-base font-bold text-sena-text">
              Productos en {nombreStand}
            </h2>
            <AddProductButton />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-y border-sena-dark/8 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-sena-text/40">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-6 py-3">Categoría</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-sena-text/50">
                    No hay productos en este stand.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

function Stat({
  icon,
  label,
  value,
  valueClassName = 'text-sena-text',
}: {
  icon: ReactNode
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-start gap-3 px-3">
      <span className="mt-0.5 text-sena-text/35">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-sena-text/45">{label}</p>
        <p className={`mt-1 truncate text-sm font-semibold ${valueClassName}`}>{value}</p>
      </div>
    </div>
  )
}
