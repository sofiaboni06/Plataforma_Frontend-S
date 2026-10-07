import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import InventoryCenterBadge from '@/modules/inventario/components/InventoryCenterBadge'
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
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import {
  createObra,
  disableObra,
  getAllObras,
  updateObra,
  type ObraPayload,
} from '@/modules/inventario/data/obra'
import type { ObraApi } from '@/modules/solicitudes/types'

type StatusFilter = 'Todos' | 'Activa' | 'Inactiva'

type ObraDraft = {
  nombre: string
  lugar: string
  estado: boolean
}

const EMPTY_DRAFT: ObraDraft = { nombre: '', lugar: '', estado: true }

export default function ObrasPage() {
  const { user } = useAuth()
  const { permit } = useInventoryAccess()
  const canCreate = permit('obra.crear')
  const canEdit = permit('obra.editar')
  // El backend pide obra.eliminar para cualquier cambio de estado, también desde el modal.
  const canDisable = permit('obra.eliminar')

  const { search, setSearch, page, setPage, resetPage } = useTableState()
  const [rows, setRows] = useState<ObraApi[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState<ObraApi | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<ObraDraft>(EMPTY_DRAFT)
  const [toDisable, setToDisable] = useState<ObraApi | null>(null)
  const [disabling, setDisabling] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setRows(await getAllObras())
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar las obras.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Obras | SENA'
    void load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        `${row.nombre} ${row.lugar ?? ''}`.toLowerCase().includes(term)
      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activa' && row.estado) ||
        (statusFilter === 'Inactiva' && !row.estado)
      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(filtered, page)
  const modalOpen = creating || editing !== null
  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'Todos'

  function openCreate() {
    setCreating(true)
    setEditing(null)
    setDraft(EMPTY_DRAFT)
    setError(null)
  }

  function openEdit(row: ObraApi) {
    setCreating(false)
    setEditing(row)
    setDraft({ nombre: row.nombre, lugar: row.lugar ?? '', estado: row.estado })
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
    const lugar = draft.lugar.trim()

    if (!nombre) {
      setError('Escribe el nombre de la obra.')
      return
    }

    const payload: ObraPayload = {
      nombre,
      lugar: lugar || null,
      ...(editing && canDisable && draft.estado !== editing.estado ? { estado: draft.estado } : {}),
    }

    try {
      setSaving(true)
      setError(null)
      if (editing) await updateObra(editing.id, payload)
      else await createObra(payload)
      setNotice(editing ? 'Cambios guardados.' : 'Obra creada en tu centro de formación.')
      setCreating(false)
      setEditing(null)
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar la obra.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDisable() {
    if (!toDisable) return
    try {
      setDisabling(true)
      setError(null)
      await disableObra(toDisable.id)
      setNotice(`“${toDisable.nombre}” quedó inhabilitada.`)
      setToDisable(null)
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo inhabilitar la obra.')
      setToDisable(null)
    } finally {
      setDisabling(false)
    }
  }

  return (
    <AppLayout title="Obras" showCenterBanner={false}>
      <PageHeader
        icon={<InventoryIcon />}
        title="Obras"
        description="Obras de tu centro de formación. Las solicitudes de material y equipo se hacen para una obra activa."
        context={<InventoryCenterBadge />}
        action={
          canCreate ? (
            <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreate}>
              Nueva obra
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
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar obra o lugar..." />
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
        <ClearFiltersButton
          onClick={() => {
            setSearch('')
            setStatusFilter('Todos')
          }}
          disabled={!hasActiveFilters}
        />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando obras…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width={tableColumns.name}>Obra</TableHeader>
                    <TableHeader width={tableColumns.relation}>Lugar</TableHeader>
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
                    <TableEmpty colSpan={4}>
                      {rows.length === 0 && !hasActiveFilters
                        ? 'Tu centro todavía no tiene obras.'
                        : 'No se encontraron obras.'}
                    </TableEmpty>
                  ) : (
                    pageRows.map((row) => (
                      <TableRow key={row.id}>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-sena-text">{row.nombre}</p>
                          <p className="mt-0.5 text-xs text-sena-text/45">ID {row.id}</p>
                        </td>
                        <td className="truncate px-5 py-4 text-sena-text">{row.lugar || '—'}</td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={row.estado ? 'ok' : 'danger'}>
                            {row.estado ? 'Activa' : 'Inactiva'}
                          </StatusPill>
                        </td>
                        <td className="px-5 py-4">
                          <RowActions>
                            {canEdit ? (
                              <ActionButton title="Editar obra" onClick={() => openEdit(row)}>
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                            {canDisable ? (
                              <ActionButton
                                title="Inhabilitar obra"
                                danger
                                disabled={!row.estado}
                                onClick={() => setToDisable(row)}
                              >
                                <TrashIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                            {!canEdit && !canDisable ? (
                              <span className="text-xs text-sena-text/45">Solo lectura</span>
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
              noun="obras"
            />
          </>
        )}
      </TableCard>

      {modalOpen ? (
        <Modal
          title={editing ? 'Editar obra' : 'Nueva obra'}
          description={
            editing
              ? 'Las solicitudes que ya usan esta obra muestran el nombre nuevo.'
              : `Queda en tu centro de formación${user?.trainingCenter ? ` (${user.trainingCenter})` : ''}. No se vincula a una bodega.`
          }
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}
            <TextField
              id="obra-nombre"
              label="Nombre *"
              maxLength={150}
              value={draft.nombre}
              onChange={(event) => setDraft((current) => ({ ...current, nombre: event.target.value }))}
              required
            />
            <TextField
              id="obra-lugar"
              label="Lugar"
              maxLength={150}
              placeholder="Ej. Ambiente 204, sede norte"
              value={draft.lugar}
              onChange={(event) => setDraft((current) => ({ ...current, lugar: event.target.value }))}
            />
            {editing && canDisable ? (
              <label className="flex items-center gap-3 rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text">
                <input
                  type="checkbox"
                  checked={draft.estado}
                  onChange={(event) => setDraft((current) => ({ ...current, estado: event.target.checked }))}
                  className="size-4 accent-sena"
                />
                Activa
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
          title="Inhabilitar obra"
          subtitle="No se borra. Las solicitudes que la usan conservan su obra."
          confirmLabel="Inhabilitar"
          pendingLabel="Inhabilitando…"
          pending={disabling}
          onConfirm={() => void confirmDisable()}
          onCancel={() => setToDisable(null)}
        >
          ¿Deseas inhabilitar la obra <strong>{toDisable.nombre}</strong>? Deja de salir al crear
          una solicitud.
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}
