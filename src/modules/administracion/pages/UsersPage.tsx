import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import TextField from '@/shared/components/ui/TextField'
import { PencilIcon, PlusIcon, UserIcon } from '@/shared/components/icons/AppIcons'
import {
  ActionButton,
  ClearFiltersButton,
  ErrorBanner,
  FilterCard,
  PageHeader,
  SearchInput,
  TableCard,
  TableHeader,
  TablePagination,
  TableRow,
  tableClass,
  tableColumns,
} from '@/shared/components/DataTable'
import { ApiError, api } from '@/shared/lib/api'
import type { ManagedUser, UserFormOptions } from '@/shared/types/profile'

const PAGE_SIZE = 8
const DOCUMENT_TYPES = ['CC', 'TI', 'CE', 'PPT', 'PA']
const EMPTY_FORM = {
  nombres: '',
  apellidos: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  idPerfil: '',
  idCformacion: '',
  bodegaIds: [] as number[],
  active: true,
}

type ModalMode = 'create' | 'edit'

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [options, setOptions] = useState<UserFormOptions>({ roles: [], centers: [], bodegas: [] })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<ModalMode | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const closeModal = useCallback(() => {
    setModal(null)
    setSelectedId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }, [])

  const patchForm = (field: keyof typeof EMPTY_FORM, value: string | boolean) => {
    setForm((current) => {
      if (field === 'idCformacion' && value !== current.idCformacion) {
        return { ...current, idCformacion: String(value), bodegaIds: [] }
      }
      return { ...current, [field]: value }
    })
  }

  const toggleBodega = (bodegaId: number) => {
    setForm((current) => ({
      ...current,
      bodegaIds: current.bodegaIds.includes(bodegaId)
        ? current.bodegaIds.filter((id) => id !== bodegaId)
        : [...current.bodegaIds, bodegaId],
    }))
  }

  const loadUsers = async () => {
    const list = await api<ManagedUser[]>('/users')
    setUsers(list)
    return list
  }

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Usuarios | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const [list, nextOptions] = await Promise.all([
          api<ManagedUser[]>('/users'),
          api<UserFormOptions>('/users/options'),
        ])
        if (cancelled) return
        setUsers(list)
        setOptions(nextOptions)
      } catch (caught) {
        if (!cancelled) {
          setListError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar los usuarios.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) =>
      `${user.fullName} ${user.email} ${user.documentId} ${user.role}`.toLowerCase().includes(query),
    )
  }, [users, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search])

  const openCreate = () => {
    setSelectedId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setMessage(null)
    setModal('create')
  }

  const openEdit = (user: ManagedUser) => {
    setSelectedId(user.id)
    setFormError(null)
    setMessage(null)
    setForm({
      nombres: user.nombres,
      apellidos: user.apellidos,
      tipoDocumento: user.documentType,
      numeroDocumento: user.documentId,
      email: user.email,
      password: '',
      passwordConfirmation: '',
      idPerfil: String(user.roleId),
      idCformacion: String(user.trainingCenterId),
      bodegaIds: user.bodegaIds ?? [],
      active: user.active,
    })
    setModal('edit')
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setFormError(null)
    setMessage(null)
    try {
      const created = await api<ManagedUser>('/users', {
        method: 'POST',
        body: JSON.stringify({
          nombres: form.nombres,
          apellidos: form.apellidos,
          tipoDocumento: form.tipoDocumento,
          numeroDocumento: form.numeroDocumento,
          email: form.email,
          password: form.password,
          passwordConfirmation: form.passwordConfirmation,
          idPerfil: Number(form.idPerfil),
          idCformacion: Number(form.idCformacion),
          bodegaIds: isAdministratorRole(form.idPerfil, options) ? [] : form.bodegaIds,
        }),
      })
      const list = await loadUsers()
      const index = list.findIndex((user) => user.id === created.id)
      setPage(index >= 0 ? Math.floor(index / PAGE_SIZE) + 1 : 1)
      setMessage(`Usuario “${created.fullName}” creado con perfil ${created.role}.`)
      closeModal()
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'No se pudo crear el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedId) return
    setSaving(true)
    setFormError(null)
    setMessage(null)
    try {
      const payload: Record<string, unknown> = {
        nombres: form.nombres,
        apellidos: form.apellidos,
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
        email: form.email,
        idPerfil: Number(form.idPerfil),
        idCformacion: Number(form.idCformacion),
        active: form.active,
      }
      if (form.password) {
        payload.password = form.password
        payload.passwordConfirmation = form.passwordConfirmation
      }
      await api<ManagedUser>(`/users/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const updated = await api<ManagedUser>(`/users/${selectedId}/bodegas`, {
        method: 'PUT',
        body: JSON.stringify({
          bodegaIds: isAdministratorRole(form.idPerfil, options) ? [] : form.bodegaIds,
        }),
      })
      await loadUsers()
      setMessage(`Usuario actualizado. Perfil: ${updated.role}.`)
      closeModal()
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'No se pudo guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const from = filtered.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageRows.length
  const editing = modal === 'edit'

  return (
    <AppLayout title="Usuarios">
      <PageHeader
        icon={<UserIcon />}
        title="Usuarios"
        description="Cree cuentas, asígneles un perfil y las bodegas de su centro. Con esa bodega queda amarrado el inventario."
        action={
          <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreate}>
            Nuevo usuario
          </Button>
        }
      />

      {listError ? (
        <ErrorBanner message={listError} onClose={() => setListError(null)} />
      ) : null}

      {message ? (
        <p className="mb-4 rounded-2xl border border-sena-ok-line bg-sena-active-soft px-5 py-3.5 text-sm text-sena-ok-text">
          {message}
        </p>
      ) : null}

      <FilterCard>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar usuario..." />

        <ClearFiltersButton onClick={() => setSearch('')} disabled={!search} />
      </FilterCard>

      <TableCard>
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-sena-text-soft">Cargando usuarios…</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader width="w-[22%]">Nombre</TableHeader>
                    <TableHeader width={tableColumns.count}>Documento</TableHeader>
                    <TableHeader width="w-[22%]">Correo</TableHeader>
                    <TableHeader width={tableColumns.status}>Perfil</TableHeader>
                    <TableHeader width="w-[20%]">Centro</TableHeader>
                    <TableHeader align="center" width="w-[12%]">
                      Estado
                    </TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center text-sm text-sena-text-soft"
                      >
                        No hay usuarios que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((user) => (
                      <TableRow key={user.id}>
                        <td className="truncate font-semibold text-sena-text">{user.fullName}</td>

                        <td className="truncate text-sena-strong">
                          {user.documentType} {user.documentId}
                        </td>

                        <td className="truncate text-sena-strong">{user.email}</td>

                        <td className="truncate text-sena-text">{user.role}</td>

                        <td className="truncate text-sena-strong">
                          {user.trainingCenter || '—'}
                        </td>

                        <td className="text-center">
                          <StatusPill tone={user.active ? 'ok' : 'danger'}>
                            {user.active ? 'Activo' : 'Inactivo'}
                          </StatusPill>
                        </td>

                        <td>
                          <ActionButton title="Editar usuario" onClick={() => openEdit(user)}>
                            <PencilIcon className="size-[18px]" />
                          </ActionButton>
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
              total={filtered.length}
              noun="registros"
            />
          </>
        )}
      </TableCard>

      {modal ? (
        <Modal
          title={editing ? 'Editar usuario' : 'Registrar usuario'}
          description={
            editing
              ? 'El perfil define los módulos. Las bodegas definen de dónde ve y registra el inventario.'
              : 'Complete los datos, el perfil y las bodegas de su centro de formación.'
          }
          onClose={closeModal}
          wide
        >
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={editing ? handleUpdate : handleCreate}>
            <UserFields
              form={form}
              options={options}
              onChange={patchForm}
              onToggleBodega={toggleBodega}
              editing={editing}
            />
            {editing ? (
              <label className="flex items-center gap-2 text-sm text-sena-text sm:col-span-2">
                <input
                  type="checkbox"
                  className="size-4 accent-[#00a651]"
                  checked={form.active}
                  onChange={(event) => patchForm('active', event.target.checked)}
                />
                Cuenta activa
              </label>
            ) : null}
            {formError ? (
              <div className="rounded-xl bg-sena-danger-soft px-4 py-3 text-sm text-sena-danger-text ring-1 ring-sena-danger-line sm:col-span-2">
                {formError}
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {editing ? 'Guardar cambios' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppLayout>
  )
}

function isAdministratorRole(roleId: string, options: UserFormOptions) {
  return options.roles.find((role) => String(role.id) === roleId)?.name === 'Administrador'
}

function UserFields({
  form,
  options,
  onChange,
  onToggleBodega,
  editing = false,
}: {
  form: typeof EMPTY_FORM
  options: UserFormOptions
  onChange: (field: keyof typeof EMPTY_FORM, value: string | boolean) => void
  onToggleBodega: (bodegaId: number) => void
  editing?: boolean
}) {
  const documentOptions = DOCUMENT_TYPES.includes(form.tipoDocumento)
    ? DOCUMENT_TYPES
    : [form.tipoDocumento, ...DOCUMENT_TYPES]
  const administrator = isAdministratorRole(form.idPerfil, options)
  const centerBodegas = options.bodegas.filter(
    (bodega) => String(bodega.trainingCenterId) === form.idCformacion,
  )

  return (
    <>
      <TextField
        id="nombres"
        label="Nombres"
        value={form.nombres}
        onChange={(event) => onChange('nombres', event.target.value)}
        required
      />
      <TextField
        id="apellidos"
        label="Apellidos"
        value={form.apellidos}
        onChange={(event) => onChange('apellidos', event.target.value)}
        required
      />
      <SelectField
        id="tipoDocumento"
        label="Tipo de documento"
        value={form.tipoDocumento}
        onChange={(value) => onChange('tipoDocumento', value)}
        options={documentOptions.map((type) => ({ value: type, label: type }))}
      />
      <TextField
        id="numeroDocumento"
        label="Número de documento"
        value={form.numeroDocumento}
        onChange={(event) => onChange('numeroDocumento', event.target.value)}
        required
      />
      <TextField
        id="email"
        label="Correo"
        type="email"
        value={form.email}
        onChange={(event) => onChange('email', event.target.value)}
        required
      />
      <SelectField
        id="idPerfil"
        label="Perfil"
        value={form.idPerfil}
        onChange={(value) => onChange('idPerfil', value)}
        placeholder="Seleccione un perfil"
        options={options.roles.map((role) => ({ value: String(role.id), label: role.name }))}
      />
      <SelectField
        id="idCformacion"
        label="Centro de formación"
        value={form.idCformacion}
        onChange={(value) => onChange('idCformacion', value)}
        placeholder="Seleccione un centro"
        options={options.centers.map((center) => ({
          value: String(center.id),
          label: center.regional ? `${center.name} — ${center.regional}` : center.name,
        }))}
      />
      {administrator ? (
        <p className="text-sm text-sena-text/60 sm:col-span-2">
          El perfil Administrador ve todos los centros y todas las bodegas, así que no se le asigna una.
        </p>
      ) : (
        <div className="sm:col-span-2">
          <p className="text-sm font-medium text-sena-text/75">Bodegas del centro</p>
          <p className="mt-1 text-xs text-sena-text/55">
            Marca la bodega de esta persona, casi siempre una. Lo que puede hacer ahí lo defines en su perfil, en las funciones de Inventario.
          </p>
          {!form.idCformacion ? (
            <p className="mt-2 text-sm text-sena-text/55">Primero elige el centro de formación.</p>
          ) : centerBodegas.length === 0 ? (
            <p className="mt-2 text-sm text-sena-text/55">Este centro no tiene bodegas activas.</p>
          ) : (
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-sena-line bg-sena-veil/50 p-3">
              {centerBodegas.map((bodega) => (
                <label key={bodega.id} className="flex items-center gap-2 text-sm text-sena-text">
                  <input
                    type="checkbox"
                    className="size-4 accent-[#00a651]"
                    checked={form.bodegaIds.includes(bodega.id)}
                    onChange={() => onToggleBodega(bodega.id)}
                  />
                  {bodega.name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
      <TextField
        id="password"
        label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
        type="password"
        value={form.password}
        onChange={(event) => onChange('password', event.target.value)}
        required={!editing}
        minLength={6}
        autoComplete="new-password"
      />
      <TextField
        id="passwordConfirmation"
        label="Confirmar contraseña"
        type="password"
        value={form.passwordConfirmation}
        onChange={(event) => onChange('passwordConfirmation', event.target.value)}
        required={!editing || Boolean(form.password)}
        minLength={6}
        autoComplete="new-password"
      />
    </>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="form-field form-select"
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
