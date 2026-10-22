import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog'
import Modal from '@/shared/components/ui/Modal'
import SelectField from '@/shared/components/ui/SelectField'
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
  ExcelIcon,
  PencilIcon,
  PlusIcon,
  ProgramIcon,
  TrashIcon,
} from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import type {
  ProgramaFormacion,
  ProgramaFormacionOptions,
} from '@/modules/materiales-formacion/types/formacion'

const PAGE_SIZE = 8

const EMPTY_PROGRAM = {
  codigo: '',
  nombre: '',
  version: '1',
  idNivelPrograma: '',
  idRedConocimiento: '',
  idLineaTematica: '',
  duracionTotalHoras: '',
  cupoBaseAprendices: '30',
}

type ProgramForm = typeof EMPTY_PROGRAM
type ProgramModalState = { mode: 'create' | 'edit'; id?: number } | null

export default function ProgramasFormacionPage() {
  const { can } = useFormacionAccess()
  const [programs, setPrograms] = useState<ProgramaFormacion[]>([])
  const [options, setOptions] = useState<ProgramaFormacionOptions>({
    niveles: [],
    redes: [],
  })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [programModal, setProgramModal] = useState<ProgramModalState>(null)
  const [programForm, setProgramForm] = useState<ProgramForm>(EMPTY_PROGRAM)
  const [programSaving, setProgramSaving] = useState(false)
  const [programError, setProgramError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<ProgramaFormacion | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Programas de formación | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const [nextPrograms, nextOptions] = await Promise.all([
          api<ProgramaFormacion[]>('/programas-formacion'),
          api<ProgramaFormacionOptions>('/programas-formacion/options'),
        ])
        if (cancelled) return
        setPrograms(nextPrograms)
        setOptions(nextOptions)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudieron cargar los programas de formación.',
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

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pagePrograms = filteredPrograms.slice(pageStart, pageStart + PAGE_SIZE)
  const from = filteredPrograms.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pagePrograms.length

  const selectedRed = options.redes.find(
    (red) => String(red.id) === programForm.idRedConocimiento,
  )

  const refreshPrograms = async () => {
    const list = await api<ProgramaFormacion[]>('/programas-formacion')
    setPrograms(list)
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
    })
    setProgramError(null)
    setProgramModal({ mode: 'edit', id: programa.id })
  }

  const closeProgramModal = () => {
    if (programSaving) return
    setProgramModal(null)
    setProgramError(null)
  }

  const patchProgram = (field: keyof ProgramForm, value: string) => {
    setProgramForm((current) => {
      if (field === 'idRedConocimiento' && value !== current.idRedConocimiento) {
        return { ...current, idRedConocimiento: value, idLineaTematica: '' }
      }
      return { ...current, [field]: value }
    })
  }

  const handleProgramSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!programModal) return

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

  return (
    <AppLayout title="Programas de formación">
      <PageHeader
        icon={<ProgramIcon />}
        title="Programas de formación"
        description="Cree y edite los programas: código, versión, nivel, red, línea, duración y cupo base. Los centros se derivan de las fichas."
        action={
          can('programas', 'create') ? (
            <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreateProgram}>
              Nuevo programa
            </Button>
          ) : undefined
        }
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
          placeholder="Buscar programa por código, nombre, red o línea..."
        />

        <ClearFiltersButton onClick={() => setSearch('')} disabled={!search} />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando programas…" />
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
                    <TableHeader width="w-[14%]">Lista de materiales</TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pagePrograms.length === 0 ? (
                    <TableEmpty colSpan={7}>
                      {programs.length === 0
                        ? 'Aún no hay programas activos. Asegure primero una red con líneas en Redes y Líneas; luego use «Nuevo programa».'
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
                            <span className="text-sena-text-soft">Sin ficha</span>
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
                          <Link
                            to={`/listas-maestras-material?programaId=${programa.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-sena-line bg-white px-3 py-1 text-xs font-semibold text-sena-dark shadow-hairline transition hover:border-sena/45 hover:bg-white/50"
                          >
                            <ExcelIcon className="size-[14px]" />
                            Lista maestra
                          </Link>
                        </td>

                        <td>
                          <RowActions>
                            {can('programas', 'edit') ? (
                              <ActionButton
                                title="Editar programa"
                                onClick={() => openEditProgram(programa)}
                              >
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {can('programas', 'delete') ? (
                              <ActionButton
                                title="Desactivar programa"
                                danger
                                onClick={() => setToDelete(programa)}
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
              total={filteredPrograms.length}
              noun="programas"
            />
          </>
        )}
      </TableCard>

      {programModal ? (
        <Modal
          title={programModal.mode === 'create' ? 'Nuevo programa de formación' : 'Editar programa'}
          description="El programa pertenece a una red de conocimiento y a una de sus líneas temáticas."
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

            <p className="rounded-xl border border-sena-line bg-sena-veil/50 px-4 py-3 text-xs text-sena-text-soft sm:col-span-2">
              Los centros donde se ofrece el programa se toman de las fichas asociadas. Para
              ofrecerlo en otro centro, cree una ficha de ese programa en ese centro.
            </p>

            {options.redes.length === 0 ? (
              <p className="rounded-xl border border-sena-line bg-sena-veil/50 px-4 py-3 text-xs text-sena-text-soft sm:col-span-2">
                No hay redes activas. Cree una red y asígnele líneas en las secciones Redes y Líneas.
              </p>
            ) : selectedRed && selectedRed.lineas.length === 0 ? (
              <p className="rounded-xl border border-sena-line bg-sena-veil/50 px-4 py-3 text-xs text-sena-text-soft sm:col-span-2">
                La red seleccionada todavía no tiene líneas activas. Asígnele una desde la sección
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
