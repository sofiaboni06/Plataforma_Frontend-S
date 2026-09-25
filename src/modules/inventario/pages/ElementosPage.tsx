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
import { ApiError, api } from '@/shared/lib/api'
import { getBodegas } from '@/modules/inventario/data/bodega'
import {
  createElemento,
  getElementos,
  getUnidadesMedida,
  updateElemento,
} from '@/modules/inventario/data/elemento'
import type { BodegaApi, StandApi } from '@/modules/inventario/types/bodega'
import type {
  CreateElementoPayload,
  ElementoApi,
  UnidadMedidaApi,
} from '@/modules/inventario/types/elemento'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import type { CategoryApi, SubcategoryApi } from '@/shared/types/category'

type StatusFilter = 'Todos' | 'Activo' | 'Inactivo'

const emptyForm: CreateElementoPayload = {
  idSubcategoria: 0,
  idStand: 0,
  nombre: '',
  cantidad: 0,
  estado: true,
  idUnidadMedida: 0,
  codigo: '',
  descripcion: '',
  marca: '',
  urlFotografia: '',
}

export default function ElementosPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = useInventoryAccess()
  const canCreate = can('elementos', 'create')
  const canEdit = can('elementos', 'edit')
  const canView = can('elementos', 'view')

  const { search, setSearch, page, setPage, resetPage } = useTableState()

  const [elementos, setElementos] = useState<ElementoApi[]>([])
  const [categories, setCategories] = useState<CategoryApi[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryApi[]>([])
  const [bodegas, setBodegas] = useState<BodegaApi[]>([])
  const [unidades, setUnidades] = useState<UnidadMedidaApi[]>([])
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateElementoPayload>(emptyForm)
  const [categoryId, setCategoryId] = useState(0)
  const [bodegaId, setBodegaId] = useState(0)
  const [elementoToDisable, setElementoToDisable] = useState<ElementoApi | null>(null)
  const [disabling, setDisabling] = useState(false)

  const stands = useMemo<StandApi[]>(
    () =>
      bodegas.flatMap((bodega) =>
        (bodega.stands ?? []).map((stand) => ({
          ...stand,
          // El listado de bodegas anida el stand sin idBodega.
          // El select lo necesita para mostrar solo los de la bodega elegida.
          idBodega: bodegaOptionId(bodega),
        })),
      ),
    [bodegas],
  )

  const categoryNameById = useMemo(
    () => new Map(categories.map((item) => [item.id, item.nombre])),
    [categories],
  )

  const bodegaNameByStand = useMemo(() => {
    const map = new Map<number, string>()

    for (const bodega of bodegas) {
      for (const stand of bodega.stands ?? []) {
        map.set(stand.id, bodega.nombre)
        if (stand.idStand) map.set(stand.idStand, bodega.nombre)
      }
    }

    return map
  }, [bodegas])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return elementos.filter((item) => {
      const itemCategoryId = selectedCategoryId(item, subcategories)
      const categoryName = categoryNameById.get(itemCategoryId) ?? ''

      const matchesSearch =
        !term ||
        [
          item.codigo,
          item.nombre,
          item.marca ?? '',
          item.subcategoria?.nombre ?? '',
          categoryName,
          item.stand?.nombre ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)

      const matchesCategory =
        categoryFilter === 'Todos' || String(itemCategoryId) === categoryFilter

      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activo' && item.estado) ||
        (statusFilter === 'Inactivo' && !item.estado)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [categoryNameById, categoryFilter, elementos, search, statusFilter, subcategories])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(filtered, page)

  const hasActiveFilters =
    search.trim() !== '' || categoryFilter !== 'Todos' || statusFilter !== 'Todos'

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('Todos')
    setStatusFilter('Todos')
  }

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [elementoData, categoryData, subcategoryData, bodegaData, unidadData] =
        await Promise.all([
          getElementos(),
          api<CategoryApi[]>('/categorias'),
          api<SubcategoryApi[]>('/subcategorias'),
          getBodegas(),
          getUnidadesMedida(),
        ])
      setElementos(elementoData)
      setCategories(categoryData)
      setSubcategories(subcategoryData)
      setBodegas(bodegaData)
      setUnidades(unidadData)
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudieron cargar los elementos del inventario.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Gestionar elementos | SENA'
    void loadData()
  }, [])

  // La vista de detalle vuelve con ?editar=<id> para abrir el modal de edición,
  // porque editar un elemento no tiene página propia. Se espera a que carguen
  // subcategorías y bodegas, que son las que openEdit usa para preseleccionar.
  useEffect(() => {
    const requested = searchParams.get('editar')
    if (!requested || !elementos.length) return

    const target = elementos.find((item) => String(item.id) === requested)
    if (target) openEdit(target)

    setSearchParams({}, { replace: true })
  }, [elementos, searchParams, setSearchParams])

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setCategoryId(0)
    setBodegaId(0)
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  function openEdit(item: ElementoApi) {
    setEditingId(item.id)
    setForm({
      idSubcategoria: item.idSubcategoria,
      idStand: item.idStand,
      nombre: item.nombre,
      cantidad: item.cantidad,
      estado: item.estado,
      idUnidadMedida: item.idUnidadMedida,
      codigo: item.codigo,
      descripcion: item.descripcion ?? '',
      marca: item.marca ?? '',
      urlFotografia: item.urlFotografia ?? '',
    })
    setCategoryId(
      subcategories.find((subcategory) => subcategory.id === item.idSubcategoria)
        ?.idCategoria ?? 0,
    )
    const owner = bodegas.find((bodega) =>
      bodega.stands?.some(
        (stand) => stand.id === item.idStand || stand.idStand === item.idStand,
      ),
    )
    setBodegaId(owner ? bodegaOptionId(owner) : 0)
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  function updateForm<K extends keyof CreateElementoPayload>(
    key: K,
    value: CreateElementoPayload[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function confirmDisable() {
    if (!elementoToDisable) return

    setDisabling(true)
    setError(null)

    try {
      const updated = await updateElemento(elementoToDisable.id, { estado: false })

      setElementos((current) =>
        current.map((item) => (item.id === elementoToDisable.id ? updated : item)),
      )

      setElementoToDisable(null)
      setNotice(`El elemento “${elementoToDisable.nombre}” quedó inhabilitado.`)
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo inhabilitar el elemento.',
      )
      setElementoToDisable(null)
    } finally {
      setDisabling(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)

    const payload: CreateElementoPayload = {
      ...form,
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim(),
      descripcion: form.descripcion?.trim() || null,
      marca: form.marca?.trim() || null,
      urlFotografia: form.urlFotografia?.trim() || null,
      cantidad: Number(form.cantidad),
      idSubcategoria: Number(form.idSubcategoria),
      idStand: Number(form.idStand),
      idUnidadMedida: Number(form.idUnidadMedida),
    }

    try {
      const saved = editingId
        ? await updateElemento(editingId, payload)
        : await createElemento(payload)

      setElementos((current) => {
        if (!editingId) return [...current, saved].sort((a, b) => a.id - b.id)
        return current.map((item) => (item.id === editingId ? saved : item))
      })
      setModalOpen(false)
      setNotice(
        editingId ? 'Elemento actualizado correctamente.' : 'Elemento creado correctamente.',
      )
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar el elemento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Gestionar elementos">
      <PageHeader
        title="Gestionar elementos"
        description="Consulta y administra los elementos registrados en el inventario."
        action={
          canCreate ? (
            <Button
              type="button"
              icon={<PlusIcon className="size-4" />}
              onClick={openCreate}
            >
              Nuevo elemento
            </Button>
          ) : null
        }
      />

      {notice ? (
        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error && !modalOpen ? (
        <ErrorBanner message={error} onClose={() => setError(null)} />
      ) : null}

      <FilterCard>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, nombre o categoría..."
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

            {categories.map((category) => (
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

        <ClearFiltersButton onClick={clearFilters} disabled={!hasActiveFilters} />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando elementos…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width={tableColumns.name}>Elemento</TableHeader>
                    <TableHeader width={tableColumns.relation}>Ubicación</TableHeader>
                    <TableHeader align="center" width={tableColumns.count}>
                      Cantidad
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
                    <TableEmpty colSpan={5}>No se encontraron elementos.</TableEmpty>
                  ) : (
                    pageRows.map((item) => (
                      <TableRow key={item.id}>
                        <td className="px-5 py-4">
                          <p className="truncate font-semibold text-sena-text">
                            {item.nombre}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-sena-text/45">
                            {item.codigo} ·{' '}
                            {categoryNameById.get(selectedCategoryId(item, subcategories)) ??
                              '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="truncate font-medium text-sena-dark">
                            {bodegaNameByStand.get(item.idStand) ?? '—'}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-sena-text/45">
                            {item.stand?.nombre ?? '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-center text-sena-text/70">
                          {item.cantidad} {item.unidadMedida?.abreviatura ?? ''}
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
                                title="Ver elemento"
                                onClick={() =>
                                  navigate(`/inventario/elementos/${item.id}`)
                                }
                              >
                                <EyeIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {canEdit ? (
                              <ActionButton
                                title="Editar elemento"
                                onClick={() => openEdit(item)}
                              >
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {canEdit ? (
                              <ActionButton
                                title="Inhabilitar elemento"
                                danger
                                disabled={!item.estado}
                                onClick={() => setElementoToDisable(item)}
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
              noun="elementos"
            />
          </>
        )}
      </TableCard>

      {modalOpen ? (
        <Modal
          title={editingId ? 'Editar elemento' : 'Nuevo elemento'}
          description="Los datos se guardan directamente en el inventario del backend."
          onClose={() => !saving && setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="elemento-nombre" label="Nombre *" value={form.nombre} onChange={(event) => updateForm('nombre', event.target.value)} required />
              <TextField id="elemento-codigo" label="Código *" value={form.codigo} onChange={(event) => updateForm('codigo', event.target.value)} required />
              <TextField id="elemento-marca" label="Marca" value={form.marca ?? ''} onChange={(event) => updateForm('marca', event.target.value)} />
              <TextField id="elemento-cantidad" label="Cantidad *" type="number" min="0" step="any" value={form.cantidad} onChange={(event) => updateForm('cantidad', Number(event.target.value))} required />

              <SelectField id="elemento-categoria" label="Categoría *" value={categoryId} onChange={(value) => {
                setCategoryId(Number(value))
                updateForm('idSubcategoria', 0)
              }} options={categories.filter((item) => item.estado).map((item) => ({ value: item.id, label: item.nombre }))} required />

              <SelectField id="elemento-subcategoria" label="Subcategoría *" value={form.idSubcategoria} onChange={(value) => updateForm('idSubcategoria', Number(value))} options={subcategories.filter((item) => item.estado && item.idCategoria === categoryId).map((item) => ({ value: item.id, label: item.nombre }))} required />
              <SelectField id="elemento-bodega" label="Bodega *" value={bodegaId} onChange={(value) => {
                const nextBodegaId = Number(value)
                setBodegaId(nextBodegaId)
                const firstStand = stands.find((stand) => stand.idBodega === nextBodegaId && stand.estado)
                updateForm('idStand', firstStand?.id ?? 0)
              }} options={bodegas.filter((item) => item.estado).map((item) => ({ value: bodegaOptionId(item), label: item.nombre }))} required />
              <SelectField id="elemento-stand" label="Stand *" value={form.idStand} onChange={(value) => updateForm('idStand', Number(value))} options={stands.filter((item) => item.estado && item.idBodega === bodegaId).map((item) => ({ value: item.id, label: item.nombre }))} required />
              <SelectField id="elemento-unidad" label="Unidad de medida *" value={form.idUnidadMedida} onChange={(value) => updateForm('idUnidadMedida', Number(value))} options={unidades.filter((item) => item.estado).map((item) => ({ value: item.id, label: `${item.nombre} (${item.abreviatura})` }))} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="elemento-url" label="URL de fotografía" type="url" value={form.urlFotografia ?? ''} onChange={(event) => updateForm('urlFotografia', event.target.value)} placeholder="https://..." />
              <label className="flex items-center gap-3 rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text">
                <input type="checkbox" checked={form.estado} onChange={(event) => updateForm('estado', event.target.checked)} className="size-4 accent-sena" />
                Elemento activo
              </label>
            </div>

            <div>
              <label htmlFor="elemento-descripcion" className="text-sm font-medium text-sena-text/75">Descripción técnica</label>
              <textarea id="elemento-descripcion" value={form.descripcion ?? ''} onChange={(event) => updateForm('descripcion', event.target.value)} rows={4} className="mt-1.5 w-full rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20" />
            </div>

            <div className="flex justify-end gap-3 border-t border-sena-text/8 pt-5">
              <Button variant="secondary" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear elemento'}</Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {elementoToDisable ? (
        <ConfirmDialog
          title="Inhabilitar elemento"
          subtitle="El elemento pasará a estado inactivo."
          confirmLabel="Inhabilitar"
          pendingLabel="Inhabilitando…"
          pending={disabling}
          onConfirm={() => void confirmDisable()}
          onCancel={() => setElementoToDisable(null)}
        >
          ¿Estás seguro de que deseas inhabilitar el elemento{' '}
          <strong>{elementoToDisable.nombre}</strong>?
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}

function bodegaOptionId(bodega: BodegaApi) {
  return bodega.id_bodega ?? bodega.id
}

function selectedCategoryId(item: ElementoApi, subcategories: SubcategoryApi[]) {
  return (
    subcategories.find((subcategory) => subcategory.id === item.idSubcategoria)?.idCategoria ?? 0
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
}: {
  id: string
  label: string
  value: number
  onChange: (value: string) => void
  options: Array<{ value: number; label: string }>
  disabled?: boolean
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-sena-text/75">{label}</label>
      <select id={id} value={value || ''} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={required} className="h-11 w-full rounded-lg bg-sena-muted px-3.5 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20 disabled:cursor-not-allowed disabled:opacity-60">
        <option value="">Selecciona...</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  )
}
