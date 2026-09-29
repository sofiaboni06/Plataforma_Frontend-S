import { useEffect, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/context/auth'
import { useInventoryCenterOptional } from '@/modules/inventario/centerScope'
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
    <label className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75" htmlFor={id}>
      {label}
      <input
        id={id}
        {...props}
        className="h-11 w-full rounded-lg border border-sena-dark/10 px-3.5 text-sm text-sena-text outline-none placeholder:text-sena-text/35 focus:border-sena focus:ring-2 focus:ring-sena/20"
      />
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
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-sena-dark' : 'bg-slate-300'}`}
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
  const lockedCenter = useInventoryCenterOptional()
  const lockedCenterId = lockedCenter?.centerId ?? null
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
    setTrainingCenterId(
      lockedCenterId && mode === 'create'
        ? String(lockedCenterId)
        : initialData.idCformacion
          ? String(initialData.idCformacion)
          : '',
    )
  }, [initialData, lockedCenterId, mode])

  useEffect(() => {
    if (mode === 'create' && lockedCenterId) setTrainingCenterId(String(lockedCenterId))
  }, [lockedCenterId, mode])

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
        ...(isAdmin && trainingCenterId ? { idCformacion: Number(trainingCenterId) } : {}),
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar la bodega.')
    }
  }

  const isCreate = mode === 'create'

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
                {isCreate ? 'Agregar nueva bodega' : 'Editar bodega'}
              </h2>
              <p className="mt-1 text-sm text-sena/75">
                {isCreate
                  ? 'La bodega queda en un centro. Los stands se agregan sobre una sub-bodega que ya exista.'
                  : `Modificando ${initialData?.nombre ?? 'bodega'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar formulario"
            onClick={() => navigate('/inventario/bodegas')}
            className="grid size-9 place-items-center rounded-lg border border-sena-dark/8 text-sena-text/60 transition hover:bg-sena-muted hover:text-sena-dark"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto px-7 py-5">
          <section>
            <SectionTitle>Información de la bodega</SectionTitle>
            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

              {isAdmin && lockedCenterId ? (
                <div className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75">
                  Centro de formación
                  <div className="flex h-11 items-center rounded-lg border border-sena-dark/10 bg-sena-muted px-3.5 text-sm text-sena-text">
                    {mode === 'edit'
                      ? (centers.find((center) => String(center.id) === trainingCenterId)?.name ||
                        lockedCenter?.centerName ||
                        'Centro seleccionado')
                      : (lockedCenter?.centerName || 'Centro seleccionado')}
                  </div>
                  <p className="text-xs font-normal text-sena-text/55">
                    Queda en el centro que elegiste al entrar a inventario.
                  </p>
                </div>
              ) : isAdmin ? (
                <label className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75">
                  Centro de formación *
                  <select
                    value={trainingCenterId}
                    onChange={(event) => setTrainingCenterId(event.target.value)}
                    disabled={loadingCenters || loading}
                    className="h-11 w-full rounded-lg border border-sena-dark/10 bg-white px-3.5 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20 disabled:cursor-not-allowed disabled:bg-sena-muted"
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
              ) : (
                <div className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75">
                  Centro de formación
                  <div className="flex h-11 items-center rounded-lg border border-sena-dark/10 bg-sena-muted px-3.5 text-sm text-sena-text">
                    {user?.trainingCenter || 'Tu centro de formación'}
                  </div>
                  <p className="text-xs font-normal text-sena-text/55">
                    Si no eliges centro, la bodega queda en el tuyo.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5 text-sm font-medium text-sena-text/75 sm:col-span-2">
                <span>Estado</span>
                <div className="flex h-11 items-center justify-between rounded-lg border border-sena-dark/10 px-3.5">
                  <span className="text-sm font-medium text-sena-text">{estado ? 'Activa' : 'Inactiva'}</span>
                  <StatusSwitch checked={estado} onChange={() => setEstado((current) => !current)} />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t border-sena-dark/8 px-7 py-4">
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
