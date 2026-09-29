import { useEffect, useState, type FormEvent } from 'react'
import { createStand } from '@/modules/inventario/data/bodega'
import { ApiError } from '@/shared/lib/api'

type BodegaOption = {
  id: number
  nombre: string
  subBodegas?: Array<{ id: number; nombre: string; estado: boolean }>
}

type CreateStandModalProps = {
  bodegas: BodegaOption[]
  initialBodegaId?: number
  initialSubBodegaId?: number
  onClose: () => void
  onCreated: () => void
}

const fieldClass =
  'h-11 w-full rounded-lg border border-sena-dark/10 bg-white px-3.5 text-sm text-sena-text outline-none transition placeholder:text-sena-text/35 focus:border-sena focus:ring-2 focus:ring-sena/15'

export default function CreateStandModal({
  bodegas,
  initialBodegaId = 0,
  initialSubBodegaId = 0,
  onClose,
  onCreated,
}: CreateStandModalProps) {
  const [bodegaId, setBodegaId] = useState(initialBodegaId)
  const [subBodegaId, setSubBodegaId] = useState(initialSubBodegaId)
  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, saving])

  const subBodegas = bodegas.find((bodega) => bodega.id === bodegaId)?.subBodegas ?? []
  const subOpciones = subBodegas.filter((sub) => sub.estado || sub.id === subBodegaId)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!bodegaId) {
      setError('Selecciona una bodega.')
      return
    }
    if (!subBodegaId) {
      setError('Selecciona la sub-bodega.')
      return
    }
    if (!nombre.trim()) {
      setError('Escribe el nombre del stand.')
      return
    }

    try {
      setSaving(true)
      setError('')
      await createStand(subBodegaId, { nombre: nombre.trim(), estado })
      onCreated()
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'No se pudo guardar el stand.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={() => {
          if (!saving) onClose()
        }}
      />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crear-stand-titulo"
        className="relative z-10 w-full max-w-[34rem] rounded-2xl bg-white px-6 py-5 shadow-[0_24px_60px_rgba(0,20,10,0.22)] sm:px-7 sm:py-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="crear-stand-titulo" className="text-lg font-bold text-sena-text">
              Agregar stand
            </h2>
            <p className="mt-1 text-sm text-sena-text/50">
              El stand queda dentro de una sub-bodega. El nombre no se repite ahí.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            disabled={saving}
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-sena-text/40 transition hover:bg-sena-muted hover:text-sena-text"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <label className="block text-sm font-medium text-sena-text">
            Bodega *
            <select
              value={bodegaId || ''}
              disabled={saving || Boolean(initialBodegaId)}
              onChange={(event) => {
                setBodegaId(Number(event.target.value))
                setSubBodegaId(0)
              }}
              className={`${fieldClass} mt-1.5 disabled:cursor-not-allowed disabled:bg-sena-muted`}
            >
              <option value="">Selecciona...</option>
              {bodegas.map((bodega) => (
                <option key={bodega.id} value={bodega.id}>
                  {bodega.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-sena-text">
            Sub-bodega *
            <select
              value={subBodegaId || ''}
              disabled={saving || !bodegaId || Boolean(initialSubBodegaId)}
              onChange={(event) => setSubBodegaId(Number(event.target.value))}
              className={`${fieldClass} mt-1.5 disabled:cursor-not-allowed disabled:bg-sena-muted`}
            >
              <option value="">Selecciona...</option>
              {subOpciones.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nombre}
                </option>
              ))}
            </select>
            {bodegaId && subOpciones.length === 0 ? (
              <p className="mt-1.5 text-xs text-sena-text/55">
                Esta bodega no trae sub-bodegas activas. El stand se crea sobre una que ya exista.
              </p>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-sena-text">
            Nombre del stand *
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Estante 1"
              maxLength={150}
              disabled={saving}
              className={`${fieldClass} mt-1.5`}
            />
          </label>

          <label className="flex items-center gap-3 rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text">
            <input
              type="checkbox"
              checked={estado}
              disabled={saving}
              onChange={(event) => setEstado(event.target.checked)}
              className="size-4 accent-sena"
            />
            Stand activo
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-sena-text/70 transition hover:bg-sena-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-sena px-4 text-sm font-semibold text-white transition hover:bg-[#009247] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar stand'}
          </button>
        </div>
      </form>
    </div>
  )
}
