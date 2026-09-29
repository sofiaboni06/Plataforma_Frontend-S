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
import { getBodegas, getStandsBySubBodega } from '@/modules/inventario/data/bodega'
import { getAllCategorias } from '@/modules/inventario/data/categoria'
import { getAllItems } from '@/modules/inventario/data/item'
import {
  createElemento,
  getClasificacionesActivas,
  getCodigosEstandar,
  getElementos,
  getUnidadesMedida,
  updateElemento,
} from '@/modules/inventario/data/elemento'
import { formatCantidad, lugarDelElemento } from '@/modules/inventario/lib/lugar'
import type { BodegaApi, StandResumen } from '@/modules/inventario/types/bodega'
import type { ItemApi } from '@/modules/inventario/types/item'
import type {
  ClasificacionElementoApi,
  CodigoEstandarApi,
  CreateElementoPayload,
  ElementoApi,
  UnidadMedidaApi,
} from '@/modules/inventario/types/elemento'
import { useAuth } from '@/modules/auth/context/auth'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import type { CategoryApi } from '@/shared/types/category'

type StatusFilter = 'Todos' | 'Activo' | 'Inactivo'

type ElementoForm = {
  idItem: number
  idStand: number
  cantidad: number
  gramaje: string
  estado: boolean
  idUnidadMedida: number
  codigo: string
  descripcion: string
  marca: string
  color: string
  urlFotografia: string
  idClasificacion: number
  valorUnitarioPromedio: string
  porcentajeAumento: string
  idCodigoEstandar: number
}

const emptyForm: ElementoForm = {
  idItem: 0,
  idStand: 0,
  cantidad: 10,
  gramaje: '',
  estado: true,
  idUnidadMedida: 0,
  codigo: '',
  descripcion: '',
  marca: '',
  color: '',
  urlFotografia: '',
  idClasificacion: 0,
  valorUnitarioPromedio: '',
  porcentajeAumento: '',
  idCodigoEstandar: 0,
}

