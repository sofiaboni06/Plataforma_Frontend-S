import {
  useEffect,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/shared/components/ui/Button'
import { api } from '@/shared/lib/api'
import { getBodegas } from '@/modules/inventario/data/bodega'

import type { BodegaApi } from '@/modules/inventario/types/bodega'
import type { UserFormOptions } from '@/shared/types/profile'

type BodegaFormProps = {
  mode: 'create' | 'edit'
  initialData?: BodegaApi | null
  loading?: boolean

  onSubmit: (data: {
    nombre: string
    estado: boolean
    idCformacion?: number
    stands?: Array<{
      id?: number
      nombre: string
      estado: boolean
    }>
  }) => Promise<void>
}

type StandDraft = {
  id: number
  nombre: string
  estado: boolean
}

function WarehouseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-6"
      aria-hidden="true"
    >
      <path d="M4 20V7l8-4 8 4v13H4Z" />
      <path d="M8 20v-5h8v5M8 9h.01M12 9h.01M16 9h.01" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l.8 13h8.4L17 7" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function SectionTitle({
  children,
}: {
  children: ReactNode
}) {
  return (
    <h3 className="mb-3 border-l-2 border-sena pl-2 text-sm font-bold uppercase tracking-wide text-sena-dark">
      {children}
    </h3>
  )
}

function FormInput({
  id,
  label,
  ...props
}: {
  id: string
  label: string
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75"
      htmlFor={id}
    >
      {label}

      <input
        id={id}
        {...props}
        className="h-11 w-full rounded-lg border border-sena-dark/10 px-3.5 text-sm text-sena-text outline-none placeholder:text-black focus:border-sena focus:ring-2 focus:ring-sena/20"
      />
    </label>
  )
}

function StatusSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Cambiar estado"
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? 'bg-sena-dark' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  )
}

function normalizeBodegaCode(value: string) {
  const compactValue = value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

  const digits = compactValue.replace(/^B/, '')

  return /^\d+$/.test(digits)
    ? `B${digits.padStart(3, '0')}`
    : compactValue
}

