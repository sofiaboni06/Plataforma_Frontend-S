import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import CreateStandModal from '@/modules/inventario/components/CreateStandModal'
import {
  deleteStand,
  getBodega,
  getStandsBySubBodega,
} from '@/modules/inventario/data/bodega'
import type { BodegaApi, StandResumen, SubBodegaApi } from '@/modules/inventario/types/bodega'
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import { ApiError } from '@/shared/lib/api'

function WarehouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
      <path d="M4 20V7l8-4 8 4v13H4Z" />
      <path d="M8 20v-5h8v5M8 9h.01M12 9h.01M16 9h.01" />
    </svg>
  )
}

export default function ViewBodegaPage() {
  const navigate = useNavigate()
  const { permit } = useInventoryAccess()
  const canEdit = permit('bodega.editar', 'bodegas', 'edit')
  const canCreateStand = permit('stand.crear', 'stands', 'create')
  const canViewStand = permit('stand.ver', 'stands', 'view')
  const canEditStand = permit('stand.editar', 'stands', 'edit')
  const canDeleteStand = permit('stand.eliminar', 'stands', 'edit')

  const { id } = useParams<{ id: string }>()
  const [bodega, setBodega] = useState<BodegaApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [standToDelete, setStandToDelete] = useState<{ id: number; nombre: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [standModal, setStandModal] = useState<{ subBodegaId: number } | null>(null)
  const [standsBySub, setStandsBySub] = useState<Record<number, StandResumen[]>>({})

  async function loadBodega(currentId: string) {
    const result = await getBodega(currentId)
    if (!result) {
      setError('No se encontró la bodega.')
      setBodega(null)
      return
    }
    setBodega(result)
    setError('')
  }

  useEffect(() => {
    if (!id) {
      setError('No se encontró el identificador de la bodega.')
      setLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const result = await getBodega(id as string)
        if (cancelled) return
        if (!result) {
          setError('No se encontró la bodega.')
          setBodega(null)
          return
        }
        setBodega(result)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la bodega.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!bodega) return
    let cancelled = false

    async function loadStands() {
      const entries = await Promise.all(
        (bodega?.subBodegas ?? []).map(async (sub) => {
          if ((sub.stands?.length ?? 0) > 0) return [sub.id, sub.stands] as const
          if ((sub.totalStands ?? 0) === 0) return [sub.id, [] as StandResumen[]] as const
          const stands = await getStandsBySubBodega(sub.id)
          return [sub.id, stands] as const
        }),
      )
      if (!cancelled) {
        setStandsBySub(Object.fromEntries(entries) as Record<number, StandResumen[]>)
      }
    }

    void loadStands()
    return () => {
      cancelled = true
    }
  }, [bodega])

  async function confirmDeleteStand() {
    if (!id || !standToDelete) return
    try {
      setDeleting(true)
      setError('')
      await deleteStand(standToDelete.id)
      setStandToDelete(null)
      await loadBodega(id)
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError ? deleteError.message : 'No se pudo eliminar el stand.',
      )
      setStandToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Información de la bodega">
        <div className="mx-auto w-full max-w-5xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-sena-dark/8">
            <p className="text-sm text-sena-text/50">Cargando información de la bodega...</p>
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
            <p className="text-sm text-red-600">{error || 'No se encontró la bodega.'}</p>
            <button
              type="button"
              onClick={() => navigate('/inventario/bodegas')}
              className="mt-5 rounded-lg border border-sena/25 px-5 py-2.5 text-sm font-semibold text-sena-dark hover:bg-sena/5"
            >
              Volver
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const subBodegas = bodega.subBodegas ?? []

  return (
    <AppLayout title="Información de la bodega">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex items-center gap-2 text-sm">
          <button type="button" onClick={() => navigate('/inicio')} className="text-sena hover:text-sena-dark">
            Inicio
          </button>
          <span className="text-sena-text/30">›</span>
          <button
            type="button"
            onClick={() => navigate('/inventario/bodegas')}
            className="text-sena hover:text-sena-dark"
          >
            Bodegas
          </button>
          <span className="text-sena-text/30">›</span>
          <span className="font-semibold text-sena-text">{bodega.nombre}</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-sena-text">Información de la bodega</h1>
          <p className="mt-1 text-sm text-sena-text/55">
            El stand se crea sobre una sub-bodega que ya viene en la bodega.
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sena-dark/8 sm:p-8">
          <div className="flex items-center gap-3 border-b border-sena-dark/10 pb-5">
            <div className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-sena-dark">
              <WarehouseIcon />
            </div>
            <h2 className="text-lg font-bold text-sena-dark">Información de la bodega</h2>
          </div>

          <div className="grid gap-x-12 gap-y-7 border-b border-sena-dark/10 py-7 sm:grid-cols-2">
            <Info label="Nombre de la bodega" value={bodega.nombre} />
            <Info
              label="Ubicación"
              value={bodega.ubicacion || bodega.centroFormacion?.nombre || 'Sin ubicación registrada'}
            />
            <Info label="Centro de formación" value={bodega.centroFormacion?.nombre || 'No registrado'} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sena-text/50">Estado</p>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    bodega.estado ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {bodega.estado ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-7">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-sena-dark">Sub-bodegas</h3>
              <p className="mt-1 text-xs text-sena-text/50">
                Se elige una que ya exista. Desde aquí no se crean, editan ni eliminan.
              </p>
            </div>

            {subBodegas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sena-dark/15 px-5 py-8 text-center">
                <p className="text-sm font-semibold text-sena-text">Esta bodega no trae sub-bodegas.</p>
                <p className="mt-1 text-sm text-sena-text/50">
                  El stand necesita una sub-bodega que ya exista.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {subBodegas.map((sub) => (
                  <article key={sub.id} className="rounded-xl border border-sena-dark/10">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sena-dark/8 px-4 py-3">
                      <div>
                        <p className="font-semibold text-sena-text">{sub.nombre}</p>
                        <p className="text-xs text-sena-text/50">
                          {sub.totalStands ?? sub.stands?.length ?? 0} stands ·{' '}
                          {sub.estado ? 'Activa' : 'Inactiva'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canCreateStand ? (
                          <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-sena-dark hover:bg-sena-muted"
                            onClick={() => setStandModal({ subBodegaId: sub.id })}
                          >
                            Nuevo stand
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {standsOf(sub, standsBySub) === undefined ? (
                      <p className="px-4 py-4 text-sm text-sena-text/50">Cargando stands…</p>
                    ) : standsOf(sub, standsBySub)?.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-sena-text/50">Sin stands.</p>
                    ) : (
                      <ul className="divide-y divide-sena-dark/8">
                        {standsOf(sub, standsBySub)?.map((stand) => (
                          <li key={stand.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-sena-text">{stand.nombre}</p>
                              <p className="text-xs text-sena-text/45">
                                {stand.estado ? 'Activo' : 'Inactivo'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {canViewStand ? (
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-sena-dark"
                                  onClick={() => navigate(`/inventario/stands/${stand.id}`)}
                                >
                                  Ver
                                </button>
                              ) : null}
                              {canEditStand ? (
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-sena-dark"
                                  onClick={() => navigate(`/inventario/stands/${stand.id}/editar`)}
                                >
                                  Editar
                                </button>
                              ) : null}
                              {canDeleteStand ? (
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-red-600"
                                  onClick={() => setStandToDelete(stand)}
                                >
                                  Eliminar
                                </button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="mt-7 flex justify-end gap-3 border-t border-sena-dark/10 pt-6">
            <button
              type="button"
              onClick={() => navigate('/inventario/bodegas')}
              className="rounded-lg border border-sena/25 bg-white px-5 py-2.5 text-sm font-semibold text-sena-dark hover:bg-sena/5"
            >
              Volver
            </button>
            {canEdit ? (
              <button
                type="button"
                onClick={() => navigate(`/inventario/bodegas/${id}/editar`)}
                className="rounded-lg bg-sena px-5 py-2.5 text-sm font-semibold text-white hover:bg-sena-dark"
              >
                Editar bodega
              </button>
            ) : null}
          </div>
        </section>
      </div>

      {standModal && id ? (
        <CreateStandModal
          bodegas={[{ id: bodega.id, nombre: bodega.nombre, subBodegas }]}
          initialBodegaId={bodega.id}
          initialSubBodegaId={standModal.subBodegaId}
          onClose={() => setStandModal(null)}
          onCreated={() => {
            setStandModal(null)
            void loadBodega(id)
          }}
        />
      ) : null}

      {standToDelete ? (
        <ConfirmDialog
          title="Eliminar stand"
          subtitle="Solo se elimina si ya no tiene elementos."
          confirmLabel="Eliminar"
          pendingLabel="Eliminando…"
          pending={deleting}
          onConfirm={() => void confirmDeleteStand()}
          onCancel={() => setStandToDelete(null)}
        >
          ¿Deseas eliminar el stand <strong>{standToDelete.nombre}</strong>?
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}

function standsOf(sub: SubBodegaApi, loaded: Record<number, StandResumen[]>) {
  if (loaded[sub.id]) return loaded[sub.id]
  if ((sub.stands?.length ?? 0) > 0) return sub.stands
  if ((sub.totalStands ?? 0) === 0) return []
  return undefined
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-sena-text/50">{label}</p>
      <p className="mt-2 text-sm font-semibold text-sena-text">{value}</p>
    </div>
  )
}
