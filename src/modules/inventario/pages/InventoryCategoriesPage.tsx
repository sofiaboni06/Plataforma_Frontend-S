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
import { ApiError, api } from '@/shared/lib/api'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import type { CategoryApi, SubcategoryApi } from '@/shared/types/category'
import type { UserFormOptions } from '@/shared/types/profile'

type StatusFilter = 'Todos' | 'Activa' | 'Inactiva'

export default function InventoryCategoriesPage() {
  const navigate = useNavigate()
  const { can } = useInventoryAccess()
  const canCreate = can('categorias', 'create')
  const canEdit = can('categorias', 'edit')
  const canView = can('categorias', 'view')

  const { search, setSearch, page, setPage, resetPage } = useTableState()

  const [categories, setCategories] = useState<CategoryApi[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryApi[]>([])
  const [centers, setCenters] = useState<UserFormOptions['centers']>([])
  const [centerFilter, setCenterFilter] = useState('Todos')
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
        const [categoryList, subcategoryList, options] = await Promise.all([
          api<CategoryApi[]>('/categorias'),
          api<SubcategoryApi[]>('/subcategorias'),
          api<UserFormOptions>('/users/options'),
        ])

        if (cancelled) return

        setCategories([...categoryList].sort((a, b) => b.id - a.id))
        setSubcategories(subcategoryList)
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
        if (!cancelled) setLoading(false)
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const centerMap = useMemo(
    () => new Map(centers.map((center) => [center.id, center.name])),
    [centers],
  )

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
      const centerName = centerMap.get(category.idCformacion) ?? ''

      const subcategoryText = (subcategoriesByCategory.get(category.id) ?? [])
        .map((item) => item.nombre)
        .join(' ')

      const matchesSearch =
        !query ||
        `${category.nombre} ${centerName} ${subcategoryText}`.toLowerCase().includes(query)

      const matchesCenter =
        centerFilter === 'Todos' || String(category.idCformacion) === centerFilter

      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activa' && category.estado) ||
        (statusFilter === 'Inactiva' && !category.estado)

      return matchesSearch && matchesCenter && matchesStatus
    })
  }, [categories, centerMap, subcategoriesByCategory, search, centerFilter, statusFilter])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(
    filteredCategories,
    page,
  )

  const hasActiveFilters =
    search.trim() !== '' || centerFilter !== 'Todos' || statusFilter !== 'Todos'

  const clearFilters = () => {
    setSearch('')
    setCenterFilter('Todos')
    setStatusFilter('Todos')
  }

  const confirmDisable = async () => {
    if (!categoryToDisable) return

    setDisabling(true)
    setError(null)

    try {
      const updated = await api<CategoryApi>(`/categorias/${categoryToDisable.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: false }),
      })

      setCategories((current) =>
        current.map((item) => (item.id === categoryToDisable.id ? updated : item)),
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
        description="Administra las categorías utilizadas para clasificar los elementos del inventario."
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

        <FilterGroup label="Centro de formación">
          <select
            value={centerFilter}
            onChange={(event) => {
              setCenterFilter(event.target.value)
              resetPage()
            }}
            className={`${filterSelectClass} lg:w-64`}
          >
            <option value="Todos">Todos</option>

            {centers.map((center) => (
              <option key={center.id} value={String(center.id)}>
                {center.name}
              </option>
            ))}
          </select>
        </FilterGroup>

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
            <div className="overflow-x-auto">
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
                          {centerMap.get(category.idCformacion) ?? '—'}
                        </td>

                        <td className="px-5 py-4 text-center text-sena-text/70">
                          {(subcategoriesByCategory.get(category.id) ?? []).filter(
                            (item) => item.estado,
                          ).length}
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

                            {canEdit ? (
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
          subtitle="La categoría pasará a estado inactivo."
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
