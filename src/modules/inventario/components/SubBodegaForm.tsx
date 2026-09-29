import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/shared/components/ui/Button'
import type { SubBodegaApi } from '@/modules/inventario/types/bodega'

type SubBodegaFormProps = {
  mode: 'create' | 'edit'
  initialData?: SubBodegaApi | null
  loading?: boolean
  onClose?: () => void
  onSubmit: (data: {
    nombre: string
    estado: boolean
  }) => Promise<void>
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

export default function SubBodegaForm({
  mode,
  initialData,
  loading = false,
  onClose,
  onSubmit,
}: SubBodegaFormProps) {
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!initialData) return

    setNombre(initialData.nombre)
    setEstado(initialData.estado)
  }, [initialData])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const cleanName = nombre.trim()

    if (!cleanName) {
      setError('Escribe el nombre de la sub-bodega.')
      return
    }

    try {
      await onSubmit({
        nombre: cleanName,
        estado,
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la sub-bodega.',
      )
    }
  }

  const isCreate = mode === 'create'
  const closeForm = onClose ?? (() => navigate(-1))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sena-forest/20 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[calc(100svh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sena-dark/10"
      >
        <div className="flex items-start justify-between border-b border-sena-dark/8 px-7 py-6">
          <div className="flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-sena-dark">
              <WarehouseIcon />
            </div>

            <div>
              <h2 className="text-xl font-bold text-sena-text">
                {isCreate
                  ? 'Agregar nueva sub-bodega'
                  : 'Editar sub-bodega'}
              </h2>

              <p className="mt-1 text-sm text-sena/75">
                {isCreate
                  ? 'La sub-bodega quedará dentro de esta bodega.'
                  : `Modificando ${initialData?.nombre ?? 'sub-bodega'}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar formulario"
            disabled={loading}
            onClick={closeForm}
            className="grid size-9 place-items-center rounded-lg border border-sena-dark/8 text-sena-text/60 transition hover:bg-sena-muted hover:text-sena-dark"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto px-7 py-5">
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75">
            Nombre de la sub-bodega *
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Sub-bodega de herramientas"
              maxLength={150}
              disabled={loading}
              className="h-11 w-full rounded-lg border border-sena-dark/10 px-3.5 text-sm text-sena-text outline-none placeholder:text-sena-text/35 focus:border-sena focus:ring-2 focus:ring-sena/20"
            />
          </label>

          <div className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-sena-text/75">
            <span>Estado</span>

            <label className="flex h-11 items-center justify-between rounded-lg border border-sena-dark/10 px-3.5">
              <span className="text-sm font-medium text-sena-text">
                {estado ? 'Activa' : 'Inactiva'}
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={estado}
                disabled={loading}
                onClick={() => setEstado((current) => !current)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  estado ? 'bg-sena-dark' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                    estado ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-sena-dark/8 px-7 py-4">
          <Button
            variant="secondary"
            type="button"
            disabled={loading}
            onClick={closeForm}
          >
            Cancelar
          </Button>

          <Button type="submit" disabled={loading}>
            {loading
              ? 'Guardando...'
              : isCreate
                ? 'Guardar sub-bodega'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}