import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
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
import {
  PencilIcon,
  PlusIcon,
  ProgramIcon,
  TrashIcon,
} from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'
import { esPerfilInstructor } from '@/modules/materiales-formacion/lib/formacion'
import { cn } from '@/shared/lib/cn'
import type { ManagedUser } from '@/shared/types/profile'
import type {
  ProgramaFormacion,
  ProgramaFormacionOptions,
} from '@/modules/materiales-formacion/types/formacion'
import RedesTab from '@/modules/materiales-formacion/components/RedesTab'
import LineasTab from '@/modules/materiales-formacion/components/LineasTab'
import type { FormacionTabHandle } from '@/modules/materiales-formacion/components/types'

const PAGE_SIZE = 8
const TABS = ['Instructores', 'Programas', 'Redes', 'Líneas'] as const
type Tab = (typeof TABS)[number]

const EMPTY_PROGRAM = {
  codigo: '',
  nombre: '',
  version: '1',
  idNivelPrograma: '',
  idRedConocimiento: '',
  idLineaTematica: '',
  duracionTotalHoras: '',
  cupoBaseAprendices: '30',
  centroIds: [] as number[],
}

type ProgramForm = typeof EMPTY_PROGRAM
type ProgramModalState = { mode: 'create' | 'edit'; id?: number } | null

async function buildAssignments(programs: ProgramaFormacion[]) {
  const rows = await Promise.all(
    programs.map(async (programa) => ({
      programa,
      users: await api<ManagedUser[]>(`/programas-formacion/${programa.id}/usuarios`),
    })),
  )

  const assignments: Record<number, ProgramaFormacion[]> = {}
  for (const row of rows) {
    for (const user of row.users) {
      assignments[user.id] = [...(assignments[user.id] ?? []), row.programa]
    }
  }

  return assignments
}

