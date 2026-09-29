import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import { PencilIcon, PlusIcon, TrashIcon } from '@/shared/components/icons/AppIcons'
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
import {
  createClasificacion,
  disableClasificacion,
  getClasificaciones,
  updateClasificacion,
} from '@/modules/inventario/data/elemento'
import type { ClasificacionElementoApi } from '@/modules/inventario/types/elemento'
import { useAuth } from '@/modules/auth/context/auth'

type StatusFilter = 'Todos' | 'Activa' | 'Inactiva'

export default function ClasificacionesPage() {
  const { isAdmin, user } = useAuth()
  const canCreate = isAdmin || user?.permissions?.includes('clasificacion_elemento.crear') === true
  const canEdit = isAdmin || user?.permissions?.includes('clasificacion_elemento.editar') === true
  const canDelete = isAdmin || user?.permissions?.includes('clasificacion_elemento.eliminar') === true

  const { search, setSearch, page, setPage, resetPage } = useTableState()
  const [rows, setRows] = useState<ClasificacionElementoApi[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState<ClasificacionElementoApi | null>(null)
  const [creating, setCreating] = useState(false)
  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState(true)
  const [toDisable, setToDisable] = useState<ClasificacionElementoApi | null>(null)
  const [disabling, setDisabling] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setRows(await getClasificaciones())
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar las clasificaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Clasificaciones | SENA'
    void load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch = !term || row.nombre.toLowerCase().includes(term)
      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activa' && row.estado) ||
        (statusFilter === 'Inactiva' && !row.estado)
      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(filtered, page)
  const modalOpen = creating || editing !== null

  function openCreate() {
    setCreating(true)
    setEditing(null)
    setNombre('')
    setEstado(true)
    setError(null)
  }

  function openEdit(row: ClasificacionElementoApi) {
    setCreating(false)
    setEditing(row)
    setNombre(row.nombre)
    setEstado(row.estado)
    setError(null)
  }

  function closeModal() {
    if (saving) return
    setCreating(false)
    setEditing(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const clean = nombre.trim()
    if (!clean) {
      setError('Escribe el nombre de la clasificación.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      if (editing) {
        await updateClasificacion(editing.id, { nombre: clean, estado })
        setNotice('Clasificación actualizada.')
      } else {
        await createClasificacion({ nombre: clean, estado })
        setNotice('Clasificación creada.')
      }
      setCreating(false)
      setEditing(null)
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar la clasificación.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDisable() {
    if (!toDisable) return
    try {
      setDisabling(true)
      setError(null)
      await disableClasificacion(toDisable.id)
      setNotice(`“${toDisable.nombre}” quedó inhabilitada. Los elementos que ya la tenían siguen mostrando el nombre.`)
      setToDisable(null)
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo inhabilitar la clasificación.')
      setToDisable(null)
    } finally {
      setDisabling(false)
    }
  }

  return (
    <AppLayout title="Clasificaciones">
      <PageHeader
        title="Clasificaciones del elemento"
        description="Catálogo. En el elemento se envía el id, no el nombre."
        action={
          canCreate ? (
            <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreate}>
              Nueva clasificación
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
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar clasificación..." />
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
          disabled={search.trim() === '' && statusFilter === 'Todos'}
        />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando clasificaciones…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width={tableColumns.name}>Clasificación</TableHeader>
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
                    <TableEmpty colSpan={3}>No se encontraron clasificaciones.</TableEmpty>
                  ) : (
                    pageRows.map((row) => (
                      <TableRow key={row.id}>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-sena-text">{row.nombre}</p>
                          <p className="mt-0.5 text-xs text-sena-text/45">ID {row.id}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={row.estado ? 'ok' : 'danger'}>
                            {row.estado ? 'Activa' : 'Inactiva'}
                          </StatusPill>
                        </td>
                        <td className="px-5 py-4">
                          <RowActions>
                            {canEdit ? (
                              <ActionButton title="Editar clasificación" onClick={() => openEdit(row)}>
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                            {canDelete ? (
                              <ActionButton
                                title="Inhabilitar clasificación"
                                danger
                                disabled={!row.estado}
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
              noun="clasificaciones"
            />
          </>
        )}
      </TableCard>

      {modalOpen ? (
        <Modal
          title={editing ? 'Editar clasificación' : 'Nueva clasificación'}
          description="El listado del elemento solo ofrece las activas."
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}
            <TextField
              id="clasificacion-nombre"
              label="Nombre *"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              required
            />
            <label className="flex items-center gap-3 rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text">
              <input
                type="checkbox"
                checked={estado}
                onChange={(event) => setEstado(event.target.checked)}
                className="size-4 accent-sena"
              />
              Clasificación activa
            </label>
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
          title="Inhabilitar clasificación"
          subtitle="No se borra. El elemento que ya la tenía sigue mostrando el nombre."
          confirmLabel="Inhabilitar"
          pendingLabel="Inhabilitando…"
          pending={disabling}
          onConfirm={() => void confirmDisable()}
          onCancel={() => setToDisable(null)}
        >
          ¿Deseas inhabilitar <strong>{toDisable.nombre}</strong>?
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}
