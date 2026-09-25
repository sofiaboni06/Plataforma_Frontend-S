import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'

import {
  getBodega,
  getStand,
} from '@/modules/inventario/data/bodega'

import type {
  BodegaApi,
  StandApi,
} from '@/modules/inventario/types/bodega'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'

function LayersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3.5 12 8.5 4.5 8.5-4.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3.5 16.5 8.5 4.5 8.5-4.5"
      />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 12H5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 19-7-7 7-7"
      />
    </svg>
  )
}


export default function ViewStandPage() {
  const navigate = useNavigate()
  const { can } = useInventoryAccess()
  const canEdit = can('stands', 'edit')

  const { id_bodega, id_stand } = useParams<{
    id_bodega: string
    id_stand: string
  }>()

  const [stand, setStand] = useState<StandApi | null>(null)
  const [bodega, setBodega] = useState<BodegaApi | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      if (!id_bodega || !id_stand) {
        setError('No se encontró el stand solicitado.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const [standResult, bodegaResult] = await Promise.all([
          getStand(id_stand),
          getBodega(id_bodega),
        ])

        if (!standResult) {
          setError('No se encontró el stand solicitado.')
          return
        }

        setStand(standResult)
        setBodega(bodegaResult ?? null)
      } catch (loadError) {
        console.error('Error al cargar el stand:', loadError)

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar la información del stand.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [id_bodega, id_stand])

  /*
   * IMPORTANTE:
   * El detalle del stand pertenece al módulo "Gestionar stands".
   * Por eso Volver debe regresar a /inventario/stands
   * y NO a /inventario/bodegas.
   */
  function handleBack() {
    navigate('/inventario/stands')
  }

  function handleEdit() {
    if (!id_bodega || !id_stand) {
      return
    }

    navigate(
      `/inventario/bodegas/${id_bodega}/stands/${id_stand}/editar`,
    )
  }

  if (loading) {
    return (
      <AppLayout title="Detalle del stand">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-sena-dark/8">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-emerald-50 text-sena">
              <LayersIcon />
            </div>

            <p className="text-sm text-sena-text/55">
              Cargando información del stand...
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !stand) {
    return (
      <AppLayout title="Detalle del stand">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-sena-dark/8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sena/70">
                Gestionar stands
              </p>

              <h1 className="mt-2 text-2xl font-bold text-sena-text">
                Detalle del stand
              </h1>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {error || 'No se encontró el stand solicitado.'}
            </div>

            <div className="mt-6">
              <Button
                variant="secondary"
                type="button"
                onClick={handleBack}
              >
                <span className="mr-2">
                  <ArrowLeftIcon />
                </span>
                Volver
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Detalle del stand">
      <div className="mx-auto w-full max-w-6xl">

        {/* BREADCRUMB */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-sena-text/45">
          <button
            type="button"
            onClick={handleBack}
            className="font-medium text-sena hover:underline"
          >
            Gestionar stands
          </button>

          <span>/</span>

          <span className="text-sena-text/60">
            Detalle del stand
          </span>
        </div>

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-sena-dark">
              <LayersIcon />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sena/70">
                Gestionar stands
              </p>

              <h1 className="mt-1 text-2xl font-bold text-sena-text">
                {stand.nombre}
              </h1>

              <p className="mt-1 text-sm text-sena-text/55">
                Información detallada del stand
              </p>
            </div>
          </div>

          <div
            className={[
              'inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold',
              stand.estado
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-500',
            ].join(' ')}
          >
            {stand.estado ? 'Disponible' : 'No disponible'}
          </div>
        </div>

        {/* INFORMACIÓN */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/8">

          <div className="border-b border-sena-dark/8 px-6 py-5">
            <h2 className="border-l-2 border-sena pl-2 text-sm font-bold uppercase tracking-wide text-sena-dark">
              Información general
            </h2>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">

            {/* NOMBRE */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sena-text/45">
                Nombre del stand
              </p>

              <div className="rounded-lg border border-sena-dark/10 bg-slate-50 px-4 py-3 text-sm font-medium text-sena-text">
                {stand.nombre}
              </div>
            </div>

            {/* ID */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sena-text/45">
                Código / ID
              </p>

              <div className="rounded-lg border border-sena-dark/10 bg-slate-50 px-4 py-3 text-sm font-medium text-sena-text">
                ST-{String(stand.id).padStart(3, '0')}
              </div>
            </div>

            {/* BODEGA */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sena-text/45">
                Bodega
              </p>

              <div className="rounded-lg border border-sena-dark/10 bg-slate-50 px-4 py-3 text-sm font-medium text-sena-text">
                {stand.bodega?.nombre ||
                  bodega?.nombre ||
                  'Sin bodega'}
              </div>
            </div>

            {/* ESTADO */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sena-text/45">
                Estado
              </p>

              <div className="flex h-11.5 items-center rounded-lg border border-sena-dark/10 bg-slate-50 px-4">
                <span
                  className={[
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                    stand.estado
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  {stand.estado
                    ? 'Disponible'
                    : 'No disponible'}
                </span>
              </div>
            </div>

          </div>

          {/* PRODUCTOS */}
          <div className="border-t border-sena-dark/8 px-6 py-5">
            <h2 className="border-l-2 border-sena pl-2 text-sm font-bold uppercase tracking-wide text-sena-dark">
              Productos del stand
            </h2>
          </div>

          <div className="px-6 pb-6">
            <div className="rounded-xl border border-dashed border-sena-dark/15 bg-slate-50 px-6 py-10 text-center">
              <div className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-emerald-50 text-sena">
                <LayersIcon />
              </div>

              <p className="text-sm font-medium text-sena-text">
                No hay productos registrados
              </p>

              <p className="mt-1 text-xs text-sena-text/45">
                Los productos asociados a este stand aparecerán aquí.
              </p>
            </div>
          </div>

       {/* FOOTER */}
<div className="border-t border-sena-dark/8 bg-white px-6 py-5">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">

    {/* VOLVER */}
    <Button
      variant="secondary"
      type="button"
      onClick={handleBack}
      className="h-11 min-w-30 justify-center rounded-xl border border-sena/25 bg-white px-5 text-sm font-semibold text-sena-dark transition hover:border-sena/40 hover:bg-sena/5"
    >
      Volver
    </Button>

    {/* EDITAR */}
    {canEdit ? (
    <Button
      type="button"
      onClick={handleEdit}
      className="h-11 min-w-37.5 justify-center rounded-xl px-5 text-sm font-semibold shadow-sm transition hover:shadow-md"
    >
      Editar stand
    </Button>
    ) : null}

  </div>
</div>
        </div>
      </div>
    </AppLayout>
  )
}