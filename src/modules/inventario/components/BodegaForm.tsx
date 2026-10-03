import { useEffect, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/context/auth'
import Button from '@/shared/components/ui/Button'
import { api } from '@/shared/lib/api'
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
  }) => Promise<void>
}

function WarehouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6" aria-hidden="true">
      <path d="M4 20V7l8-4 8 4v13H4Z" />
      <path d="M8 20v-5h8v5M8 9h.01M12 9h.01M16 9h.01" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="form-section-title">{children}</h3>
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
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <span className="form-label">{label}</span>
      <input id={id} {...props} className="form-field" />
    </label>
  )
}

function StatusSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Cambiar estado"
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-sena' : 'bg-sena-off-soft ring-1 ring-sena-line'}`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${checked ? 'left-6' : 'left-1'}`}
      />
    </button>
  )
}

export default function BodegaForm({ mode, initialData, loading = false, onSubmit }: BodegaFormProps) {
  const navigate = useNavigate()
  const { isAdmin, user } = useAuth()
  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState(true)
  const [error, setError] = useState('')
  const [trainingCenterId, setTrainingCenterId] = useState('')
  const [centers, setCenters] = useState<UserFormOptions['centers']>([])
  const [loadingCenters, setLoadingCenters] = useState(isAdmin)

  useEffect(() => {
    if (!initialData) return
    setNombre(initialData.nombre)
    setEstado(initialData.estado)
    setTrainingCenterId(initialData.idCformacion ? String(initialData.idCformacion) : '')
  }, [initialData])

  useEffect(() => {
    let cancelled = false

    async function loadCenters() {
      if (!isAdmin) {
        setLoadingCenters(false)
        return
      }

      try {
        const options = await api<UserFormOptions>('/users/options')
        if (!cancelled) setCenters(options.centers)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar los centros de formación.',
          )
        }
      } finally {
        if (!cancelled) setLoadingCenters(false)
      }
    }

    void loadCenters()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const isCreate = mode === 'create'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const cleanName = nombre.trim()
    if (!cleanName) {
      setError('Escribe el nombre de la bodega.')
      return
    }

    if (isAdmin && mode === 'create' && !trainingCenterId) {
      setError('Selecciona el centro de formación.')
      return
    }

    try {
      await onSubmit({
        nombre: cleanName,
        estado,
        ...(isCreate && isAdmin && trainingCenterId ? { idCformacion: Number(trainingCenterId) } : {}),
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar la bodega.')
    }
  }

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
                {isCreate ? 'Agregar nueva bodega' : 'Editar bodega'}
              </h2>
              <p className="mt-1 text-sm text-sena-strong">
                {isCreate
                  ? 'Elige el centro. Si es de otro centro, no se abre aquí: se asigna en Usuarios.'
                  : `Modificando ${initialData?.nombre ?? 'bodega'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar formulario"
            onClick={() => navigate('/inventario/bodegas')}
            className="grid size-9 place-items-center rounded-xl text-sena-dark/70 transition hover:bg-sena-veil hover:text-sena-dark"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto px-7 py-5">
          <section>
            <SectionTitle>Información de la bodega</SectionTitle>
            {error ? (
              <div className="mb-4 rounded-xl bg-sena-danger-soft px-4 py-3 text-sm text-sena-danger-text ring-1 ring-sena-danger-line">
                {error}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                id="nombre-bodega"
                label="Nombre de la bodega *"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej. Bodega Taller"
                maxLength={150}
                disabled={loading}
              />

              {isAdmin && isCreate ? (
                <label className="flex flex-col gap-1.5">
                  <span className="form-label">Centro de formación *</span>
                  <select
                    value={trainingCenterId}
                    onChange={(event) => setTrainingCenterId(event.target.value)}
                    disabled={loadingCenters || loading}
                    className="form-field form-select"
                  >
                    <option value="">
                      {loadingCenters ? 'Cargando centros de formación...' : 'Selecciona un centro de formación'}
                    </option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.regional ? `${center.name} — ${center.regional}` : center.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : isAdmin ? (
                <div className="flex flex-col gap-1.5">
                  <span className="form-label">Centro de formación</span>
                  <div className="form-static">
                    {initialData?.centroFormacion?.nombre ||
                      centers.find((center) => String(center.id) === trainingCenterId)?.name ||
                      'Centro de la bodega'}
                  </div>
                  <p className="form-hint">El centro no se cambia al editar.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="form-label">Centro de formación</span>
                  <div className="form-static">
                    {user?.trainingCenter || 'Tu centro de formación'}
                  </div>
                  <p className="form-hint">
                    Si no eliges centro, la bodega queda en el tuyo.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="form-label">Estado</span>
                <div className="form-static">
                  <span className="text-sm font-medium text-sena-text">
                    {estado ? 'Activa' : 'Inactiva'}
                  </span>
                  <StatusSwitch checked={estado} onChange={() => setEstado((current) => !current)} />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t border-sena-hairline px-7 py-4">
          <Button variant="secondary" type="button" disabled={loading} onClick={() => navigate('/inventario/bodegas')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : isCreate ? 'Guardar bodega' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}
