import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import TextField from '@/shared/components/ui/TextField'
import { PlusIcon, SearchIcon } from '@/shared/components/icons/AppIcons'
import { ApiError } from '@/shared/lib/api'

import {
  createActividad,
  deleteActividad,
  getActividades,
  updateActividad,
} from '@/modules/actividades/data/actividad'

import type { Actividad } from '@/modules/actividades/types'

type ModalMode = 'create' | 'edit'

const EMPTY_FORM = {
  nombre: '',
  lugar: '',
  estado: true,
}

export default function ActivitiesPage() {
  const [actividades, setActividades] = useState<
    Actividad[]
  >([])

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<
    'Todos' | 'Activas' | 'Inactivas'
  >('Todos')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [modal, setModal] =
    useState<ModalMode | null>(null)

  const [selectedId, setSelectedId] =
    useState<number | null>(null)

  const [form, setForm] =
    useState(EMPTY_FORM)

  const [error, setError] =
    useState<string | null>(null)

  const loadActividades = async () => {
    try {
      setLoading(true)
      setError(null)

      const rows = await getActividades()
      setActividades(rows)
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudieron cargar las actividades.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadActividades()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return actividades.filter((actividad) => {
      const matchesTab =
        tab === 'Todos' ||
        (tab === 'Activas' && actividad.estado) ||
        (tab === 'Inactivas' && !actividad.estado)

      const matchesSearch =
        !query ||
        `${actividad.nombre} ${actividad.lugar ?? ''}`
          .toLowerCase()
          .includes(query)

      return matchesTab && matchesSearch
    })
  }, [actividades, search, tab])

  const openCreate = () => {
    setSelectedId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setModal('create')
  }

  const openEdit = (actividad: Actividad) => {
    setSelectedId(actividad.id)
    setForm({
      nombre: actividad.nombre,
      lugar: actividad.lugar ?? '',
      estado: actividad.estado,
    })
    setError(null)
    setModal('edit')
  }

  const closeModal = () => {
    if (saving) return

    setModal(null)
    setSelectedId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!form.nombre.trim()) {
      setError(
        'El nombre de la actividad es obligatorio.',
      )
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (modal === 'create') {
        await createActividad({
          nombre: form.nombre.trim(),
          lugar: form.lugar.trim() || undefined,
          estado: form.estado,
        })
      } else if (modal === 'edit' && selectedId) {
        await updateActividad(selectedId, {
          nombre: form.nombre.trim(),
          lugar: form.lugar.trim(),
          estado: form.estado,
        })
      }

      await loadActividades()
      closeModal()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo guardar la actividad.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (
    actividad: Actividad,
  ) => {
    const confirmed = window.confirm(
      `¿Deseas deshabilitar la actividad "${actividad.nombre}"?`,
    )

    if (!confirmed) return

    try {
      setError(null)

      await deleteActividad(actividad.id)
      await loadActividades()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo deshabilitar la actividad.',
      )
    }
  }

  return (
    <AppLayout title="Actividades">
      <div className="rounded-2xl bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-sena-text">
              Actividades
            </h1>

            <p className="mt-1 text-sm text-sena-text/60">
              Consulta y gestiona las actividades utilizadas en los préstamos.
            </p>
          </div>

          <Button
            type="button"
            icon={<PlusIcon className="size-4" />}
            onClick={openCreate}
            className="h-11 shrink-0 rounded-xl"
          >
            Nueva actividad
          </Button>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex gap-5 border-b border-sena-dark/10 text-sm font-medium">
          {['Todos', 'Activas', 'Inactivas'].map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setTab(
                    item as
                      | 'Todos'
                      | 'Activas'
                      | 'Inactivas',
                  )
                }
                className={
                  tab === item
                    ? 'border-b-2 border-sena pb-3 text-sena'
                    : 'pb-3 text-sena-text/50 hover:text-sena-text'
                }
              >
                {item}
              </button>
            ),
          )}
        </div>

        <div className="mt-5">
          <label className="flex h-11 w-full max-w-md items-center gap-2 rounded-xl bg-sena-muted px-3">
            <SearchIcon className="size-4 text-sena-text/40" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar actividad..."
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-sena-text/40"
            />
          </label>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-sena-text/60">
            Cargando actividades…
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-175 text-left text-sm">
              <thead>
                <tr className="border-b border-sena-dark/10 text-sena-text/55">
                  <th className="px-3 py-3 font-medium">
                    Nombre
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Lugar
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Estado
                  </th>

                  <th className="px-3 py-3 text-right font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((actividad) => (
                  <tr
                    key={actividad.id}
                    className="border-b border-sena-dark/8 last:border-b-0"
                  >
                    <td className="px-3 py-4 font-medium text-sena-text">
                      {actividad.nombre}
                    </td>

                    <td className="px-3 py-4 text-sena-text/65">
                      {actividad.lugar || 'Sin lugar'}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={
                          actividad.estado
                            ? 'rounded-full bg-sena/12 px-2.5 py-1 text-xs font-medium text-sena'
                            : 'rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700'
                        }
                      >
                        {actividad.estado
                          ? 'Activa'
                          : 'Inactiva'}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            openEdit(actividad)
                          }
                        >
                          Editar
                        </Button>

                        {actividad.estado ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              void handleDelete(
                                actividad,
                              )
                            }
                          >
                            Deshabilitar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}

                {!filtered.length ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-10 text-center text-sm text-sena-text/50"
                    >
                      No hay actividades para mostrar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 border-t border-sena-dark/6 pt-4 text-sm text-sena-text/50">
          Mostrando {filtered.length} actividades
        </div>
      </div>

      {modal ? (
        <Modal
          title={
            modal === 'create'
              ? 'Nueva actividad'
              : 'Editar actividad'
          }
          description="Completa la información de la actividad."
          onClose={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <TextField
              id="actividad-nombre"
              label="Nombre"
              value={form.nombre}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nombre: event.target.value,
                }))
              }
              placeholder="Ej. Mantenimiento de taller"
              maxLength={200}
              required
            />

            <TextField
              id="actividad-lugar"
              label="Lugar"
              value={form.lugar}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lugar: event.target.value,
                }))
              }
              placeholder="Ej. Taller de mecánica"
              maxLength={200}
            />

            <label className="flex items-center gap-3 text-sm text-sena-text">
              <input
                type="checkbox"
                checked={form.estado}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    estado: event.target.checked,
                  }))
                }
              />

              Actividad activa
            </label>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Guardando…'
                  : modal === 'create'
                    ? 'Crear actividad'
                    : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppLayout>
  )
}