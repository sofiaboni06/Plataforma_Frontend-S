import { useEffect, useImperativeHandle, useMemo, useState, type FormEvent, type Ref } from 'react'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog'
import Modal from '@/shared/components/ui/Modal'
import TextField from '@/shared/components/ui/TextField'
import {
  ActionButton,
  ErrorBanner,
  RowActions,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TablePagination,
  TableRow,
  tableClass,
  tableColumns,
} from '@/shared/components/DataTable'
import { PencilIcon, TrashIcon } from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'
import type {
  LineaTematica,
  RedConocimiento,
} from '@/modules/materiales-formacion/types/formacion'
import type { FormacionTabHandle } from '@/modules/materiales-formacion/components/types'

const PAGE_SIZE = 8

const EMPTY_RED = {
  nombre: '',
  nombreGestor: '',
  telGestor: '',
  mailGestor: '',
  nombreAsesor: '',
  telAsesor: '',
  mailAsesor: '',
  lineaIds: [] as number[],
}

type RedForm = typeof EMPTY_RED
type RedField = Exclude<keyof RedForm, 'lineaIds'>

function nullable(value: string) {
  const text = value.trim()
  return text ? text : null
}

export default function RedesTab({
  search,
  onCatalogChanged,
  ref,
}: {
  search: string
  onCatalogChanged: () => void
  ref?: Ref<FormacionTabHandle>
}) {
  const [redes, setRedes] = useState<RedConocimiento[]>([])
  const [lineas, setLineas] = useState<LineaTematica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [modal, setModal] = useState<{ red?: RedConocimiento } | null>(null)
  const [form, setForm] = useState<RedForm>(EMPTY_RED)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<RedConocimiento | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    const [nextRedes, nextLineas] = await Promise.all([
      api<RedConocimiento[]>('/redes-conocimiento'),
      api<LineaTematica[]>('/lineas-tematicas'),
    ])
    setRedes(nextRedes)
    setLineas(nextLineas)
  }

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const [nextRedes, nextLineas] = await Promise.all([
          api<RedConocimiento[]>('/redes-conocimiento'),
          api<LineaTematica[]>('/lineas-tematicas'),
        ])
        if (cancelled) return
        setRedes(nextRedes)
        setLineas(nextLineas)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudieron cargar las redes de conocimiento.',
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

  const openCreate = () => {
    setForm({ ...EMPTY_RED, lineaIds: [] })
    setFormError(null)
    setMessage(null)
    setModal({})
  }

  useImperativeHandle(ref, () => ({ openCreate }))

  const openEdit = (red: RedConocimiento) => {
    setForm({
      nombre: red.nombre,
      nombreGestor: red.nombreGestor ?? '',
      telGestor: red.telGestor ?? '',
      mailGestor: red.mailGestor ?? '',
      nombreAsesor: red.nombreAsesor ?? '',
      telAsesor: red.telAsesor ?? '',
      mailAsesor: red.mailAsesor ?? '',
      lineaIds: red.lineaIds,
    })
    setFormError(null)
    setMessage(null)
    setModal({ red })
  }

  const closeModal = () => {
    if (saving) return
    setModal(null)
    setFormError(null)
  }

  const patchForm = (field: RedField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const toggleLinea = (lineaId: number) => {
    setForm((current) => ({
      ...current,
      lineaIds: current.lineaIds.includes(lineaId)
        ? current.lineaIds.filter((id) => id !== lineaId)
        : [...current.lineaIds, lineaId],
    }))
  }

  const lineaOptions = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string; estado: boolean }>()
    for (const linea of lineas) {
      map.set(linea.id, { id: linea.id, nombre: linea.nombre, estado: linea.estado })
    }
    for (const linea of modal?.red?.lineasTematicas ?? []) {
      if (!map.has(linea.id)) map.set(linea.id, linea)
    }
    return [...map.values()].sort((left, right) => left.nombre.localeCompare(right.nombre))
  }, [lineas, modal])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return redes

    return redes.filter((red) =>
      `${red.nombre} ${red.nombreGestor ?? ''} ${red.nombreAsesor ?? ''} ${red.lineasTematicas
        .map((linea) => linea.nombre)
        .join(' ')}`
        .toLowerCase()
        .includes(query),
    )
  }, [redes, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageRows.length

  const refresh = async () => {
    await load()
    onCatalogChanged()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!modal) return

    setSaving(true)
    setFormError(null)
    setMessage(null)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        nombreGestor: nullable(form.nombreGestor),
        telGestor: nullable(form.telGestor),
        mailGestor: nullable(form.mailGestor),
        nombreAsesor: nullable(form.nombreAsesor),
        telAsesor: nullable(form.telAsesor),
        mailAsesor: nullable(form.mailAsesor),
        lineaIds: form.lineaIds,
      }

      if (modal.red) {
        await api<RedConocimiento>(`/redes-conocimiento/${modal.red.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setMessage(`Red “${payload.nombre}” actualizada.`)
      } else {
        await api<RedConocimiento>('/redes-conocimiento', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setMessage(`Red “${payload.nombre}” creada.`)
      }

      setModal(null)
      await refresh().catch(() => undefined)
    } catch (caught) {
      setFormError(
        caught instanceof ApiError ? caught.message : 'No se pudo guardar la red de conocimiento.',
      )
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
      await api(`/redes-conocimiento/${toDelete.id}`, { method: 'DELETE' })
      setMessage(`Red “${toDelete.nombre}” desactivada.`)
      setToDelete(null)
      await refresh().catch(() => undefined)
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'No se pudo desactivar la red de conocimiento.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      {message ? (
        <p className="mb-4 rounded-2xl border border-sena-ok-line bg-sena-active-soft px-5 py-3.5 text-sm text-sena-ok-text">
          {message}
        </p>
      ) : null}

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando redes de conocimiento…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader width="w-[24%]">Red</TableHeader>
                    <TableHeader width="w-[26%]">Líneas temáticas</TableHeader>
                    <TableHeader width="w-[18%]">Gestor</TableHeader>
                    <TableHeader width="w-[16%]">Asesor</TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={5}>
                      {redes.length === 0
                        ? 'Aún no hay redes activas. Cree la primera con «Nueva red».'
                        : 'No hay redes que coincidan con la búsqueda.'}
                    </TableEmpty>
                  ) : (
                    pageRows.map((red) => (
                      <TableRow key={red.id}>
                        <td className="truncate font-semibold text-sena-text">{red.nombre}</td>

                        <td>
                          <StatusPill tone={red.lineasTematicas.length ? 'ok' : 'danger'}>
                            {red.lineasTematicas.length === 0
                              ? 'Sin líneas'
                              : `${red.lineasTematicas.length} ${
                                  red.lineasTematicas.length === 1 ? 'línea' : 'líneas'
                                }`}
                          </StatusPill>

                          {red.lineasTematicas.length ? (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {red.lineasTematicas.slice(0, 2).map((linea) => (
                                <span
                                  key={linea.id}
                                  title={linea.nombre}
                                  className="max-w-[10rem] truncate rounded-full bg-sena-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-sena-dark"
                                >
                                  {linea.nombre}
                                </span>
                              ))}
                              {red.lineasTematicas.length > 2 ? (
                                <span className="rounded-full bg-sena-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-sena-dark">
                                  +{red.lineasTematicas.length - 2}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <p className="mt-1.5 text-xs text-sena-text-soft">
                              Asígnele líneas para poder crear programas.
                            </p>
                          )}
                        </td>

                        <td className="min-w-0">
                          <p className="truncate text-sena-strong">{red.nombreGestor || '—'}</p>
                          <p className="truncate text-xs text-sena-text-soft">
                            {red.mailGestor || red.telGestor || ''}
                          </p>
                        </td>

                        <td className="min-w-0">
                          <p className="truncate text-sena-strong">{red.nombreAsesor || '—'}</p>
                          <p className="truncate text-xs text-sena-text-soft">
                            {red.mailAsesor || red.telAsesor || ''}
                          </p>
                        </td>

                        <td>
                          <RowActions>
                            <ActionButton title="Editar red" onClick={() => openEdit(red)}>
                              <PencilIcon className="size-[18px]" />
                            </ActionButton>

                            <ActionButton
                              title="Desactivar red"
                              danger
                              onClick={() => setToDelete(red)}
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
              total={filtered.length}
              noun="redes"
            />
          </>
        )}
      </TableCard>

      {modal ? (
        <Modal
          title={modal.red ? 'Editar red de conocimiento' : 'Nueva red de conocimiento'}
          description="La red agrupa las líneas temáticas que luego se eligen al crear un programa de formación."
          onClose={closeModal}
          wide
          spacious
        >
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="sm:col-span-2">
              <TextField
                id="red-nombre"
                label="Nombre de la red"
                value={form.nombre}
                onChange={(event) => patchForm('nombre', event.target.value)}
                maxLength={150}
                required
              />
            </div>

            <TextField
              id="red-nombre-gestor"
              label="Nombre del gestor"
              value={form.nombreGestor}
              onChange={(event) => patchForm('nombreGestor', event.target.value)}
              maxLength={150}
            />
            <TextField
              id="red-tel-gestor"
              label="Teléfono del gestor"
              value={form.telGestor}
              onChange={(event) => patchForm('telGestor', event.target.value)}
              maxLength={30}
            />
            <div className="sm:col-span-2">
              <TextField
                id="red-mail-gestor"
                label="Correo del gestor"
                type="email"
                value={form.mailGestor}
                onChange={(event) => patchForm('mailGestor', event.target.value)}
                maxLength={150}
              />
            </div>

            <TextField
              id="red-nombre-asesor"
              label="Nombre del asesor"
              value={form.nombreAsesor}
              onChange={(event) => patchForm('nombreAsesor', event.target.value)}
              maxLength={150}
            />
            <TextField
              id="red-tel-asesor"
              label="Teléfono del asesor"
              value={form.telAsesor}
              onChange={(event) => patchForm('telAsesor', event.target.value)}
              maxLength={30}
            />
            <div className="sm:col-span-2">
              <TextField
                id="red-mail-asesor"
                label="Correo del asesor"
                type="email"
                value={form.mailAsesor}
                onChange={(event) => patchForm('mailAsesor', event.target.value)}
                maxLength={150}
              />
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-sena-text/75">Líneas temáticas</p>
              <p className="mt-1 text-xs text-sena-text/55">
                Marque las líneas que pertenecen a esta red. Si falta una, créela primero en la
                pestaña Líneas.
              </p>

              {lineaOptions.length === 0 ? (
                <p className="mt-2 rounded-xl border border-sena-line bg-sena-veil/60 px-4 py-3 text-sm text-sena-text-soft">
                  Aún no hay líneas activas. Créelas en la pestaña Líneas y vuelva a intentarlo.
                </p>
              ) : (
                <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-xl border border-sena-line bg-sena-veil/50 p-3">
                  {lineaOptions.map((linea) => (
                    <label
                      key={linea.id}
                      className="flex items-start gap-2 text-sm text-sena-text"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 accent-[#00a651]"
                        checked={form.lineaIds.includes(linea.id)}
                        onChange={() => toggleLinea(linea.id)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate">{linea.nombre}</span>
                        {linea.estado === false ? (
                          <span className="block text-xs text-sena-text/55">Inactiva</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

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
                {saving ? 'Guardando…' : modal.red ? 'Guardar cambios' : 'Crear red'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title="Desactivar red de conocimiento"
          subtitle={toDelete.nombre}
          confirmLabel="Desactivar"
          pendingLabel="Desactivando…"
          pending={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            if (!deleting) setToDelete(null)
          }}
        >
          Dejará de aparecer al crear programas. Los programas existentes que ya usan esta red se
          conservan, y sus líneas siguen disponibles.
        </ConfirmDialog>
      ) : null}
    </>
  )
}