export default function ElementosPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAdmin } = useAuth()
  const { permit } = useInventoryAccess()
  const canCreate = permit('elemento.crear', 'elementos', 'create')
  const canEdit = permit('elemento.editar', 'elementos', 'edit')
  const canView = permit('elemento.ver', 'elementos', 'view')

  const { search, setSearch, page, setPage, resetPage } = useTableState()

  const [elementos, setElementos] = useState<ElementoApi[]>([])
  const [items, setItems] = useState<ItemApi[]>([])
  const [categories, setCategories] = useState<CategoryApi[]>([])
  const [bodegas, setBodegas] = useState<BodegaApi[]>([])
  const [unidades, setUnidades] = useState<UnidadMedidaApi[]>([])
  const [clasificaciones, setClasificaciones] = useState<ClasificacionElementoApi[]>([])
  const [codigos, setCodigos] = useState<CodigoEstandarApi[]>([])
  const [puedeClasificacion, setPuedeClasificacion] = useState(true)
  const [puedeCodigo, setPuedeCodigo] = useState(true)
  const [standsDeSub, setStandsDeSub] = useState<StandResumen[]>([])
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ElementoForm>(emptyForm)
  const [itemSearch, setItemSearch] = useState('')
  const [bodegaId, setBodegaId] = useState(0)
  const [subBodegaId, setSubBodegaId] = useState(0)
  const [elementoToDisable, setElementoToDisable] = useState<ElementoApi | null>(null)
  const [disabling, setDisabling] = useState(false)

  const bodegaLocked = !isAdmin && bodegas.length === 1
  const lockedBodega = bodegaLocked ? bodegas[0] : null

  const categoryNameById = useMemo(
    () => new Map(categories.map((item) => [item.id, item.nombre])),
    [categories],
  )

  const filtered = useMemo(() => {
    const term = foldSearch(search)

    return elementos.filter((item) => {
      const itemCategoryId = categoryOfElemento(item, items).id
      const categoryName = categoryNameById.get(itemCategoryId) || categoryOfElemento(item, items).nombre

      const matchesSearch =
        !term ||
        foldSearch(
          [
            item.codigo,
            item.nombre,
            item.item ? `item ${item.item.id} ítem ${item.item.id} ${item.item.nombre}` : '',
            item.marca ?? '',
            subcategoryOfElemento(item, items),
            categoryName,
            item.stand?.nombre ?? '',
          ].join(' '),
        ).includes(term)

      const matchesCategory =
        categoryFilter === 'Todos' || String(itemCategoryId) === categoryFilter

      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activo' && item.estado) ||
        (statusFilter === 'Inactivo' && !item.estado)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [categoryNameById, categoryFilter, elementos, items, search, statusFilter])

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
      const [elementoData, itemData, categoryData, bodegaData, unidadData] = await Promise.all([
        getElementos(),
        getAllItems(),
        getAllCategorias(),
        getBodegas(),
        getUnidadesMedida(),
      ])
      const clasificacionData = await getClasificacionesActivas().then(
        (rows) => ({ ok: true, rows }),
        (caught: unknown) => {
          if (caught instanceof ApiError && caught.status === 403) return { ok: false, rows: [] }
          throw caught
        },
      )
      const codigoData = await getCodigosEstandar().then(
        (rows) => ({ ok: true, rows }),
        (caught: unknown) => {
          if (caught instanceof ApiError && caught.status === 403) return { ok: false, rows: [] }
          throw caught
        },
      )
      setElementos(elementoData)
      setItems(itemData)
      setCategories(categoryData)
      setBodegas(bodegaData)
      setUnidades(unidadData)
      setClasificaciones(clasificacionData.rows)
      setPuedeClasificacion(clasificacionData.ok)
      setCodigos(codigoData.rows)
      setPuedeCodigo(codigoData.ok)
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

  useEffect(() => {
    if (!bodegaLocked || !lockedBodega || editingId) return
    setBodegaId(lockedBodega.id)
  }, [bodegaLocked, lockedBodega, editingId])

  useEffect(() => {
    if (!subBodegaId) {
      setStandsDeSub([])
      return
    }

    const bodega = bodegas.find((item) => item.id === bodegaId)
    const sub = bodega?.subBodegas?.find((item) => item.id === subBodegaId)
    if (sub && ((sub.stands?.length ?? 0) > 0 || (sub.totalStands ?? 0) === 0)) {
      setStandsDeSub(sub.stands ?? [])
      return
    }

    let cancelled = false
    getStandsBySubBodega(subBodegaId)
      .then((rows) => {
        if (!cancelled) setStandsDeSub(rows)
      })
      .catch(() => {
        if (!cancelled) setStandsDeSub(sub?.stands ?? [])
      })

    return () => {
      cancelled = true
    }
  }, [bodegaId, bodegas, subBodegaId])

  // La vista de detalle vuelve con ?editar=<id> para abrir el modal de edición,
  // porque editar un elemento no tiene página propia. Se espera a que carguen
  // los elementos y las bodegas, que son las que openEdit usa para preseleccionar.
  useEffect(() => {
    const requested = searchParams.get('editar')
    if (!requested || loading || !elementos.length) return

    const target = elementos.find((item) => String(item.id) === requested)
    if (target) openEdit(target)

    setSearchParams({}, { replace: true })
  }, [elementos, loading, searchParams, setSearchParams])

  function openCreate() {
    const lockedId = bodegaLocked && lockedBodega ? lockedBodega.id : 0
    setEditingId(null)
    setForm({ ...emptyForm })
    setItemSearch('')
    setBodegaId(lockedId)
    setSubBodegaId(0)
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  function openEdit(item: ElementoApi) {
    const lugar = lugarDelElemento(item, bodegas)
    setEditingId(item.id)
    setForm({
      idItem: item.idItem ?? 0,
      idStand: item.idStand,
      cantidad: item.cantidad,
      gramaje: item.gramaje == null ? '' : String(item.gramaje),
      estado: item.estado,
      idUnidadMedida: item.idUnidadMedida,
      codigo: item.codigo,
      descripcion: item.descripcion ?? '',
      marca: item.marca ?? '',
      color: item.color ?? '',
      urlFotografia: item.urlFotografia ?? '',
      idClasificacion: item.idClasificacion ?? 0,
      valorUnitarioPromedio:
        item.valorUnitarioPromedio == null ? '' : String(item.valorUnitarioPromedio),
      porcentajeAumento: item.porcentajeAumento == null ? '' : String(item.porcentajeAumento),
      idCodigoEstandar: item.idCodigoEstandar ?? 0,
    })
    setItemSearch('')
    setBodegaId(lugar.bodegaId)
    setSubBodegaId(lugar.subBodegaId)
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  function updateForm<K extends keyof ElementoForm>(key: K, value: ElementoForm[K]) {
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

    const cantidad = Number(form.cantidad)
    if (!form.idItem) {
      setError('Selecciona el ítem de este elemento.')
      setSaving(false)
      return
    }

    if (!isAdmin && bodegas.length === 0) {
      setError('No tienes una bodega asignada. El administrador debe afiliarte una antes de registrar elementos.')
      setSaving(false)
      return
    }

    if (!subBodegaId) {
      setError('Selecciona la sub-bodega.')
      setSaving(false)
      return
    }

    if (!form.idStand) {
      setError('Selecciona el stand de la sub-bodega.')
      setSaving(false)
      return
    }

    if (!Number.isFinite(cantidad) || cantidad < 10) {
      setError('La cantidad mínima de un elemento es 10.')
      setSaving(false)
      return
    }

    const gramajeText = form.gramaje.trim()
    const gramaje = gramajeText === '' ? null : Number(gramajeText)
    if (gramaje !== null && (!Number.isFinite(gramaje) || gramaje < 0)) {
      setError('El gramaje debe ser un número mayor o igual a 0.')
      setSaving(false)
      return
    }

    const valor = optionalNumber(form.valorUnitarioPromedio)
    const porcentaje = optionalNumber(form.porcentajeAumento)
    if (valor instanceof Error || porcentaje instanceof Error) {
      setError('El valor unitario y el porcentaje de aumento deben ser números mayores o iguales a 0.')
      setSaving(false)
      return
    }

    const payload: CreateElementoPayload = {
      idItem: Number(form.idItem),
      idStand: Number(form.idStand),
      cantidad,
      estado: form.estado,
      idUnidadMedida: Number(form.idUnidadMedida),
      codigo: form.codigo.trim(),
      descripcion: form.descripcion.trim() || null,
      marca: form.marca.trim() || null,
      color: form.color.trim() || null,
      urlFotografia: form.urlFotografia.trim() || null,
      ...(gramaje !== null ? { gramaje } : editingId ? { gramaje: null } : {}),
      ...optionalId('idClasificacion', form.idClasificacion, Boolean(editingId)),
      ...optionalId('idCodigoEstandar', form.idCodigoEstandar, Boolean(editingId)),
      ...(valor !== undefined || editingId
        ? { valorUnitarioPromedio: valor ?? null }
        : {}),
      ...(porcentaje !== undefined || editingId
        ? { porcentajeAumento: porcentaje ?? null }
        : {}),
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

  const itemTerm = foldSearch(itemSearch)
  const itemOptions = items.filter((item) => {
    const visible = item.estado || item.id === form.idItem
    const matchesTerm =
      !itemTerm ||
      foldSearch(`${item.nombre} ${item.subcategoria?.nombre ?? ''} ${item.id}`).includes(itemTerm)
    return visible && matchesTerm
  })
  const selectedItem = items.find((item) => item.id === form.idItem) ?? null
  const subBodegas = (bodegas.find((bodega) => bodega.id === bodegaId)?.subBodegas ?? []).filter(
    (sub) => sub.estado || sub.id === subBodegaId,
  )
  const valorPreview = previewValorConAumento(
    Number(form.cantidad),
    optionalNumber(form.valorUnitarioPromedio),
    optionalNumber(form.porcentajeAumento),
  )

  return (
    <AppLayout title="Gestionar elementos">
      <PageHeader
        title="Gestionar elementos"
        description="El elemento es el stock de un ítem. La cantidad mínima es 10."
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
          placeholder="Buscar por código, nombre, ítem o categoría..."
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
                    pageRows.map((item) => {
                      const lugar = lugarDelElemento(item, bodegas)
                      const subcategoria = subcategoryOfElemento(item, items)
                      return (
                      <TableRow key={item.id}>
                        <td className="px-5 py-4">
                          <p className="truncate font-semibold text-sena-text">
                            {item.nombre}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-sena-text/45">
                            {item.codigo}
                            {subcategoria ? ` · ${subcategoria}` : ''}
                            {' · '}
                            {item.item
                              ? `Ítem ${item.item.id} · ${item.item.nombre}`
                              : 'Sin ítem'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="truncate font-medium text-sena-dark">{lugar.bodega}</p>
                          <p className="mt-0.5 truncate text-xs text-sena-text/45">
                            {lugar.subBodega} · {lugar.stand}
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
                      )
                    })
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
          description="El nombre se copia del ítem. El valor con aumento lo calcula el sistema."
          onClose={() => !saving && setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="elemento-buscar-item"
                label="Buscar ítem"
                value={itemSearch}
                onChange={(event) => setItemSearch(event.target.value)}
                placeholder="Nombre del producto"
              />
              <SelectField
                id="elemento-item"
                label="Ítem *"
                value={form.idItem}
                onChange={(value) => updateForm('idItem', Number(value))}
                options={itemOptions.map((item) => ({
                  value: item.id,
                  label: item.subcategoria?.nombre
                    ? `${item.nombre} · ${item.subcategoria.nombre}`
                    : item.nombre,
                }))}
                required
              />
              {bodegaLocked && lockedBodega ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-sena-text/75">Bodega</span>
                  <div className="flex h-11 items-center rounded-lg bg-sena-muted px-3.5 text-sm font-medium text-sena-text">
                    {lockedBodega.nombre}
                  </div>
                  <p className="text-xs text-sena-text/55">
                    Queda en la bodega asignada. Eliges la sub-bodega y el stand.
                  </p>
                </div>
              ) : !isAdmin && bodegas.length === 0 ? (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-sena-text/75">Bodega</span>
                  <p className="rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text/70">
                    No tienes una bodega asignada. Pide al administrador que te afilie una.
                  </p>
                </div>
              ) : (
                <SelectField
                  id="elemento-bodega"
                  label={isAdmin ? 'Bodega *' : 'Bodega asignada *'}
                  value={bodegaId}
                  onChange={(value) => {
                    setBodegaId(Number(value))
                    setSubBodegaId(0)
                    updateForm('idStand', 0)
                  }}
                  options={bodegas
                    .filter((item) => item.estado || item.id === bodegaId)
                    .map((item) => ({ value: item.id, label: item.nombre }))}
                  required
                />
              )}
              <SelectField
                id="elemento-sub-bodega"
                label="Sub-bodega *"
                value={subBodegaId}
                onChange={(value) => {
                  setSubBodegaId(Number(value))
                  updateForm('idStand', 0)
                }}
                options={subBodegas.map((item) => ({ value: item.id, label: item.nombre }))}
                required
              />
              <SelectField
                id="elemento-stand"
                label="Stand *"
                value={form.idStand}
                onChange={(value) => updateForm('idStand', Number(value))}
                options={standsDeSub
                  .filter((item) => item.estado || item.id === form.idStand)
                  .map((item) => ({ value: item.id, label: item.nombre }))}
                required
              />
              <SelectField
                id="elemento-unidad"
                label="Unidad de medida *"
                value={form.idUnidadMedida}
                onChange={(value) => updateForm('idUnidadMedida', Number(value))}
                options={unidades
                  .filter((item) => item.estado || item.id === form.idUnidadMedida)
                  .map((item) => ({
                    value: item.id,
                    label: `${item.nombre} (${item.abreviatura})`,
                  }))}
                required
              />
              {puedeClasificacion ? (
                <SelectField
                  id="elemento-clasificacion"
                  label="Clasificación"
                  value={form.idClasificacion}
                  onChange={(value) => updateForm('idClasificacion', Number(value))}
                  options={clasificacionOptions(clasificaciones, elementos, editingId).map((item) => ({
                    value: item.id,
                    label: item.nombre,
                  }))}
                />
              ) : null}
              {puedeCodigo ? (
                <SelectField
                  id="elemento-unspsc"
                  label="Código UNSPSC"
                  value={form.idCodigoEstandar}
                  onChange={(value) => updateForm('idCodigoEstandar', Number(value))}
                  options={codigoOptions(codigos, elementos, editingId).map((item) => ({
                    value: item.id,
                    label: `${item.codigo} · ${item.nombre}`,
                  }))}
                />
              ) : null}
              <TextField
                id="elemento-codigo"
                label="Código *"
                value={form.codigo}
                onChange={(event) => updateForm('codigo', event.target.value)}
                required
              />
              <TextField
                id="elemento-cantidad"
                label="Cantidad * (mínimo 10)"
                type="number"
                min="10"
                step="1"
                value={form.cantidad}
                onChange={(event) => updateForm('cantidad', Number(event.target.value))}
                required
              />
              <TextField
                id="elemento-gramaje"
                label="Gramaje"
                type="number"
                min="0"
                step="any"
                value={form.gramaje}
                onChange={(event) => updateForm('gramaje', event.target.value)}
              />
              <TextField
                id="elemento-marca"
                label="Marca"
                value={form.marca}
                onChange={(event) => updateForm('marca', event.target.value)}
              />
              <TextField
                id="elemento-color"
                label="Color"
                value={form.color}
                onChange={(event) => updateForm('color', event.target.value)}
              />
              <TextField
                id="elemento-valor"
                label="Valor unitario promedio"
                type="number"
                min="0"
                step="any"
                value={form.valorUnitarioPromedio}
                onChange={(event) => updateForm('valorUnitarioPromedio', event.target.value)}
              />
              <TextField
                id="elemento-porcentaje"
                label="Porcentaje de aumento"
                type="number"
                min="0"
                step="any"
                value={form.porcentajeAumento}
                onChange={(event) => updateForm('porcentajeAumento', event.target.value)}
                placeholder="15"
              />
            </div>

            <p className="rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text/70">
              Valor con aumento:{' '}
              <span className="font-semibold text-sena-text">
                {valorPreview == null ? '—' : formatCantidad(valorPreview)}
              </span>
              . El sistema lo calcula: cantidad × valor unitario × (1 + porcentaje / 100). Escribe 15 para un 15 %.
            </p>

            {selectedItem ? (
              <p className="rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text/70">
                El elemento toma el nombre del ítem
                {selectedItem.subcategoria?.nombre ? ` y la subcategoría ${selectedItem.subcategoria.nombre}` : ''}.
                {selectedItem.descripcion ? ` ${selectedItem.descripcion}` : ''}
              </p>
            ) : null}

            {itemOptions.length === 0 ? (
              <p className="text-sm text-sena-text/65">
                No hay ítems para esta búsqueda.{' '}
                <button
                  type="button"
                  className="font-semibold text-sena"
                  onClick={() => navigate('/inventario/items')}
                >
                  Crear ítem
                </button>
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="elemento-url" label="URL de fotografía" type="url" value={form.urlFotografia} onChange={(event) => updateForm('urlFotografia', event.target.value)} placeholder="https://..." />
              <label className="flex items-center gap-3 rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text">
                <input type="checkbox" checked={form.estado} onChange={(event) => updateForm('estado', event.target.checked)} className="size-4 accent-sena" />
                Elemento activo
              </label>
            </div>

            <div>
              <label htmlFor="elemento-descripcion" className="text-sm font-medium text-sena-text/75">Descripción técnica</label>
              <textarea id="elemento-descripcion" value={form.descripcion} onChange={(event) => updateForm('descripcion', event.target.value)} rows={4} className="mt-1.5 w-full rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20" />
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

function optionalNumber(value: string) {
  const text = value.trim()
  if (!text) return undefined
  const number = Number(text)
  if (!Number.isFinite(number) || number < 0) return new Error('invalid')
  return number
}

function optionalId(
  key: 'idClasificacion' | 'idCodigoEstandar',
  value: number,
  editing: boolean,
): Partial<CreateElementoPayload> {
  if (value) return { [key]: value }
  if (editing) return { [key]: null }
  return {}
}

function previewValorConAumento(
  cantidad: number,
  valor: number | undefined | Error,
  porcentaje: number | undefined | Error,
) {
  if (typeof valor !== 'number' || typeof porcentaje !== 'number' || !Number.isFinite(cantidad)) {
    return null
  }
  return cantidad * valor * (1 + porcentaje / 100)
}

function clasificacionOptions(
  rows: ClasificacionElementoApi[],
  elementos: ElementoApi[],
  editingId: number | null,
) {
  const current = elementos.find((item) => item.id === editingId)?.clasificacion
  if (!current || rows.some((item) => item.id === current.id)) return rows
  return [{ id: current.id, nombre: current.nombre, estado: true }, ...rows]
}

function codigoOptions(rows: CodigoEstandarApi[], elementos: ElementoApi[], editingId: number | null) {
  const current = elementos.find((item) => item.id === editingId)?.codigoEstandar
  if (!current || rows.some((item) => item.id === current.id)) return rows
  return [current, ...rows]
}

function foldSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

function relatedItem(elemento: ElementoApi, rows: ItemApi[]) {
  return elemento.idItem ? rows.find((item) => item.id === elemento.idItem) : undefined
}

function subcategoryOfElemento(elemento: ElementoApi, rows: ItemApi[]) {
  return elemento.subcategoria?.nombre || relatedItem(elemento, rows)?.subcategoria?.nombre || ''
}

function categoryOfElemento(elemento: ElementoApi, rows: ItemApi[]) {
  const related = relatedItem(elemento, rows)
  return {
    id: related?.subcategoria?.idCategoria ?? 0,
    nombre: related?.subcategoria?.categoria?.nombre ?? '',
  }
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
