import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import CreateStandModal from '@/modules/inventario/components/CreateStandModal'

import {
  deleteStand,
  getBodega,
} from '@/modules/inventario/data/bodega'

import type {
  BodegaApi,
  StandApi,
} from '@/modules/inventario/types/bodega'

function shouldOpenCreateStand(state: unknown) {
  return Boolean(
    state &&
      typeof state === 'object' &&
      'openCreateStand' in state &&
      (state as { openCreateStand?: boolean }).openCreateStand,
  )
}

export default function ViewBodegaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [bodega, setBodega] = useState<BodegaApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(() => shouldOpenCreateStand(location.state))
  const [tab, setTab] = useState<'stands' | 'productos' | 'resumen'>('stands')

  async function loadBodega(silent = false) {
    if (!id) {
      setError('No se encontró el identificador de la bodega.')
      setLoading(false)
      return
    }

    try {
      if (!silent) setLoading(true)
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
      if (!silent) setLoading(false)
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

      await loadBodega(true)
    } catch (deleteError) {
      console.error('Error al eliminar el stand:', deleteError)

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se pudo eliminar el stand.',
      )
    }
  }

  function openCreateStand() {
    setCreateOpen(true)
  }

  function closeCreateStand() {
    setCreateOpen(false)

    if (shouldOpenCreateStand(location.state)) {
      navigate(location.pathname, { replace: true, state: {} })
    }
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

  const ubicacion = bodega.ubicacion ?? bodega.centroFormacion?.nombre ?? 'Sin sede'
  const totalStands = bodega.totalStands ?? bodega.stands.length

  return (
    <AppLayout title={bodega.nombre}>
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_12px_rgba(0,70,35,0.06)] ring-1 ring-sena-dark/8 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-sena-dark">
                <WarehouseIcon />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-sena-text">
                  {bodega.nombre}
                </h1>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-sena-text/50">
                  <PinIcon />
                  {ubicacion}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <SummaryPill icon={<LayersIcon />} label="Total de stands" value={String(totalStands)} />
              <SummaryPill icon={<BoxIcon />} label="Total de productos" value="0" />
            </div>
          </div>
        </section>

        <div className="mt-6 flex gap-6 border-b border-sena-dark/10 px-1">
          {(
            [
              ['stands', 'Stands'],
              ['productos', 'Productos'],
              ['resumen', 'Resumen'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={[
                '-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition',
                tab === value
                  ? 'border-sena text-sena-dark'
                  : 'border-transparent text-sena-text/45 hover:text-sena-text/70',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {tab === 'stands' ? (
          <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,70,35,0.06)] ring-1 ring-sena-dark/8">
            <div className="flex justify-end px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={openCreateStand}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-sena px-4 text-sm font-semibold text-white transition hover:bg-[#009247]"
              >
                <PlusIcon />
                Nuevo stand
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-y border-sena-dark/8 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-sena-text/40">
                    <th className="px-6 py-3">N.º</th>
                    <th className="px-4 py-3">Stand</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Productos</th>
                    <th className="px-4 py-3">Capacidad</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {bodega.stands.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center text-sm text-sena-text/50">
                        Esta bodega todavía no tiene stands.
                      </td>
                    </tr>
                  ) : (
                    bodega.stands.map((stand, index) => (
                      <tr key={stand.id} className="border-b border-sena-dark/6 last:border-b-0">
                        <td className="px-6 py-4">
                          <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-sm font-bold text-sena-dark">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sena">
                              <LayersIcon />
                            </span>
                            <div>
                              <p className="font-semibold text-sena-text">{stand.nombre}</p>
                              <p className="text-xs text-sena-text/45">Ubicación: {bodega.nombre}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                              stand.estado
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-500',
                            ].join(' ')}
                          >
                            {stand.estado ? 'Disponible' : 'No disponible'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-sena-text/70">—</td>
                        <td className="px-4 py-4 text-sm text-sena-text/70">—</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <Link
                              to={`/inventario/bodegas/${bodega.id}/stands/${stand.id}`}
                              title="Ver stand"
                              aria-label={`Ver ${stand.nombre}`}
                              className="grid size-9 place-items-center rounded-lg text-sky-500 transition hover:bg-sky-50"
                            >
                              <EyeIcon />
                            </Link>
                            <Link
                              to={`/inventario/bodegas/${bodega.id}/stands/${stand.id}/editar`}
                              title="Editar stand"
                              aria-label={`Editar ${stand.nombre}`}
                              className="grid size-9 place-items-center rounded-lg text-sena-text/45 transition hover:bg-sena-muted hover:text-sena-dark"
                            >
                              <EditIcon />
                            </Link>
                            <button
                              type="button"
                              title="Eliminar stand"
                              aria-label={`Eliminar ${stand.nombre}`}
                              onClick={() => void handleDeleteStand(stand)}
                              className="grid size-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
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
          </section>
        ) : null}

        {tab === 'productos' ? (
          <section className="mt-4 rounded-2xl bg-white px-6 py-14 text-center shadow-[0_2px_12px_rgba(0,70,35,0.06)] ring-1 ring-sena-dark/8">
            <p className="text-sm font-semibold text-sena-text">No hay productos en esta bodega</p>
            <p className="mt-1 text-sm text-sena-text/50">
              Los productos aparecen cuando se asocian a un stand.
            </p>
          </section>
        ) : null}

        {tab === 'resumen' ? (
          <section className="mt-4 rounded-2xl bg-white px-6 py-6 shadow-[0_2px_12px_rgba(0,70,35,0.06)] ring-1 ring-sena-dark/8">
            <div className="grid gap-5 sm:grid-cols-3">
              <Info label="Nombre" value={bodega.nombre} />
              <Info label="Ubicación" value={ubicacion} />
              <Info label="Estado" value={bodega.estado ? 'Disponible' : 'No disponible'} />
            </div>
          </section>
        ) : null}

        {createOpen && id ? (
          <CreateStandModal
            bodegaId={id}
            bodegaNombre={bodega.nombre}
            onClose={closeCreateStand}
            onCreated={(createdBodegaId) => {
              setCreateOpen(false)

              if (String(createdBodegaId) !== String(id)) {
                navigate(`/inventario/bodegas/${createdBodegaId}`)
                return
              }

              void loadBodega(true)
            }}
          />
        ) : null}
      </div>
    </AppLayout>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-sena-text/45">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-sena-text">{value}</p>
    </div>
  )
}

function SummaryPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-40 items-center gap-3 rounded-2xl bg-emerald-50/80 px-4 py-3">
      <span className="text-sena">{icon}</span>
      <div>
        <p className="text-xs text-sena-text/50">{label}</p>
        <p className="text-lg font-bold leading-tight text-sena-text">{value}</p>
      </div>
    </div>
  )
}

function WarehouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V9l8-5 8 5v11" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20v-6h6v6" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="1.8" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 4 7 3.5-7 3.5-7-3.5L12 4Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 7 3.5 7-3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 16 7 3.5 7-3.5" />
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px]" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px]" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px]" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m7 7 .8 13h8.4L17 7" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}