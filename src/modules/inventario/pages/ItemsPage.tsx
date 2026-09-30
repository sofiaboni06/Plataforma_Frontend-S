import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { EyeIcon, PencilIcon, PlusIcon, TrashIcon } from '@/shared/components/icons/AppIcons'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog'
import Modal from '@/shared/components/ui/Modal'
import TextField from '@/shared/components/ui/TextField'
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
import { useInventoryCenterOptional } from '@/modules/inventario/centerScope'
import { getAllCategorias, getSubcategorias } from '@/modules/inventario/data/categoria'
import { createItem, disableItem, getAllItems, updateItem } from '@/modules/inventario/data/item'
import { categoriesOfCenter, itemsOfCenter, subcategoriesOfCenter } from '@/modules/inventario/lib/centro'
import type { CreateItemPayload, ItemApi } from '@/modules/inventario/types/item'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import type { CategoryApi, SubcategoryApi } from '@/shared/types/category'

type StatusFilter = 'Todos' | 'Activo' | 'Inactivo'

type ItemForm = {
  nombre: string
  descripcion: string
  idSubcategoria: number
  estado: boolean
}

const emptyForm: ItemForm = {
  nombre: '',
  descripcion: '',
  idSubcategoria: 0,
  estado: true,
}

export default function ItemsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { permit } = useInventoryAccess()
  const centerId = useInventoryCenterOptional()?.centerId ?? null
  const canCreate = permit('item.crear', 'items', 'create')
  const canView = permit('item.ver', 'items', 'view')
  const canEdit = permit('item.editar', 'items', 'edit')
  const canDelete = permit('item.eliminar', 'items', 'edit')

  const { search, setSearch, page, setPage, resetPage } = useTableState()

  const [items, setItems] = useState<ItemApi[]>([])
  const [categories, setCategories] = useState<CategoryApi[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryApi[]>([])
  const [categoryId, setCategoryId] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ItemForm>(emptyForm)
  const [itemToDisable, setItemToDisable] = useState<ItemApi | null>(null)
  const [disabling, setDisabling] = useState(false)

  const visibleCategories = useMemo(
    () => categoriesOfCenter(categories, centerId),
    [categories, centerId],
  )
  const visibleSubcategories = useMemo(
    () => subcategoriesOfCenter(subcategories, categories, centerId),
    [categories, centerId, subcategories],
  )
  const visibleItems = useMemo(
    () => itemsOfCenter(items, categories, centerId),
    [categories, centerId, items],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return visibleItems.filter((item) => {
      const categoryName = item.subcategoria?.categoria?.nombre ?? ''
      const subcategoryName = item.subcategoria?.nombre ?? ''
      const matchesSearch =
        !term ||
        [item.nombre, item.descripcion ?? '', categoryName, subcategoryName]
          .join(' ')
          .toLowerCase()
          .includes(term)

      const matchesCategory =
        categoryFilter === 'Todos' ||
        String(item.subcategoria?.idCategoria ?? '') === categoryFilter

      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activo' && item.estado) ||
        (statusFilter === 'Inactivo' && !item.estado)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [categoryFilter, search, statusFilter, visibleItems])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(filtered, page)
  const hasActiveFilters =
    search.trim() !== '' || categoryFilter !== 'Todos' || statusFilter !== 'Todos'

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [itemData, categoryData, subcategoryData] = await Promise.all([
        getAllItems(),
        getAllCategorias(),
        getSubcategorias().catch((caught: unknown) => {
          if (caught instanceof ApiError && caught.status === 403) return []
          throw caught
        }),
      ])
      setItems(itemData)
      setCategories(categoryData)
      setSubcategories(subcategoryData)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar los ítems.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Gestionar ítems | SENA'
    void loadData()
  }, [])

  function openCreate() {
    setEditingId(null)
    setCategoryId(0)
    setForm({ ...emptyForm })
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  function openEdit(item: ItemApi) {
    setEditingId(item.id)
    setCategoryId(item.subcategoria?.idCategoria ?? 0)
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      idSubcategoria: item.idSubcategoria,
      estado: item.estado,
    })
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  useEffect(() => {
    const requested = searchParams.get('editar')
    if (!requested || loading || !items.length) return

    const target = items.find((item) => String(item.id) === requested)
    if (target) openEdit(target)

    setSearchParams({}, { replace: true })
  }, [items, loading, searchParams, setSearchParams])

  async function confirmDisable() {
    if (!itemToDisable) return

    setDisabling(true)
    setError(null)

    try {
      await disableItem(itemToDisable.id)
      setItems((current) =>
        current.map((item) =>
          item.id === itemToDisable.id ? { ...item, estado: false } : item,
        ),
      )
      setNotice(`El ítem “${itemToDisable.nombre}” quedó inhabilitado.`)
      setItemToDisable(null)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo inhabilitar el ítem.')
      setItemToDisable(null)
    } finally {
      setDisabling(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)

    const idSubcategoria = Number(form.idSubcategoria)
    if (!Number.isInteger(idSubcategoria) || idSubcategoria <= 0) {
      setError('Selecciona una subcategoría.')
      setSaving(false)
      return
    }

    const payload: CreateItemPayload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      idSubcategoria,
      estado: form.estado,
    }

    try {
      const saved = editingId
        ? await updateItem(editingId, payload)
        : await createItem(payload)

      setItems((current) => {
        if (!editingId) return [...current, saved].sort((left, right) => left.id - right.id)
        return current.map((item) => (item.id === editingId ? saved : item))
      })
      setModalOpen(false)
      setNotice(editingId ? 'Ítem actualizado correctamente.' : 'Ítem creado correctamente.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar el ítem.')
    } finally {
      setSaving(false)
    }
  }

  const subcategoryOptions = visibleSubcategories.filter(
    (item) =>
      item.idCategoria === categoryId && (item.estado || item.id === form.idSubcategoria),
  )

  return (
    <AppLayout title="Gestionar ítems">
      <PageHeader
        title="Gestionar ítems"
        description="El ítem es la ficha del producto. El nombre dice qué es, por ejemplo pintura para techos vinilo color rojo."
        action={
          canCreate ? (
            <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreate}>
              Nuevo ítem
            </Button>
          ) : null
        }
      />

      {notice ? (
        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error && !modalOpen ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      <FilterCard>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, descripción o categoría..."
        />

        <FilterGroup label="Categoría">
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value)
              resetPage()
            }}
            className={`${filterSelectClass} lg:w-64`}
          >
            <option value="Todos">Todas</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.nombre}
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
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </FilterGroup>

        <ClearFiltersButton
          onClick={() => {
            setSearch('')
            setCategoryFilter('Todos')
            setStatusFilter('Todos')
          }}
          disabled={!hasActiveFilters}
        />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando ítems…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width={tableColumns.name}>Ítem</TableHeader>
                    <TableHeader width={tableColumns.relation}>Clasificación</TableHeader>
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
                    <TableEmpty colSpan={4}>No se encontraron ítems.</TableEmpty>
                  ) : (
                    pageRows.map((item) => (
                      <TableRow key={item.id}>
                        <td className="px-5 py-4">
                          <p className="truncate font-semibold text-sena-text">{item.nombre}</p>
                          <p className="mt-0.5 truncate text-xs text-sena-text/45">
                            {item.descripcion || 'Sin descripción'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="truncate font-medium text-sena-dark">
                            {item.subcategoria?.categoria?.nombre ?? '—'}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-sena-text/45">
                            {item.subcategoria?.nombre ?? '—'}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={item.estado ? 'ok' : 'danger'}>
                            {item.estado ? 'Activo' : 'Inactivo'}
                          </StatusPill>
                        </td>
                        <td className="px-5 py-4">
                          <RowActions>
                            {canView ? (
                              <ActionButton
                                title="Ver ítem"
                                onClick={() => navigate(`/inventario/items/${item.id}`)}
                              >
                                <EyeIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                            {canEdit ? (
                              <ActionButton title="Editar ítem" onClick={() => openEdit(item)}>
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                            {canDelete ? (
                              <ActionButton
                                title="Inhabilitar ítem"
                                danger
                                disabled={!item.estado}
                                onClick={() => setItemToDisable(item)}
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
              noun="ítems"
            />
          </>
        )}
      </TableCard>

      {modalOpen ? (
        <Modal
          title={editingId ? 'Editar ítem' : 'Nuevo ítem'}
          description="El nombre es el producto concreto. Cantidad y gramaje se registran después, en el elemento."
          onClose={() => !saving && setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <TextField
              id="item-nombre"
              label="Nombre *"
              value={form.nombre}
              onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
              placeholder="Pintura para techos vinilo color rojo"
              required
            />

            <SelectField
              id="item-categoria"
              label="Categoría *"
              value={categoryId}
              onChange={(value) => {
                setCategoryId(Number(value))
                setForm((current) => ({ ...current, idSubcategoria: 0 }))
              }}
              options={visibleCategories
                .filter((item) => item.estado || item.id === categoryId)
                .map((item) => ({ value: item.id, label: item.nombre }))}
              required
            />
            <SelectField
              id="item-subcategoria"
              label="Subcategoría *"
              value={form.idSubcategoria}
              onChange={(value) =>
                setForm((current) => ({ ...current, idSubcategoria: Number(value) }))
              }
              options={subcategoryOptions.map((item) => ({ value: item.id, label: item.nombre }))}
              required
              disabled={!categoryId}
            />

            <div>
              <label htmlFor="item-descripcion" className="text-sm font-medium text-sena-text/75">
                Descripción
              </label>
              <textarea
                id="item-descripcion"
                value={form.descripcion}
                onChange={(event) =>
                  setForm((current) => ({ ...current, descripcion: event.target.value }))
                }
                rows={4}
                className="mt-1.5 w-full rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20"
              />
            </div>

            <label className="flex items-center gap-3 rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text">
              <input
                type="checkbox"
                checked={form.estado}
                onChange={(event) =>
                  setForm((current) => ({ ...current, estado: event.target.checked }))
                }
                className="size-4 accent-sena"
              />
              Ítem activo
            </label>

            <div className="flex justify-end gap-3 border-t border-sena-text/8 pt-5">
              <Button variant="secondary" type="button" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear ítem'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {itemToDisable ? (
        <ConfirmDialog
          title="Inhabilitar ítem"
          subtitle="No se puede inhabilitar si todavía tiene elementos activos."
          confirmLabel="Inhabilitar"
          pendingLabel="Inhabilitando…"
          pending={disabling}
          onConfirm={() => void confirmDisable()}
          onCancel={() => setItemToDisable(null)}
        >
          ¿Estás seguro de que deseas inhabilitar el ítem <strong>{itemToDisable.nombre}</strong>?
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}: {
  id: string
  label: string
  value: number
  onChange: (value: string) => void
  options: Array<{ value: number; label: string }>
  required?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-sena-text/75">
        {label}
      </label>
      <select
        id={id}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        className="h-11 w-full rounded-lg bg-sena-muted px-3.5 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">Selecciona...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
