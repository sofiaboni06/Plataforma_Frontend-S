import { useEffect, useState } from 'react'
import Button from '@/shared/components/ui/Button'
import type {
  CreateStandPayload,
  UpdateStandPayload,
} from '@/modules/inventario/types/bodega'

type StandFormValues = {
  nombre: string
  estado: boolean
}

type StandFormProps = {
  mode: 'create' | 'edit'
  initialValues?: Partial<StandFormValues>
  loading?: boolean
  onSubmit: (
    values: CreateStandPayload | UpdateStandPayload,
  ) => Promise<void> | void
  onCancel: () => void
}

export default function StandForm({
  mode,
  initialValues,
  loading = false,
  onSubmit,
  onCancel,
}: StandFormProps) {
  const [nombre, setNombre] = useState(
    initialValues?.nombre ?? '',
  )

  const [estado, setEstado] = useState(
    initialValues?.estado ?? true,
  )

  const [error, setError] = useState('')

  useEffect(() => {
    setNombre(initialValues?.nombre ?? '')
    setEstado(initialValues?.estado ?? true)
  }, [initialValues?.nombre, initialValues?.estado])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedNombre = nombre.trim()

    if (!normalizedNombre) {
      setError('El nombre del stand es obligatorio.')
      return
    }

    try {
      setError('')

      await onSubmit({
        nombre: normalizedNombre,
        estado,
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar el stand.',
      )
    }
  }

  const isEdit = mode === 'edit'

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/8">
        <div className="border-b border-sena-dark/8 px-5 py-5 sm:px-7">
          <p className="text-sm font-medium text-sena/90">
            Inventario
          </p>

          <h2 className="mt-1 text-xl font-bold text-sena-text">
            {isEdit ? 'Editar stand' : 'Crear stand'}
          </h2>

          <p className="mt-1 text-sm text-sena-text/55">
            {isEdit
              ? 'Actualiza la información del stand.'
              : 'Registra un nuevo stand para esta bodega.'}
          </p>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="nombre-stand"
              className="mb-1.5 block text-sm font-medium text-sena-text/70"
            >
              Nombre del stand
            </label>

            <input
              id="nombre-stand"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Stand de herramientas"
              maxLength={150}
              disabled={loading}
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-sena-dark/10 bg-white px-3.5 text-sm text-sena-text outline-none transition placeholder:text-sena-text/35 focus:border-sena focus:ring-2 focus:ring-sena/15 disabled:cursor-not-allowed disabled:bg-sena-muted/40"
            />

            <p className="mt-1.5 text-xs text-sena-text/45">
              Escribe el nombre con el que se identificará el stand.
            </p>
          </div>

          <div className="rounded-xl border border-sena-dark/8 bg-sena-muted/30 p-4">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-sena-text">
                  Estado
                </p>

                <p className="mt-0.5 text-xs text-sena-text/50">
                  {estado
                    ? 'El stand estará disponible y activo.'
                    : 'El stand estará registrado como inactivo.'}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={estado}
                aria-label="Cambiar estado del stand"
                disabled={loading}
                onClick={() => setEstado((current) => !current)}
                className={[
                  'relative h-6 w-11 shrink-0 rounded-full transition',
                  'focus:outline-none focus:ring-2 focus:ring-sena/20',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  estado ? 'bg-sena-dark' : 'bg-slate-300',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition',
                    estado ? 'left-[22px]' : 'left-0.5',
                  ].join(' ')}
                />
              </button>
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-sena-dark/8 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={onCancel}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={loading || !nombre.trim()}
          >
            {loading
              ? isEdit
                ? 'Guardando...'
                : 'Creando...'
              : isEdit
                ? 'Guardar cambios'
                : 'Crear stand'}
          </Button>
        </div>
      </div>
    </form>
  )
}