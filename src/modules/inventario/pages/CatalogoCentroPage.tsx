import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  InventoryIcon,
  PencilIcon,
  PlusIcon,
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
import { useAuth } from '@/modules/auth/context/auth'
import { useInventoryCenterOptional } from '@/modules/inventario/centerScope'
import {
  createClasificacion,
  createCodigoEstandar,
  createUnidadMedida,
  createUsoPresupuestal,
  deleteCodigoEstandar,
  disableClasificacion,
  disableUnidadMedida,
  disableUsoPresupuestal,
  getClasificaciones,
  getCodigosEstandar,
  getUnidadesMedidaTodas,
  getUsosPresupuestalesTodos,
  updateClasificacion,
  updateCodigoEstandar,
  updateUnidadMedida,
  updateUsoPresupuestal,
} from '@/modules/inventario/data/elemento'
import type { CatalogoElementoKind } from '@/modules/inventario/types/elemento'

type StatusFilter = 'Todos' | 'Activa' | 'Inactiva'

type CatalogRow = {
  id: number
  nombre: string
  estado?: boolean
  abreviatura?: string
  codigo?: string
}

type CatalogDraft = {
  nombre: string
  abreviatura?: string
  codigo?: string
  estado?: boolean
  idCformacion?: number
}

type CatalogConfig = {
  title: string
  heading: string
  singular: string
  nuevo: string
  noun: string
  empty: string
  searchPlaceholder: string
  hasEstado: boolean
  removesRow: boolean
  permissions: { create: string; edit: string; remove: string }
  fields: Array<{ key: 'nombre' | 'abreviatura' | 'codigo'; label: string; max: number }>
  load: (centerId: number | null) => Promise<CatalogRow[]>
  create: (draft: CatalogDraft) => Promise<CatalogRow>
  update: (id: number, draft: CatalogDraft) => Promise<CatalogRow>
  remove: (id: number) => Promise<unknown>
  disableTitle: string
  disableBody: (nombre: string) => string
  disabledNotice: (nombre: string) => string
}

