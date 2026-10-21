import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { PencilIcon } from '@/shared/components/icons/AppIcons'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import { ApiError } from '@/shared/lib/api'
import ElementoFoto, { fotoUrlDelElemento } from '@/modules/inventario/components/ElementoFoto'
import { getMaterialFormacion } from '@/modules/materiales-formacion/data/materialFormacion'
import type { MaterialFormacionApi } from '@/modules/materiales-formacion/types'
import { useMaterialFormacionAccess } from '@/modules/materiales-formacion/useMaterialFormacionAccess'

export default function ViewMaterialFormacionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useMaterialFormacionAccess()

  const [material, setMaterial] = useState<MaterialFormacionApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const data = await getMaterialFormacion(id ?? '')
        if (!cancelled) setMaterial(data)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudo cargar el material de formación.',
          )
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

  if (loading) {
    return (
      <AppLayout title="Ver material de formación" showCenterBanner={false}>
        <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center">
          <p className="text-sm text-sena-text/55">Cargando material...</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !material) {
    return (
      <AppLayout title="Ver material de formación" showCenterBanner={false}>
        <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-red-700">{error ?? 'Material no encontrado.'}</p>

            <Button
              type="button"
              variant="secondary"
              className="mt-5"
              onClick={() => navigate('/materiales')}
            >
              Volver
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const foto = fotoUrlDelElemento(material.elemento?.id ?? 0, material.elemento?.urlFotografia)

  return (
    <AppLayout title="Ver material de formación" showCenterBanner={false}>
      <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center py-8">
        <section className="w-full max-w-[900px] rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-sena-dark/8 sm:px-8 sm:py-7">
          <div className="flex items-center gap-3 border-b border-sena-dark/10 pb-4">
            <BoxIcon className="size-7 text-sena-dark" />

            <h1 className="text-xl font-semibold text-sena-dark">
              Información del material de formación
            </h1>

            <div className="ml-auto">
              <StatusPill tone={material.estado ? 'ok' : 'danger'}>
                {material.estado ? 'Activo' : 'Inactivo'}
              </StatusPill>
            </div>
          </div>

          {material.programa ? (
            <div className="mt-7 rounded-xl bg-sena-muted/40 px-4 py-4">
              <span className="block text-xs font-semibold uppercase tracking-wider text-sena-text/45">
                Programa de formación
              </span>
              <span className="mt-1 block text-sm font-semibold text-sena-dark">
                {material.programa.codigo} · {material.programa.nombre} · v
                {material.programa.version}
              </span>
            </div>
          ) : (
            <div className="mt-7 rounded-xl border border-dashed border-sena-dark/10 bg-sena-muted/40 px-4 py-4">
              <span className="block text-xs font-semibold uppercase tracking-wider text-sena-text/45">
                Programa de formación
              </span>
              <span className="mt-1 block text-sm font-semibold text-sena-text/55">
                Sin programa
              </span>
            </div>
          )}

          <div className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <InfoItem
              label="Elemento"
              value={material.elemento?.nombre ?? 'Elemento no disponible'}
            />
            <InfoItem
              label="Código del elemento"
              value={material.elemento?.codigo ?? '—'}
            />
            <InfoItem
              label="Unidad de medida"
              value={material.elemento?.unidadMedida?.nombre ?? '—'}
            />
            <InfoItem
              label="Cantidad base"
              value={`${material.cantidadBase} ${
                material.elemento?.unidadMedida?.abreviatura ?? ''
              }`.trim()}
            />
            <InfoItem label="ID del material" value={String(material.id)} />
            <InfoItem
              label="Última actualización"
              value={formatFecha(material.updatedAt ?? material.createdAt)}
            />
          </div>

          <div className="mt-7 border-t border-sena-dark/10 pt-6">
            <h2 className="mb-3 text-sm font-bold text-sena-dark">Observaciones</h2>

            {material.observaciones ? (
              <p className="rounded-xl bg-sena-muted/40 px-4 py-3 text-sm leading-6 text-sena-text/75">
                {material.observaciones}
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-sena-dark/10 bg-sena-muted/40 px-5 py-8 text-center text-sm text-sena-text/45">
                Este material no tiene observaciones registradas.
              </div>
            )}
          </div>

          {foto ? (
            <div className="mt-7 border-t border-sena-dark/10 pt-6">
              <h2 className="mb-3 text-sm font-bold text-sena-dark">Fotografía del elemento</h2>

              <ElementoFoto
                src={foto}
                alt={material.elemento?.nombre ?? 'Elemento'}
                className="max-h-64 rounded-xl border border-sena-dark/8 object-contain"
              />
            </div>
          ) : null}

          <div className="mt-7 flex justify-end gap-3 border-t border-sena-dark/10 pt-5">
            <Link to="/materiales">
              <Button type="button" variant="secondary">
                Volver
              </Button>
            </Link>

            {canEdit ? (
              <Link to={`/materiales?editar=${material.id}`}>
                <Button type="button" icon={<PencilIcon className="size-4" />}>
                  Editar material
                </Button>
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs font-semibold uppercase tracking-wider text-sena-text/45">
        {label}
      </span>

      <span className="mt-1 block text-sm font-semibold text-sena-dark">{value}</span>
    </div>
  )
}

function formatFecha(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" />
      <path d="M8 6H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  )
}
