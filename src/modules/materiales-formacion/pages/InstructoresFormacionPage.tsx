import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import MultiSelectCombobox, {
  type ComboOption,
} from '@/shared/components/ui/MultiSelectCombobox'
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
import { ProgramIcon, UserIcon } from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'
import { buildAssignments } from '@/modules/materiales-formacion/lib/assignments'
import { esPerfilProgramas } from '@/modules/materiales-formacion/lib/formacion'
import type { ProgramaFormacion } from '@/modules/materiales-formacion/types/formacion'
import type { ManagedUser } from '@/shared/types/profile'

const PAGE_SIZE = 8

export default function InstructoresFormacionPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [programs, setPrograms] = useState<ProgramaFormacion[]>([])
  const [assignments, setAssignments] = useState<Record<number, ProgramaFormacion[]>>({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [assignTarget, setAssignTarget] = useState<ManagedUser | null>(null)
  const [assignIds, setAssignIds] = useState<number[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Asignar programas | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const [nextUsers, nextPrograms] = await Promise.all([
          api<ManagedUser[]>('/users'),
          api<ProgramaFormacion[]>('/programas-formacion'),
        ])
        const nextAssignments = await buildAssignments(nextPrograms)
        if (cancelled) return
        setUsers(nextUsers)
        setPrograms(nextPrograms)
        setAssignments(nextAssignments)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudo cargar la información de usuarios.',
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
  }, [search])

  const asignables = useMemo(() => users.filter((user) => esPerfilProgramas(user.role)), [users])

  const filteredAsignables = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return asignables

    return asignables.filter((user) => {
      const assigned = (assignments[user.id] ?? [])
        .map((programa) => `${programa.codigo} ${programa.nombre}`)
        .join(' ')
      return `${user.fullName} ${user.email} ${user.documentId} ${user.trainingCenter} ${assigned}`
        .toLowerCase()
        .includes(query)
    })
  }, [asignables, assignments, search])

  const totalPages = Math.max(1, Math.ceil(filteredAsignables.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageAsignables = filteredAsignables.slice(pageStart, pageStart + PAGE_SIZE)
  const from = filteredAsignables.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageAsignables.length

  const assignAvailable = useMemo(() => {
    if (!assignTarget) return []

    return programs.filter((programa) =>
      (programa.centros ?? []).some((centro) => centro.id === assignTarget.trainingCenterId),
    )
  }, [programs, assignTarget])

  const assignOptions = useMemo<ComboOption[]>(
    () =>
      assignAvailable.map((programa) => ({
        id: programa.id,
        title: programa.nombre,
        subtitle: `${programa.codigo}${programa.nivel ? ` · ${programa.nivel.nombre}` : ''}${
          programa.lineaTematica ? ` · ${programa.lineaTematica.nombre}` : ''
        }`,
        keywords: `${programa.codigo} ${programa.nivel?.nombre ?? ''} ${
          programa.lineaTematica?.nombre ?? ''
        } ${programa.redConocimiento?.nombre ?? ''}`,
      })),
    [assignAvailable],
  )

  const openAssign = async (user: ManagedUser) => {
    setAssignTarget(user)
    setAssignIds([])
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
          : 'No se pudieron cargar los programas del usuario.',
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
      const updated = await api<ProgramaFormacion[]>(`/users/${assignTarget.id}/programas`, {
        method: 'PUT',
        body: JSON.stringify({ programaIds: assignIds }),
      })
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

  return (
    <AppLayout title="Asignar programas">
      <PageHeader
        icon={<UserIcon />}
        title="Asignar programas"
        description="Al instructor se le asignan programas para pedir materiales. Al coordinador, esos programas definen su red y línea (Informática → Software → ADSO): solo le llegan las solicitudes de esa red."
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
          placeholder="Buscar por nombre, correo o programa..."
        />

        <ClearFiltersButton onClick={() => setSearch('')} disabled={!search} />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando usuarios…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader width="w-[26%]">Instructor / Coordinador</TableHeader>
                    <TableHeader width={tableColumns.count}>Documento</TableHeader>
                    <TableHeader width="w-[18%]">Centro</TableHeader>
                    <TableHeader>Programas asignados</TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pageAsignables.length === 0 ? (
                    <TableEmpty colSpan={5}>
                      {asignables.length === 0 ? (
                        <>
                          No hay usuarios con perfil Instructor o Coordinador.{' '}
                          <Link
                            to="/usuarios"
                            className="font-semibold text-sena underline-offset-2 hover:underline"
                          >
                            Cree uno desde Usuarios
                          </Link>
                          .
                        </>
                      ) : (
                        'No hay usuarios que coincidan con la búsqueda.'
                      )}
                    </TableEmpty>
                  ) : (
                    pageAsignables.map((user) => {
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
              total={filteredAsignables.length}
              noun="usuarios"
            />
          </>
        )}
      </TableCard>

      {assignTarget ? (
        <Modal
          title={`Programas de ${assignTarget.fullName}`}
          description={`Marque los programas del centro ${assignTarget.trainingCenter} que tiene a cargo este usuario.`}
          onClose={closeAssign}
          wide
          spacious
        >
          {assignLoading ? (
            <p className="py-8 text-center text-sm text-sena-text-soft">Cargando programas…</p>
          ) : (
            <form onSubmit={handleAssign}>
              <MultiSelectCombobox
                options={assignOptions}
                selectedIds={assignIds}
                onToggle={toggleAssign}
                label="Programas del centro"
                placeholder="Escriba el código o el nombre del programa..."
                emptyMessage="Este centro no tiene programas con ficha asociada. Cree una ficha del programa en ese centro desde la sección Fichas."
              />

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
    </AppLayout>
  )
}
