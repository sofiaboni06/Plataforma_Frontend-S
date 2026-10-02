import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@/shared/components/icons/AppIcons'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog'
import {
  ActionButton,
  ClearFiltersButton,
  ErrorBanner,
  FilterCard,
  FilterGroup,
  PageHeader,
  RowActions,
  SearchInput,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TablePagination,
  TableRow,
  tableClass,
  tableColumns,
} from '@/shared/components/DataTable'
import { filterSelectClass, usePagination, useTableState } from '@/shared/lib/table'
import { ApiError } from '@/shared/lib/api'
import { useAuth } from '@/modules/auth/context/auth'
import { useInventoryCenterOptional } from '@/modules/inventario/centerScope'
import { disableCategoria, getAllCategorias, getSubcategorias } from '@/modules/inventario/data/categoria'
import { categoriesOfCenter } from '@/modules/inventario/lib/centro'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import type { CategoryApi, SubcategoryApi } from '@/shared/types/category'

type StatusFilter = 'Todos' | 'Activa' | 'Inactiva'

export default function InventoryCategoriesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const center = useInventoryCenterOptional()
  const { permit } = useInventoryAccess()
  const canCreate = permit('categoria.crear', 'categorias', 'create')
  const canEdit = permit('categoria.editar', 'categorias', 'edit')
  const canView = permit('categoria.ver', 'categorias', 'view')
  const canDelete = permit('categoria.eliminar', 'categorias', 'edit')
  const canSeeSub = permit('subcategoria.ver', 'categorias', 'view')

  const { search, setSearch, page, setPage, resetPage } = useTableState()

  const [categories, setCategories] = useState<CategoryApi[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryApi[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryToDisable, setCategoryToDisable] = useState<CategoryApi | null>(null)
  const [disabling, setDisabling] = useState(false)

  useEffect(() => {
    document.title = 'Gestionar categorías | SENA'
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [categoryList, subcategoryList] = await Promise.all([
          getAllCategorias(),
          canSeeSub ? getSubcategorias() : Promise.resolve([]),
        ])

        if (cancelled) return

        setCategories(categoryList)
        setSubcategories(subcategoryList)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudieron cargar las categorías.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [canSeeSub])

  const visibleCategories = useMemo(
    () => categoriesOfCenter(categories, center?.centerId ?? null),
    [categories, center?.centerId],
  )

  const centerLabel = center?.centerId ? center.centerName : (user?.trainingCenter ?? '')

  const subcategoriesByCategory = useMemo(() => {
    const map = new Map<number, SubcategoryApi[]>()

    for (const subcategory of subcategories) {
      const current = map.get(subcategory.idCategoria) ?? []
      current.push(subcategory)
      map.set(subcategory.idCategoria, current)
    }

    return map
  }, [subcategories])

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase()

    return visibleCategories.filter((category) => {
      const subcategoryText = (subcategoriesByCategory.get(category.id) ?? [])
        .map((item) => item.nombre)
        .join(' ')

      const matchesSearch =
        !query ||
        `${category.nombre} ${centerLabel} ${subcategoryText}`.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activa' && category.estado) ||
        (statusFilter === 'Inactiva' && !category.estado)

      return matchesSearch && matchesStatus
    })
  }, [centerLabel, search, statusFilter, subcategoriesByCategory, visibleCategories])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(
    filteredCategories,
    page,
  )

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'Todos'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('Todos')
  }

  const confirmDisable = async () => {
    if (!categoryToDisable) return

    setDisabling(true)
    setError(null)

    try {
      await disableCategoria(categoryToDisable.id)

      setCategories((current) =>
        current.map((item) =>
          item.id === categoryToDisable.id ? { ...item, estado: false } : item,
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
      <PageHeader
        title="Gestionar categorías"
        description="Nombre, estado y subcategorías. La subcategoría se guarda aparte, colgada de la categoría."
        action={
          canCreate ? (
            <Button
              type="button"
              icon={<PlusIcon className="size-4" />}
              onClick={() => navigate('/inventario/categorias/crear')}
            >
              Nueva categoría
            </Button>
          ) : null
        }
      />

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      <FilterCard>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar categoría..."
        />

        <FilterGroup label="Estado">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter)
              resetPage()
            }}
            className={`${filterSelectClass} lg:w-40`}
          >
            <option value="Todos">Todos</option>
            <option value="Activa">Activa</option>
            <option value="Inactiva">Inactiva</option>
          </select>
        </FilterGroup>

        <ClearFiltersButton onClick={clearFilters} disabled={!hasActiveFilters} />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando categorías…" />
        ) : (
          <>
            <div className="overflow-hidden">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width={tableColumns.name}>Categoría</TableHeader>
                    <TableHeader width={tableColumns.relation}>
                      Centro de formación
                    </TableHeader>
                    <TableHeader align="center" width={tableColumns.count}>
                      Subcategorías
                    </TableHeader>
                    <TableHeader align="center" width={tableColumns.status}>
                      Estado
                    </TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={5}>No se encontraron categorías.</TableEmpty>
                  ) : (
                    pageRows.map((category) => (
                      <TableRow key={category.id}>
                        <td className="truncate px-5 py-4 font-semibold text-sena-text">
                          {category.nombre}
                        </td>

                        <td className="truncate px-5 py-4 font-medium text-sena-dark">
                          {centerLabel || '—'}
                        </td>

                        <td className="px-5 py-4 text-center text-sena-text/70">
                          {canSeeSub
                            ? (subcategoriesByCategory.get(category.id) ?? []).filter(
                                (item) => item.estado,
                              ).length
                            : '—'}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={category.estado ? 'ok' : 'danger'}>
                            {category.estado ? 'Activa' : 'Inactiva'}
                          </StatusPill>
                        </td>

                        <td className="px-5 py-4">
                          <RowActions>
                            {canView ? (
                              <ActionButton
                                title="Ver categoría"
                                onClick={() =>
                                  navigate(`/inventario/categorias/${category.id}`)
                                }
                              >
                                <EyeIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {canEdit ? (
                              <ActionButton
                                title="Editar categoría"
                                onClick={() =>
                                  navigate(`/inventario/categorias/${category.id}/editar`)
                                }
                              >
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {canDelete ? (
                              <ActionButton
                                title="Inhabilitar categoría"
                                danger
                                disabled={!category.estado}
                                onClick={() => setCategoryToDisable(category)}
                              >
                                <TrashIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                          </RowActions>
                        </td>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              from={from}
              to={to}
              total={total}
              noun="categorías"
            />
          </>
        )}
      </TableCard>

      {categoryToDisable ? (
        <ConfirmDialog
          title="Inhabilitar categoría"
          subtitle="Si todavía tiene subcategorías activas, no se puede inhabilitar."
          confirmLabel="Inhabilitar"
          pendingLabel="Inhabilitando…"
          pending={disabling}
          onConfirm={() => void confirmDisable()}
          onCancel={() => setCategoryToDisable(null)}
        >
          ¿Estás seguro de que deseas inhabilitar la categoría{' '}
          <strong>{categoryToDisable.nombre}</strong>?
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}
