import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { EyeIcon, PencilIcon, PlusIcon, TrashIcon } from '@/shared/components/icons/AppIcons'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import Toast from '@/shared/components/ui/Toast'
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
import CrearCatalogoModal, {
  type CatalogoCreado,
} from '@/modules/inventario/components/CrearCatalogoModal'
import ElementoFoto, { fotoUrlDelElemento } from '@/modules/inventario/components/ElementoFoto'
import { getBodegas, getStandsBySubBodega } from '@/modules/inventario/data/bodega'
import { getAllCategorias } from '@/modules/inventario/data/categoria'
import { getAllItems } from '@/modules/inventario/data/item'
import { useInventoryCenterOptional } from '@/modules/inventario/centerScope'
import {
  categoriesOfCenter,
  centerIdFromBodega,
  elementosOfBodegas,
  itemsOfCenter,
} from '@/modules/inventario/lib/centro'
import {
  createElemento,
  getClasificacionesActivas,
  getCodigosEstandar,
  getElementos,
  getUnidadesMedida,
  getUsosPresupuestales,
  updateElemento,
  uploadElementoFotografia,
} from '@/modules/inventario/data/elemento'
import { formatCantidad, lugarDelElemento } from '@/modules/inventario/lib/lugar'
import type { BodegaApi, StandResumen } from '@/modules/inventario/types/bodega'
import type { ItemApi } from '@/modules/inventario/types/item'
import type {
  CatalogoElementoKind,
  ClasificacionElementoApi,
  CodigoEstandarApi,
  CreateElementoPayload,
  ElementoApi,
  UnidadMedidaApi,
  UsoPresupuestalApi,
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
  idClasificacion: number
  valorUnitarioPromedio: string
  porcentajeAumento: string
  idCodigoEstandar: number
  idUsoPresupuestal: number
}

type CatalogFlag = { forbidden: boolean; failed: boolean }

type CatalogAccess = {
  unidad: CatalogFlag
  clasificacion: CatalogFlag
  codigo: CatalogFlag
  uso: CatalogFlag
}

const clearFlag: CatalogFlag = { forbidden: false, failed: false }

const emptyCatalogAccess: CatalogAccess = {
  unidad: clearFlag,
  clasificacion: clearFlag,
  codigo: clearFlag,
  uso: clearFlag,
}

const ELEMENTO_STEPS = [
  { label: 'Producto', hint: 'Elige el ítem. El nombre del elemento se copia de ahí.' },
  { label: 'Ubicación', hint: 'Bodega, sub-bodega y stand donde queda el stock.' },
  { label: 'Catálogo', hint: 'Unidad del centro, código interno y clasificaciones.' },
  { label: 'Existencia', hint: 'Cantidad, valor, foto y datos opcionales.' },
] as const

const LAST_STEP = ELEMENTO_STEPS.length - 1

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
  idClasificacion: 0,
  valorUnitarioPromedio: '',
  porcentajeAumento: '',
  idCodigoEstandar: 0,
  idUsoPresupuestal: 0,
}

