import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { StatusPill } from '../components/modules/ResourceBoard'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import TextField from '../components/ui/TextField'
import { PlusIcon, SearchIcon } from '../components/icons/AppIcons'
import { cn } from '../lib/cn'
import { ApiError, api } from '../lib/api'
import type { ManagedUser, UserFormOptions } from '../types/profile'

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
  active: true,
}

type ModalMode = 'create' | 'edit'

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [options, setOptions] = useState<UserFormOptions>({ roles: [], centers: [] })
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
    setForm((current) => ({ ...current, [field]: value }))
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
      const updated = await api<ManagedUser>(`/users/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
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
      <div className="rounded-2xl bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-sena-text">Usuarios</h1>
            <p className="mt-1 max-w-2xl text-sm text-sena-text/60">
              Cree cuentas y asígneles un perfil. Los módulos los ve cada persona según el perfil.
            </p>
          </div>
          <Button
            type="button"
            icon={<PlusIcon className="size-4" />}
            onClick={openCreate}
            className="h-11 shrink-0 rounded-xl"
          >
            Nuevo usuario
          </Button>
        </div>

        {listError ? <p className="mt-4 text-sm text-red-700">{listError}</p> : null}
        {message ? <p className="mt-4 text-sm text-sena">{message}</p> : null}

        <label className="mt-6 flex h-11 w-full max-w-md items-center gap-2 rounded-xl bg-sena-muted px-3">
          <SearchIcon className="size-4 text-sena-text/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar usuario..."
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-sena-text/40"
          />
        </label>

        {loading ? (
          <p className="mt-6 text-sm text-sena-text/60">Cargando usuarios…</p>
        ) : (
          <>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-sena-dark/10 text-sena-text/55">
                    <th className="px-3 py-3 font-medium">Nombre</th>
                    <th className="px-3 py-3 font-medium">Documento</th>
                    <th className="px-3 py-3 font-medium">Correo</th>
                    <th className="px-3 py-3 font-medium">Perfil</th>
                    <th className="px-3 py-3 font-medium">Centro</th>
                    <th className="px-3 py-3 font-medium">Estado</th>
                    <th className="px-3 py-3 font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length ? (
                    pageRows.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-sena-dark/8 last:border-b-0 hover:bg-sena-muted/80"
                      >
                        <td className="px-3 py-3 font-medium text-sena-text">{user.fullName}</td>
                        <td className="px-3 py-3 text-sena-text/70">
                          {user.documentType} {user.documentId}
                        </td>
                        <td className="px-3 py-3 text-sena-text/70">{user.email}</td>
                        <td className="px-3 py-3 text-sena-text">{user.role}</td>
                        <td className="max-w-[220px] truncate px-3 py-3 text-sena-text/70">
                          {user.trainingCenter || '—'}
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill tone={user.active ? 'ok' : 'danger'}>
                            {user.active ? 'Activo' : 'Inactivo'}
                          </StatusPill>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            className="text-sm font-semibold text-sena hover:underline"
                            onClick={() => openEdit(user)}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-sena-text/50">
                        No hay usuarios que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-sena-text/50">
                Mostrando {from} - {to} de {filtered.length} registros
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={cn(
                      'grid size-8 place-items-center rounded-lg text-sm',
                      item === currentPage ? 'bg-sena text-white' : 'text-sena-text/60 hover:bg-sena-muted',
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {modal ? (
        <Modal
          title={editing ? 'Editar usuario' : 'Registrar usuario'}
          description={
            editing
              ? 'Cambie el perfil para que, al entrar, vea solo los módulos de ese perfil.'
              : 'Complete los datos y asígnele un perfil. Los módulos salen de ese perfil.'
          }
          onClose={closeModal}
          wide
        >
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={editing ? handleUpdate : handleCreate}>
            <UserFields form={form} options={options} onChange={patchForm} editing={editing} />
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
            {formError ? <p className="text-sm text-red-700 sm:col-span-2">{formError}</p> : null}
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

function UserFields({
  form,
  options,
  onChange,
  editing = false,
}: {
  form: typeof EMPTY_FORM
  options: UserFormOptions
  onChange: (field: keyof typeof EMPTY_FORM, value: string | boolean) => void
  editing?: boolean
}) {
  const documentOptions = DOCUMENT_TYPES.includes(form.tipoDocumento)
    ? DOCUMENT_TYPES
    : [form.tipoDocumento, ...DOCUMENT_TYPES]

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
      <label htmlFor={id} className="text-sm font-medium text-sena-text/75">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="h-11 w-full rounded-lg border border-transparent bg-sena-muted px-3.5 text-sm text-sena-text outline-none focus:border-sena focus:bg-white focus:ring-2 focus:ring-sena/20"
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
