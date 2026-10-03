import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { PencilIcon } from '@/shared/components/icons/AppIcons'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import { ApiError } from '@/shared/lib/api'
import ElementoFoto, { fotoUrlDelElemento } from '@/modules/inventario/components/ElementoFoto'
import { getBodegas } from '@/modules/inventario/data/bodega'
import { getElementos } from '@/modules/inventario/data/elemento'
import { getItem } from '@/modules/inventario/data/item'
import type { BodegaApi } from '@/modules/inventario/types/bodega'
import type { ElementoApi } from '@/modules/inventario/types/elemento'
import type { ItemApi } from '@/modules/inventario/types/item'
import { lugarDelElemento } from '@/modules/inventario/lib/lugar'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'

export default function ViewItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { permit } = useInventoryAccess()
  const canEdit = permit('item.editar', 'items', 'edit')
  const canViewElemento = permit('elemento.ver', 'elementos', 'view')

  const [item, setItem] = useState<ItemApi | null>(null)
  const [elementos, setElementos] = useState<ElementoApi[]>([])
  const [bodegas, setBodegas] = useState<BodegaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) return

      try {
        const itemData = await getItem(id)
        if (cancelled) return

        setItem(itemData)
        document.title = `${itemData.nombre} | Ítem | SENA`

        const [elementoData, bodegaData] = await Promise.all([
          getElementos().catch(() => [] as ElementoApi[]),
          getBodegas().catch(() => [] as BodegaApi[]),
        ])

        if (cancelled) return

        setElementos(elementoData.filter((elemento) => elemento.idItem === itemData.id))
        setBodegas(bodegaData)
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : 'No se pudo cargar el ítem.')
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
      <AppLayout title="Ver ítem">
        <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center">
          <p className="text-sm text-sena-text/55">Cargando ítem…</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !item) {
    return (
      <AppLayout title="Ver ítem">
        <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-red-700">{error ?? 'Ítem no encontrado.'}</p>
            <Button
              type="button"
              variant="secondary"
              className="mt-5"
              onClick={() => navigate('/inventario/items')}
            >
              Volver
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Ver ítem">
      <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center py-8">
        <section className="w-full max-w-[900px] rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-sena-dark/8 sm:px-8 sm:py-7">
          <div className="flex items-center gap-3 border-b border-sena-dark/10 pb-4">
            <TagIcon className="size-7 text-sena-dark" />
            <h1 className="text-xl font-semibold text-sena-dark">Información del ítem</h1>
          </div>

          <div className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <InfoItem label="Ítem" value={`Ítem ${item.id}`} />
            <InfoItem label="Nombre" value={item.nombre} />
            <InfoItem label="Categoría" value={item.subcategoria?.categoria?.nombre ?? '—'} />
            <InfoItem label="Subcategoría" value={item.subcategoria?.nombre ?? '—'} />
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-sena-text/45">
                Estado
              </span>
              <div className="mt-2">
                <StatusPill tone={item.estado ? 'ok' : 'danger'}>
                  {item.estado ? 'Activo' : 'Inactivo'}
                </StatusPill>
              </div>
            </div>
          </div>

          <div className="mt-7 border-t border-sena-dark/10 pt-6">
            <h2 className="mb-3 text-sm font-bold text-sena-dark">Descripción</h2>
            {item.descripcion ? (
              <p className="rounded-xl bg-sena-muted/40 px-4 py-3 text-sm leading-6 text-sena-text/75">
                {item.descripcion}
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-sena-dark/10 bg-sena-muted/40 px-5 py-8 text-center text-sm text-sena-text/45">
                Este ítem no tiene descripción.
              </div>
            )}
          </div>

          <div className="mt-7 border-t border-sena-dark/10 pt-6">
            <h2 className="mb-3 text-sm font-bold text-sena-dark">Elementos de este ítem</h2>
            <p className="mb-4 text-sm text-sena-text/55">
              El stock vive en el elemento: cantidad, gramaje, marca y ubicación.
            </p>

            {elementos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sena-dark/10 bg-sena-muted/40 px-5 py-8 text-center text-sm text-sena-text/45">
                Este ítem todavía no tiene elementos registrados.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-sena-dark/8">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="bg-sena-muted/50 text-left text-xs font-bold uppercase tracking-wider text-sena-dark">
                      <th className="px-4 py-3">Foto</th>
                      <th className="px-4 py-3">Elemento</th>
                      <th className="px-4 py-3">Ubicación</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {elementos.map((elemento) => (
                      <tr key={elemento.id} className="border-t border-sena-dark/6">
                        <td className="px-4 py-3">
                          {elemento.urlFotografia ? (
                            <ElementoFoto
                              src={fotoUrlDelElemento(elemento.id, elemento.urlFotografia)}
                              alt={elemento.nombre}
                              className="size-12 rounded-lg object-cover ring-1 ring-sena-dark/8"
                            />
                          ) : (
                            <span className="grid size-12 place-items-center rounded-lg bg-sena-muted text-[10px] uppercase tracking-wide text-sena-text/40">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sena-text">{elemento.codigo}</p>
                          <p className="mt-0.5 text-xs text-sena-text/45">
                            {[elemento.marca, elemento.color].filter(Boolean).join(' · ') ||
                              elemento.nombre}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sena-dark">
                            {lugarDelElemento(elemento, bodegas).subBodega}
                          </p>
                          <p className="mt-0.5 text-xs text-sena-text/45">
                            {lugarDelElemento(elemento, bodegas).bodega} ·{' '}
                            {lugarDelElemento(elemento, bodegas).stand}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center text-sena-text/70">
                          {elemento.cantidad} {elemento.unidadMedida?.abreviatura ?? ''}
                          {elemento.gramaje == null ? '' : ` · ${elemento.gramaje}`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusPill tone={elemento.estado ? 'ok' : 'danger'}>
                            {elemento.estado ? 'Activo' : 'Inactivo'}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canViewElemento ? (
                            <Link
                              to={`/inventario/elementos/${elemento.id}`}
                              className="text-sm font-semibold text-sena-dark underline-offset-2 hover:underline"
                            >
                              Ver elemento
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-7 flex justify-end gap-3 border-t border-sena-dark/10 pt-5">
            <Link to="/inventario/items">
              <Button type="button" variant="secondary">
                Volver
              </Button>
            </Link>

            {canEdit ? (
              <Link to={`/inventario/items?editar=${item.id}`}>
                <Button type="button" icon={<PencilIcon className="size-4" />}>
                  Editar ítem
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

function TagIcon({ className }: { className?: string }) {
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
      <path d="M12 3H5a2 2 0 0 0-2 2v7l9.3 9.3a2 2 0 0 0 2.8 0l6.2-6.2a2 2 0 0 0 0-2.8L12 3Z" />
      <path d="M7.5 7.5h.01" />
    </svg>
  )
}
