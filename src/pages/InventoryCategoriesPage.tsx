import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import {
  EyeIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
} from '../components/icons/AppIcons'
import {
  StatusPill,
} from '../components/modules/ResourceBoard'
import Button from '../components/ui/Button'
import { ApiError, api } from '../lib/api'
import { cn } from '../lib/cn'
import type {
  CategoryApi,
  SubcategoryApi,
} from '../types/category'
import type {
  UserFormOptions,
} from '../types/profile'

const PAGE_SIZE = 8

type StatusFilter =
  | 'Todos'
  | 'Activa'
  | 'Inactiva'

export default function InventoryCategoriesPage() {
  const navigate = useNavigate()

  const [categories, setCategories] =
    useState<CategoryApi[]>([])

  const [subcategories, setSubcategories] =
    useState<SubcategoryApi[]>([])

  const [centers, setCenters] =
    useState<UserFormOptions['centers']>([])

  const [search, setSearch] =
    useState('')

  const [centerFilter, setCenterFilter] =
    useState('Todos')

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('Todos')

  const [page, setPage] =
    useState(1)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [categoryToDisable, setCategoryToDisable] =
    useState<CategoryApi | null>(null)

  const [disabling, setDisabling] =
    useState(false)

  useEffect(() => {
    document.title =
      'Gestionar categorías | SENA'
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [
          categoryList,
          subcategoryList,
          options,
        ] = await Promise.all([
          api<CategoryApi[]>(
            '/categorias',
          ),
          api<SubcategoryApi[]>(
            '/subcategorias',
          ),
          api<UserFormOptions>(
            '/users/options',
          ),
        ])

        if (cancelled) return

        setCategories(categoryList)
        setSubcategories(
          subcategoryList,
        )
        setCenters(options.centers)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudieron cargar las categorías.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const centerMap = useMemo(
    () =>
      new Map(
        centers.map(
          (center) => [
            center.id,
            center.name,
          ],
        ),
      ),
    [centers],
  )

  const subcategoriesByCategory =
    useMemo(() => {
      const map = new Map<
        number,
        SubcategoryApi[]
      >()

      for (const subcategory of subcategories) {
        const current =
          map.get(
            subcategory.idCategoria,
          ) ?? []

        current.push(subcategory)

        map.set(
          subcategory.idCategoria,
          current,
        )
      }

      return map
    }, [subcategories])

  const filteredCategories =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      return categories.filter(
        (category) => {
          const centerName =
            centerMap.get(
              category.idCformacion,
            ) ?? ''

          const categorySubcategories =
            subcategoriesByCategory.get(
              category.id,
            ) ?? []

          const subcategoryText =
            categorySubcategories
              .map(
                (item) =>
                  item.nombre,
              )
              .join(' ')

          const searchableText =
            `${category.nombre} ${centerName} ${subcategoryText}`
              .toLowerCase()

          const matchesSearch =
            !query ||
            searchableText.includes(
              query,
            )

          const matchesCenter =
            centerFilter ===
              'Todos' ||
            String(
              category.idCformacion,
            ) === centerFilter

          const matchesStatus =
            statusFilter ===
              'Todos' ||
            (
              statusFilter ===
                'Activa' &&
              category.estado
            ) ||
            (
              statusFilter ===
                'Inactiva' &&
              !category.estado
            )

          return (
            matchesSearch &&
            matchesCenter &&
            matchesStatus
          )
        },
      )
    }, [
      categories,
      centerMap,
      subcategoriesByCategory,
      search,
      centerFilter,
      statusFilter,
    ])

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCategories.length /
          PAGE_SIZE,
      ),
    )

  const currentPage =
    Math.min(page, totalPages)

  const pageStart =
    (currentPage - 1) *
    PAGE_SIZE

  const pageRows =
    filteredCategories.slice(
      pageStart,
      pageStart + PAGE_SIZE,
    )

  const from =
    filteredCategories.length === 0
      ? 0
      : pageStart + 1

  const to =
    pageStart +
    pageRows.length

  useEffect(() => {
    setPage(1)
  }, [
    search,
    centerFilter,
    statusFilter,
  ])

  const clearFilters = () => {
    setSearch('')
    setCenterFilter('Todos')
    setStatusFilter('Todos')
    setPage(1)
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    centerFilter !== 'Todos' ||
    statusFilter !== 'Todos'

  const confirmDisable = async () => {
    if (!categoryToDisable)
      return

    setDisabling(true)
    setError(null)

    try {
      const updated =
        await api<CategoryApi>(
          `/categorias/${categoryToDisable.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              estado: false,
            }),
          },
        )

      setCategories(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              categoryToDisable.id
                ? updated
                : item,
          ),
      )

      setCategoryToDisable(null)
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo inhabilitar la categoría.',
      )
    } finally {
      setDisabling(false)
    }
  }

  return (
    <AppLayout title="Gestionar categorías">
      <div className="pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-sena-dark">
            GESTIONAR CATEGORÍAS
          </h1>

          <p className="mt-1 text-sm text-sena-text/60">
            Administra las categorías utilizadas para clasificar los elementos del inventario.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sena-dark/8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-sena-text/40" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar categoría..."
              className="h-11 w-full rounded-xl border border-sena-dark/10 bg-white pl-10 pr-3 text-sm text-sena-text outline-none placeholder:text-sena-text/40 focus:border-sena focus:ring-2 focus:ring-sena/20"
            />
          </div>

          <FilterGroup label="Centro de formación">
            <select
              value={centerFilter}
              onChange={(event) =>
                setCenterFilter(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-sena-dark/10 bg-white px-3 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20 lg:w-64"
            >
              <option value="Todos">
                Todos
              </option>

              {centers.map(
                (center) => (
                  <option
                    key={center.id}
                    value={String(
                      center.id,
                    )}
                  >
                    {center.name}
                  </option>
                ),
              )}
            </select>
          </FilterGroup>

          <FilterGroup label="Estado">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter,
                )
              }
              className="h-11 w-full rounded-xl border border-sena-dark/10 bg-white px-3 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20 lg:w-40"
            >
              <option value="Todos">
                Todos
              </option>

              <option value="Activa">
                Activa
              </option>

              <option value="Inactiva">
                Inactiva
              </option>
            </select>
          </FilterGroup>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-sena-dark/10 bg-white px-4 text-sm font-medium text-sena-text/70 hover:bg-sena-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/8">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-sena-text/55">
            Cargando categorías…
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader>
                      Categoría
                    </TableHeader>

                    <TableHeader>
                      Centro de Formación
                    </TableHeader>

                    <TableHeader center>
                      Subcategorías
                    </TableHeader>

                    <TableHeader center>
                      Estado
                    </TableHeader>

                    <TableHeader center>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-sm text-sena-text/45"
                      >
                        No se encontraron categorías.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map(
                      (category) => {
                        const categorySubcategories =
                          subcategoriesByCategory.get(
                            category.id,
                          ) ?? []

                        return (
                          <tr
                            key={
                              category.id
                            }
                            className="border-b border-sena-dark/6 last:border-b-0 hover:bg-sena-muted/40"
                          >
                            <td className="px-5 py-4 font-semibold text-sena-text">
                              {
                                category.nombre
                              }
                            </td>

                            <td className="px-5 py-4 font-medium text-sena-dark">
                              {centerMap.get(
                                category.idCformacion,
                              ) ?? '—'}
                            </td>

                            <td className="px-5 py-4 text-center text-sena-text/70">
                              {
                                categorySubcategories.length
                              }
                            </td>

                            <td className="px-5 py-4 text-center">
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
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-3">
                                <ActionButton
                                  title="Ver categoría"
                                  onClick={() =>
                                    navigate(
                                      `/inventario/categorias/${category.id}`,
                                    )
                                  }
                                >
                                  <EyeIcon className="size-[18px]" />
                                </ActionButton>

                                <ActionButton
                                  title="Editar categoría"
                                  onClick={() =>
                                    navigate(
                                      `/inventario/categorias/${category.id}/editar`,
                                    )
                                  }
                                >
                                  <PencilIcon className="size-[18px]" />
                                </ActionButton>

                                <ActionButton
                                  title="Inhabilitar categoría"
                                  danger={
                                    true
                                  }
                                  disabled={
                                    !category.estado
                                  }
                                  onClick={() =>
                                    setCategoryToDisable(
                                      category,
                                    )
                                  }
                                >
                                  <TrashIcon className="size-[18px]" />
                                </ActionButton>
                              </div>
                            </td>
                          </tr>
                        )
                      },
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-sena-dark/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-sena-text/55">
                Mostrando {from} - {to} de{' '}
                {
                  filteredCategories.length
                } categorías
              </span>

              <div className="flex items-center gap-1">
                <PageButton
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setPage(
                      (value) =>
                        value - 1,
                    )
                  }
                >
                  ‹
                </PageButton>

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) =>
                    index + 1,
                ).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setPage(item)
                      }
                      className={cn(
                        'grid size-8 place-items-center rounded-lg text-sm font-semibold',
                        item ===
                          currentPage
                          ? 'bg-sena text-white'
                          : 'text-sena-text/55 hover:bg-sena-muted',
                      )}
                    >
                      {item}
                    </button>
                  ),
                )}

                <PageButton
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (value) =>
                        value + 1,
                    )
                  }
                >
                  ›
                </PageButton>
              </div>
            </div>
          </>
        )}
      </section>

      {categoryToDisable ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            if (!disabling) {
              setCategoryToDisable(
                null,
              )
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
                <TrashIcon className="size-6" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-sena-dark">
                  Inhabilitar categoría
                </h2>

                <p className="mt-1 text-sm text-sena-text/55">
                  La categoría pasará a estado inactivo.
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-sena-text/70">
              ¿Estás seguro de que deseas
              inhabilitar la categoría{' '}
              <strong>
                {categoryToDisable.nombre}
              </strong>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={disabling}
                onClick={() =>
                  setCategoryToDisable(
                    null,
                  )
                }
              >
                Cancelar
              </Button>

              <Button
                type="button"
                disabled={disabling}
                onClick={() =>
                  void confirmDisable()
                }
                className="bg-red-600 hover:bg-red-700"
              >
                {disabling
                  ? 'Inhabilitando…'
                  : 'Inhabilitar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  )
}

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-sena-text/60">
        {label}
      </label>

      {children}
    </div>
  )
}

function TableHeader({
  children,
  center = false,
}: {
  children: ReactNode
  center?: boolean
}) {
  return (
    <th
      className={cn(
        'px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-sena-dark',
        center
          ? 'text-center'
          : 'text-left',
      )}
    >
      {children}
    </th>
  )
}

function ActionButton({
  children,
  title,
  onClick,
  danger = false,
  disabled = false,
}: {
  children: ReactNode
  title: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-md p-1 transition-colors',
        danger
          ? 'text-sena-text/40 hover:text-red-600'
          : 'text-sena-text/40 hover:text-sena',
        disabled &&
          'cursor-not-allowed opacity-30',
      )}
    >
      {children}
    </button>
  )
}

function PageButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center rounded-lg text-sena-text/45 hover:bg-sena-muted disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}