export default function ProgramasFormacionPage() {
  const [tab, setTab] = useState<Tab>('Instructores')
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [programs, setPrograms] = useState<ProgramaFormacion[]>([])
  const [options, setOptions] = useState<ProgramaFormacionOptions>({
    niveles: [],
    redes: [],
    centros: [],
  })
  const [assignments, setAssignments] = useState<Record<number, ProgramaFormacion[]>>({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [assignTarget, setAssignTarget] = useState<ManagedUser | null>(null)
  const [assignIds, setAssignIds] = useState<number[]>([])
  const [assignSearch, setAssignSearch] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const [programModal, setProgramModal] = useState<ProgramModalState>(null)
  const [programForm, setProgramForm] = useState<ProgramForm>(EMPTY_PROGRAM)
  const [programSaving, setProgramSaving] = useState(false)
  const [programError, setProgramError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<ProgramaFormacion | null>(null)
  const [deleting, setDeleting] = useState(false)
  const redesRef = useRef<FormacionTabHandle>(null)
  const lineasRef = useRef<FormacionTabHandle>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Formación | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const [nextUsers, nextPrograms, nextOptions] = await Promise.all([
          api<ManagedUser[]>('/users'),
          api<ProgramaFormacion[]>('/programas-formacion'),
          api<ProgramaFormacionOptions>('/programas-formacion/options'),
        ])
        const nextAssignments = await buildAssignments(nextPrograms)
        if (cancelled) return
        setUsers(nextUsers)
        setPrograms(nextPrograms)
        setOptions(nextOptions)
        setAssignments(nextAssignments)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudo cargar la información de formación.',
          )
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

  useEffect(() => {
    setPage(1)
  }, [tab, search])

  const instructores = useMemo(() => users.filter((user) => esPerfilInstructor(user.role)), [users])

  const filteredInstructors = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return instructores

    return instructores.filter((user) => {
      const assigned = (assignments[user.id] ?? [])
        .map((programa) => `${programa.codigo} ${programa.nombre}`)
        .join(' ')
      return `${user.fullName} ${user.email} ${user.documentId} ${user.trainingCenter} ${assigned}`
        .toLowerCase()
        .includes(query)
    })
  }, [instructores, assignments, search])

  const filteredPrograms = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return programs

    return programs.filter((programa) =>
      `${programa.codigo} ${programa.nombre} ${programa.nivel?.nombre ?? ''} ${
        programa.redConocimiento?.nombre ?? ''
      } ${programa.lineaTematica?.nombre ?? ''}`
        .toLowerCase()
        .includes(query),
    )
  }, [programs, search])

  const activeRows = tab === 'Instructores' ? filteredInstructors : filteredPrograms
  const totalPages = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageInstructors = filteredInstructors.slice(pageStart, pageStart + PAGE_SIZE)
  const pagePrograms = filteredPrograms.slice(pageStart, pageStart + PAGE_SIZE)
  const from = activeRows.length === 0 ? 0 : pageStart + 1
  const to = pageStart + Math.min(PAGE_SIZE, activeRows.length - pageStart)

  const assignAvailable = useMemo(() => {
    if (!assignTarget) return []

    return programs.filter((programa) =>
      (programa.centros ?? []).some((centro) => centro.id === assignTarget.trainingCenterId),
    )
  }, [programs, assignTarget])

  const assignPrograms = useMemo(() => {
    const query = assignSearch.trim().toLowerCase()
    if (!query) return assignAvailable

    return assignAvailable.filter((programa) =>
      `${programa.codigo} ${programa.nombre} ${programa.nivel?.nombre ?? ''}`
        .toLowerCase()
        .includes(query),
    )
  }, [assignAvailable, assignSearch])

  const selectedRed = options.redes.find(
    (red) => String(red.id) === programForm.idRedConocimiento,
  )

  const refreshPrograms = async () => {
    const list = await api<ProgramaFormacion[]>('/programas-formacion')
    setPrograms(list)
    setAssignments(await buildAssignments(list))
  }

  const refreshCatalog = async () => {
    try {
      const [list, nextOptions] = await Promise.all([
        api<ProgramaFormacion[]>('/programas-formacion'),
        api<ProgramaFormacionOptions>('/programas-formacion/options'),
      ])
      setPrograms(list)
      setOptions(nextOptions)
      setAssignments(await buildAssignments(list))
    } catch {
      // Las pestañas de catálogo ya refrescaron su propio listado.
    }
  }

  const openAssign = async (user: ManagedUser) => {
    setAssignTarget(user)
    setAssignIds([])
    setAssignSearch('')
    setAssignError(null)
    setAssignLoading(true)
    try {
      const current = await api<ProgramaFormacion[]>(`/users/${user.id}/programas`)
      const allowed = current.filter((programa) =>
        (programa.centros ?? []).some((centro) => centro.id === user.trainingCenterId),
      )
      setAssignIds(allowed.map((programa) => programa.id))
      setAssignments((previous) => ({ ...previous, [user.id]: allowed }))
    } catch (caught) {
      setAssignError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudieron cargar los programas del instructor.',
      )
    } finally {
      setAssignLoading(false)
    }
  }

  const closeAssign = () => {
    if (assignSaving) return
    setAssignTarget(null)
    setAssignError(null)
  }

  const toggleAssign = (programaId: number) => {
    setAssignIds((current) =>
      current.includes(programaId)
        ? current.filter((id) => id !== programaId)
        : [...current, programaId],
    )
  }

  const handleAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!assignTarget) return

    setAssignSaving(true)
    setAssignError(null)
    setMessage(null)
    try {
      const updated = await api<ProgramaFormacion[]>(
        `/users/${assignTarget.id}/programas`,
        {
          method: 'PUT',
          body: JSON.stringify({ programaIds: assignIds }),
        },
      )
      setAssignments((previous) => ({ ...previous, [assignTarget.id]: updated }))
      setMessage(`Programas de ${assignTarget.fullName} actualizados.`)
      setAssignTarget(null)
    } catch (caught) {
      setAssignError(
        caught instanceof ApiError ? caught.message : 'No se pudo guardar la asignación.',
      )
    } finally {
      setAssignSaving(false)
    }
  }

  const openCreateProgram = () => {
    setProgramForm(EMPTY_PROGRAM)
    setProgramError(null)
    setProgramModal({ mode: 'create' })
  }

  const openEditProgram = (programa: ProgramaFormacion) => {
    setProgramForm({
      codigo: programa.codigo,
      nombre: programa.nombre,
      version: programa.version,
      idNivelPrograma: String(programa.idNivelPrograma),
      idRedConocimiento: String(programa.idRedConocimiento),
      idLineaTematica: String(programa.idLineaTematica),
      duracionTotalHoras:
        programa.duracionTotalHoras != null ? String(programa.duracionTotalHoras) : '',
      cupoBaseAprendices: String(programa.cupoBaseAprendices),
      centroIds: (programa.centros ?? []).map((centro) => centro.id),
    })
    setProgramError(null)
    setProgramModal({ mode: 'edit', id: programa.id })
  }

  const closeProgramModal = () => {
    if (programSaving) return
    setProgramModal(null)
    setProgramError(null)
  }

  const patchProgram = (field: Exclude<keyof ProgramForm, 'centroIds'>, value: string) => {
    setProgramForm((current) => {
      if (field === 'idRedConocimiento' && value !== current.idRedConocimiento) {
        return { ...current, idRedConocimiento: value, idLineaTematica: '' }
      }
      return { ...current, [field]: value }
    })
  }

  const toggleProgramCentro = (centroId: number) => {
    setProgramForm((current) => ({
      ...current,
      centroIds: current.centroIds.includes(centroId)
        ? current.centroIds.filter((id) => id !== centroId)
        : [...current.centroIds, centroId],
    }))
  }

  const handleProgramSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!programModal) return

    if (!programForm.centroIds.length) {
      setProgramError('Seleccione al menos un centro de formación para el programa.')
      return
    }

    setProgramSaving(true)
    setProgramError(null)
    setMessage(null)
    try {
      const payload = {
        idRedConocimiento: Number(programForm.idRedConocimiento),
        idLineaTematica: Number(programForm.idLineaTematica),
        idNivelPrograma: Number(programForm.idNivelPrograma),
        codigo: programForm.codigo.trim(),
        nombre: programForm.nombre.trim(),
        version: programForm.version.trim(),
        duracionTotalHoras: programForm.duracionTotalHoras
          ? Number(programForm.duracionTotalHoras)
          : null,
        cupoBaseAprendices: programForm.cupoBaseAprendices
          ? Number(programForm.cupoBaseAprendices)
          : 30,
        centroIds: programForm.centroIds,
      }

      if (programModal.mode === 'create') {
        await api<ProgramaFormacion>('/programas-formacion', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setMessage(`Programa “${payload.nombre}” creado.`)
      } else {
        await api<ProgramaFormacion>(`/programas-formacion/${programModal.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setMessage(`Programa “${payload.nombre}” actualizado.`)
      }

      setProgramModal(null)
      await refreshPrograms().catch(() => undefined)
    } catch (caught) {
      setProgramError(
        caught instanceof ApiError ? caught.message : 'No se pudo guardar el programa.',
      )
    } finally {
      setProgramSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return

    setDeleting(true)
    setError(null)
    setMessage(null)
    try {
      await api(`/programas-formacion/${toDelete.id}`, { method: 'DELETE' })
      setMessage(`Programa “${toDelete.nombre}” desactivado.`)
      setToDelete(null)
      await refreshPrograms().catch(() => undefined)
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'No se pudo desactivar el programa.',
      )
    } finally {
      setDeleting(false)
    }
  }

  const headerAction =
    tab === 'Programas' ? (
      <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreateProgram}>
        Nuevo programa
      </Button>
    ) : tab === 'Redes' ? (
      <Button
        type="button"
        icon={<PlusIcon className="size-4" />}
        onClick={() => redesRef.current?.openCreate()}
      >
        Nueva red
      </Button>
    ) : tab === 'Líneas' ? (
      <Button
        type="button"
        icon={<PlusIcon className="size-4" />}
        onClick={() => lineasRef.current?.openCreate()}
      >
        Nueva línea
      </Button>
    ) : undefined

  return (
    <AppLayout title="Formación">
      <PageHeader
        icon={<ProgramIcon />}
        title="Formación"
        description="Administre redes, líneas y programas de formación, y asigne a cada instructor los programas que dicta."
        action={headerAction}
      />

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      {message ? (
        <p className="mb-4 rounded-2xl border border-sena-ok-line bg-sena-active-soft px-5 py-3.5 text-sm text-sena-ok-text">
          {message}
        </p>
      ) : null}

      <FilterCard>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={
            tab === 'Instructores'
              ? 'Buscar instructor por nombre, correo o programa...'
              : tab === 'Programas'
                ? 'Buscar programa por código, nombre, red o línea...'
                : tab === 'Redes'
                  ? 'Buscar red por nombre, gestor, asesor o línea...'
                  : 'Buscar línea por nombre, descripción o red...'
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={cn(
                'h-[56px] shrink-0 rounded-2xl px-4 text-sm font-semibold whitespace-nowrap transition duration-150',
                name === tab
                  ? 'bg-sena text-white shadow-brand'
                  : 'border border-sena-line bg-glass-strong text-sena-dark shadow-hairline backdrop-blur-glass-sm hover:bg-white/90 hover:text-sena-dark',
              )}
            >
              {name}
            </button>
          ))}
        </div>

        <ClearFiltersButton onClick={() => setSearch('')} disabled={!search} />
      </FilterCard>

      {tab === 'Redes' ? (
        <RedesTab
          ref={redesRef}
          search={search}
          onCatalogChanged={() => void refreshCatalog()}
        />
      ) : tab === 'Líneas' ? (
        <LineasTab
          ref={lineasRef}
          search={search}
          onCatalogChanged={() => void refreshCatalog()}
        />
      ) : (
        <TableCard>
          {loading ? (
            <TableLoading label="Cargando formación…" />
          ) : tab === 'Instructores' ? (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader width="w-[26%]">Instructor</TableHeader>
                    <TableHeader width={tableColumns.count}>Documento</TableHeader>
                    <TableHeader width="w-[18%]">Centro</TableHeader>
                    <TableHeader>Programas asignados</TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pageInstructors.length === 0 ? (
                    <TableEmpty colSpan={5}>
                      {instructores.length === 0 ? (
                        <>
                          No hay usuarios con perfil Instructor.{' '}
                          <Link
                            to="/usuarios"
                            className="font-semibold text-sena underline-offset-2 hover:underline"
                          >
                            Cree uno desde Usuarios
                          </Link>
                          .
                        </>
                      ) : (
                        'No hay instructores que coincidan con la búsqueda.'
                      )}
                    </TableEmpty>
                  ) : (
                    pageInstructors.map((user) => {
                      const assigned = assignments[user.id] ?? []
                      return (
                        <TableRow key={user.id}>
                          <td className="min-w-0">
                            <p className="truncate font-semibold text-sena-text">{user.fullName}</p>
                            <p className="truncate text-xs text-sena-text-soft">{user.email}</p>
                          </td>

                          <td className="truncate text-sena-strong">
                            {user.documentType} {user.documentId}
                          </td>

                          <td className="truncate text-sena-strong">
                            {user.trainingCenter || '—'}
                          </td>

                          <td>
                            <StatusPill tone={assigned.length ? 'ok' : 'danger'}>
                              {assigned.length === 0
                                ? 'Sin programas'
                                : `${assigned.length} ${
                                    assigned.length === 1 ? 'programa' : 'programas'
                                  }`}
                            </StatusPill>

                            {assigned.length ? (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {assigned.slice(0, 2).map((programa) => (
                                  <span
                                    key={programa.id}
                                    title={programa.nombre}
                                    className="max-w-[11rem] truncate rounded-full bg-sena-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-sena-dark"
                                  >
                                    {programa.codigo}
                                  </span>
                                ))}
                                {assigned.length > 2 ? (
                                  <span className="rounded-full bg-sena-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-sena-dark">
                                    +{assigned.length - 2}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </td>

                          <td>
                            <RowActions>
                              <ActionButton
                                title="Asignar programas"
                                onClick={() => void openAssign(user)}
                              >
                                <ProgramIcon className="size-[18px]" />
                              </ActionButton>
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
              total={filteredInstructors.length}
              noun="instructores"
            />
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader width="w-[26%]">Programa</TableHeader>
                    <TableHeader width="w-[14%]">Nivel</TableHeader>
                    <TableHeader width="w-[20%]">Red / Línea</TableHeader>
                    <TableHeader width="w-[18%]">Centros</TableHeader>
                    <TableHeader align="center" width="w-[8%]">
                      Horas
                    </TableHeader>
                    <TableHeader align="center" width="w-[7%]">
                      Cupo
                    </TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pagePrograms.length === 0 ? (
                    <TableEmpty colSpan={7}>
                      {programs.length === 0
                        ? 'Aún no hay programas activos. Asegure primero una red con líneas en las pestañas Redes y Líneas; luego use «Nuevo programa».'
                        : 'No hay programas que coincidan con la búsqueda.'}
                    </TableEmpty>
                  ) : (
                    pagePrograms.map((programa) => (
                      <TableRow key={programa.id}>
                        <td className="min-w-0">
                          <p className="truncate font-semibold text-sena-text">{programa.nombre}</p>
                          <p className="truncate text-xs text-sena-text-soft">
                            {programa.codigo} · v{programa.version}
                          </p>
                        </td>

                        <td className="truncate text-sena-strong">
                          {programa.nivel?.nombre ?? '—'}
                        </td>

                        <td className="min-w-0">
                          <p className="truncate text-sena-text">
                            {programa.redConocimiento?.nombre ?? '—'}
                          </p>
                          <p className="truncate text-xs text-sena-text-soft">
                            {programa.lineaTematica?.nombre ?? '—'}
                          </p>
                        </td>

                        <td className="min-w-0">
                          {(programa.centros ?? []).length === 0 ? (
                            <span className="text-sena-text-soft">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(programa.centros ?? []).slice(0, 2).map((centro) => (
                                <span
                                  key={centro.id}
                                  title={centro.nombre}
                                  className="max-w-[9.5rem] truncate rounded-full bg-sena-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-sena-dark"
                                >
                                  {centro.nombre}
                                </span>
                              ))}
                              {(programa.centros ?? []).length > 2 ? (
                                <span className="rounded-full bg-sena-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-sena-dark">
                                  +{(programa.centros ?? []).length - 2}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </td>

                        <td className="text-center text-sena-strong">
                          {programa.duracionTotalHoras ?? '—'}
                        </td>

                        <td className="text-center text-sena-strong">
                          {programa.cupoBaseAprendices}
                        </td>

                        <td>
                          <RowActions>
                            <ActionButton
                              title="Editar programa"
                              onClick={() => openEditProgram(programa)}
                            >
                              <PencilIcon className="size-[18px]" />
                            </ActionButton>

                            <ActionButton
                              title="Desactivar programa"
                              danger
                              onClick={() => setToDelete(programa)}
                            >
                              <TrashIcon className="size-[18px]" />
                            </ActionButton>
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
              total={filteredPrograms.length}
              noun="programas"
            />
          </>
        )}
        </TableCard>
      )}

      {assignTarget ? (
        <Modal
          title={`Programas de ${assignTarget.fullName}`}
          description={`Marque los programas del centro ${assignTarget.trainingCenter} que dicta este instructor.`}
          onClose={closeAssign}
          wide
          spacious
        >
          {assignLoading ? (
            <p className="py-8 text-center text-sm text-sena-text-soft">Cargando programas…</p>
          ) : (
            <form onSubmit={handleAssign}>
              <SearchInput
                value={assignSearch}
                onChange={setAssignSearch}
                placeholder="Buscar programa por código o nombre..."
              />

              {assignAvailable.length === 0 ? (
                <p className="mt-4 rounded-xl border border-sena-line bg-sena-veil/60 px-4 py-4 text-sm text-sena-text-soft">
                  Este centro no tiene programas asociados. Asígnelos desde la pestaña Programas.
                </p>
              ) : assignPrograms.length === 0 ? (
                <p className="mt-4 rounded-xl border border-sena-line bg-sena-veil/60 px-4 py-4 text-sm text-sena-text-soft">
                  Ningún programa coincide con la búsqueda.
                </p>
              ) : (
                <div className="mt-4 max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-sena-line bg-sena-veil/50 p-3">
                  {assignPrograms.map((programa) => (
                    <label
                      key={programa.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-white/70"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 accent-[#00a651]"
                        checked={assignIds.includes(programa.id)}
                        onChange={() => toggleAssign(programa.id)}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-sena-text">
                          {programa.nombre}
                        </span>
                        <span className="block truncate text-xs text-sena-text-soft">
                          {programa.codigo}
                          {programa.nivel ? ` · ${programa.nivel.nombre}` : ''}
                          {programa.lineaTematica ? ` · ${programa.lineaTematica.nombre}` : ''}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <p className="mt-3 text-xs font-medium text-sena-text-soft">
                Seleccionados: {assignIds.length}
              </p>

              {assignError ? (
                <div className="mt-4 rounded-xl bg-sena-danger-soft px-4 py-3 text-sm text-sena-danger-text ring-1 ring-sena-danger-line">
                  {assignError}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeAssign}
                  disabled={assignSaving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={assignSaving}>
                  {assignSaving ? 'Guardando…' : 'Guardar asignación'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      ) : null}

      {programModal ? (
        <Modal
          title={programModal.mode === 'create' ? 'Nuevo programa de formación' : 'Editar programa'}
          description="El programa pertenece a una red de conocimiento y a una de sus líneas temáticas. Marque los centros donde se ofrece."
          onClose={closeProgramModal}
          wide
          spacious
        >
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleProgramSubmit}>
            <TextField
              id="codigo"
              label="Código del programa"
              value={programForm.codigo}
              onChange={(event) => patchProgram('codigo', event.target.value)}
              maxLength={30}
              required
            />

            <TextField
              id="version"
              label="Versión"
              value={programForm.version}
              onChange={(event) => patchProgram('version', event.target.value)}
              maxLength={20}
              required
            />

            <div className="sm:col-span-2">
              <TextField
                id="nombre"
                label="Nombre del programa"
                value={programForm.nombre}
                onChange={(event) => patchProgram('nombre', event.target.value)}
                maxLength={200}
                required
              />
            </div>

            <SelectField
              id="idNivelPrograma"
              label="Nivel de formación"
              value={programForm.idNivelPrograma}
              onChange={(value) => patchProgram('idNivelPrograma', value)}
              placeholder="Seleccione un nivel"
              options={options.niveles.map((nivel) => ({
                value: String(nivel.id),
                label: nivel.nombre,
              }))}
            />

            <SelectField
              id="idRedConocimiento"
              label="Red de conocimiento"
              value={programForm.idRedConocimiento}
              onChange={(value) => patchProgram('idRedConocimiento', value)}
              placeholder="Seleccione una red"
              options={options.redes.map((red) => ({
                value: String(red.id),
                label: red.nombre,
              }))}
            />

            <SelectField
              id="idLineaTematica"
              label="Línea temática"
              value={programForm.idLineaTematica}
              onChange={(value) => patchProgram('idLineaTematica', value)}
              placeholder={
                programForm.idRedConocimiento
                  ? 'Seleccione una línea'
                  : 'Primero seleccione la red'
              }
              disabled={!programForm.idRedConocimiento}
              options={(selectedRed?.lineas ?? []).map((linea) => ({
                value: String(linea.id),
                label: linea.nombre,
              }))}
            />

            <TextField
              id="duracionTotalHoras"
              label="Duración total (horas)"
              type="number"
              min={1}
              value={programForm.duracionTotalHoras}
              onChange={(event) => patchProgram('duracionTotalHoras', event.target.value)}
              placeholder="Opcional"
            />

            <TextField
              id="cupoBaseAprendices"
              label="Cupo base de aprendices"
              type="number"
              min={1}
              value={programForm.cupoBaseAprendices}
              onChange={(event) => patchProgram('cupoBaseAprendices', event.target.value)}
              required
            />

            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-sena-text/75">Centros donde se ofrece</p>
              <p className="mt-1 text-xs text-sena-text/55">
                Solo los instructores de estos centros podrán tener este programa asignado.
              </p>

              {options.centros.length === 0 ? (
                <p className="mt-2 rounded-xl border border-sena-line bg-sena-veil/50 px-4 py-3 text-xs text-sena-text-soft">
                  No hay centros de formación disponibles.
                </p>
              ) : (
                <div className="mt-2 grid max-h-40 gap-2 overflow-y-auto rounded-xl border border-sena-line bg-sena-veil/50 p-3 sm:grid-cols-2">
                  {options.centros.map((centro) => (
                    <label
                      key={centro.id}
                      className="flex items-start gap-2 text-sm text-sena-text"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 accent-[#00a651]"
                        checked={programForm.centroIds.includes(centro.id)}
                        onChange={() => toggleProgramCentro(centro.id)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate">{centro.nombre}</span>
                        {centro.regional ? (
                          <span className="block truncate text-xs text-sena-text/55">
                            {centro.regional}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {programForm.centroIds.length === 0 ? (
                <p className="mt-2 text-xs font-medium text-sena-danger-text">
                  Seleccione al menos un centro de formación.
                </p>
              ) : null}
            </div>

            {options.redes.length === 0 ? (
              <p className="rounded-xl border border-sena-line bg-sena-veil/50 px-4 py-3 text-xs text-sena-text-soft sm:col-span-2">
                No hay redes activas. Cree una red y asígnele líneas en las pestañas Redes y Líneas.
              </p>
            ) : selectedRed && selectedRed.lineas.length === 0 ? (
              <p className="rounded-xl border border-sena-line bg-sena-veil/50 px-4 py-3 text-xs text-sena-text-soft sm:col-span-2">
                La red seleccionada todavía no tiene líneas activas. Asígnele una desde la pestaña
                Redes.
              </p>
            ) : null}

            {programError ? (
              <div className="rounded-xl bg-sena-danger-soft px-4 py-3 text-sm text-sena-danger-text ring-1 ring-sena-danger-line sm:col-span-2">
                {programError}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap justify-end gap-2 sm:col-span-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeProgramModal}
                disabled={programSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={programSaving}>
                {programSaving
                  ? 'Guardando…'
                  : programModal.mode === 'create'
                    ? 'Crear programa'
                    : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title="Desactivar programa"
          subtitle={toDelete.nombre}
          confirmLabel="Desactivar"
          pendingLabel="Desactivando…"
          pending={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            if (!deleting) setToDelete(null)
          }}
        >
          El programa dejará de aparecer para asignarlo a instructores. Las asignaciones existentes
          se conservan.
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
  placeholder,
  disabled = false,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
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
        disabled={disabled}
        className="form-field form-select disabled:cursor-not-allowed disabled:opacity-60"
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
