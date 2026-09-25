import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { PencilIcon } from '@/shared/components/icons/AppIcons'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import { ApiError, api } from '@/shared/lib/api'
import { getBodegas } from '@/modules/inventario/data/bodega'
import { getElemento } from '@/modules/inventario/data/elemento'
import type { ElementoApi } from '@/modules/inventario/types/elemento'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import type { CategoryApi, SubcategoryApi } from '@/shared/types/category'

export default function ViewElementoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useInventoryAccess()
  const canEdit = can('elementos', 'edit')

  const [elemento, setElemento] = useState<ElementoApi | null>(null)
  const [categoryName, setCategoryName] = useState('—')
  const [bodegaName, setBodegaName] = useState('—')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) return

      try {
        const [elementoData, categories, subcategories, bodegas] = await Promise.all([
          getElemento(id),
          api<CategoryApi[]>('/categorias'),
          api<SubcategoryApi[]>('/subcategorias'),
          getBodegas(),
        ])

        if (cancelled) return

        setElemento(elementoData)
        document.title = `${elementoData.nombre} | Inventario | SENA`

        const subcategory = subcategories.find(
          (item) => item.id === elementoData.idSubcategoria,
        )

        setCategoryName(
          categories.find((item) => item.id === subcategory?.idCategoria)?.nombre ?? '—',
        )

        setBodegaName(
          bodegas.find((bodega) =>
            bodega.stands?.some(
              (stand) =>
                stand.id === elementoData.idStand ||
                stand.idStand === elementoData.idStand,
            ),
          )?.nombre ?? '—',
        )
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError ? caught.message : 'No se pudo cargar el elemento.',
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
      <AppLayout title="Ver elemento">
        <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center">
          <p className="text-sm text-sena-text/55">Cargando elemento…</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !elemento) {
    return (
      <AppLayout title="Ver elemento">
        <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-red-700">{error ?? 'Elemento no encontrado.'}</p>

            <Button
              type="button"
              variant="secondary"
              className="mt-5"
              onClick={() => navigate('/inventario/elementos')}
            >
              Volver
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Ver elemento">
      <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center py-8">
        <section className="w-full max-w-[900px] rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-sena-dark/8 sm:px-8 sm:py-7">
          <div className="flex items-center gap-3 border-b border-sena-dark/10 pb-4">
            <BoxIcon className="size-7 text-sena-dark" />

            <h1 className="text-xl font-semibold text-sena-dark">
              Información del elemento
            </h1>
          </div>

          <div className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <InfoItem label="Código" value={elemento.codigo} />
            <InfoItem label="Nombre del elemento" value={elemento.nombre} />
            <InfoItem label="Categoría" value={categoryName} />
            <InfoItem label="Subcategoría" value={elemento.subcategoria?.nombre ?? '—'} />
            <InfoItem label="Bodega" value={bodegaName} />
            <InfoItem label="Stand" value={elemento.stand?.nombre ?? '—'} />
            <InfoItem
              label="Cantidad"
              value={`${elemento.cantidad} ${elemento.unidadMedida?.abreviatura ?? ''}`.trim()}
            />
            <InfoItem label="Marca" value={elemento.marca || '—'} />

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-sena-text/45">
                Estado
              </span>

              <div className="mt-2">
                <StatusPill tone={elemento.estado ? 'ok' : 'danger'}>
                  {elemento.estado ? 'Activo' : 'Inactivo'}
                </StatusPill>
              </div>
            </div>

            <InfoItem
              label="Unidad de medida"
              value={elemento.unidadMedida?.nombre ?? '—'}
            />
          </div>

          <div className="mt-7 border-t border-sena-dark/10 pt-6">
            <h2 className="mb-3 text-sm font-bold text-sena-dark">Descripción técnica</h2>

            {elemento.descripcion ? (
              <p className="rounded-xl bg-sena-muted/40 px-4 py-3 text-sm leading-6 text-sena-text/75">
                {elemento.descripcion}
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-sena-dark/10 bg-sena-muted/40 px-5 py-8 text-center text-sm text-sena-text/45">
                Este elemento no tiene descripción técnica registrada.
              </div>
            )}
          </div>

          {elemento.urlFotografia ? (
            <div className="mt-7 border-t border-sena-dark/10 pt-6">
              <h2 className="mb-3 text-sm font-bold text-sena-dark">Fotografía</h2>

              <img
                src={elemento.urlFotografia}
                alt={elemento.nombre}
                className="max-h-64 rounded-xl border border-sena-dark/8 object-contain"
              />
            </div>
          ) : null}

          <div className="mt-7 flex justify-end gap-3 border-t border-sena-dark/10 pt-5">
            <Link to="/inventario/elementos">
              <Button type="button" variant="secondary">
                Volver
              </Button>
            </Link>

            {canEdit ? (
              <Link to={`/inventario/elementos?editar=${elemento.id}`}>
                <Button type="button" icon={<PencilIcon className="size-4" />}>
                  Editar elemento
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
      <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7Z" />
      <path d="m3 8.5 9 5.5 9-5.5M12 14v7" />
    </svg>
  )
}
