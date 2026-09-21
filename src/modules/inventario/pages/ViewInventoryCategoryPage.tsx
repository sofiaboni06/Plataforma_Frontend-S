import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { PencilIcon } from '@/shared/components/icons/AppIcons'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import { ApiError, api } from '@/shared/lib/api'
import type {
  CategoryApi,
  SubcategoryApi,
} from '@/shared/types/category'
import type {
  UserFormOptions,
} from '@/shared/types/profile'

export default function ViewInventoryCategoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [category, setCategory] =
    useState<CategoryApi | null>(null)

  const [subcategories, setSubcategories] =
    useState<SubcategoryApi[]>([])

  const [centers, setCenters] =
    useState<UserFormOptions['centers']>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) return

      try {
        const [
          categoryData,
          subcategoryData,
          options,
        ] = await Promise.all([
          api<CategoryApi>(
            `/categorias/${id}`,
          ),
          api<SubcategoryApi[]>(
            '/subcategorias',
          ),
          api<UserFormOptions>(
            '/users/options',
          ),
        ])

        if (cancelled) return

        setCategory(
          categoryData,
        )

        setSubcategories(
          subcategoryData.filter(
            (item) =>
              item.idCategoria ===
              categoryData.id,
          ),
        )

        setCenters(
          options.centers,
        )
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudo cargar la categoría.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id])

  const centerName =
    centers.find(
      (center) =>
        center.id ===
        category?.idCformacion,
    )?.name ?? '—'

  if (loading) {
    return (
      <AppLayout title="Ver categoría">
        <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center">
          <p className="text-sm text-sena-text/55">
            Cargando categoría…
          </p>
        </div>
      </AppLayout>
    )
  }

  if (error || !category) {
    return (
      <AppLayout title="Ver categoría">
        <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-red-700">
              {error ??
                'Categoría no encontrada.'}
            </p>

            <Button
              type="button"
              variant="secondary"
              className="mt-5"
              onClick={() =>
                navigate(
                  '/inventario/categorias',
                )
              }
            >
              Volver
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Ver categoría">
      <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center py-8">
        <section className="w-full max-w-[900px] rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-sena-dark/8 sm:px-8 sm:py-7">
          <div className="flex items-center gap-3 border-b border-sena-dark/10 pb-4">
            <FolderIcon className="size-7 text-sena-dark" />

            <h1 className="text-xl font-semibold text-sena-dark">
              Información de la categoría
            </h1>
          </div>

          <div className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <InfoItem
              label="Centro de formación"
              value={centerName}
            />

            <InfoItem
              label="Nombre de la categoría"
              value={category.nombre}
            />

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-sena-text/45">
                Estado
              </span>

              <div className="mt-2">
                <StatusPill
                  tone={
                    category.estado
                      ? 'ok'
                      : 'danger'
                  }
                >
                  {category.estado
                    ? 'Activa'
                    : 'Inactiva'}
                </StatusPill>
              </div>
            </div>
          </div>

          <div className="mt-7 border-t border-sena-dark/10 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-sena-dark">
                Subcategorías
              </h2>

              <span className="rounded-full bg-sena-muted px-3 py-1 text-xs text-sena-text/55">
                {subcategories.length}{' '}
                {subcategories.length ===
                1
                  ? 'subcategoría'
                  : 'subcategorías'}
              </span>
            </div>

            {subcategories.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-sena-dark/10 bg-sena-muted/40 px-5 py-8 text-center text-sm text-sena-text/45">
                Esta categoría no tiene subcategorías registradas.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-sena-dark/8">
                <div className="bg-sena-muted/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-sena-dark">
                  Subcategoría
                </div>

                {subcategories.map(
                  (subcategory) => (
                    <div
                      key={
                        subcategory.id
                      }
                      className="border-t border-sena-dark/6 px-4 py-3 text-sm font-medium text-sena-text"
                    >
                      {
                        subcategory.nombre
                      }
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="mt-7 flex justify-end gap-3 border-t border-sena-dark/10 pt-5">
            <Link to="/inventario/categorias">
              <Button
                type="button"
                variant="secondary"
              >
                Volver
              </Button>
            </Link>

            <Link
              to={`/inventario/categorias/${category.id}/editar`}
            >
              <Button
                type="button"
                icon={
                  <PencilIcon className="size-4" />
                }
              >
                Editar categoría
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <span className="block text-xs font-semibold uppercase tracking-wider text-sena-text/45">
        {label}
      </span>

      <span className="mt-1 block text-sm font-semibold text-sena-dark">
        {value}
      </span>
    </div>
  )
}

function FolderIcon({
  className,
}: {
  className?: string
}) {
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
      <path d="M3.5 6.5h6l2 2h9v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9.5a2 2 0 0 1 2-2Z" />
      <path d="M3.5 6.5v-1a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