export default function BodegaForm({
  mode,
  initialData,
  loading = false,
  onSubmit,
}: BodegaFormProps) {
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState(true)
  const [error, setError] = useState('')
  const [codigo, setCodigo] = useState('')
  const [trainingCenterId, setTrainingCenterId] = useState('')

  const [centers, setCenters] =
    useState<UserFormOptions['centers']>([])

  const [existingBodegas, setExistingBodegas] =
    useState<BodegaApi[]>([])

  const [loadingCenters, setLoadingCenters] = useState(true)
  const [warningMessage, setWarningMessage] =
    useState<string | null>(null)

  const [descripcion, setDescripcion] = useState('')

  /*
   * IMPORTANTE:
   *
   * Antes aquí estaban:
   *
   * Stand 1
   * Stand 2
   * Stand 3
   *
   * Eso era información de ejemplo.
   *
   * Ahora inicia vacío en CREAR.
   * En EDITAR se llena con los stands reales de la BD.
   */
  const [stands, setStands] = useState<StandDraft[]>([])

  useEffect(() => {
    if (!initialData) {
      return
    }

    setNombre(initialData.nombre)
    setEstado(initialData.estado)

    setCodigo(
      `B${String(initialData.id_bodega).padStart(3, '0')}`,
    )

    setTrainingCenterId(
      initialData.id_cformacion
        ? String(initialData.id_cformacion)
        : '',
    )

    /*
     * Aquí cargamos los stands que realmente vienen
     * de la base de datos.
     */
    setStands(
      initialData.stands.map((stand) => ({
        id: stand.id,
        nombre: stand.nombre,
        estado: stand.estado,
      })),
    )
  }, [initialData])

  useEffect(() => {
    let cancelled = false

    async function loadCenters() {
      try {
        const options =
          await api<UserFormOptions>('/users/options')

        const bodegaList =
          mode === 'create'
            ? await getBodegas()
            : []

        if (!cancelled) {
          setCenters(options.centers)
          setExistingBodegas(bodegaList)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar los centros de formación.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingCenters(false)
        }
      }
    }

    void loadCenters()

    return () => {
      cancelled = true
    }
  }, [mode])

  function addStand() {
    /*
     * Los IDs negativos son temporales.
     * Un stand nuevo todavía no existe en BD.
     */
    const temporaryId = -Date.now()

    setStands((current) => [
      ...current,
      {
        id: temporaryId,
        nombre: '',
        estado: true,
      },
    ])
  }

  function removeStand(standId: number) {
    setStands((current) =>
      current.filter((stand) => stand.id !== standId),
    )
  }

  function updateStandName(
    standId: number,
    value: string,
  ) {
    setStands((current) =>
      current.map((stand) =>
        stand.id === standId
          ? {
              ...stand,
              nombre: value,
            }
          : stand,
      ),
    )
  }

  function updateStandStatus(
    standId: number,
    value: boolean,
  ) {
    setStands((current) =>
      current.map((stand) =>
        stand.id === standId
          ? {
              ...stand,
              estado: value,
            }
          : stand,
      ),
    )
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setWarningMessage(null)

    const cleanName = nombre.trim()

    if (!cleanName) {
      setError(
        'Todos los campos obligatorios deben estar completos.',
      )
      return
    }

    if (
      mode === 'create' &&
      (!codigo.trim() || !trainingCenterId)
    ) {
      setError(
        'Todos los campos obligatorios deben estar completos.',
      )
      return
    }

    if (mode === 'create') {
      const normalizeName = (value: string) =>
        value
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ')

      const normalizedName =
        normalizeName(cleanName)

      const normalizedCode =
        normalizeBodegaCode(codigo)

      if (!/^B\d{3}$/.test(normalizedCode)) {
        setWarningMessage(
          'El código debe tener el formato B001.',
        )
        return
      }

      const duplicateName =
        existingBodegas.find(
          (bodega) =>
            normalizeName(bodega.nombre) ===
            normalizedName,
        )

      const duplicateCode =
        existingBodegas.find(
          (bodega) =>
            normalizeBodegaCode(
              `B${String(bodega.id_bodega).padStart(3, '0')}`,
            ) === normalizedCode,
        )

      if (duplicateName) {
        setWarningMessage(
          `La bodega "${cleanName}" ya existe.`,
        )
        return
      }

      if (duplicateCode) {
        setWarningMessage(
          'No se puede repetir el código de bodega.',
        )
        return
      }
    }

    /*
     * No enviamos filas vacías.
     */
    const cleanStands = stands
      .map((stand) => ({
        id: mode === 'edit' && stand.id > 0
          ? stand.id
          : undefined,
        nombre: stand.nombre.trim(),
        estado: stand.estado,
      }))
      .filter((stand) => stand.nombre)

    try {
      await onSubmit({
        nombre: cleanName,
        estado,

        ...(mode === 'create'
          ? {
              idCformacion:
                Number(trainingCenterId),
            }
          : {}),

        stands: cleanStands,
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la bodega.',
      )
    }
  }

  const isCreate = mode === 'create'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-6 ${
        isCreate
          ? 'bg-sena-forest/20'
          : 'bg-sena-forest/35 backdrop-blur-[2px]'
      }`}
    >
      {warningMessage ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setWarningMessage(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600">
                <span className="text-xl font-bold">
                  !
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-sena-dark">
                  Advertencia
                </h2>

                <p className="mt-1 text-sm text-sena-text/55">
                  Revisa la información ingresada.
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-sena-text/70">
              {warningMessage}
            </p>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={() =>
                  setWarningMessage(null)
                }
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="flex max-h-[calc(100svh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sena-dark/10"
      >
        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-sena-dark/8 px-7 py-6">
          <div className="flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-sena-dark">
              <WarehouseIcon />
            </div>

            <div>
              <h2 className="text-xl font-bold text-sena-text">
                {isCreate
                  ? 'Agregar nueva bodega'
                  : 'Editar bodega'}
              </h2>

              <p className="mt-1 text-sm text-sena/75">
                {isCreate
                  ? 'Completa la información de la bodega y sus stands.'
                  : `Modificando ${
                      initialData?.nombre ?? 'bodega'
                    }`}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar formulario"
            onClick={() =>
              navigate('/inventario/bodegas')
            }
            className="grid size-9 place-items-center rounded-lg border border-sena-dark/8 text-sena-text/60 transition hover:bg-sena-muted hover:text-sena-dark"
          >
            <CloseIcon />
          </button>
        </div>

        {/* CONTENIDO */}

        <div className="overflow-y-auto px-7 py-5 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <section>
            <SectionTitle>
              Información de la bodega
            </SectionTitle>

            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                id={
                  isCreate
                    ? 'nombre'
                    : 'nombre-editar'
                }
                label="Nombre de la bodega *"
                value={nombre}
                onChange={(event) =>
                  setNombre(event.target.value)
                }
                placeholder="Ej. Bodega Norte"
                maxLength={150}
                disabled={loading}
              />

              <FormInput
                id={
                  isCreate
                    ? 'codigo-bodega'
                    : 'codigo-bodega-editar'
                }
                label="Código de bodega *"
                value={codigo}
                onChange={(event) =>
                  setCodigo(
                    event.target.value.toUpperCase(),
                  )
                }
                placeholder="Ej. B006"
                maxLength={30}
                readOnly={!isCreate}
              />

              <label className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75">
                Centro de formación *

                <select
                  value={trainingCenterId}
                  onChange={(event) =>
                    setTrainingCenterId(
                      event.target.value,
                    )
                  }
                  disabled={
                    loadingCenters || loading
                  }
                  className="h-11 w-full rounded-lg border border-sena-dark/10 bg-white px-3.5 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20"
                >
                  <option value="">
                    {loadingCenters
                      ? 'Cargando centros de formación...'
                      : 'Selecciona un centro de formación'}
                  </option>

                  {centers.map((center) => (
                    <option
                      key={center.id}
                      value={center.id}
                    >
                      {center.regional
                        ? `${center.name} — ${center.regional}`
                        : center.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75">
                <span>Estado</span>

                <div className="flex h-11 items-center justify-end rounded-lg border border-sena-dark/10 px-3.5">
                  <span className="mr-3 text-sm font-medium text-sena-text">
                    {estado
                      ? 'Activo'
                      : 'Inactivo'}
                  </span>

                  <StatusSwitch
                    checked={estado}
                    onChange={() =>
                      setEstado(
                        (current) => !current,
                      )
                    }
                  />
                </div>
              </div>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75 sm:col-span-2">
                Descripción

                <textarea
                  value={descripcion}
                  onChange={(event) =>
                    setDescripcion(
                      event.target.value,
                    )
                  }
                  placeholder="Descripción breve de la bodega (opcional)..."
                  rows={2}
                  className="resize-none rounded-lg border border-sena-dark/10 px-3.5 py-3 text-sm text-sena-text outline-none placeholder:text-black focus:border-sena focus:ring-2 focus:ring-sena/20"
                />
              </label>
            </div>
          </section>

          {/* STANDS */}

          <section className="mt-6 border-t border-sena-dark/8 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle>
                Stands de la bodega
              </SectionTitle>

              <div className="flex items-center gap-3">
                <span className="text-sm text-sena/70">
                  {stands.length}{' '}
                  {stands.length === 1
                    ? 'stand'
                    : 'stands'}
                </span>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={addStand}
                  className="h-9! px-3 text-xs"
                >
                  + Agregar stand
                </Button>
              </div>
            </div>

            {stands.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sena-dark/15 bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm font-medium text-sena-text/70">
                  Esta bodega todavía no tiene
                  stands.
                </p>

                <p className="mt-1 text-xs text-sena-text/50">
                  Usa "Agregar stand" para crear uno.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-sena-dark/10">
                <table className="w-full min-w-140 border-collapse">
                  <thead>
                    <tr className="bg-sena-muted/60 text-left text-[11px] font-bold uppercase tracking-wide text-black">
                      <th className="w-16 px-3 py-3">
                        N.º
                      </th>

                      <th className="px-3 py-3">
                        Nombre del stand
                      </th>

                      <th className="w-40 px-3 py-3">
                        Estado
                      </th>

                      <th className="w-16 px-3 py-3 text-center">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-sena-dark/8">
                    {stands.map(
                      (stand, index) => (
                        <tr
                          key={stand.id}
                          className="bg-white"
                        >
                          <td className="px-3 py-2">
                            <span className="grid size-7 place-items-center rounded-md bg-emerald-100 text-sm font-semibold text-sena-dark">
                              {index + 1}
                            </span>
                          </td>

                          <td className="px-3 py-2">
                            <input
                              value={
                                stand.nombre
                              }
                              onChange={(event) =>
                                updateStandName(
                                  stand.id,
                                  event.target
                                    .value,
                                )
                              }
                              placeholder="Nombre del stand"
                              className="h-9 w-full rounded-lg border border-sena-dark/10 px-3 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <select
                              value={
                                stand.estado
                                  ? 'active'
                                  : 'inactive'
                              }
                              onChange={(event) =>
                                updateStandStatus(
                                  stand.id,
                                  event.target
                                    .value ===
                                    'active',
                                )
                              }
                              className="h-9 w-full rounded-lg border border-sena-dark/10 bg-white px-3 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20"
                            >
                              <option value="active">
                                Disponible
                              </option>

                              <option value="inactive">
                                Inactivo
                              </option>
                            </select>
                          </td>

                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              aria-label={`Eliminar stand ${
                                index + 1
                              }`}
                              onClick={() =>
                                removeStand(
                                  stand.id,
                                )
                              }
                              className="mx-auto grid size-9 place-items-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* FOOTER */}

        <div className="flex justify-end gap-3 border-t border-sena-dark/8 px-7 py-4">
          <Button
            variant="secondary"
            type="button"
            disabled={loading}
            onClick={() =>
              navigate('/inventario/bodegas')
            }
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Guardando...'
              : isCreate
                ? 'Guardar bodega'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}