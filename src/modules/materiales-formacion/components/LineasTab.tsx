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
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import type { LineaTematica } from '@/modules/materiales-formacion/types/formacion'
import type { FormacionTabHandle } from '@/modules/materiales-formacion/components/types'

const PAGE_SIZE = 8

const EMPTY_LINEA = {
  nombre: '',
  descripcion: '',
}

type LineaForm = typeof EMPTY_LINEA

function nullable(value: string) {
  const text = value.trim()
  return text ? text : null
}

export default function LineasTab({
  search,
  onCatalogChanged,
  ref,
}: {
  search: string
  onCatalogChanged: () => void
  ref?: Ref<FormacionTabHandle>
}) {
  const { can } = useFormacionAccess()
  const [lineas, setLineas] = useState<LineaTematica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [modal, setModal] = useState<{ linea?: LineaTematica } | null>(null)
  const [form, setForm] = useState<LineaForm>(EMPTY_LINEA)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<LineaTematica | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLineas(await api<LineaTematica[]>('/lineas-tematicas'))
  }

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const list = await api<LineaTematica[]>('/lineas-tematicas')
        if (!cancelled) setLineas(list)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudieron cargar las líneas temáticas.',
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
    setForm(EMPTY_LINEA)
    setFormError(null)
    setMessage(null)
    setModal({})
  }

  useImperativeHandle(ref, () => ({ openCreate }))

  const openEdit = (linea: LineaTematica) => {
    setForm({
      nombre: linea.nombre,
      descripcion: linea.descripcion ?? '',
    })
    setFormError(null)
    setMessage(null)
    setModal({ linea })
  }

  const closeModal = () => {
    if (saving) return
    setModal(null)
    setFormError(null)
  }

  const patchForm = (field: keyof LineaForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return lineas

    return lineas.filter((linea) =>
      `${linea.nombre} ${linea.descripcion ?? ''} ${linea.redes.map((red) => red.nombre).join(' ')}`
        .toLowerCase()
        .includes(query),
    )
  }, [lineas, search])

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
        descripcion: nullable(form.descripcion),
      }

      if (modal.linea) {
        await api<LineaTematica>(`/lineas-tematicas/${modal.linea.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setMessage(`Línea “${payload.nombre}” actualizada.`)
      } else {
        await api<LineaTematica>('/lineas-tematicas', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setMessage(`Línea “${payload.nombre}” creada. Asígnela a una red para usarla en programas.`)
      }

      setModal(null)
      await refresh().catch(() => undefined)
    } catch (caught) {
      setFormError(
        caught instanceof ApiError ? caught.message : 'No se pudo guardar la línea temática.',
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
      await api(`/lineas-tematicas/${toDelete.id}`, { method: 'DELETE' })
      setMessage(`Línea “${toDelete.nombre}” desactivada.`)
      setToDelete(null)
      await refresh().catch(() => undefined)
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo desactivar la línea temática.',
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
          <TableLoading label="Cargando líneas temáticas…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader width="w-[26%]">Línea</TableHeader>
                    <TableHeader width="w-[34%]">Descripción</TableHeader>
                    <TableHeader width="w-[24%]">Redes</TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={4}>
                      {lineas.length === 0
                        ? 'Aún no hay líneas activas. Cree la primera con «Nueva línea».'
                        : 'No hay líneas que coincidan con la búsqueda.'}
                    </TableEmpty>
                  ) : (
                    pageRows.map((linea) => (
                      <TableRow key={linea.id}>
                        <td className="truncate font-semibold text-sena-text">{linea.nombre}</td>

                        <td className="truncate text-sena-strong">
                          {linea.descripcion || '—'}
                        </td>

                        <td>
                          <StatusPill tone={linea.redes.length ? 'ok' : 'danger'}>
                            {linea.redes.length === 0
                              ? 'Sin red'
                              : `${linea.redes.length} ${
                                  linea.redes.length === 1 ? 'red' : 'redes'
                                }`}
                          </StatusPill>

                          {linea.redes.length ? (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {linea.redes.slice(0, 2).map((red) => (
                                <span
                                  key={red.id}
                                  title={red.nombre}
                                  className="max-w-[10rem] truncate rounded-full bg-sena-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-sena-dark"
                                >
                                  {red.nombre}
                                </span>
                              ))}
                              {linea.redes.length > 2 ? (
                                <span className="rounded-full bg-sena-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-sena-dark">
                                  +{linea.redes.length - 2}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <p className="mt-1.5 text-xs text-sena-text-soft">
                              Asígnela a una red desde la pestaña Redes.
                            </p>
                          )}
                        </td>

                        <td>
                          <RowActions>
                            {can('lineas', 'edit') ? (
                              <ActionButton title="Editar línea" onClick={() => openEdit(linea)}>
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {can('lineas', 'delete') ? (
                              <ActionButton
                                title="Desactivar línea"
                                danger
                                onClick={() => setToDelete(linea)}
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
              total={filtered.length}
              noun="líneas"
            />
          </>
        )}
      </TableCard>

      {modal ? (
        <Modal
          title={modal.linea ? 'Editar línea temática' : 'Nueva línea temática'}
          description="Las líneas se asocian a una red de conocimiento y son la segunda parte de un programa de formación."
          onClose={closeModal}
          wide
          spacious
        >
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <TextField
              id="linea-nombre"
              label="Nombre de la línea"
              value={form.nombre}
              onChange={(event) => patchForm('nombre', event.target.value)}
              maxLength={150}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="linea-descripcion" className="form-label">
                Descripción
              </label>
              <textarea
                id="linea-descripcion"
                value={form.descripcion}
                onChange={(event) => patchForm('descripcion', event.target.value)}
                maxLength={1000}
                rows={4}
                className="form-field h-auto min-h-24 resize-y px-3.5 py-3"
                placeholder="Opcional"
              />
            </div>

            {modal.linea ? (
              <div className="rounded-xl border border-sena-line bg-sena-veil/50 px-4 py-3">
                <p className="text-xs font-semibold tracking-[0.08em] text-sena-text-soft uppercase">
                  Redes asociadas
                </p>
                {modal.linea.redes.length === 0 ? (
                  <p className="mt-1 text-sm text-sena-text-soft">
                    Esta línea todavía no pertenece a ninguna red. Asígnela desde la pestaña Redes.
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {modal.linea.redes.map((red) => (
                      <span
                        key={red.id}
                        className="rounded-full bg-sena-soft px-2.5 py-1 text-xs font-semibold text-sena-dark"
                      >
                        {red.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-sena-line bg-sena-veil/50 px-4 py-3 text-xs text-sena-text-soft">
                Después de crearla, edite la red correspondiente en la pestaña Redes para asociarla.
              </p>
            )}

            {formError ? (
              <div className="rounded-xl bg-sena-danger-soft px-4 py-3 text-sm text-sena-danger-text ring-1 ring-sena-danger-line">
                {formError}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : modal.linea ? 'Guardar cambios' : 'Crear línea'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title="Desactivar línea temática"
          subtitle={toDelete.nombre}
          confirmLabel="Desactivar"
          pendingLabel="Desactivando…"
          pending={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            if (!deleting) setToDelete(null)
          }}
        >
          Dejará de aparecer al crear o editar redes y programas. Las asociaciones existentes se
          conservan.
        </ConfirmDialog>
      ) : null}
    </>
  )
}
