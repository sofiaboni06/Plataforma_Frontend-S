import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  EyeIcon,
  InventoryIcon,
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
import { disableCategoria, getAllCategorias, getSubcategorias } from '@/modules/inventario/data/categoria'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import type { CategoryApi, SubcategoryApi } from '@/shared/types/category'

type StatusFilter = 'Todos' | 'Activa' | 'Inactiva'

export default function InventoryCategoriesPage() {
  const navigate = useNavigate()
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

    return categories.filter((category) => {
      const subcategoryText = (subcategoriesByCategory.get(category.id) ?? [])
        .map((item) => item.nombre)
        .join(' ')

      const matchesSearch =
        !query || `${category.nombre} ${subcategoryText}`.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activa' && category.estado) ||
        (statusFilter === 'Inactiva' && !category.estado)

      return matchesSearch && matchesStatus
    })
  }, [categories, search, statusFilter, subcategoriesByCategory])

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
    <AppLayout title="Gestionar categorías" showCenterBanner={false}>
      <PageHeader
        icon={<InventoryIcon />}
        title="Gestionar categorías"
        description="La misma lista para todos los centros. Nombre, estado y subcategorías. La subcategoría se guarda aparte."
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
            className={`${filterSelectClass} lg:w-[212px]`}
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
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader width={tableColumns.name}>Categoría</TableHeader>
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
                    <TableEmpty colSpan={4}>No se encontraron categorías.</TableEmpty>
                  ) : (
                    pageRows.map((category) => (
                      <TableRow key={category.id}>
                        <td className="truncate px-6 py-5 font-semibold text-sena-text">
                          {category.nombre}
                        </td>

                        <td className="px-6 py-5 text-center text-sena-text-soft">
                          {canSeeSub
                            ? (subcategoriesByCategory.get(category.id) ?? []).filter(
                                (item) => item.estado,
                              ).length
                            : '—'}
                        </td>

                        <td className="px-6 py-5 text-center">
                          <StatusPill tone={category.estado ? 'ok' : 'danger'}>
                            {category.estado ? 'Activa' : 'Inactiva'}
                          </StatusPill>
                        </td>

                        <td className="px-6 py-5">
                          <RowActions>
                            {canView ? (
                              <ActionButton
                                title="Ver categoría"
                                onClick={() =>
                                  navigate(`/inventario/categorias/${category.id}`)
                                }
                              >
                                <EyeIcon className="size-5" />
                              </ActionButton>
                            ) : null}

                            {canEdit ? (
                              <ActionButton
                                title="Editar categoría"
                                onClick={() =>
                                  navigate(`/inventario/categorias/${category.id}/editar`)
                                }
                              >
                                <PencilIcon className="size-5" />
                              </ActionButton>
                            ) : null}

                            {canDelete ? (
                              <ActionButton
                                title="Inhabilitar categoría"
                                danger
                                disabled={!category.estado}
                                onClick={() => setCategoryToDisable(category)}
                              >
                                <TrashIcon className="size-5" />
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
