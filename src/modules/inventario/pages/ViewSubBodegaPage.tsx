import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog'
import CreateStandModal from '@/modules/inventario/components/CreateStandModal'
import SubBodegaForm from '@/modules/inventario/components/SubBodegaForm'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@/shared/components/icons/AppIcons'
import { ActionButton, RowActions } from '@/shared/components/DataTable'
import {
  deleteStand,
  getBodega,
  getStandsBySubBodega,
  getSubBodega,
  updateSubBodega,
} from '@/modules/inventario/data/bodega'
import type { BodegaApi, StandApi, SubBodegaApi } from '@/modules/inventario/types/bodega'
import { ApiError } from '@/shared/lib/api'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'

export default function ViewSubBodegaPage() {
  const navigate = useNavigate()
  const { permit } = useInventoryAccess()
  const canCreateStand = permit('stand.crear', 'stands', 'create')
  const canViewStand = permit('stand.ver', 'stands', 'view')
  const canEditStand = permit('stand.editar', 'stands', 'edit')
  const canDeleteStand = permit('stand.eliminar', 'stands', 'edit')
  const { id, subBodegaId } = useParams<{ id: string; subBodegaId: string }>()

  const [bodega, setBodega] = useState<BodegaApi | null>(null)
  const [subBodega, setSubBodega] = useState<SubBodegaApi | null>(null)
  const [stands, setStands] = useState<StandApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [standModal, setStandModal] = useState(false)
  const [standToDelete, setStandToDelete] = useState<StandApi | null>(null)
  const [savingSubBodega, setSavingSubBodega] = useState(false)
  const [deletingStand, setDeletingStand] = useState(false)

  useEffect(() => {
    if (!id || !subBodegaId) {
      setError('No se encontró la bodega o sub-bodega solicitada.')
      setLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      if (!id || !subBodegaId) {
        return
      }

      try {
        setLoading(true)
        setError('')
        const [bodegaResult, subBodegaResult, standResults] = await Promise.all([
          getBodega(id),
          getSubBodega(subBodegaId),
          getStandsBySubBodega(subBodegaId),
        ])
        if (cancelled) return

        if (
          !bodegaResult ||
          !subBodegaResult ||
          Number(subBodegaResult.idBodega) !== Number(id)
        ) {
          setBodega(null)
          setSubBodega(null)
          setStands([])
          setError('No se encontró la sub-bodega solicitada.')
          return
        }

        setBodega(bodegaResult)
        setSubBodega(subBodegaResult)
        setStands(standResults)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la sub-bodega.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id, subBodegaId])

  async function refreshStands() {
    if (!subBodegaId) return
    const result = await getStandsBySubBodega(subBodegaId)
    setStands(result)
  }

  async function handleUpdateSubBodega(data: { nombre: string; estado: boolean }) {
    if (!subBodega) return

    try {
      setSavingSubBodega(true)
      const updated = await updateSubBodega(subBodega.id, data)
      setSubBodega(updated)
      setEditModal(false)
    } finally {
      setSavingSubBodega(false)
    }
  }

  async function confirmDeleteStand() {
    if (!standToDelete) return

    try {
      setDeletingStand(true)
      setError('')
      await deleteStand(standToDelete.id)
      setStandToDelete(null)
      await refreshStands()
    } catch (deleteError) {
      setError(deleteError instanceof ApiError ? deleteError.message : 'No se pudo eliminar el stand.')
      setStandToDelete(null)
    } finally {
      setDeletingStand(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Información de la sub-bodega">
        <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-sena-dark/8">
          <p className="text-sm text-sena-text/50">Cargando información de la sub-bodega...</p>
        </div>
      </AppLayout>
    )
  }

  if (!bodega || !subBodega) {
    return (
      <AppLayout title="Información de la sub-bodega">
        <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-sena-dark/8">
          <p className="text-sm text-red-600">{error || 'No se encontró la sub-bodega solicitada.'}</p>
          <button
            type="button"
            onClick={() => navigate(id ? `/inventario/bodegas/${id}` : '/inventario/bodegas')}
            className="mt-5 rounded-lg border border-sena/25 px-5 py-2.5 text-sm font-semibold text-sena-dark hover:bg-sena/5"
          >
            Volver a la bodega
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Información de la sub-bodega">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => navigate('/inventario/bodegas')}
            className="text-sena hover:text-sena-dark"
          >
            Bodegas
          </button>
          <span className="text-sena-text/30">›</span>
          <button
            type="button"
            onClick={() => navigate(`/inventario/bodegas/${bodega.id}`)}
            className="text-sena hover:text-sena-dark"
          >
            {bodega.nombre}
          </button>
          <span className="text-sena-text/30">›</span>
          <span className="font-semibold text-sena-text">{subBodega.nombre}</span>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sena-dark/8 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-sena-dark/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sena/70">Sub-bodega</p>
              <h1 className="mt-1 text-2xl font-bold text-sena-dark">{subBodega.nombre}</h1>
              <p className="mt-1 text-sm text-sena-text/55">Pertenece a {bodega.nombre}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditModal(true)}
              className="rounded-lg border border-sena/25 px-4 py-2 text-sm font-semibold text-sena-dark hover:bg-sena/5"
            >
              Editar sub-bodega
            </button>
          </div>

          <div className="grid gap-6 border-b border-sena-dark/10 py-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sena-text/50">Bodega</p>
              <p className="mt-2 text-sm font-semibold text-sena-text">{bodega.nombre}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sena-text/50">Estado</p>
              <p className={`mt-2 text-sm font-semibold ${subBodega.estado ? 'text-emerald-700' : 'text-slate-500'}`}>
                {subBodega.estado ? 'Activa' : 'Inactiva'}
              </p>
            </div>
          </div>

          <div className="pt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-sena-dark">Stands</h2>
                <p className="mt-1 text-xs text-sena-text/50">
                  {stands.length} {stands.length === 1 ? 'stand' : 'stands'} en esta sub-bodega
                </p>
              </div>
              {canCreateStand ? (
                <button
                  type="button"
                  onClick={() => setStandModal(true)}
                  className="rounded-lg bg-sena px-4 py-2 text-xs font-semibold text-white hover:bg-sena-dark"
                >
                  Nuevo stand
                </button>
              ) : null}
            </div>

            {stands.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sena-dark/15 px-5 py-8 text-center">
                <p className="text-sm text-sena-text/55">Esta sub-bodega todavía no tiene stands.</p>
              </div>
            ) : (
              <ul className="divide-y divide-sena-dark/8">
                {stands.map((stand) => (
                  <li key={stand.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="text-sm font-semibold text-sena-text">{stand.nombre}</p>
                      <p className={`mt-1 text-xs ${stand.estado ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {stand.estado ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                    <RowActions>
                      {canViewStand ? (
                        <ActionButton
                          title="Ver stand"
                          onClick={() => navigate(`/inventario/stands/${stand.id}`)}
                        >
                          <EyeIcon className="size-[18px]" />
                        </ActionButton>
                      ) : null}
                      {canEditStand ? (
                        <ActionButton
                          title="Editar stand"
                          onClick={() => navigate(`/inventario/stands/${stand.id}/editar`)}
                        >
                          <PencilIcon className="size-[18px]" />
                        </ActionButton>
                      ) : null}
                      {canDeleteStand ? (
                        <ActionButton
                          title="Eliminar stand"
                          danger
                          onClick={() => setStandToDelete(stand)}
                        >
                          <TrashIcon className="size-[18px]" />
                        </ActionButton>
                      ) : null}
                    </RowActions>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {editModal ? (
        <SubBodegaForm
          mode="edit"
          initialData={subBodega}
          loading={savingSubBodega}
          onClose={() => setEditModal(false)}
          onSubmit={handleUpdateSubBodega}
        />
      ) : null}

      {standModal ? (
        <CreateStandModal
          bodegas={[
            {
              id: bodega.id,
              nombre: bodega.nombre,
              subBodegas: [{ id: subBodega.id, nombre: subBodega.nombre, estado: subBodega.estado }],
            },
          ]}
          initialBodegaId={bodega.id}
          initialSubBodegaId={subBodega.id}
          onClose={() => setStandModal(false)}
          onCreated={() => {
            setStandModal(false)
            void refreshStands().catch((loadError) => {
              setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los stands.')
            })
          }}
        />
      ) : null}

      {standToDelete ? (
        <ConfirmDialog
          title="Eliminar stand"
          subtitle="Solo se elimina si ya no tiene elementos."
          confirmLabel="Eliminar"
          pendingLabel="Eliminando…"
          pending={deletingStand}
          onConfirm={() => void confirmDeleteStand()}
          onCancel={() => setStandToDelete(null)}
        >
          ¿Deseas eliminar el stand <strong>{standToDelete.nombre}</strong>?
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}