const CONFIGS: Record<CatalogoElementoKind, CatalogConfig> = {
  clasificacion: {
    title: 'Clasificaciones',
    heading: 'Clasificaciones del elemento',
    singular: 'clasificación',
    nuevo: 'Nueva clasificación',
    noun: 'clasificaciones',
    empty: 'Este centro no tiene clasificaciones.',
    searchPlaceholder: 'Buscar clasificación...',
    hasEstado: true,
    removesRow: false,
    permissions: {
      create: 'clasificacion_elemento.crear',
      edit: 'clasificacion_elemento.editar',
      remove: 'clasificacion_elemento.eliminar',
    },
    fields: [{ key: 'nombre', label: 'Nombre *', max: 150 }],
    load: (centerId) => getClasificaciones(centerId),
    create: (draft) => createClasificacion(draft),
    update: (id, draft) => updateClasificacion(id, { nombre: draft.nombre, estado: draft.estado }),
    remove: (id) => disableClasificacion(id),
    disableTitle: 'Inhabilitar clasificación',
    disableBody: (nombre) => `¿Deseas inhabilitar ${nombre}? Deja de aparecer en el elemento.`,
    disabledNotice: (nombre) => `“${nombre}” quedó inhabilitada.`,
  },
  unidad: {
    title: 'Unidades de medida',
    heading: 'Unidades de medida',
    singular: 'unidad de medida',
    nuevo: 'Nueva unidad',
    noun: 'unidades',
    empty: 'Este centro no tiene unidades de medida.',
    searchPlaceholder: 'Buscar unidad...',
    hasEstado: true,
    removesRow: false,
    permissions: {
      create: 'unidad_medida.crear',
      edit: 'unidad_medida.editar',
      remove: 'unidad_medida.eliminar',
    },
    fields: [
      { key: 'nombre', label: 'Nombre *', max: 80 },
      { key: 'abreviatura', label: 'Abreviatura *', max: 20 },
    ],
    load: (centerId) => getUnidadesMedidaTodas(centerId),
    create: (draft) =>
      createUnidadMedida({
        nombre: draft.nombre,
        abreviatura: draft.abreviatura ?? '',
        estado: draft.estado,
        idCformacion: draft.idCformacion,
      }),
    update: (id, draft) =>
      updateUnidadMedida(id, {
        nombre: draft.nombre,
        abreviatura: draft.abreviatura,
        estado: draft.estado,
      }),
    remove: (id) => disableUnidadMedida(id),
    disableTitle: 'Inhabilitar unidad',
    disableBody: (nombre) => `¿Deseas inhabilitar ${nombre}? Deja de aparecer en el elemento.`,
    disabledNotice: (nombre) => `“${nombre}” quedó inhabilitada.`,
  },
  uso: {
    title: 'Usos presupuestales',
    heading: 'Usos presupuestales',
    singular: 'uso presupuestal',
    nuevo: 'Nuevo uso presupuestal',
    noun: 'usos presupuestales',
    empty: 'Este centro no tiene usos presupuestales.',
    searchPlaceholder: 'Buscar uso presupuestal...',
    hasEstado: true,
    removesRow: false,
    permissions: {
      create: 'uso_presupuestal.crear',
      edit: 'uso_presupuestal.editar',
      remove: 'uso_presupuestal.eliminar',
    },
    fields: [{ key: 'nombre', label: 'Nombre *', max: 200 }],
    load: (centerId) => getUsosPresupuestalesTodos(centerId),
    create: (draft) => createUsoPresupuestal(draft),
    update: (id, draft) => updateUsoPresupuestal(id, { nombre: draft.nombre, estado: draft.estado }),
    remove: (id) => disableUsoPresupuestal(id),
    disableTitle: 'Inhabilitar uso presupuestal',
    disableBody: (nombre) => `¿Deseas inhabilitar ${nombre}? Deja de aparecer en el elemento.`,
    disabledNotice: (nombre) => `“${nombre}” quedó inhabilitado.`,
  },
  codigo: {
    title: 'Códigos UNSPSC',
    heading: 'Códigos UNSPSC',
    singular: 'código UNSPSC',
    nuevo: 'Nuevo código UNSPSC',
    noun: 'códigos',
    empty: 'Este centro no tiene códigos UNSPSC.',
    searchPlaceholder: 'Buscar código o nombre...',
    hasEstado: false,
    removesRow: true,
    permissions: {
      create: 'codigo_estandar.crear',
      edit: 'codigo_estandar.editar',
      remove: 'codigo_estandar.eliminar',
    },
    fields: [
      { key: 'codigo', label: 'Código UNSPSC *', max: 20 },
      { key: 'nombre', label: 'Nombre *', max: 200 },
    ],
    load: (centerId) => getCodigosEstandar(centerId),
    create: (draft) =>
      createCodigoEstandar({
        codigo: draft.codigo ?? '',
        nombre: draft.nombre,
        idCformacion: draft.idCformacion,
      }),
    update: (id, draft) => updateCodigoEstandar(id, { codigo: draft.codigo, nombre: draft.nombre }),
    remove: (id) => deleteCodigoEstandar(id),
    disableTitle: 'Borrar código UNSPSC',
    disableBody: (nombre) =>
      `¿Deseas borrar ${nombre}? Si algún elemento lo usa, no se borra.`,
    disabledNotice: (nombre) => `“${nombre}” se borró.`,
  },
}

function allowed(isAdmin: boolean, permissions: string[] | undefined, code: string) {
  return isAdmin || permissions?.includes(code) === true
}