export default function ElementosPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAdmin, user } = useAuth()
  const centerId = useInventoryCenterOptional()?.centerId ?? null
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
  const [usos, setUsos] = useState<UsoPresupuestalApi[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogAccess, setCatalogAccess] = useState<CatalogAccess>(emptyCatalogAccess)
  const [quickKind, setQuickKind] = useState<CatalogoElementoKind | null>(null)
  const [standsDeSub, setStandsDeSub] = useState<StandResumen[]>([])
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const clearNotice = useCallback(() => setNotice(null), [])
  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ElementoForm>(emptyForm)
  const [itemSearch, setItemSearch] = useState('')
  const [bodegaId, setBodegaId] = useState(0)
  const [subBodegaId, setSubBodegaId] = useState(0)
  const [elementoToDisable, setElementoToDisable] = useState<ElementoApi | null>(null)
  const [disabling, setDisabling] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoGuardada, setFotoGuardada] = useState<string | null>(null)

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

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(filtered, page, 5)

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
      const [elementoData, itemData, categoryData, bodegaData] = await Promise.all([
        getElementos(),
        getAllItems(),
        getAllCategorias(),
        getBodegas(centerId ? { idCformacion: centerId } : undefined),
      ])
      const categoriasDelCentro = categoriesOfCenter(categoryData, centerId)
      setElementos(elementosOfBodegas(elementoData, bodegaData, centerId))
      setItems(itemsOfCenter(itemData, categoryData, centerId))
      setCategories(categoriasDelCentro)
      setBodegas(bodegaData)
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
  }, [centerId])

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    }
  }, [fotoPreview])

  useEffect(() => {
    if (!bodegaLocked || !lockedBodega || editingId) return
    setBodegaId(lockedBodega.id)
  }, [bodegaLocked, lockedBodega, editingId])

  const selectedBodega = bodegas.find((item) => item.id === bodegaId)
  const bodegaCenterId = centerIdFromBodega(selectedBodega, {
    isAdmin,
    trainingCenterId: user?.trainingCenterId,
  })

  useEffect(() => {
    if (!modalOpen) return

    if (!bodegaCenterId) {
      setUnidades([])
      setClasificaciones([])
      setCodigos([])
      setUsos([])
      setCatalogAccess(emptyCatalogAccess)
      setCatalogLoading(false)
      return
    }

    let cancelled = false
    setCatalogLoading(true)
    setUnidades([])
    setClasificaciones([])
    setCodigos([])
    setUsos([])
    setCatalogAccess(emptyCatalogAccess)

    Promise.all([
      readCatalog(() => getUnidadesMedida(bodegaCenterId)),
      readCatalog(() => getClasificacionesActivas(bodegaCenterId)),
      readCatalog(() => getCodigosEstandar(bodegaCenterId)),
      readCatalog(() => getUsosPresupuestales(bodegaCenterId)),
    ])
      .then(([unidadData, clasificacionData, codigoData, usoData]) => {
        if (cancelled) return
        setUnidades(unidadData.rows)
        setClasificaciones(clasificacionData.rows)
        setCodigos(codigoData.rows)
        setUsos(usoData.rows)
        setCatalogAccess({
          unidad: flagOf(unidadData),
          clasificacion: flagOf(clasificacionData),
          codigo: flagOf(codigoData),
          uso: flagOf(usoData),
        })
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [bodegaCenterId, modalOpen])

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
    setFotoFile(null)
    setFotoPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setFotoGuardada(null)
    setStep(0)
    setReached(0)
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
      idClasificacion: item.idClasificacion ?? 0,
      valorUnitarioPromedio:
        item.valorUnitarioPromedio == null ? '' : String(item.valorUnitarioPromedio),
      porcentajeAumento: item.porcentajeAumento == null ? '' : String(item.porcentajeAumento),
      idCodigoEstandar: item.idCodigoEstandar ?? 0,
      idUsoPresupuestal: item.idUsoPresupuestal ?? 0,
    })
    setItemSearch(item.item?.nombre ?? item.nombre)
    setBodegaId(lugar.bodegaId)
    setSubBodegaId(lugar.subBodegaId)
    setFotoFile(null)
    setFotoPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setFotoGuardada(fotoUrlDelElemento(item.id, item.urlFotografia))
    setStep(0)
    setReached(LAST_STEP)
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  function updateForm<K extends keyof ElementoForm>(key: K, value: ElementoForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function pickFoto(file: File | null) {
    if (file) {
      const invalid = fotoInvalida(file)
      if (invalid) {
        setError(invalid)
        return
      }
    }
    setFotoPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return file ? URL.createObjectURL(file) : null
    })
    setFotoFile(file)
    if (file) setError(null)
  }

  function clearFoto() {
    pickFoto(null)
  }

  function stepError(current: number) {
    if (current === 0 && !form.idItem) return 'Selecciona el ítem de este elemento.'

    if (current === 1) {
      if (!isAdmin && bodegas.length === 0) {
        return 'No tienes una bodega asignada. El administrador debe afiliarte una antes de registrar elementos.'
      }
      if (!bodegaId) return 'Selecciona la bodega.'
      if (!subBodegaId) return 'Selecciona la sub-bodega.'
      if (!form.idStand) return 'Selecciona el stand de la sub-bodega.'
    }

    if (current === 2) {
      if (!bodegaCenterId) {
        return 'Esta bodega no trae el centro de formación. No se pueden cargar sus catálogos.'
      }
      if (!form.idUnidadMedida) {
        return unidades.length === 0
          ? 'Este centro no tiene unidades de medida. Crea una antes de guardar el elemento.'
          : 'Selecciona la unidad de medida de este centro.'
      }
      if (!form.codigo.trim()) return 'Escribe el código interno del inventario.'
      const taken = elementos.some(
        (row) =>
          row.id !== editingId &&
          row.codigo.trim().toLocaleLowerCase('es') === form.codigo.trim().toLocaleLowerCase('es'),
      )
      if (taken) {
        return 'Ese código interno ya lo tiene otro elemento. Escribe uno distinto.'
      }
    }

    if (current === 3) {
      const cantidad = Number(form.cantidad)
      if (!Number.isFinite(cantidad) || cantidad < 10) return 'La cantidad mínima de un elemento es 10.'
      const gramajeText = form.gramaje.trim()
      const gramaje = gramajeText === '' ? null : Number(gramajeText)
      if (gramaje !== null && (!Number.isFinite(gramaje) || gramaje < 0)) {
        return 'El gramaje debe ser un número mayor o igual a 0.'
      }
      const valor = optionalNumber(form.valorUnitarioPromedio)
      const porcentaje = optionalNumber(form.porcentajeAumento)
      if (valor instanceof Error || porcentaje instanceof Error) {
        return 'El valor unitario y el porcentaje de aumento deben ser números mayores o iguales a 0.'
      }
    }

    return null
  }

  function goToStep(next: number) {
    if (next === step) return
    if (next < step) {
      setStep(next)
      setError(null)
      return
    }
    if (next > reached + 1 && !editingId) return
    for (let index = step; index < next; index += 1) {
      const message = stepError(index)
      if (message) {
        setStep(index)
        setError(message)
        return
      }
    }
    setStep(next)
    setReached((current) => Math.max(current, next))
    setError(null)
  }

  function goNext() {
    goToStep(Math.min(step + 1, LAST_STEP))
  }

  function closeForm() {
    if (saving || quickKind) return
    setModalOpen(false)
    setStep(0)
    setReached(0)
  }

  function changeBodega(nextId: number) {
    const nextBodega = bodegas.find((item) => item.id === nextId)
    const nextCenter = centerIdFromBodega(nextBodega, {
      isAdmin,
      trainingCenterId: user?.trainingCenterId,
    })
    const sameCenter = Boolean(nextCenter && nextCenter === bodegaCenterId)
    setBodegaId(nextId)
    setSubBodegaId(0)
    setQuickKind(null)
    if (sameCenter) {
      updateForm('idStand', 0)
      return
    }
    setUnidades([])
    setClasificaciones([])
    setCodigos([])
    setUsos([])
    setCatalogAccess(emptyCatalogAccess)
    setForm((current) => ({
      ...current,
      idStand: 0,
      idUnidadMedida: 0,
      idClasificacion: 0,
      idCodigoEstandar: 0,
      idUsoPresupuestal: 0,
    }))
  }

  function acceptCatalog(kind: CatalogoElementoKind, row: CatalogoCreado) {
    if (kind === 'unidad' && 'abreviatura' in row) {
      setUnidades((current) => sortByNombre([...current.filter((item) => item.id !== row.id), row]))
      updateForm('idUnidadMedida', row.id)
    } else if (kind === 'clasificacion' && !('codigo' in row) && !('abreviatura' in row)) {
      setClasificaciones((current) =>
        sortByNombre([...current.filter((item) => item.id !== row.id), row]),
      )
      updateForm('idClasificacion', row.id)
    } else if (kind === 'uso' && !('codigo' in row) && !('abreviatura' in row)) {
      setUsos((current) => sortByNombre([...current.filter((item) => item.id !== row.id), row]))
      updateForm('idUsoPresupuestal', row.id)
    } else if (kind === 'codigo' && 'codigo' in row) {
      setCodigos((current) => sortByNombre([...current.filter((item) => item.id !== row.id), row]))
      updateForm('idCodigoEstandar', row.id)
    }
    setQuickKind(null)
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
    if (step < LAST_STEP) {
      goNext()
      return
    }

    for (let index = 0; index <= LAST_STEP; index += 1) {
      const message = stepError(index)
      if (message) {
        setStep(index)
        setReached((current) => Math.max(current, index))
        setError(message)
        return
      }
    }

    setSaving(true)
    setError(null)
    setNotice(null)

    const cantidad = Number(form.cantidad)

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
      ...(gramaje !== null ? { gramaje } : editingId ? { gramaje: null } : {}),
      ...optionalId('idClasificacion', form.idClasificacion, Boolean(editingId)),
      ...optionalId('idCodigoEstandar', form.idCodigoEstandar, Boolean(editingId)),
      ...optionalId('idUsoPresupuestal', form.idUsoPresupuestal, Boolean(editingId)),
      ...(valor !== undefined || editingId
        ? { valorUnitarioPromedio: valor ?? null }
        : {}),
      ...(porcentaje !== undefined || editingId
        ? { porcentajeAumento: porcentaje ?? null }
        : {}),
    }

    try {
      let saved = editingId
        ? await updateElemento(editingId, payload)
        : await createElemento(payload)

      if (fotoFile) {
        try {
          saved = await uploadElementoFotografia(saved.id, fotoFile)
        } catch (caught) {
          setElementos((current) => {
            if (!editingId) return [...current, saved].sort((a, b) => a.id - b.id)
            return current.map((item) => (item.id === editingId ? saved : item))
          })
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'El elemento se guardó, pero no se pudo subir la fotografía.',
          )
          return
        }
      }

      setElementos((current) => {
        if (!editingId) return [...current, saved].sort((a, b) => a.id - b.id)
        return current.map((item) => (item.id === editingId ? saved : item))
      })
      setModalOpen(false)
      setNotice(
        editingId ? '¡Elemento actualizado exitosamente!' : '¡Elemento creado exitosamente!',
      )
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.message : 'No se pudo guardar el elemento.'
      if (/código interno ya lo tiene/i.test(message) || /codigo has already been taken/i.test(message)) {
        setStep(2)
        setReached((current) => Math.max(current, 2))
      }
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const itemTerm = foldSearch(itemSearch)
  const itemOptions = items.filter((item) => {
    const visible = item.estado || item.id === form.idItem
    const matchesTerm =
      !itemTerm ||
      foldSearch(
        [
          item.nombre,
          item.subcategoria?.nombre ?? '',
          item.subcategoria?.categoria?.nombre ?? '',
          String(item.id),
        ].join(' '),
      ).includes(itemTerm)
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

      {notice ? <Toast message={notice} onClose={clearNotice} /> : null}

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
                    <TableHeader width="w-[12%]">Foto</TableHeader>
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
                    <TableEmpty colSpan={6}>No se encontraron elementos.</TableEmpty>
                  ) : (
                    pageRows.map((item) => {
                      const lugar = lugarDelElemento(item, bodegas)
                      const subcategoria = subcategoryOfElemento(item, items)
                      return (
                      <TableRow key={item.id}>
                        <td className="px-5 py-4">
                          {item.urlFotografia ? (
                            <ElementoFoto
                              src={fotoUrlDelElemento(item.id, item.urlFotografia)}
                              alt={item.nombre}
                              className="size-14 rounded-xl object-cover ring-1 ring-sena-dark/8"
                            />
                          ) : (
                            <span className="grid size-14 place-items-center rounded-xl bg-sena-muted text-[10px] font-medium uppercase tracking-wide text-sena-text/40">
                              Sin foto
                            </span>
                          )}
                        </td>
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
          description={ELEMENTO_STEPS[step].hint}
          onClose={closeForm}
          wide
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <ol className="grid grid-cols-4 gap-2">
              {ELEMENTO_STEPS.map((item, index) => {
                const active = index === step
                const done = index < step
                const open = index <= reached
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      disabled={!open || saving}
                      onClick={() => goToStep(index)}
                      className={`flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition duration-150 ${
                        active
                          ? 'bg-sena/10 text-sena'
                          : done
                            ? 'text-sena-text hover:bg-sena-muted'
                            : 'text-sena-text/40'
                      } disabled:cursor-not-allowed`}
                    >
                      <span
                        className={`grid size-7 place-items-center rounded-full text-xs font-semibold ${
                          active || done ? 'bg-sena text-white' : 'bg-sena-muted text-sena-text/50'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-[11px] font-semibold leading-tight sm:text-xs">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ol>

            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="max-h-[min(52vh,440px)] overflow-y-auto pr-1">
            {step === 0 ? (
              <ItemPicker
                query={itemSearch}
                selected={selectedItem}
                options={itemOptions}
                hasAny={items.some((item) => item.estado || item.id === form.idItem)}
                onQuery={(value) => {
                  setItemSearch(value)
                  if (form.idItem) updateForm('idItem', 0)
                }}
                onPick={(item) => {
                  updateForm('idItem', item.id)
                  setItemSearch(item.nombre)
                }}
                onCreate={() => navigate('/inventario/items')}
              />
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4 sm:grid-cols-2">
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
                    onChange={(value) => changeBodega(Number(value))}
                    options={bodegas
                      .filter((item) => item.estado || item.id === bodegaId)
                      .map((item) => ({ value: item.id, label: item.nombre }))}
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
                />
                <SelectField
                  id="elemento-stand"
                  label="Stand *"
                  value={form.idStand}
                  onChange={(value) => updateForm('idStand', Number(value))}
                  options={standsDeSub
                    .filter((item) => item.estado || item.id === form.idStand)
                    .map((item) => ({ value: item.id, label: item.nombre }))}
                />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <CatalogSelect
                  id="elemento-unidad"
                  label="Unidad de medida *"
                  value={form.idUnidadMedida}
                  onChange={(value) => updateForm('idUnidadMedida', value)}
                  loading={catalogLoading}
                  hasBodega={bodegaId > 0}
                  centerId={bodegaCenterId}
                  access={catalogAccess.unidad}
                  emptyText="Este centro no tiene unidades de medida."
                  options={withCurrentUnidad(unidades, elementos, editingId, form.idUnidadMedida).map(
                    (item) => ({
                      value: item.id,
                      label: `${item.nombre} (${item.abreviatura})`,
                    }),
                  )}
                  canCreate={canCatalog(user?.permissions, isAdmin, 'unidad_medida.crear')}
                  onCreate={() => setQuickKind('unidad')}
                />
                <div className="flex flex-col gap-1.5">
                  <TextField
                    id="elemento-codigo"
                    label="Código *"
                    maxLength={50}
                    value={form.codigo}
                    onChange={(event) => updateForm('codigo', event.target.value)}
                  />
                  <p className="text-xs text-sena-text/55">
                    Código interno único. Si otro elemento ya lo tiene, no se guarda. No es el UNSPSC.
                  </p>
                </div>
                <CatalogSelect
                  id="elemento-clasificacion"
                  label="Clasificación"
                  value={form.idClasificacion}
                  onChange={(value) => updateForm('idClasificacion', value)}
                  loading={catalogLoading}
                  hasBodega={bodegaId > 0}
                  centerId={bodegaCenterId}
                  access={catalogAccess.clasificacion}
                  emptyText="Este centro no tiene clasificaciones."
                  options={withCurrentNombre(
                    clasificaciones,
                    form.idClasificacion,
                    elementos.find((item) => item.id === editingId)?.clasificacion?.nombre,
                  ).map((item) => ({ value: item.id, label: item.nombre }))}
                  canCreate={canCatalog(user?.permissions, isAdmin, 'clasificacion_elemento.crear')}
                  onCreate={() => setQuickKind('clasificacion')}
                />
                <CatalogSelect
                  id="elemento-unspsc"
                  label="Código UNSPSC"
                  value={form.idCodigoEstandar}
                  onChange={(value) => updateForm('idCodigoEstandar', value)}
                  loading={catalogLoading}
                  hasBodega={bodegaId > 0}
                  centerId={bodegaCenterId}
                  access={catalogAccess.codigo}
                  emptyText="Este centro no tiene códigos UNSPSC."
                  options={withCurrentCodigo(codigos, elementos, editingId, form.idCodigoEstandar).map(
                    (item) => ({
                      value: item.id,
                      label: `${item.codigo} · ${item.nombre}`,
                    }),
                  )}
                  canCreate={canCatalog(user?.permissions, isAdmin, 'codigo_estandar.crear')}
                  onCreate={() => setQuickKind('codigo')}
                />
                <CatalogSelect
                  id="elemento-uso"
                  label="Uso presupuestal"
                  value={form.idUsoPresupuestal}
                  onChange={(value) => updateForm('idUsoPresupuestal', value)}
                  loading={catalogLoading}
                  hasBodega={bodegaId > 0}
                  centerId={bodegaCenterId}
                  access={catalogAccess.uso}
                  emptyText="Este centro no tiene usos presupuestales."
                  options={withCurrentNombre(
                    usos,
                    form.idUsoPresupuestal,
                    elementos.find((item) => item.id === editingId)?.usoPresupuestal?.nombre,
                  ).map((item) => ({ value: item.id, label: item.nombre }))}
                  canCreate={canCatalog(user?.permissions, isAdmin, 'uso_presupuestal.crear')}
                  onCreate={() => setQuickKind('uso')}
                />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="elemento-cantidad"
                    label="Cantidad * (mínimo 10)"
                    type="number"
                    min="10"
                    step="1"
                    value={form.cantidad}
                    onChange={(event) => updateForm('cantidad', Number(event.target.value))}
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
                </div>
                <p className="rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text/70">
                  Valor con aumento:{' '}
                  <span className="font-semibold text-sena-text">
                    {valorPreview == null ? '—' : formatCantidad(valorPreview)}
                  </span>
                  . El sistema lo calcula: cantidad × valor unitario × (1 + porcentaje / 100). Escribe 15 para un 15 %.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FotoPicker
                    preview={fotoPreview}
                    current={fotoGuardada}
                    fileName={fotoFile?.name ?? null}
                    disabled={saving}
                    onPick={pickFoto}
                    onClear={clearFoto}
                  />
                  <label className="flex items-center gap-3 rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text">
                    <input
                      type="checkbox"
                      checked={form.estado}
                      onChange={(event) => updateForm('estado', event.target.checked)}
                      className="size-4 accent-sena"
                    />
                    Elemento activo
                  </label>
                </div>
                <div>
                  <label htmlFor="elemento-descripcion" className="text-sm font-medium text-sena-text/75">
                    Descripción técnica
                  </label>
                  <textarea
                    id="elemento-descripcion"
                    value={form.descripcion}
                    onChange={(event) => updateForm('descripcion', event.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20"
                  />
                </div>
              </div>
            ) : null}
            </div>

            <div className="flex justify-between gap-3 border-t border-sena-text/8 pt-5">
              <Button variant="secondary" type="button" onClick={closeForm} disabled={saving}>
                Cancelar
              </Button>
              <div className="flex gap-3">
                {step > 0 ? (
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => goToStep(step - 1)}
                    disabled={saving}
                  >
                    Atrás
                  </Button>
                ) : null}
                <Button type="submit" disabled={saving}>
                  {step < LAST_STEP
                    ? 'Siguiente'
                    : saving
                      ? 'Guardando...'
                      : editingId
                        ? 'Guardar cambios'
                        : 'Crear elemento'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      ) : null}

      {quickKind && modalOpen ? (
        <CrearCatalogoModal
          kind={quickKind}
          idCformacion={bodegaCenterId}
          isAdmin={isAdmin}
          onClose={() => setQuickKind(null)}
          onCreated={acceptCatalog}
        />
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
  key: 'idClasificacion' | 'idCodigoEstandar' | 'idUsoPresupuestal',
  value: number,
  editing: boolean,
): Partial<CreateElementoPayload> {
  if (value) return { [key]: value }
  if (editing) return { [key]: null }
  return {}
}

async function readCatalog<T>(request: () => Promise<T[]>) {
  try {
    return { rows: await request(), forbidden: false, failed: false }
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 403) {
      return { rows: [] as T[], forbidden: true, failed: false }
    }
    return { rows: [] as T[], forbidden: false, failed: true }
  }
}

function flagOf(result: { forbidden: boolean; failed: boolean }): CatalogFlag {
  return { forbidden: result.forbidden, failed: result.failed }
}

function canCatalog(permissions: string[] | undefined, isAdmin: boolean, code: string) {
  return isAdmin || permissions?.includes(code) === true
}

function sortByNombre<T extends { nombre: string }>(rows: T[]) {
  return [...rows].sort((left, right) => left.nombre.localeCompare(right.nombre, 'es'))
}

function withCurrentNombre<T extends { id: number; nombre: string }>(
  rows: T[],
  selectedId: number,
  currentName: string | undefined,
) {
  if (!selectedId || rows.some((item) => item.id === selectedId)) return rows
  return [{ id: selectedId, nombre: currentName || 'Selección actual' } as T, ...rows]
}

function withCurrentUnidad(
  rows: UnidadMedidaApi[],
  elementos: ElementoApi[],
  editingId: number | null,
  selectedId: number,
) {
  if (!selectedId || rows.some((item) => item.id === selectedId)) return rows
  const current = elementos.find((item) => item.id === editingId)?.unidadMedida
  return [
    {
      id: selectedId,
      nombre: current?.nombre || 'Selección actual',
      abreviatura: current?.abreviatura || '',
      estado: true,
    },
    ...rows,
  ]
}

function withCurrentCodigo(
  rows: CodigoEstandarApi[],
  elementos: ElementoApi[],
  editingId: number | null,
  selectedId: number,
) {
  if (!selectedId || rows.some((item) => item.id === selectedId)) return rows
  const current = elementos.find((item) => item.id === editingId)?.codigoEstandar
  return [
    {
      id: selectedId,
      codigo: current?.codigo || '',
      nombre: current?.nombre || 'Selección actual',
    },
    ...rows,
  ]
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

function CatalogSelect({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  loading,
  hasBodega,
  centerId,
  access,
  emptyText,
  canCreate,
  onCreate,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  options: Array<{ value: number; label: string }>
  required?: boolean
  loading: boolean
  hasBodega: boolean
  centerId: number | null
  access: CatalogFlag
  emptyText: string
  canCreate: boolean
  onCreate: () => void
}) {
  const placeholder = !hasBodega
    ? 'Elige la bodega'
    : !centerId
      ? 'Esta bodega no trae el centro de formación'
      : loading
        ? 'Cargando…'
        : access.forbidden
          ? 'Sin permiso para ver este catálogo'
          : access.failed
            ? 'No se pudo cargar'
            : options.length === 0
              ? emptyText
              : 'Selecciona...'
  const showCreate =
    Boolean(centerId) && !loading && !access.forbidden && !access.failed && options.length === 0 && canCreate

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-sena-text/75">
        {label}
      </label>
      <select
        id={id}
        value={value || ''}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={!centerId || loading || access.forbidden}
        required={required}
        className="h-11 w-full rounded-lg bg-sena-muted px-3.5 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {showCreate ? (
        <p className="text-xs text-sena-text/60">
          <button type="button" className="font-semibold text-sena" onClick={onCreate}>
            Crear en este centro
          </button>
        </p>
      ) : null}
    </div>
  )
}

function FotoPicker({
  preview,
  current,
  fileName,
  disabled,
  onPick,
  onClear,
}: {
  preview: string | null
  current: string | null
  fileName: string | null
  disabled: boolean
  onPick: (file: File | null) => void
  onClear: () => void
}) {
  const shown = preview || current

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    event.target.value = ''
    if (file) onPick(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-sena-text/75">Fotografía</span>
      <div className="flex items-center gap-3 rounded-lg bg-sena-muted px-3.5 py-3">
        {shown ? (
          preview ? (
            <img src={preview} alt="" className="size-14 rounded-xl object-cover ring-1 ring-sena-dark/8" />
          ) : (
            <ElementoFoto src={current} alt="" className="size-14 rounded-xl object-cover ring-1 ring-sena-dark/8" />
          )
        ) : (
          <span className="grid size-14 place-items-center rounded-xl bg-white text-[10px] font-medium uppercase tracking-wide text-sena-text/40">
            Sin foto
          </span>
        )}
        <div className="min-w-0 flex-1">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-white px-3.5 text-sm font-semibold text-sena-dark ring-1 ring-sena/20">
            Seleccionar archivo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={disabled}
              onChange={handleChange}
            />
          </label>
          <p className="mt-1 truncate text-xs text-sena-text/55">
            {fileName ?? 'JPG, PNG o WEBP. Máximo 8 MB. Se toma desde tu PC.'}
          </p>
          {preview ? (
            <button type="button" className="mt-1 text-xs font-semibold text-sena" onClick={onClear} disabled={disabled}>
              Quitar archivo
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function fotoInvalida(file: File) {
  const okType = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)
  const okName = /\.(jpe?g|png|webp)$/i.test(file.name)
  if (!okType && !okName) return 'La fotografía debe ser JPG, PNG o WEBP.'
  if (file.size > 8 * 1024 * 1024) return 'La fotografía no puede pesar más de 8 MB.'
  return null
}

function ItemPicker({
  query,
  selected,
  options,
  hasAny,
  onQuery,
  onPick,
  onCreate,
}: {
  query: string
  selected: ItemApi | null
  options: ItemApi[]
  hasAny: boolean
  onQuery: (value: string) => void
  onPick: (item: ItemApi) => void
  onCreate: () => void
}) {
  const shown = selected ? [] : options.slice(0, 8)
  const more = !selected && options.length > 8

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="elemento-item" className="text-sm font-medium text-sena-text/75">
          Ítem *
        </label>
        <input
          id="elemento-item"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Escribe el nombre, la categoría o la subcategoría"
          autoComplete="off"
          className="h-11 w-full rounded-lg bg-sena-muted px-3.5 text-sm text-sena-text outline-none placeholder:text-sena-text/40 focus:bg-white focus:ring-2 focus:ring-sena/20"
        />
        <p className="text-xs text-sena-text/55">
          {selected
            ? 'Escribe otro nombre si quieres cambiar el ítem.'
            : 'Los ítems aparecen abajo. Escribe para filtrar.'}
        </p>
      </div>

      {selected ? (
        <div className="rounded-xl bg-sena-muted px-3.5 py-3">
          <p className="text-sm font-semibold text-sena-text">{selected.nombre}</p>
          <p className="mt-0.5 text-xs text-sena-text/55">
            {[selected.subcategoria?.categoria?.nombre, selected.subcategoria?.nombre]
              .filter(Boolean)
              .join(' · ') || 'Sin categoría'}
            {` · Ítem ${selected.id}`}
          </p>
          {selected.descripcion ? (
            <p className="mt-2 text-sm text-sena-text/70">{selected.descripcion}</p>
          ) : (
            <p className="mt-2 text-sm text-sena-text/70">
              El elemento toma este nombre y esta subcategoría.
            </p>
          )}
        </div>
      ) : shown.length > 0 ? (
        <div className="space-y-2">
          <ul className="divide-y divide-sena-dark/8 overflow-hidden rounded-xl bg-sena-muted">
            {shown.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="flex w-full flex-col items-start px-3.5 py-3 text-left hover:bg-white"
                >
                  <span className="text-sm font-semibold text-sena-text">{item.nombre}</span>
                  <span className="mt-0.5 text-xs text-sena-text/55">
                    {[item.subcategoria?.categoria?.nombre, item.subcategoria?.nombre]
                      .filter(Boolean)
                      .join(' · ') || 'Sin categoría'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {more ? (
            <p className="text-xs text-sena-text/50">Hay más ítems. Sigue escribiendo para encontrarlos.</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-sena-text/65">
          {hasAny
            ? 'No hay ítems con ese texto. Prueba otra palabra o el nombre de la categoría.'
            : 'Este centro no tiene ítems.'}{' '}
          <button type="button" className="font-semibold text-sena" onClick={onCreate}>
            Crear ítem
          </button>
        </p>
      )}
    </div>
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
