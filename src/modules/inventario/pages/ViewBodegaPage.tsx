import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import SubBodegaForm from '@/modules/inventario/components/SubBodegaForm'
import {
  createSubBodega,
  getBodega,
} from '@/modules/inventario/data/bodega'
import type { BodegaApi } from '@/modules/inventario/types/bodega'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'

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
  const canCreateSub = permit('bodega.crear', 'bodegas', 'create')

  const { id } = useParams<{ id: string }>()
  const [bodega, setBodega] = useState<BodegaApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subBodegaModal, setSubBodegaModal] = useState(false)
  const [savingSubBodega, setSavingSubBodega] = useState(false)

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

  async function handleCreateSubBodega(data: { nombre: string; estado: boolean }) {
    if (!id) return

    try {
      setSavingSubBodega(true)
      await createSubBodega(id, data)
      setSubBodegaModal(false)
      try {
        await loadBodega(id)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo actualizar la bodega.')
      }
    } finally {
      setSavingSubBodega(false)
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
            Administra las sub-bodegas asociadas y consulta sus stands.
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-sena-dark">
                  Sub-bodegas
                </h3>

                <p className="mt-1 text-xs text-sena-text/50">
                  Administra las sub-bodegas que pertenecen a esta bodega.
                </p>
              </div>

              {canCreateSub ? (
                <button
                  type="button"
                  className="rounded-lg bg-sena px-4 py-2 text-xs font-semibold text-white hover:bg-sena-dark"
                  onClick={() => setSubBodegaModal(true)}
                >
                  Nueva sub-bodega
                </button>
              ) : null}
            </div>

            {subBodegas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sena-dark/15 px-5 py-8 text-center">
                <p className="text-sm font-semibold text-sena-text">Esta bodega no trae sub-bodegas.</p>
                <p className="mt-1 text-sm text-sena-text/50">
                  Crea una sub-bodega para organizar los stands de esta bodega.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {subBodegas.map((sub) => (
                  <article key={sub.id} className="rounded-xl border border-sena-dark/10">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                      <div>
                        <p className="font-semibold text-sena-text">{sub.nombre}</p>
                        <p className="text-xs text-sena-text/50">
                          {sub.totalStands ?? sub.stands?.length ?? 0} stands ·{' '}
                          {sub.estado ? 'Activa' : 'Inactiva'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg border border-sena/25 px-3 py-1.5 text-xs font-semibold text-sena-dark hover:bg-sena/5"
                        onClick={() => navigate(`/inventario/bodegas/${bodega.id}/sub-bodegas/${sub.id}`)}
                      >
                        Ver sub-bodega
                      </button>
                    </div>
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

      {subBodegaModal ? (
        <SubBodegaForm
          mode="create"
          loading={savingSubBodega}
          onClose={() => setSubBodegaModal(false)}
          onSubmit={handleCreateSubBodega}
        />
      ) : null}

    </AppLayout>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-sena-text/50">{label}</p>
      <p className="mt-2 text-sm font-semibold text-sena-text">{value}</p>
    </div>
  )
}