export default function CatalogoCentroPage({ kind }: { kind: CatalogoElementoKind }) {
  const config = CONFIGS[kind]
  const { isAdmin, user } = useAuth()
  const center = useInventoryCenterOptional()
  const centerId = isAdmin ? (center?.centerId ?? null) : (user?.trainingCenterId ?? null)
  const centerName = isAdmin ? center?.centerName : user?.trainingCenter

  const canCreate = allowed(isAdmin, user?.permissions, config.permissions.create)
  const canEdit = allowed(isAdmin, user?.permissions, config.permissions.edit)
  const canDelete = allowed(isAdmin, user?.permissions, config.permissions.remove)

  const { search, setSearch, page, setPage, resetPage } = useTableState()
  const [rows, setRows] = useState<CatalogRow[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState<CatalogRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<CatalogDraft>({ nombre: '', estado: true })
  const [toDisable, setToDisable] = useState<CatalogRow | null>(null)
  const [disabling, setDisabling] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setRows(await config.load(centerId))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo cargar el catálogo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = `${config.title} | SENA`
    if (isAdmin && !centerId) {
      setRows([])
      setLoading(false)
      return
    }
    void load()
  }, [centerId, isAdmin, kind])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.nombre.toLowerCase().includes(term) ||
        (row.codigo ?? '').toLowerCase().includes(term) ||
        (row.abreviatura ?? '').toLowerCase().includes(term)
      const matchesStatus =
        !config.hasEstado ||
        statusFilter === 'Todos' ||
        (statusFilter === 'Activa' && row.estado !== false) ||
        (statusFilter === 'Inactiva' && row.estado === false)
      return matchesSearch && matchesStatus
    })
  }, [config.hasEstado, rows, search, statusFilter])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(filtered, page)
  const modalOpen = creating || editing !== null
  const columnCount = 2 + (config.fields.some((field) => field.key !== 'nombre') ? 1 : 0) + (config.hasEstado ? 1 : 0)

  function openCreate() {
    setCreating(true)
    setEditing(null)
    setDraft({ nombre: '', abreviatura: '', codigo: '', estado: true })
    setError(null)
  }

  function openEdit(row: CatalogRow) {
    setCreating(false)
    setEditing(row)
    setDraft({
      nombre: row.nombre,
      abreviatura: row.abreviatura ?? '',
      codigo: row.codigo ?? '',
      estado: row.estado !== false,
    })
    setError(null)
  }

  function closeModal() {
    if (saving) return
    setCreating(false)
    setEditing(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nombre = draft.nombre.trim()
    const abreviatura = draft.abreviatura?.trim() ?? ''
    const codigo = draft.codigo?.trim() ?? ''

    if (!nombre) {
      setError('Escribe el nombre.')
      return
    }
    if (config.fields.some((field) => field.key === 'abreviatura') && !abreviatura) {
      setError('Escribe la abreviatura.')
      return
    }
    if (config.fields.some((field) => field.key === 'codigo') && !codigo) {
      setError('Escribe el código UNSPSC.')
      return
    }

    const payload: CatalogDraft = {
      nombre,
      ...(config.fields.some((field) => field.key === 'abreviatura') ? { abreviatura } : {}),
      ...(config.fields.some((field) => field.key === 'codigo') ? { codigo } : {}),
      ...(config.hasEstado ? { estado: draft.estado !== false } : {}),
      ...(creating && isAdmin && centerId ? { idCformacion: centerId } : {}),
    }

    try {
      setSaving(true)
      setError(null)
      if (editing) await config.update(editing.id, payload)
      else await config.create(payload)
      setNotice(editing ? 'Cambios guardados.' : 'Registro creado en este centro.')
      setCreating(false)
      setEditing(null)
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDisable() {
    if (!toDisable) return
    try {
      setDisabling(true)
      setError(null)
      await config.remove(toDisable.id)
      setNotice(config.disabledNotice(toDisable.nombre))
      setToDisable(null)
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo completar la acción.')
      setToDisable(null)
    } finally {
      setDisabling(false)
    }
  }

  const description = centerName
    ? `${config.heading} de ${centerName}. Cada centro tiene las suyas. Un centro nuevo llega vacío.`
    : `${config.heading}. Cada centro tiene las suyas.`

  return (
    <AppLayout title={config.title}>
      <PageHeader
        icon={<InventoryIcon />}
        title={config.heading}
        description={description}
        action={
          canCreate ? (
            <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreate}>
              {config.nuevo}
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
        <SearchInput value={search} onChange={setSearch} placeholder={config.searchPlaceholder} />
        {config.hasEstado ? (
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
        ) : null}
        <ClearFiltersButton
          onClick={() => {
            setSearch('')
            setStatusFilter('Todos')
          }}
          disabled={search.trim() === '' && statusFilter === 'Todos'}
        />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando catálogo…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    {config.fields.some((field) => field.key === 'codigo') ? (
                      <TableHeader width={tableColumns.relation}>Código</TableHeader>
                    ) : null}
                    <TableHeader width={tableColumns.name}>Nombre</TableHeader>
                    {config.fields.some((field) => field.key === 'abreviatura') ? (
                      <TableHeader width={tableColumns.relation}>Abreviatura</TableHeader>
                    ) : null}
                    {config.hasEstado ? (
                      <TableHeader align="center" width={tableColumns.status}>
                        Estado
                      </TableHeader>
                    ) : null}
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={columnCount}>
                      {rows.length === 0 && search.trim() === '' && statusFilter === 'Todos'
                        ? config.empty
                        : 'No se encontraron registros.'}
                    </TableEmpty>
                  ) : (
                    pageRows.map((row) => (
                      <TableRow key={row.id}>
                        {config.fields.some((field) => field.key === 'codigo') ? (
                          <td className="px-5 py-4 font-semibold text-sena-text">{row.codigo}</td>
                        ) : null}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-sena-text">{row.nombre}</p>
                          <p className="mt-0.5 text-xs text-sena-text/45">ID {row.id}</p>
                        </td>
                        {config.fields.some((field) => field.key === 'abreviatura') ? (
                          <td className="px-5 py-4 text-sena-text">{row.abreviatura}</td>
                        ) : null}
                        {config.hasEstado ? (
                          <td className="px-5 py-4 text-center">
                            <StatusPill tone={row.estado === false ? 'danger' : 'ok'}>
                              {row.estado === false ? 'Inactiva' : 'Activa'}
                            </StatusPill>
                          </td>
                        ) : null}
                        <td className="px-5 py-4">
                          <RowActions>
                            {canEdit ? (
                              <ActionButton title="Editar" onClick={() => openEdit(row)}>
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                            {canDelete ? (
                              <ActionButton
                                title={config.removesRow ? 'Borrar' : 'Inhabilitar'}
                                danger
                                disabled={!config.removesRow && row.estado === false}
                                onClick={() => setToDisable(row)}
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
              noun={config.noun}
            />
          </>
        )}
      </TableCard>

      {modalOpen ? (
        <Modal
          title={editing ? `Editar ${config.singular}` : config.nuevo}
          description={
            editing
              ? 'El centro no se puede cambiar.'
              : centerName
                ? `Queda en ${centerName}.`
                : 'Queda en el centro de tu cuenta.'
          }
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}
            {config.fields.map((field) => (
              <TextField
                key={field.key}
                id={`catalogo-${field.key}`}
                label={field.label}
                maxLength={field.max}
                value={draft[field.key] ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                }
                required
              />
            ))}
            {config.hasEstado ? (
              <label className="flex items-center gap-3 rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text">
                <input
                  type="checkbox"
                  checked={draft.estado !== false}
                  onChange={(event) => setDraft((current) => ({ ...current, estado: event.target.checked }))}
                  className="size-4 accent-sena"
                />
                Activo
              </label>
            ) : null}
            <div className="flex justify-end gap-3 border-t border-sena-text/8 pt-5">
              <Button variant="secondary" type="button" onClick={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {toDisable ? (
        <ConfirmDialog
          title={config.disableTitle}
          subtitle={config.removesRow ? 'Esta acción borra la fila.' : 'No se borra. Deja de salir en el elemento.'}
          confirmLabel={config.removesRow ? 'Borrar' : 'Inhabilitar'}
          pendingLabel={config.removesRow ? 'Borrando…' : 'Inhabilitando…'}
          pending={disabling}
          onConfirm={() => void confirmDisable()}
          onCancel={() => setToDisable(null)}
        >
          {config.disableBody(toDisable.nombre)}
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}
