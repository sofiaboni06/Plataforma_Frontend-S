import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import { StatusPill } from '@/shared/components/ResourceBoard'
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
import {
  CalendarIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'
import { filterSelectClass } from '@/shared/lib/table'
import { useAuth } from '@/modules/auth/context/auth'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import type { Ficha, FichaOptions } from '@/modules/materiales-formacion/types/formacion'

const PAGE_SIZE = 8

const EMPTY_FICHA = {
  numeroFicha: '',
  idPrograma: '',
  idJornada: '',
  idCformacion: '',
  fechaInicio: '',
  fechaFin: '',
  cupoAprendices: '30',
  estado: true,
}

type FichaForm = typeof EMPTY_FICHA
type EstadoFilter = 'Todas' | 'Activas' | 'Inactivas'

async function fetchFichas(centerId: string, estado: EstadoFilter) {
  const base = `/fichas?idCformacion=${centerId}`

  if (estado === 'Todas') {
    const [activas, inactivas] = await Promise.all([
      api<Ficha[]>(`${base}&estado=true`),
      api<Ficha[]>(`${base}&estado=false`),
    ])
    return [...activas, ...inactivas].sort((left, right) =>
      left.numeroFicha.localeCompare(right.numeroFicha),
    )
  }

  return api<Ficha[]>(`${base}&estado=${estado === 'Activas'}`)
}

function formatDate(value: string | null) {
  if (!value) return null
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

export default function FichasPage() {
  const { user } = useAuth()
  const { can } = useFormacionAccess()
  const [options, setOptions] = useState<FichaOptions>({
    programas: [],
    jornadas: [],
    centros: [],
  })
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [centerId, setCenterId] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('Todas')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [fichasLoading, setFichasLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [modal, setModal] = useState<{ ficha?: Ficha } | null>(null)
  const [form, setForm] = useState<FichaForm>(EMPTY_FICHA)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Ficha | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Fichas | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const nextOptions = await api<FichaOptions>('/fichas/options')
        if (cancelled) return
        setOptions(nextOptions)

        const preferred = user?.trainingCenterId
        const fallback = nextOptions.centros[0]?.id
        const selected =
          preferred && nextOptions.centros.some((centro) => centro.id === preferred)
            ? preferred
            : fallback
        setCenterId(selected ? String(selected) : '')
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError ? caught.message : 'No se pudieron cargar las fichas.',
          )
        }
      } finally {
        if (!cancelled) setOptionsLoading(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [user?.trainingCenterId])

  useEffect(() => {
    if (!centerId) return
    let cancelled = false

    async function load() {
      setFichasLoading(true)
      try {
        const list = await fetchFichas(centerId, estadoFilter)
        if (!cancelled) setFichas(list)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError ? caught.message : 'No se pudieron cargar las fichas.',
          )
        }
      } finally {
        if (!cancelled) setFichasLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [centerId, estadoFilter])

  useEffect(() => {
    setPage(1)
  }, [search])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return fichas

    return fichas.filter((ficha) =>
      `${ficha.numeroFicha} ${ficha.programa?.codigo ?? ''} ${ficha.programa?.nombre ?? ''} ${
        ficha.centroFormacion?.nombre ?? ''
      } ${ficha.jornada?.nombre ?? ''}`
        .toLowerCase()
        .includes(query),
    )
  }, [fichas, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageRows.length

  const programOptions = options.programas.map((programa) => ({
    value: String(programa.id),
    label: `${programa.codigo} · ${programa.nombre}`,
  }))

  const centerOptions = options.centros.map((centro) => ({
    value: String(centro.id),
    label: centro.nombre,
  }))

  const jornadaOptions = options.jornadas.map((jornada) => ({
    value: String(jornada.id),
    label: jornada.nombre,
  }))

  const reloadFichas = async () => {
    if (!centerId) return
    setFichas(await fetchFichas(centerId, estadoFilter))
  }

  const patchForm = <K extends keyof FichaForm>(field: K, value: FichaForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FICHA, idCformacion: centerId })
    setFormError(null)
    setMessage(null)
    setModal({})
  }

  const openEdit = (ficha: Ficha) => {
    setForm({
      numeroFicha: ficha.numeroFicha,
      idPrograma: String(ficha.programaId),
      idJornada: ficha.jornadaId != null ? String(ficha.jornadaId) : '',
      idCformacion: String(ficha.centroFormacionId),
      fechaInicio: ficha.fechaInicio ?? '',
      fechaFin: ficha.fechaFin ?? '',
      cupoAprendices: String(ficha.cupoAprendices),
      estado: ficha.estado,
    })
    setFormError(null)
    setMessage(null)
    setModal({ ficha })
  }

  const closeModal = () => {
    if (saving) return
    setModal(null)
    setFormError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!modal) return

    setSaving(true)
    setFormError(null)
    setMessage(null)
    try {
      const payload = {
        idPrograma: Number(form.idPrograma),
        idJornada: form.idJornada ? Number(form.idJornada) : null,
        idCformacion: Number(form.idCformacion),
        numeroFicha: form.numeroFicha.trim(),
        fechaInicio: form.fechaInicio || null,
        fechaFin: form.fechaFin || null,
        cupoAprendices: form.cupoAprendices ? Number(form.cupoAprendices) : 30,
        estado: form.estado,
      }

      if (modal.ficha) {
        await api<Ficha>(`/fichas/${modal.ficha.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setMessage(`Ficha ${payload.numeroFicha} actualizada.`)
      } else {
        await api<Ficha>('/fichas', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setMessage(`Ficha ${payload.numeroFicha} creada.`)
      }

      setModal(null)
      await reloadFichas().catch(() => undefined)
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'No se pudo guardar la ficha.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return

    setDeleting(true)
    setError(null)
    setMessage(null)
    try {
      await api(`/fichas/${toDelete.id}`, { method: 'DELETE' })
      setMessage(`Ficha ${toDelete.numeroFicha} deshabilitada.`)
      setToDelete(null)
      await reloadFichas().catch(() => undefined)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo deshabilitar la ficha.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout title="Fichas">
      <PageHeader
        icon={<CalendarIcon />}
        title="Fichas"
        description="La ficha es la que ofrece un programa en un centro. Para que un instructor de un centro vea un programa, ese centro necesita una ficha activa."
        action={
          can('fichas', 'create') ? (
            <Button
              type="button"
              icon={<PlusIcon className="size-4" />}
              onClick={openCreate}
              disabled={optionsLoading || options.programas.length === 0}
            >
              Nueva ficha
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

      {!optionsLoading && options.programas.length === 0 ? (
        <p className="mb-4 rounded-2xl border border-sena-line bg-sena-veil/60 px-5 py-3.5 text-sm text-sena-text-soft">
          No hay programas activos. Cree primero un programa en la sección Programas de formación.
        </p>
      ) : null}

      <FilterCard>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por número de ficha, programa, centro o jornada..."
        />

        <FilterGroup label="Centro">
          <select
            value={centerId}
            onChange={(event) => setCenterId(event.target.value)}
            className={`${filterSelectClass} lg:w-56`}
            disabled={optionsLoading}
          >
            {options.centros.map((centro) => (
              <option key={centro.id} value={String(centro.id)}>
                {centro.nombre}
              </option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup label="Estado">
          <select
            value={estadoFilter}
            onChange={(event) => setEstadoFilter(event.target.value as EstadoFilter)}
            className={`${filterSelectClass} lg:w-44`}
          >
            <option value="Todas">Todas</option>
            <option value="Activas">Activas</option>
            <option value="Inactivas">Inactivas</option>
          </select>
        </FilterGroup>

        <ClearFiltersButton
          onClick={() => {
            setSearch('')
            setEstadoFilter('Todas')
          }}
          disabled={!search && estadoFilter === 'Todas'}
        />
      </FilterCard>

      <TableCard>
        {optionsLoading || fichasLoading ? (
          <TableLoading label="Cargando fichas…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader width="w-[14%]">Ficha</TableHeader>
                    <TableHeader width="w-[26%]">Programa</TableHeader>
                    <TableHeader width="w-[18%]">Centro</TableHeader>
                    <TableHeader width="w-[14%]">Jornada</TableHeader>
                    <TableHeader width="w-[16%]">Fechas</TableHeader>
                    <TableHeader align="center" width="w-[7%]">
                      Cupo
                    </TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={7}>
                      {fichas.length === 0
                        ? estadoFilter === 'Inactivas'
                          ? 'Este centro no tiene fichas inactivas.'
                          : 'Este centro no tiene fichas. Cree la primera con «Nueva ficha».'
                        : 'No hay fichas que coincidan con la búsqueda.'}
                    </TableEmpty>
                  ) : (
                    pageRows.map((ficha) => (
                      <TableRow key={ficha.id}>
                        <td className="min-w-0">
                          <p className="truncate font-semibold text-sena-text">
                            {ficha.numeroFicha}
                          </p>
                          <StatusPill tone={ficha.estado ? 'ok' : 'danger'}>
                            {ficha.estado ? 'Activa' : 'Inactiva'}
                          </StatusPill>
                        </td>

                        <td className="min-w-0">
                          <p className="truncate text-sena-text">
                            {ficha.programa?.nombre ?? '—'}
                          </p>
                          <p className="truncate text-xs text-sena-text-soft">
                            {ficha.programa?.codigo ?? '—'}
                            {ficha.programa?.nivel ? ` · ${ficha.programa.nivel.nombre}` : ''}
                          </p>
                        </td>

                        <td className="truncate text-sena-strong">
                          {ficha.centroFormacion?.nombre ?? '—'}
                        </td>

                        <td className="truncate text-sena-strong">
                          {ficha.jornada?.nombre ?? 'Sin jornada'}
                        </td>

                        <td className="text-sena-strong">
                          {formatDate(ficha.fechaInicio) ?? '—'}
                          <span className="text-sena-text-soft"> → </span>
                          {formatDate(ficha.fechaFin) ?? '—'}
                        </td>

                        <td className="text-center text-sena-strong">{ficha.cupoAprendices}</td>

                        <td>
                          <RowActions>
                            {can('fichas', 'edit') ? (
                              <ActionButton title="Editar ficha" onClick={() => openEdit(ficha)}>
                                <PencilIcon className="size-4.5" />
                              </ActionButton>
                            ) : null}

                            {can('fichas', 'delete') ? (
                              <ActionButton
                                title="Deshabilitar ficha"
                                danger
                                onClick={() => setToDelete(ficha)}
                              >
                                <TrashIcon className="size-4.5" />
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
              total={filtered.length}
              noun="fichas"
            />
          </>
        )}
      </TableCard>

      {modal ? (
        <Modal
          title={modal.ficha ? 'Editar ficha' : 'Nueva ficha'}
          description="La ficha asocia un programa a un centro. Es la que habilita el programa para los instructores de ese centro."
          onClose={closeModal}
          wide
          spacious
        >
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
            <SelectField
              id="ficha-programa"
              label="Programa"
              value={form.idPrograma}
              onChange={(value) => patchForm('idPrograma', value)}
              placeholder="Seleccione un programa"
              options={programOptions}
            />

            <TextField
              id="ficha-numero"
              label="Número de ficha"
              value={form.numeroFicha}
              onChange={(event) => patchForm('numeroFicha', event.target.value)}
              maxLength={30}
              required
            />

            <SelectField
              id="ficha-centro"
              label="Centro de formación"
              value={form.idCformacion}
              onChange={(value) => patchForm('idCformacion', value)}
              placeholder="Seleccione un centro"
              options={centerOptions}
            />

            <SelectField
              id="ficha-jornada"
              label="Jornada"
              value={form.idJornada}
              onChange={(value) => patchForm('idJornada', value)}
              placeholder="Sin jornada"
              options={jornadaOptions}
              required={false}
            />

            <TextField
              id="ficha-inicio"
              label="Fecha de inicio"
              type="date"
              value={form.fechaInicio}
              onChange={(event) => patchForm('fechaInicio', event.target.value)}
            />

            <TextField
              id="ficha-fin"
              label="Fecha de fin"
              type="date"
              value={form.fechaFin}
              onChange={(event) => patchForm('fechaFin', event.target.value)}
            />

            <TextField
              id="ficha-cupo"
              label="Cupo de aprendices"
              type="number"
              min={1}
              value={form.cupoAprendices}
              onChange={(event) => patchForm('cupoAprendices', event.target.value)}
              required
            />

            <label className="flex items-center gap-3 self-end pb-2 text-sm font-medium text-sena-text">
              <input
                type="checkbox"
                className="size-4 accent-sena"
                checked={form.estado}
                onChange={(event) => patchForm('estado', event.target.checked)}
              />
              Ficha activa
            </label>

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
                {saving ? 'Guardando…' : modal.ficha ? 'Guardar cambios' : 'Crear ficha'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title="Deshabilitar ficha"
          subtitle={toDelete.numeroFicha}
          confirmLabel="Deshabilitar"
          pendingLabel="Deshabilitando…"
          pending={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            if (!deleting) setToDelete(null)
          }}
        >
          El programa dejará de aparecer para el centro de esta ficha si no tiene otra ficha activa
          allí. Las asignaciones existentes se conservan.
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}
