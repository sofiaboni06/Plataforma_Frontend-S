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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sena-forest/45 px-4 py-6 backdrop-blur-[6px]">
      <form
        onSubmit={handleSubmit}
        className="form-panel flex max-h-[calc(100svh-3rem)] w-full max-w-2xl flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between border-b border-sena-hairline px-7 py-6">
          <div className="flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sena text-white shadow-brand-sm">
              <WarehouseIcon />
            </div>

            <div>
              <h2 className="text-xl font-bold text-sena-text">
                {isCreate
                  ? 'Agregar nueva sub-bodega'
                  : 'Editar sub-bodega'}
              </h2>

              <p className="mt-1 text-sm text-sena-strong">
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
            className="grid size-9 place-items-center rounded-xl text-sena-dark/70 transition hover:bg-sena-veil hover:text-sena-dark"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto px-7 py-5">
          {error ? (
            <div className="mb-4 rounded-xl bg-sena-danger-soft px-4 py-3 text-sm text-sena-danger-text ring-1 ring-sena-danger-line">
              {error}
            </div>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="form-label">Nombre de la sub-bodega *</span>
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Sub-bodega de herramientas"
              maxLength={150}
              disabled={loading}
              className="form-field"
            />
          </label>

          <div className="mt-4 flex flex-col gap-1.5">
            <span className="form-label">Estado</span>

            <div className="form-static">
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
                  estado ? 'bg-sena' : 'bg-sena-off-soft ring-1 ring-sena-line'
                }`}
              >
                <span
                  className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                    estado ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-sena-hairline px-7 py-4">
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