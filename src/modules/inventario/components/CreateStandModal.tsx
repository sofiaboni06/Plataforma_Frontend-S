import { useEffect, useState, type FormEvent } from 'react'
import { createStand, getBodegas } from '@/modules/inventario/data/bodega'

type CreateStandModalProps = {
  bodegaId: string
  bodegaNombre?: string
  onClose: () => void
  onCreated: (bodegaId: string) => void
}

const fieldClass =
  'h-11 w-full rounded-lg border border-sena-dark/10 bg-white px-3.5 text-sm text-sena-text outline-none transition placeholder:text-sena-text/35 focus:border-sena focus:ring-2 focus:ring-sena/15'

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4.5h11.2L19.5 8v11.5H5V4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4.5V9h7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 19.5v-5.5h8v5.5" />
    </svg>
  )
}

export default function CreateStandModal({
  bodegaId,
  bodegaNombre,
  onClose,
  onCreated,
}: CreateStandModalProps) {
  const [bodegas, setBodegas] = useState<Array<{ id: number; nombre: string }>>([])
  const [selectedBodegaId, setSelectedBodegaId] = useState(bodegaId)
  const [numero, setNumero] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [capacidad, setCapacidad] = useState('')
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

  useEffect(() => {
    let active = true

    getBodegas()
      .then((list) => {
        if (!active) return
        setBodegas(list.map((bodega) => ({ id: bodega.id, nombre: bodega.nombre })))
      })
      .catch(() => {
        if (!active) return
        setBodegas([])
      })

    return () => {
      active = false
    }
  }, [])

  const options =
    bodegas.length > 0
      ? bodegas
      : bodegaNombre
        ? [{ id: Number(bodegaId), nombre: bodegaNombre }]
        : []

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const numeroNormalizado = numero.trim()
    const nombreNormalizado = nombre.trim()

    if (!selectedBodegaId) {
      setError('Selecciona una bodega.')
      return
    }

    if (!numeroNormalizado) {
      setError('El número del stand es obligatorio.')
      return
    }

    if (!/^\d+$/.test(numeroNormalizado)) {
      setError('El número del stand debe ser un número.')
      return
    }

    if (capacidad.trim() && !/^\d+$/.test(capacidad.trim())) {
      setError('La capacidad debe ser un número.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await createStand(selectedBodegaId, {
        nombre: nombreNormalizado || `Stand ${numeroNormalizado}`,
        estado,
      })

      onCreated(selectedBodegaId)
    } catch (submitError) {
      setError(
        submitError instanceof Error
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
              Agregar nuevo stand
            </h2>
            <p className="mt-1 text-sm text-sena-text/50">
              Completa la información del stand
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            disabled={saving}
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-sena-text/40 transition hover:bg-sena-muted hover:text-sena-text"
          >
            <CloseIcon />
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
            <span className="relative mt-1.5 block">
              <select
                value={selectedBodegaId}
                disabled={saving}
                onChange={(event) => setSelectedBodegaId(event.target.value)}
                className={`${fieldClass} appearance-none pr-10`}
              >
                {options.length === 0 ? (
                  <option value={bodegaId}>{bodegaNombre || 'Bodega actual'}</option>
                ) : (
                  options.map((bodega) => (
                    <option key={bodega.id} value={bodega.id}>
                      {bodega.nombre}
                    </option>
                  ))
                )}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sena-text/40">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-sena-text">
              Número de stand *
              <input
                value={numero}
                onChange={(event) => setNumero(event.target.value)}
                placeholder="Ej. 4"
                inputMode="numeric"
                disabled={saving}
                className={`${fieldClass} mt-1.5`}
              />
            </label>
            <label className="block text-sm font-medium text-sena-text">
              Nombre del stand
              <input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej. Stand 1"
                maxLength={150}
                disabled={saving}
                className={`${fieldClass} mt-1.5`}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-sena-text">
            Descripción
            <textarea
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Descripción del stand..."
              rows={3}
              disabled={saving}
              className="mt-1.5 w-full resize-none rounded-lg border border-sena-dark/10 bg-white px-3.5 py-2.5 text-sm text-sena-text outline-none transition placeholder:text-sena-text/35 focus:border-sena focus:ring-2 focus:ring-sena/15"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
            <label className="block text-sm font-medium text-sena-text">
              Capacidad (uds.)
              <input
                value={capacidad}
                onChange={(event) => setCapacidad(event.target.value)}
                placeholder="Ej. 50"
                inputMode="numeric"
                disabled={saving}
                className={`${fieldClass} mt-1.5`}
              />
            </label>

            <div>
              <p className="text-sm font-medium text-sena-text">Estado</p>
              <div className="mt-1.5 flex h-11 items-center justify-between">
                <span className="text-sm text-sena-text/80">
                  {estado ? 'Disponible' : 'No disponible'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={estado}
                  aria-label="Cambiar estado del stand"
                  disabled={saving}
                  onClick={() => setEstado((current) => !current)}
                  className={[
                    'relative h-6 w-11 shrink-0 rounded-full transition',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-sena/30',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    estado ? 'bg-sena' : 'bg-slate-300',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition',
                      estado ? 'left-[22px]' : 'left-0.5',
                    ].join(' ')}
                  />
                </button>
              </div>
            </div>
          </div>
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
            <SaveIcon />
            {saving ? 'Guardando...' : 'Guardar stand'}
          </button>
        </div>
      </form>
    </div>
  )
}
