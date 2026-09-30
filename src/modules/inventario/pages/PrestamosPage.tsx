import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import TextField from '@/shared/components/ui/TextField'
import { ApiError } from '@/shared/lib/api'
import { PlusIcon } from '@/shared/components/icons/AppIcons'

import { useAuth } from '@/modules/auth/context/auth'

import {
  createPrestamo,
  devolverPrestamo,
  getPrestamos,
} from '@/modules/inventario/data/prestamo'

import { getElementos } from '@/modules/inventario/data/elemento'

import { getActividades } from '@/modules/actividades/data/actividad'

import type { ElementoApi } from '@/modules/inventario/types/elemento'
import type { Actividad } from '@/modules/actividades/types'
import type {
  Prestamo,
  PrestamoEstado,
} from '@/modules/inventario/types/prestamo'

const EMPTY_FORM = {
  idElemento: '',
  idActividad: '',
  cantidad: '1',
  ficha: '',
  observacion: '',
}

export default function PrestamosPage() {
  const { user } = useAuth()

  const [prestamos, setPrestamos] =
    useState<Prestamo[]>([])

  const [elementos, setElementos] =
    useState<ElementoApi[]>([])

  const [actividades, setActividades] =
    useState<Actividad[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [modalOpen, setModalOpen] =
    useState(false)

  const [form, setForm] =
    useState(EMPTY_FORM)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        prestamosRows,
        elementosRows,
        actividadesRows,
      ] = await Promise.all([
        getPrestamos(),
        getElementos(),
        getActividades(),
      ])

      setPrestamos(prestamosRows)
      setElementos(
        elementosRows.filter(
          (elemento) =>
            elemento.estado &&
            elemento.cantidad > 0,
        ),
      )
      setActividades(
        actividadesRows.filter(
          (actividad) => actividad.estado,
        ),
      )
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo cargar la información.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setForm(EMPTY_FORM)
  }

  const selectedElemento =
    elementos.find(
      (elemento) =>
        elemento.id === Number(form.idElemento),
    ) ?? null

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!user) {
      setError(
        'No se encontró el usuario de la sesión.',
      )
      return
    }

    if (!form.idElemento) {
      setError('Selecciona un elemento.')
      return
    }

    if (!form.idActividad) {
      setError('Selecciona una actividad.')
      return
    }

    const cantidad = Number(form.cantidad)

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      setError(
        'La cantidad debe ser un número entero mayor que cero.',
      )
      return
    }

    if (
      selectedElemento &&
      cantidad > selectedElemento.cantidad
    ) {
      setError(
        `Solo hay ${selectedElemento.cantidad} unidades disponibles.`,
      )
      return
    }

    setSaving(true)
    setError(null)

    try {
      await createPrestamo({
        idElemento: Number(form.idElemento),
        idUsuario: user.id,
        idActividad: Number(form.idActividad),
        cantidad,
        ficha: form.ficha.trim() || undefined,
        observacion:
          form.observacion.trim() || undefined,
      })

      await loadData()
      closeModal()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo crear el préstamo.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleReturn = async (
    prestamo: Prestamo,
  ) => {
    const confirmed = window.confirm(
      `¿Registrar la devolución del préstamo #${prestamo.id}?`,
    )

    if (!confirmed) return

    try {
      setError(null)

      await devolverPrestamo(prestamo.id)
      await loadData()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo registrar la devolución.',
      )
    }
  }

  const estadoLabel = (
    estado: PrestamoEstado,
  ) => {
    if (estado === 'prestado') return 'Prestado'
    if (estado === 'devuelto') return 'Devuelto'
    return 'Consumido'
  }

  return (
    <AppLayout title="Préstamos">
      <div className="rounded-2xl bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-sena-text">
              Préstamos
            </h1>

            <p className="mt-1 text-sm text-sena-text/60">
              Registra y controla los préstamos de elementos.
            </p>
          </div>

          <Button
            type="button"
            icon={<PlusIcon className="size-4" />}
            onClick={openCreate}
            className="h-11 shrink-0 rounded-xl"
          >
            Nuevo préstamo
          </Button>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-sena-text/60">
            Cargando préstamos…
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-250 text-left text-sm">
              <thead>
                <tr className="border-b border-sena-dark/10 text-sena-text/55">
                  <th className="px-3 py-3 font-medium">
                    Elemento
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Usuario
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Actividad
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Cantidad
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Ficha
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Estado
                  </th>

                  <th className="px-3 py-3 text-right font-medium">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {prestamos.map((prestamo) => (
                  <tr
                    key={prestamo.id}
                    className="border-b border-sena-dark/8 last:border-b-0"
                  >
                    <td className="px-3 py-4">
                      <p className="font-medium text-sena-text">
                        {prestamo.elemento?.nombre ??
                          `Elemento #${prestamo.idElemento}`}
                      </p>

                      {prestamo.elemento?.codigo ? (
                        <p className="text-xs text-sena-text/50">
                          {prestamo.elemento.codigo}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-3 py-4 text-sena-text/70">
                      {prestamo.usuario?.fullName ??
                        `Usuario #${prestamo.idUsuario}`}
                    </td>

                    <td className="px-3 py-4">
                      <p className="text-sena-text">
                        {prestamo.actividad?.nombre ??
                          `Actividad #${prestamo.idActividad}`}
                      </p>

                      {prestamo.actividad?.lugar ? (
                        <p className="text-xs text-sena-text/50">
                          {prestamo.actividad.lugar}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-3 py-4">
                      {prestamo.cantidad}
                    </td>

                    <td className="px-3 py-4 text-sena-text/70">
                      {prestamo.ficha || '—'}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={
                          prestamo.estado ===
                          'prestado'
                            ? 'rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800'
                            : prestamo.estado ===
                                'devuelto'
                              ? 'rounded-full bg-sena/12 px-2.5 py-1 text-xs font-medium text-sena'
                              : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700'
                        }
                      >
                        {estadoLabel(
                          prestamo.estado,
                        )}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex justify-end">
                        {prestamo.estado ===
                        'prestado' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              void handleReturn(
                                prestamo,
                              )
                            }
                          >
                            Registrar devolución
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}

                {!prestamos.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-10 text-center text-sm text-sena-text/50"
                    >
                      No hay préstamos registrados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen ? (
        <Modal
          title="Nuevo préstamo"
          description="Selecciona el elemento y la actividad asociada."
          onClose={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="prestamo-elemento"
                className="mb-1.5 block text-sm font-medium text-sena-text/75"
              >
                Elemento
              </label>

              <select
                id="prestamo-elemento"
                value={form.idElemento}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    idElemento:
                      event.target.value,
                  }))
                }
                className="h-11 w-full rounded-lg bg-sena-muted px-3.5 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20"
                required
              >
                <option value="">
                  Selecciona un elemento
                </option>

                {elementos.map((elemento) => (
                  <option
                    key={elemento.id}
                    value={elemento.id}
                  >
                    {elemento.nombre} —{' '}
                    {elemento.codigo} — Stock:{' '}
                    {elemento.cantidad}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="prestamo-actividad"
                className="mb-1.5 block text-sm font-medium text-sena-text/75"
              >
                Actividad
              </label>

              <select
                id="prestamo-actividad"
                value={form.idActividad}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    idActividad:
                      event.target.value,
                  }))
                }
                className="h-11 w-full rounded-lg bg-sena-muted px-3.5 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20"
                required
              >
                <option value="">
                  Selecciona una actividad
                </option>

                {actividades.map((actividad) => (
                  <option
                    key={actividad.id}
                    value={actividad.id}
                  >
                    {actividad.nombre}
                    {actividad.lugar
                      ? ` — ${actividad.lugar}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <TextField
              id="prestamo-cantidad"
              label="Cantidad"
              type="number"
              min={1}
              max={
                selectedElemento?.cantidad ??
                undefined
              }
              value={form.cantidad}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cantidad:
                    event.target.value,
                }))
              }
              required
            />

            <TextField
              id="prestamo-ficha"
              label="Ficha"
              value={form.ficha}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  ficha:
                    event.target.value,
                }))
              }
              placeholder="Ej. 2876543"
              maxLength={50}
            />

            <TextField
              id="prestamo-observacion"
              label="Observación"
              value={form.observacion}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  observacion:
                    event.target.value,
                }))
              }
              placeholder="Observación del préstamo"
            />

            <div className="rounded-xl bg-sena-muted p-4">
              <p className="text-xs text-sena-text/50">
                Usuario que registra el préstamo
              </p>

              <p className="mt-1 text-sm font-medium text-sena-text">
                {user?.fullName ??
                  'Usuario actual'}
              </p>
            </div>

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
                  ? 'Registrando…'
                  : 'Registrar préstamo'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppLayout>
  )
}