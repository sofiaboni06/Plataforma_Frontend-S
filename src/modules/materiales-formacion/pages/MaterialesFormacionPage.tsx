import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  EyeIcon,
  PencilIcon,
  PlusIcon,
  ReportIcon,
  TrashIcon,
} from '@/shared/components/icons/AppIcons'
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
import ElementoFoto, { fotoUrlDelElemento } from '@/modules/inventario/components/ElementoFoto'
import {
  createMaterialFormacion,
  disableMaterialFormacion,
  getCatalogoElementos,
  getMaterialesFormacion,
  getProgramasOpciones,
  updateMaterialFormacion,
} from '@/modules/materiales-formacion/data/materialFormacion'
import type {
  MaterialFormacionApi,
  MaterialFormacionElemento,
  MaterialFormacionPrograma,
} from '@/modules/materiales-formacion/types'
import { useMaterialFormacionAccess } from '@/modules/materiales-formacion/useMaterialFormacionAccess'

type StatusFilter = 'Todos' | 'Activo' | 'Inactivo'

type MaterialForm = {
  idPrograma: number
  idElemento: number
  cantidadBase: string
  observaciones: string
  estado: boolean
}

const emptyForm: MaterialForm = {
  idPrograma: 0,
  idElemento: 0,
  cantidadBase: '',
  observaciones: '',
  estado: true,
}

