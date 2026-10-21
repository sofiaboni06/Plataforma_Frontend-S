import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
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
  InventoryIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import type { NivelPrograma } from '@/modules/materiales-formacion/types/formacion'

const PAGE_SIZE = 8

export default function NivelesProgramaPage() {
  const { can } = useFormacionAccess()
  const [niveles, setNiveles] = useState<NivelPrograma[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [modal, setModal] = useState<{ nivel?: NivelPrograma } | null>(null)
  const [nombre, setNombre] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<NivelPrograma | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Niveles de formación | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const list = await api<NivelPrograma[]>('/niveles-programa')
        if (!cancelled) setNiveles(list)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudieron cargar los niveles de formación.',
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return niveles

    return niveles.filter((nivel) => nivel.nombre.toLowerCase().includes(query))
  }, [niveles, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageRows.length

  const reload = async () => {
    setNiveles(await api<NivelPrograma[]>('/niveles-programa'))
  }

  const openCreate = () => {
    setNombre('')
    setFormError(null)
    setMessage(null)
    setModal({})
  }

  const openEdit = (nivel: NivelPrograma) => {
    setNombre(nivel.nombre)
    setFormError(null)
    setMessage(null)
    setModal({ nivel })
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
      const payload = { nombre: nombre.trim() }

      if (modal.nivel) {
        await api<NivelPrograma>(`/niveles-programa/${modal.nivel.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setMessage(`Nivel “${payload.nombre}” actualizado.`)
      } else {
        await api<NivelPrograma>('/niveles-programa', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setMessage(`Nivel “${payload.nombre}” creado.`)
      }

      setModal(null)
      await reload().catch(() => undefined)
    } catch (caught) {
      setFormError(
        caught instanceof ApiError ? caught.message : 'No se pudo guardar el nivel de formación.',
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
      await api(`/niveles-programa/${toDelete.id}`, { method: 'DELETE' })
      setMessage(`Nivel “${toDelete.nombre}” eliminado.`)
      setToDelete(null)
      await reload().catch(() => undefined)
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'No se pudo eliminar el nivel de formación.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout title="Niveles de formación">
      <PageHeader
        icon={<InventoryIcon />}
        title="Niveles de formación"
        description="Catálogo corto con los niveles de formación: técnico, tecnólogo, entre otros."
        action={
          can('niveles', 'create') ? (
            <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreate}>
              Nuevo nivel
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
          placeholder="Buscar nivel de formación por nombre..."
        />

        <ClearFiltersButton onClick={() => setSearch('')} disabled={!search} />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando niveles de formación…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader>Nivel de formación</TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={2}>
                      {niveles.length === 0
                        ? 'Aún no hay niveles registrados. Cree el primero con «Nuevo nivel».'
                        : 'No hay niveles que coincidan con la búsqueda.'}
                    </TableEmpty>
                  ) : (
                    pageRows.map((nivel) => (
                      <TableRow key={nivel.id}>
                        <td className="truncate font-semibold text-sena-text">{nivel.nombre}</td>

                        <td>
                          <RowActions>
                            {can('niveles', 'edit') ? (
                              <ActionButton title="Editar nivel" onClick={() => openEdit(nivel)}>
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}

                            {can('niveles', 'delete') ? (
                              <ActionButton
                                title="Eliminar nivel"
                                danger
                                onClick={() => setToDelete(nivel)}
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
              noun="niveles"
            />
          </>
        )}
      </TableCard>

      {modal ? (
        <Modal
          title={modal.nivel ? 'Editar nivel de formación' : 'Nuevo nivel de formación'}
          description="El nivel se elige al crear o editar un programa de formación."
          onClose={closeModal}
          wide
          spacious
        >
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <TextField
              id="nivel-nombre"
              label="Nombre del nivel"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              maxLength={100}
              required
            />

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
                {saving ? 'Guardando…' : modal.nivel ? 'Guardar cambios' : 'Crear nivel'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title="Eliminar nivel de formación"
          subtitle={toDelete.nombre}
          confirmLabel="Eliminar"
          pendingLabel="Eliminando…"
          pending={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            if (!deleting) setToDelete(null)
          }}
        >
          Si algún programa usa este nivel, no se podrá eliminar.
        </ConfirmDialog>
      ) : null}
    </AppLayout>
  )
}
