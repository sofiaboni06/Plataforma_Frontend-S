import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import MultiSelectCombobox, {
  type ComboOption,
} from '@/shared/components/ui/MultiSelectCombobox'
import SweetAlert from '@/shared/components/ui/SweetAlert'
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
import { esPerfilProgramas } from '@/modules/materiales-formacion/lib/formacion'
import type { ProgramaFormacion } from '@/modules/materiales-formacion/types/formacion'
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
  programaIds: [] as number[],
  active: true,
}

type ModalMode = 'create' | 'edit'

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [options, setOptions] = useState<UserFormOptions>({ roles: [], centers: [], bodegas: [] })
  const [programs, setPrograms] = useState<ProgramaFormacion[]>([])
  const [programsLoading, setProgramsLoading] = useState(false)
  const [programsError, setProgramsError] = useState<string | null>(null)
  const [createdProgramUser, setCreatedProgramUser] = useState<{
    user: ManagedUser
    programs: ProgramaFormacion[]
    askBodega: boolean
  } | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<ModalMode | null>(null)
  const [successAlert, setSuccessAlert] = useState<{
    title: string
    text: string
    confirmLabel: string
    onConfirm: () => void
  } | null>(null)
  const [bodegaStep, setBodegaStep] = useState<ManagedUser | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const editingId = useRef<number | null>(null)

  const closeModal = useCallback(() => {
    editingId.current = null
    setModal(null)
    setSelectedId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setProgramsLoading(false)
    setProgramsError(null)
  }, [])

  const continueFromPrograms = () => {
    const flow = createdProgramUser
    setCreatedProgramUser(null)
    if (flow?.askBodega) setBodegaStep(flow.user)
  }

  const patchForm = (field: keyof typeof EMPTY_FORM, value: string | boolean) => {
    setForm((current) => {
      if (field === 'idCformacion' && value !== current.idCformacion) {
        return { ...current, idCformacion: String(value), bodegaIds: [], programaIds: [] }
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

  const togglePrograma = (programaId: number) => {
    setForm((current) => ({
      ...current,
      programaIds: current.programaIds.includes(programaId)
        ? current.programaIds.filter((id) => id !== programaId)
        : [...current.programaIds, programaId],
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

  const programasRole = isProgramasRole(form.idPerfil, options)

  useEffect(() => {
    if (!modal || !programasRole || !form.idCformacion) {
      setPrograms([])
      setProgramsLoading(false)
      setProgramsError(null)
      return
    }

    let cancelled = false
    setProgramsLoading(true)
    setProgramsError(null)

    api<ProgramaFormacion[]>(`/programas-formacion?idCformacion=${form.idCformacion}`)
      .then((list) => {
        if (!cancelled) setPrograms(list)
      })
      .catch((caught) => {
        if (!cancelled) {
          setProgramsError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudieron cargar los programas de este centro.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setProgramsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [modal, programasRole, form.idCformacion])

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
    setSuccessAlert(null)
    setModal('create')
  }

  const openEdit = (user: ManagedUser) => {
    editingId.current = user.id
    setSelectedId(user.id)
    setFormError(null)
    setSuccessAlert(null)
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
      programaIds: [],
      active: user.active,
    })
    setModal('edit')

    if (esPerfilProgramas(user.role)) {
      void api<ProgramaFormacion[]>(`/users/${user.id}/programas`)
        .then((current) => {
          if (editingId.current !== user.id) return
          setForm((draft) => ({
            ...draft,
            programaIds:
              draft.idCformacion === String(user.trainingCenterId)
                ? current.map((programa) => programa.id)
                : draft.programaIds,
          }))
        })
        .catch(() => undefined)
    }
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setFormError(null)
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
          programaIds: isProgramasRole(form.idPerfil, options) ? form.programaIds : [],
        }),
      })
      const list = await loadUsers()
      const index = list.findIndex((user) => user.id === created.id)
      setPage(index >= 0 ? Math.floor(index / PAGE_SIZE) + 1 : 1)

      const admin = isAdministratorRole(form.idPerfil, options)
      const askBodega = !admin
      closeModal()

      if (isProgramasRole(form.idPerfil, options)) {
        const assigned = await api<ProgramaFormacion[]>(`/users/${created.id}/programas`).catch(
          () => [] as ProgramaFormacion[],
        )
        setSuccessAlert({
          title: 'Usuario creado',
          text: `“${created.fullName}” con perfil ${created.role}. Siguiente paso: sus programas.`,
          confirmLabel: 'Ver programas',
          onConfirm: () => setCreatedProgramUser({ user: created, programs: assigned, askBodega }),
        })
      } else {
        setSuccessAlert({
          title: 'Usuario creado',
          text: `“${created.fullName}” con perfil ${created.role}.`,
          confirmLabel: 'Continuar',
          onConfirm: () => {
            if (askBodega) setBodegaStep(created)
          },
        })
      }
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
      if (isProgramasRole(form.idPerfil, options)) {
        await api<ProgramaFormacion[]>(`/users/${selectedId}/programas`, {
          method: 'PUT',
          body: JSON.stringify({ programaIds: form.programaIds }),
        })
      }
      await loadUsers()
      closeModal()
      setSuccessAlert({
        title: 'Usuario actualizado',
        text: `El perfil quedó como ${updated.role}.`,
        confirmLabel: 'Entendido',
        onConfirm: () => undefined,
      })
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'No se pudo guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const from = filtered.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageRows.length
  const editing = modal === 'edit'
  const createdPrograms = createdProgramUser?.programs ?? []

  return (
    <AppLayout title="Usuarios">
      <PageHeader
        icon={<UserIcon />}
        title="Usuarios"
        description="Cree cuentas, asígneles perfil, centro y programas. La bodega y las solicitudes se asignan después, cuando el usuario las necesite."
        action={
          <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreate}>
            Nuevo usuario
          </Button>
        }
      />

      {listError ? (
        <ErrorBanner message={listError} onClose={() => setListError(null)} />
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
              ? 'El perfil define los módulos. Aquí también puedes ajustar la bodega de solicitudes.'
              : 'Complete los datos, el perfil y el centro. Si es instructor o coordinador, asigne los programas de ese centro.'
          }
          onClose={closeModal}
          wide
        >
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={editing ? handleUpdate : handleCreate}>
            <UserFields
              form={form}
              options={options}
              programs={programs}
              programsLoading={programsLoading}
              programsError={programsError}
              onChange={patchForm}
              onToggleBodega={toggleBodega}
              onTogglePrograma={togglePrograma}
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
            {!isFormValid(form, options, editing) ? (
  <p className="text-sm text-sena-text/60 sm:col-span-2">
    Completa los campos obligatorios con datos válidos para continuar.
  </p>
) : null}
            <div className="mt-2 flex flex-wrap justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button
  type="submit"
  disabled={
    saving ||
    (isProgramasRole(form.idPerfil, options) && programsLoading) ||
    !isFormValid(form, options, editing)
  }
>
  {editing ? 'Guardar cambios' : 'Crear usuario'}
</Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {createdProgramUser ? (
        <Modal
          title="Listo, ya creaste el usuario"
          description={`${createdProgramUser.user.fullName} · ${createdProgramUser.user.email}`}
          onClose={() => setCreatedProgramUser(null)}
          wide
          spacious
        >
          <div className="space-y-4">
            <Summary
              label="Centro de formación"
              value={createdProgramUser.user.trainingCenter || 'Sin centro asignado'}
            />

            <div className="rounded-2xl border border-sena-line bg-sena-veil/40 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-sena-dark">Programas de formación</p>
                <StatusPill tone={createdPrograms.length ? 'ok' : 'warn'}>
                  {createdPrograms.length
                    ? `${createdPrograms.length} ${
                        createdPrograms.length === 1 ? 'asignado' : 'asignados'
                      }`
                    : 'Sin asignar'}
                </StatusPill>
              </div>

              {createdPrograms.length ? (
                <ul className="mt-3 space-y-1.5">
                  {createdPrograms.map((programa) => (
                    <li
                      key={programa.id}
                      className="flex flex-wrap items-center gap-2 text-sm text-sena-text"
                    >
                      <span className="rounded-full bg-sena-soft px-2 py-0.5 text-[0.6875rem] font-bold text-sena-dark">
                        {programa.codigo}
                      </span>
                      <span className="min-w-0 truncate">{programa.nombre}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-6 text-sena-text/65">
                  Aún no tiene programas. Verá «Materiales de formación» cuando le asignes al menos
                  uno.
                </p>
              )}
            </div>

            <p className="text-sm leading-6 text-sena-text/65">
              Puedes ajustar los programas ahora o más adelante desde «Editar usuario».
            </p>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const user = createdProgramUser.user
                  setCreatedProgramUser(null)
                  openEdit(user)
                }}
              >
                Asignar programas
              </Button>
              <Button type="button" onClick={continueFromPrograms}>
                Continuar
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {successAlert ? (
        <SweetAlert
          title={successAlert.title}
          confirmLabel={successAlert.confirmLabel}
          onConfirm={() => {
            const run = successAlert.onConfirm
            setSuccessAlert(null)
            run()
          }}
        >
          {successAlert.text}
        </SweetAlert>
      ) : null}

      {bodegaStep ? (
        <SweetAlert
          tone="question"
          title="¿Asignar una bodega ahora?"
          confirmLabel="Asignar ahora"
          cancelLabel="Más tarde"
          onConfirm={() => {
            const user = bodegaStep
            setBodegaStep(null)
            openEdit(user)
          }}
          onCancel={() => setBodegaStep(null)}
        >
          Es opcional. La bodega se usa para las solicitudes de inventario; sin ella el usuario no
          podrá registrarlas. Puedes dejarlo para después y asignarla cuando la necesite desde
          «Editar usuario».
        </SweetAlert>
      ) : null}
    </AppLayout>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 px-5 py-4 ring-1 ring-sena-line">
      <p className="text-[0.6875rem] font-bold tracking-[0.1em] text-sena-text/50 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-sena-dark">{value}</p>
    </div>
  )
}

function isAdministratorRole(roleId: string, options: UserFormOptions) {
  return options.roles.find((role) => String(role.id) === roleId)?.name === 'Administrador'
}

const DOCUMENT_RULES: Record<string, { min: number; max: number; pattern: RegExp }> = {
  CC:  { min: 6,  max: 10, pattern: /^\d+$/ },
  TI:  { min: 8,  max: 11, pattern: /^\d+$/ },
  CE:  { min: 6,  max: 12, pattern: /^\d+$/ },
  PPT: { min: 6,  max: 12, pattern: /^\d+$/ },
  PA:  { min: 6,  max: 12, pattern: /^[A-Za-z0-9]+$/ },
}

function isValidName(value: string) {
  const trimmed = value.trim()
  if (trimmed.length < 2 || trimmed.length > 80) return false
  // Solo letras (con tildes/ñ/ü), espacios y guiones/apóstrofes
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/.test(trimmed)) return false
  // Debe contener al menos una vocal (rechaza "jsjfjs")
  if (!/[aeiouáéíóúü]/i.test(trimmed)) return false
  return true
}

function isValidDocument(type: string, value: string) {
  const rule = DOCUMENT_RULES[type]
  if (!rule) return false
  const trimmed = value.trim()
  if (trimmed.length < rule.min || trimmed.length > rule.max) return false
  return rule.pattern.test(trimmed)
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function isFormValid(
  form: typeof EMPTY_FORM,
  options: UserFormOptions,
  editing: boolean,
) {
  if (!isValidName(form.nombres)) return false
  if (!isValidName(form.apellidos)) return false
  if (!isValidDocument(form.tipoDocumento, form.numeroDocumento)) return false
  if (!isValidEmail(form.email)) return false
  if (!form.idPerfil) return false
  if (!form.idCformacion) return false

  // Contraseñas
    // Contraseñas
  const needsPassword = !editing || Boolean(form.password)
  if (needsPassword) {
    if (form.password.length < 6) return false
    if (form.password !== form.passwordConfirmation) return false
    if (COMMON_PASSWORDS.includes(form.password.toLowerCase())) return false // <--- NUEVO
  }

  // Perfil programas: al menos 1 programa
  if (isProgramasRole(form.idPerfil, options) && form.programaIds.length === 0) {
    return false
  }

  return true
}

function PasswordField({
  id,
  label,
  value,
  confirmValue,
  onChange,
  required,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  confirmValue?: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  const strength = getPasswordStrength(value)
  
  // Solo mostrar error si ya escribió algo o si es la confirmación y no coinciden
  const error = 
    (id === 'password' && value && COMMON_PASSWORDS.includes(value.toLowerCase())) ? 'Esta contraseña es muy insegura.' :
    (id === 'passwordConfirmation' && value && confirmValue && value !== confirmValue) ? 'Las contraseñas no coinciden.' :
    null

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          className={`form-field w-full pr-10 ${error ? 'ring-1 ring-red-400 focus:ring-red-400' : ''}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-2 flex items-center text-sena-text/60 hover:text-sena-dark"
          tabIndex={-1}
        >
          {visible ? ( /* Ojo tachado */
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
          ) : ( /* Ojo abierto */
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          )}
        </button>
      </div>
      
      {/* Barra de seguridad (Solo en el campo principal de contraseña) */}
      {id === 'password' && value.length > 0 && (
        <div className="mt-1 flex items-center gap-2">
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-sena-line">
            <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
          </div>
          <span className="text-xs font-medium text-sena-text/60">{strength.label}</span>
        </div>
      )}
      
      {/* Mensaje de Error */}
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  )
}

function isProgramasRole(roleId: string, options: UserFormOptions) {
  return esPerfilProgramas(options.roles.find((role) => String(role.id) === roleId)?.name)
}

// Lista de contraseñas muy comunes en Colombia y el mundo
const COMMON_PASSWORDS = [
  '123456', '123456789', '12345678', '12345', 'password', 'asdfgh', 
  'qwerty', '10203040', 'colombia', 'sena', 'admin', '1234567'
]

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: 'bg-transparent' }
  
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: 'Débil', color: 'bg-red-500' }
  if (score === 3 || score === 4) return { score, label: 'Media', color: 'bg-yellow-400' }
  return { score, label: 'Fuerte', color: 'bg-green-500' }
}

// Validaciones con mensajes
function getNombreError(value: string) {
  if (!value.trim()) return 'Este campo es obligatorio.'
  if (value.trim().length < 3) return 'Debe tener al menos 3 letras.'
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/.test(value)) return 'Solo se permiten letras y espacios.'
  if (!/[aeiouáéíóúü]/i.test(value)) return 'El nombre no parece válido (parece texto al azar).'
  return null
}

function getDocumentoError(type: string, value: string) {
  if (!value.trim()) return 'El número de documento es obligatorio.'
  const rule = DOCUMENT_RULES[type]
  if (!rule) return 'Tipo de documento no válido.'
  
  if (value.length < rule.min) return `Faltan dígitos (mínimo ${rule.min}).`
  if (value.length > rule.max) return `Excede el límite (máximo ${rule.max}).`
  if (!rule.pattern.test(value)) return 'Solo se permiten números.'
  return null
}

function getPasswordError(password: string, confirm: string) {
  if (!password) return 'La contraseña es obligatoria.'
  if (password.length < 6) return 'Debe tener al menos 6 caracteres.'
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return 'Esta contraseña es muy insegura. Elige otra.'
  }
  if (password !== confirm) return 'Las contraseñas no coinciden.'
  return null
}

function UserFields({
  form,
  options,
  programs,
  programsLoading = false,
  programsError = null,
  onChange,
  onToggleBodega,
  onTogglePrograma,
  editing = false,
}: {
  form: typeof EMPTY_FORM
  options: UserFormOptions
  programs: ProgramaFormacion[]
  programsLoading?: boolean
  programsError?: string | null
  onChange: (field: keyof typeof EMPTY_FORM, value: string | boolean) => void
  onToggleBodega: (bodegaId: number) => void
  onTogglePrograma: (programaId: number) => void
  editing?: boolean
}) {
  const documentOptions = DOCUMENT_TYPES.includes(form.tipoDocumento)
    ? DOCUMENT_TYPES
    : [form.tipoDocumento, ...DOCUMENT_TYPES]
  const administrator = isAdministratorRole(form.idPerfil, options)
  const programasPerfil = isProgramasRole(form.idPerfil, options)
  const centerBodegas = options.bodegas.filter(
    (bodega) => String(bodega.trainingCenterId) === form.idCformacion,
  )
  const programaOptions = useMemo<ComboOption[]>(
    () =>
      programs.map((programa) => ({
        id: programa.id,
        title: programa.nombre,
        subtitle: `${programa.codigo}${programa.nivel ? ` · ${programa.nivel.nombre}` : ''}`,
        keywords: `${programa.codigo} ${programa.nivel?.nombre ?? ''}`,
      })),
    [programs],
  )
  const [nombreError, setNombreError] = useState<string | null>(null)
  const [apellidoError, setApellidoError] = useState<string | null>(null)
  const [documentoError, setDocumentoError] = useState<string | null>(null)

  return (
    <>
            {/* NOMBRES */}
      <div className="flex flex-col gap-1.5">
        <TextField
          id="nombres"
          label="Nombres"
          value={form.nombres}
          onChange={(event) => {
            onChange('nombres', event.target.value)
            if (nombreError) setNombreError(getNombreError(event.target.value))
          }}
          onBlur={() => setNombreError(getNombreError(form.nombres))}
          required
          className={nombreError ? 'ring-1 ring-red-400' : ''}
        />
        {nombreError && <span className="text-xs text-red-500 font-medium">{nombreError}</span>}
      </div>

      {/* APELLIDOS */}
      <div className="flex flex-col gap-1.5">
        <TextField
          id="apellidos"
          label="Apellidos"
          value={form.apellidos}
          onChange={(event) => {
            onChange('apellidos', event.target.value)
            if (apellidoError) setApellidoError(getNombreError(event.target.value))
          }}
          onBlur={() => setApellidoError(getNombreError(form.apellidos))}
          required
          className={apellidoError ? 'ring-1 ring-red-400' : ''}
        />
        {apellidoError && <span className="text-xs text-red-500 font-medium">{apellidoError}</span>}
      </div>

      <SelectField
        id="tipoDocumento"
        label="Tipo de documento"
        value={form.tipoDocumento}
        onChange={(value) => {
          onChange('tipoDocumento', value)
          setDocumentoError(getDocumentoError(value, form.numeroDocumento))
        }}
        options={documentOptions.map((type) => ({ value: type, label: type }))}
      />

      {/* NUMERO DE DOCUMENTO */}
      <div className="flex flex-col gap-1.5">
        <TextField
          id="numeroDocumento"
          label="Número de documento"
          value={form.numeroDocumento}
          onChange={(event) => {
            // Solo permitir números si no es Pasaporte (PA)
            const val = form.tipoDocumento === 'PA' 
              ? event.target.value 
              : event.target.value.replace(/\D/g, '')
            onChange('numeroDocumento', val)
            if (documentoError) setDocumentoError(getDocumentoError(form.tipoDocumento, val))
          }}
          onBlur={() => setDocumentoError(getDocumentoError(form.tipoDocumento, form.numeroDocumento))}
          required
          maxLength={DOCUMENT_RULES[form.tipoDocumento]?.max}
          className={documentoError ? 'ring-1 ring-red-400' : ''}
        />
        {documentoError && <span className="text-xs text-red-500 font-medium">{documentoError}</span>}
      </div>
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
      {editing ? (
        administrator ? (
          <p className="text-sm text-sena-text/60 sm:col-span-2">
            El perfil Administrador ve todos los centros y todas las bodegas, así que no se le asigna
            una.
          </p>
        ) : (
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-sena-text/75">Bodegas del centro</p>
            <p className="mt-1 text-xs text-sena-text/55">
              Marca la bodega de esta persona, casi siempre una. Esa bodega será la que use para las
              solicitudes de inventario; lo que puede hacer allí lo defines en su perfil.
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
        )
      ) : null}
      {programasPerfil ? (
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs text-sena-text/55">
            Solo aparecen los programas que tienen ficha en el centro seleccionado. Si lo dejas sin
            programas, no verá «Materiales de formación» hasta que le asignes uno.
          </p>
          {programsError ? (
            <p className="rounded-xl bg-sena-danger-soft px-4 py-3 text-sm text-sena-danger-text ring-1 ring-sena-danger-line">
              {programsError}
            </p>
          ) : !form.idCformacion ? (
            <p className="text-sm text-sena-text/55">
              Primero elige el centro de formación para ver sus programas.
            </p>
          ) : (
            <MultiSelectCombobox
              options={programaOptions}
              selectedIds={form.programaIds}
              onToggle={onTogglePrograma}
              label="Programas de formación"
              placeholder="Escriba el código o el nombre del programa..."
              loading={programsLoading}
              loadingLabel="Cargando programas del centro…"
              emptyMessage="Este centro no tiene programas con ficha asociada. Crea una ficha del programa en este centro para poder asignarlo."
            />
          )}
        </div>
      ) : null}
            <PasswordField
        id="password"
        label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
        value={form.password}
        onChange={(event) => onChange('password', event.target.value)}
        required={!editing}
        autoComplete="new-password"
      />
      <PasswordField
        id="passwordConfirmation"
        label="Confirmar contraseña"
        value={form.passwordConfirmation}
        confirmValue={form.password} // <--- NUEVO: Para validar que coincidan
        onChange={(event) => onChange('passwordConfirmation', event.target.value)}
        required={!editing || Boolean(form.password)}
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