export default function MaterialesFormacionPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { canCreate, canView, canEdit, canDelete } = useMaterialFormacionAccess()

  const { search, setSearch, page, setPage, resetPage } = useTableState()

  const [materiales, setMateriales] = useState<MaterialFormacionApi[]>([])
  const [programas, setProgramas] = useState<MaterialFormacionPrograma[]>([])
  const [elementos, setElementos] = useState<MaterialFormacionElemento[]>([])
  const [programaFilter, setProgramaFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<MaterialForm>(emptyForm)
  const [elementoSearch, setElementoSearch] = useState('')
  const [materialToDisable, setMaterialToDisable] = useState<MaterialFormacionApi | null>(null)
  const [disabling, setDisabling] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return materiales.filter((material) => {
      const elementoNombre = material.elemento?.nombre ?? ''
      const elementoCodigo = material.elemento?.codigo ?? ''
      const programaNombre = material.programa?.nombre ?? ''
      const programaCodigo = material.programa?.codigo ?? ''

      const matchesSearch =
        !term ||
        [
          elementoNombre,
          elementoCodigo,
          programaNombre,
          programaCodigo,
          material.observaciones ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)

      const matchesPrograma =
        programaFilter === 'Todos' || String(material.idPrograma) === programaFilter

      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activo' && material.estado) ||
        (statusFilter === 'Inactivo' && !material.estado)

      return matchesSearch && matchesPrograma && matchesStatus
    })
  }, [materiales, search, programaFilter, statusFilter])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(filtered, page)
  const hasActiveFilters =
    search.trim() !== '' || programaFilter !== 'Todos' || statusFilter !== 'Todos'

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [materialData, programaData, elementoData] = await Promise.all([
        getMaterialesFormacion(),
        getProgramasOpciones(),
        getCatalogoElementos().catch((caught: unknown) => {
          if (caught instanceof ApiError && caught.status === 403) return []
          throw caught
        }),
      ])
      setMateriales(materialData)
      setProgramas(programaData)
      setElementos(elementoData)
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudieron cargar los materiales de formación.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Materiales de formación | SENA'
    void loadData()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setElementoSearch('')
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  function openEdit(material: MaterialFormacionApi) {
    setEditingId(material.id)
    setForm({
      idPrograma: material.idPrograma,
      idElemento: material.idElemento,
      cantidadBase: String(material.cantidadBase),
      observaciones: material.observaciones ?? '',
      estado: material.estado,
    })
    setElementoSearch('')
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  useEffect(() => {
    const requested = searchParams.get('editar')
    if (!requested || loading || !materiales.length) return

    const target = materiales.find((material) => String(material.id) === requested)
    if (target) openEdit(target)

    setSearchParams({}, { replace: true })
  }, [materiales, loading, searchParams, setSearchParams])

  async function confirmDisable() {
    if (!materialToDisable) return

    setDisabling(true)
    setError(null)

    try {
      await disableMaterialFormacion(materialToDisable.id)
      setMateriales((current) =>
        current.map((material) =>
          material.id === materialToDisable.id ? { ...material, estado: false } : material,
        ),
      )
      setNotice(
        `El material “${materialToDisable.elemento?.nombre ?? ''}” quedó inhabilitado.`,
      )
      setMaterialToDisable(null)
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo inhabilitar el material de formación.',
      )
      setMaterialToDisable(null)
    } finally {
      setDisabling(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)

    const idPrograma = Number(form.idPrograma)
    if (!Number.isInteger(idPrograma) || idPrograma <= 0) {
      setError('Selecciona un programa de formación.')
      setSaving(false)
      return
    }

    const idElemento = Number(form.idElemento)
    if (!Number.isInteger(idElemento) || idElemento <= 0) {
      setError('Selecciona el elemento del inventario.')
      setSaving(false)
      return
    }

    const cantidadBase = Number(form.cantidadBase)
    if (!Number.isFinite(cantidadBase) || cantidadBase < 1) {
      setError('La cantidad base debe ser 1 o más.')
      setSaving(false)
      return
    }

    const observaciones = form.observaciones.trim()

    try {
      const saved = editingId
        ? await updateMaterialFormacion(editingId, {
            idPrograma,
            idElemento,
            cantidadBase,
            observaciones: observaciones || null,
            estado: form.estado,
          })
        : await createMaterialFormacion({
            idPrograma,
            idElemento,
            cantidadBase,
            ...(observaciones ? { observaciones } : {}),
            estado: form.estado,
          })

      setMateriales((current) => {
        if (!editingId) return [saved, ...current]
        return current.map((material) => (material.id === editingId ? saved : material))
      })
      setModalOpen(false)
      setNotice(
        editingId
          ? 'Material de formación actualizado correctamente.'
          : 'Material de formación creado correctamente.',
      )
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo guardar el material de formación.',
      )
    } finally {
      setSaving(false)
    }
  }

  const programaOptions = useMemo(() => {
    const options = programas.map((programa) => ({
      value: programa.id,
      label: `${programa.codigo} · ${programa.nombre}`,
    }))

    // Un programa dado de baja sigue apareciendo mientras edite su material.
    const actual = editingId ? materiales.find((material) => material.id === editingId) : null
    if (
      actual?.programa &&
      !options.some((option) => option.value === actual.idPrograma)
    ) {
      options.unshift({
        value: actual.idPrograma,
        label: `${actual.programa.codigo} · ${actual.programa.nombre}`,
      })
    }

    return options
  }, [programas, materiales, editingId])

  const elementoOptions = useMemo(() => {
    const term = elementoSearch.trim().toLowerCase()

    const opciones = elementos
      .filter((elemento) => elemento.estado || elemento.id === form.idElemento)
      .filter(
        (elemento) =>
          !term ||
          [elemento.nombre, elemento.codigo ?? ''].join(' ').toLowerCase().includes(term),
      )
      .map((elemento) => ({
        value: elemento.id,
        label: elemento.codigo
          ? `${elemento.nombre} — ${elemento.codigo}`
          : elemento.nombre,
      }))

    // El elemento elegido no se pierde aunque esté inactivo o fuera del filtro.
    if (form.idElemento && !opciones.some((option) => option.value === form.idElemento)) {
      const actual = elementos.find((elemento) => elemento.id === form.idElemento)
      if (actual) {
        opciones.unshift({
          value: actual.id,
          label: actual.codigo ? `${actual.nombre} — ${actual.codigo}` : actual.nombre,
        })
      }
    }

    return opciones
  }, [elementos, elementoSearch, form.idElemento])

  return (
    <AppLayout title="Materiales de formación" showCenterBanner={false}>
      <PageHeader
        icon={<ReportIcon />}
        title="Materiales de formación"
        description="Qué elemento del inventario necesita cada programa de formación y con qué cantidad base. El stock sigue siendo de bodega: aquí solo se planifica por programa."
        action={
          canCreate ? (
            <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreate}>
              Crear material
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
          placeholder="Buscar por elemento, código o programa..."
        />

        <FilterGroup label="Programa">
          <select
            value={programaFilter}
            onChange={(event) => {
              setProgramaFilter(event.target.value)
              resetPage()
            }}
            className={`${filterSelectClass} lg:w-64`}
          >
            <option value="Todos">Todos</option>
            {programas.map((programa) => (
              <option key={programa.id} value={String(programa.id)}>
                {programa.codigo} · {programa.nombre}
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
            setProgramaFilter('Todos')
            setStatusFilter('Todos')
          }}
          disabled={!hasActiveFilters}
        />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando materiales..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width={tableColumns.name}>Material</TableHeader>
                    <TableHeader width={tableColumns.relation}>Programa</TableHeader>
                    <TableHeader align="center" width={tableColumns.count}>
                      Cantidad base
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
                    <TableEmpty colSpan={5}>
                      No se encontraron materiales de formación.
                    </TableEmpty>
                  ) : (
                    pageRows.map((material) => (
                      <TableRow key={material.id}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ElementoFoto
                              src={fotoUrlDelElemento(
                                material.elemento?.id ?? 0,
                                material.elemento?.urlFotografia,
                              )}
                              alt=""
                              className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-sena-dark/8"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-sena-text">
                                {material.elemento?.nombre ?? 'Elemento no disponible'}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-sena-text/45">
                                {[
                                  material.elemento?.codigo,
                                  material.elemento?.unidadMedida?.abreviatura,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || 'Sin código'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="truncate font-medium text-sena-dark">
                            {material.programa?.nombre ?? '—'}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-sena-text/45">
                            {material.programa
                              ? `${material.programa.codigo} · v${material.programa.version}`
                              : 'Sin programa'}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-semibold text-sena-dark">
                            {material.cantidadBase}
                          </span>
                          <span className="ml-1 text-xs text-sena-text/55">
                            {material.elemento?.unidadMedida?.abreviatura ?? ''}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={material.estado ? 'ok' : 'danger'}>
                            {material.estado ? 'Activo' : 'Inactivo'}
                          </StatusPill>
                        </td>
                        <td className="px-5 py-4">
                          <RowActions>
                            {canView ? (
                              <ActionButton
                                title="Ver material"
                                onClick={() => navigate(`/materiales/${material.id}`)}
                              >
                                <EyeIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                            {canEdit ? (
                              <ActionButton
                                title="Editar material"
                                onClick={() => openEdit(material)}
                              >
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                            {canDelete ? (
                              <ActionButton
                                title="Inhabilitar material"
                                danger
                                disabled={!material.estado}
                                onClick={() => setMaterialToDisable(material)}
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
              noun="materiales"
            />
          </>
        )}
      </TableCard>

      {modalOpen ? (
        <Modal
          title={editingId ? 'Editar material de formación' : 'Nuevo material de formación'}
          description="Asigna un elemento del inventario a un programa con la cantidad base de referencia. El elemento no se copia: solo se referencia."
          onClose={() => !saving && setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            {programaOptions.length === 0 ? (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No hay programas de formación activos. Primero se deben registrar los programas
                para poder crear materiales.
              </div>
            ) : null}

            <SelectField
              id="material-programa"
              label="Programa de formación *"
              value={form.idPrograma}
              onChange={(value) =>
                setForm((current) => ({ ...current, idPrograma: Number(value) }))
              }
              options={programaOptions}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="material-elemento-search" className="form-label">
                Elemento del inventario *
              </label>
              <TextField
                id="material-elemento-search"
                label="Buscar elemento"
                value={elementoSearch}
                onChange={(event) => setElementoSearch(event.target.value)}
                placeholder="Nombre o código del elemento..."
              />
              <select
                id="material-elemento"
                value={form.idElemento || ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, idElemento: Number(event.target.value) }))
                }
                required
                className="h-11 w-full rounded-lg bg-sena-muted px-3.5 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20"
              >
                <option value="">Selecciona...</option>
                {elementoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-sena-text/50">
                Solo se muestran los elementos activos del catálogo.
              </p>
            </div>

            <TextField
              id="material-cantidad"
              label="Cantidad base *"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={form.cantidadBase}
              onChange={(event) =>
                setForm((current) => ({ ...current, cantidadBase: event.target.value }))
              }
              placeholder="5"
              required
            />

            <div>
              <label
                htmlFor="material-observaciones"
                className="text-sm font-medium text-sena-text/75"
              >
                Observaciones
              </label>
              <textarea
                id="material-observaciones"
                value={form.observaciones}
                onChange={(event) =>
                  setForm((current) => ({ ...current, observaciones: event.target.value }))
                }
                rows={3}
                maxLength={1000}
                placeholder="Detalles del material para el programa..."
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
              Material activo
            </label>

            <div className="flex justify-end gap-3 border-t border-sena-text/8 pt-5">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || programaOptions.length === 0}>
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear material'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {materialToDisable ? (
        <ConfirmDialog
          title="Inhabilitar material de formación"
          subtitle="El material quedará inactivo para este programa; las solicitudes existentes conservan su historial."
          confirmLabel="Inhabilitar"
          pendingLabel="Inhabilitando..."
          pending={disabling}
          onConfirm={() => void confirmDisable()}
          onCancel={() => setMaterialToDisable(null)}
        >
          ¿Estás seguro de que deseas inhabilitar el material{' '}
          <strong>{materialToDisable.elemento?.nombre ?? ''}</strong> del programa{' '}
          <strong>{materialToDisable.programa?.nombre ?? ''}</strong>?
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
