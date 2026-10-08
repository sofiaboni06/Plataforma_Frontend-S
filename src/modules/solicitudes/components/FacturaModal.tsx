import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'

import { ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib/cn'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import { ActionButton, ErrorBanner } from '@/shared/components/DataTable'
import { TrashIcon } from '@/shared/components/icons/AppIcons'

import ElementoCombobox from '@/modules/solicitudes/components/ElementoCombobox'
import {
  availableOf,
  caracterOf,
  inputClass,
  inputErrorClass,
  personName,
} from '@/modules/solicitudes/lib/presentacion'

import type { ElementoApi } from '@/modules/inventario/types/elemento'
import type {
  CrearFacturaPayload,
  FacturaTipo,
  ObraApi,
  SolicitanteApi,
} from '@/modules/solicitudes/types'

type Fila = {
  elemento: ElementoApi
  disponible: number | null
  cantidad: string
  observacion: string
}

const TIPO = {
  consumo: {
    label: 'Consumo',
    hint: 'Se gasta en la obra',
    titulo: 'Nueva solicitud de consumo',
    ejemplo: 'ej. pintura o lija',
    cuenta: (n: number) => `${n} ${n === 1 ? 'elemento' : 'elementos'} de consumo`,
  },
  devolutivo: {
    label: 'Devolutivo',
    hint: 'Se presta y se devuelve',
    titulo: 'Nueva solicitud de devolutivos',
    ejemplo: 'ej. taladro o pulidora',
    cuenta: (n: number) => `${n} ${n === 1 ? 'devolutivo' : 'devolutivos'}`,
  },
} as const satisfies Record<FacturaTipo, unknown>

function cantidadError(fila: Fila) {
  const value = Number(fila.cantidad)

  if (fila.cantidad.trim() === '' || !Number.isInteger(value) || value <= 0) {
    return 'Escribe una cantidad entera mayor que cero.'
  }

  return ''
}

/* En el mostrador: lo que sale ya y lo que queda pendiente a su nombre. */
function entregaAviso(fila: Fila) {
  const value = Number(fila.cantidad)
  if (fila.disponible === null || cantidadError(fila) || value <= fila.disponible) return ''
  if (fila.disponible <= 0) return 'Sin existencia: queda pendiente.'
  return `Salen ${fila.disponible} ahora y ${value - fila.disponible} quedan pendientes.`
}

/*
 * La solicitud es una factura: un encabezado (tipo, obra, ficha) y una grilla
 * con lo que se necesita. Es toda de consumo o toda devolutiva, nunca mezclada.
 * `tipos` son los que el usuario puede pedir; con uno solo, queda fijo.
 *
 * Con `solicitante` es bodega registrando en el mostrador a nombre de otra
 * persona: ve la existencia y entrega lo que haya al registrar. Sin él es el
 * instructor, que pide sin ver lo que queda en bodega.
 */
export default function FacturaModal({
  obras,
  elementos,
  tipos,
  solicitante = null,
  onCambiarSolicitante,
  onClose,
  onSubmit,
}: {
  obras: ObraApi[]
  elementos: ElementoApi[]
  tipos: FacturaTipo[]
  solicitante?: SolicitanteApi | null
  onCambiarSolicitante?: () => void
  onClose: () => void
  onSubmit: (payload: Omit<CrearFacturaPayload, 'codigoSolicitud'>) => Promise<void>
}) {
  const mostrador = solicitante !== null
  const [tipo, setTipo] = useState<FacturaTipo>(tipos[0] ?? 'consumo')
  const [idObra, setIdObra] = useState('')
  const [ficha, setFicha] = useState('')
  const [observacion, setObservacion] = useState('')
  const [filas, setFilas] = useState<Fila[]>([])
  const [intentado, setIntentado] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState('')

  const cantidadRefs = useRef(new Map<number, HTMLInputElement>())
  const [recienAgregado, setRecienAgregado] = useState<number | null>(null)

  useEffect(() => {
    if (recienAgregado === null) return
    const input = cantidadRefs.current.get(recienAgregado)
    input?.focus()
    input?.select()
  }, [recienAgregado])

  const elegibles = useMemo(() => {
    const usados = new Set(filas.map((fila) => fila.elemento.id))

    return elementos
      .filter((elemento) => !usados.has(elemento.id) && caracterOf(elemento) === tipo)
      .sort((left, right) => left.nombre.localeCompare(right.nombre, 'es'))
  }, [elementos, filas, tipo])

  const cambiarTipo = (siguiente: FacturaTipo) => {
    if (siguiente === tipo) return
    setTipo(siguiente)
    setFilas([])
    cantidadRefs.current.clear()
    setLocalError('')
  }

  const agregar = (elemento: ElementoApi | null) => {
    if (!elemento || caracterOf(elemento) !== tipo) return

    setFilas((current) => [
      ...current,
      {
        elemento,
        disponible: mostrador ? availableOf(elemento) : null,
        cantidad: '1',
        observacion: '',
      },
    ])
    setRecienAgregado(elemento.id)
    setLocalError('')
  }

  const actualizar = (id: number, cambio: Partial<Pick<Fila, 'cantidad' | 'observacion'>>) => {
    setFilas((current) =>
      current.map((fila) => (fila.elemento.id === id ? { ...fila, ...cambio } : fila)),
    )
  }

  const quitar = (id: number) => {
    setFilas((current) => current.filter((fila) => fila.elemento.id !== id))
    cantidadRefs.current.delete(id)
  }

  const conError = filas.some((fila) => cantidadError(fila) !== '')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIntentado(true)
    setLocalError('')

    if (!Number(idObra)) {
      setLocalError('Selecciona la obra.')
      return
    }

    if (filas.length === 0) {
      setLocalError('Agrega al menos un elemento a la solicitud.')
      return
    }

    if (conError) {
      setLocalError('Revisa las cantidades marcadas en rojo.')
      return
    }

    setSaving(true)

    try {
      await onSubmit({
        idObra: Number(idObra),
        tipo,
        ...(ficha.trim() ? { ficha: ficha.trim() } : {}),
        ...(observacion.trim() ? { observacion: observacion.trim() } : {}),
        elementos: filas.map((fila) => ({
          idElemento: fila.elemento.id,
          cantidad: Number(fila.cantidad),
          ...(fila.observacion.trim() ? { observacion: fila.observacion.trim() } : {}),
        })),
      })
    } catch (cause) {
      setLocalError(
        cause instanceof ApiError ? cause.message : 'No se pudo registrar la solicitud.',
      )
    } finally {
      setSaving(false)
    }
  }

  const actual = TIPO[tipo]

  return (
    <Modal
      title={
        mostrador
          ? 'Registrar en el mostrador'
          : tipos.length > 1
            ? 'Nueva solicitud'
            : actual.titulo
      }
      description={
        mostrador
          ? 'Arma la solicitud de quien está en la bodega. Al registrar se entrega lo que haya y lo que falte queda pendiente a su nombre.'
          : 'Arma la lista de lo que necesitas para la obra. Una solicitud es toda de consumo o toda devolutiva.'
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {localError ? (
          <ErrorBanner message={localError} onClose={() => setLocalError('')} />
        ) : null}

        {solicitante ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sena-line bg-white/65 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-sena-text-soft">A nombre de</p>
              <p className="truncate text-sm font-semibold text-sena-text">
                {personName(solicitante)}
              </p>
              <p className="mt-0.5 truncate text-xs text-sena-text-soft">
                {solicitante.tipoDocumento ?? 'Documento'} {solicitante.numeroDocumento} ·{' '}
                {solicitante.email}
              </p>
            </div>
            {onCambiarSolicitante ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCambiarSolicitante}
                disabled={saving}
              >
                Cambiar persona
              </Button>
            ) : null}
          </div>
        ) : null}

        {tipos.length > 1 ? (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-sena-text">
              Tipo de solicitud <span className="text-sena">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-sena-line bg-white/65 p-1.5">
              {tipos.map((opcion) => (
                <label
                  key={opcion}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-center transition-colors duration-150 hover:bg-sena-muted/60 has-[:checked]:bg-sena has-[:checked]:text-white has-[:checked]:shadow-brand has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sena"
                >
                  <input
                    type="radio"
                    name="factura-tipo"
                    value={opcion}
                    checked={tipo === opcion}
                    onChange={() => cambiarTipo(opcion)}
                    disabled={saving}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold">{TIPO[opcion].label}</span>
                  <span className="block text-xs opacity-75">{TIPO[opcion].hint}</span>
                </label>
              ))}
            </div>
            {filas.length ? (
              <p className="mt-1.5 text-xs text-sena-text-soft">Si cambias el tipo, la lista se vacía.</p>
            ) : null}
          </fieldset>
        ) : null}

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_12rem]">
          <Field label="Obra" required>
            <select
              value={idObra}
              onChange={(event) => setIdObra(event.target.value)}
              className={intentado && !Number(idObra) ? inputErrorClass : inputClass}
              required
            >
              <option value="">Selecciona una obra</option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nombre}
                  {obra.lugar ? ` — ${obra.lugar}` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ficha" hint="Opcional">
            <input
              value={ficha}
              onChange={(event) => setFicha(event.target.value)}
              maxLength={50}
              placeholder="Ej. 2876543"
              className={inputClass}
            />
          </Field>
        </div>

        <section aria-labelledby="factura-elementos" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="factura-elementos" className="text-sm font-semibold text-sena-text">
              Elementos <span className="text-sena">*</span>
            </h3>
            {filas.length ? (
              <p className="text-xs text-sena-text-soft tabular-nums">
                {filas.length} {filas.length === 1 ? 'elemento' : 'elementos'}
              </p>
            ) : null}
          </div>

          <ElementoCombobox
            elementos={elegibles}
            value={null}
            onChange={agregar}
            availableOf={mostrador ? availableOf : undefined}
            label="Agregar elemento"
            placeholder={`Busca por nombre o código para agregarlo, ${actual.ejemplo}`}
            inputClassName={inputClass}
          />

          {filas.length === 0 ? (
            <p
              className={cn(
                'rounded-2xl border border-dashed px-5 py-6 text-center text-sm',
                intentado
                  ? 'border-sena-danger-line text-sena-danger-text'
                  : 'border-sena-line text-sena-text-soft',
              )}
            >
              Todavía no hay elementos. Búscalos arriba y se van sumando aquí.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-sena-line bg-white/65">
              <div
                aria-hidden="true"
                className="hidden grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,14rem)_2.5rem] gap-3 border-b border-sena-hairline bg-sena-muted/45 px-4 py-2.5 text-xs font-semibold text-sena-text-soft sm:grid"
              >
                <span>Elemento</span>
                <span className="text-center">Cantidad</span>
                <span>Observación</span>
                <span />
              </div>

              <ul className="divide-y divide-sena-hairline">
                {filas.map((fila) => {
                  const error = cantidadError(fila)
                  const aviso = entregaAviso(fila)
                  const unidad = fila.elemento.unidadMedida?.abreviatura ?? ''
                  const ayudaId = `factura-cantidad-${fila.elemento.id}`

                  return (
                    <li
                      key={fila.elemento.id}
                      className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-start gap-x-3 gap-y-2 px-4 py-3 [grid-template-areas:'nombre_nombre_quitar'_'cantidad_obs_obs'] sm:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,14rem)_2.5rem] sm:[grid-template-areas:'nombre_cantidad_obs_quitar']"
                    >
                      <div className="min-w-0 pt-1.5 [grid-area:nombre]">
                        <p className="truncate text-sm font-semibold text-sena-text">
                          {fila.elemento.nombre}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-sena-text-soft">
                          <span className="truncate">{fila.elemento.codigo}</span>
                          {fila.disponible !== null ? (
                            <span className="tabular-nums">
                              {fila.disponible}
                              {unidad ? ` ${unidad}` : ''} disp.
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <div className="flex justify-end pt-0.5 [grid-area:quitar]">
                        <ActionButton
                          title={`Quitar ${fila.elemento.nombre}`}
                          onClick={() => quitar(fila.elemento.id)}
                          disabled={saving}
                        >
                          <TrashIcon className="size-[18px]" />
                        </ActionButton>
                      </div>

                      <div className="[grid-area:cantidad]">
                          <input
                            ref={(node) => {
                              if (node) cantidadRefs.current.set(fila.elemento.id, node)
                            }}
                            type="number"
                            inputMode="numeric"
                            min="1"
                            step="1"
                            value={fila.cantidad}
                            onChange={(event) =>
                              actualizar(fila.elemento.id, { cantidad: event.target.value })
                            }
                            aria-label={`Cantidad de ${fila.elemento.nombre}`}
                            aria-invalid={error !== ''}
                            aria-describedby={error || aviso ? ayudaId : undefined}
                            className={cn(
                              error ? inputErrorClass : inputClass,
                              'px-3 py-2.5 text-center tabular-nums',
                            )}
                          />
                          {error ? (
                            <span
                              id={ayudaId}
                              className="mt-1.5 block text-[11px] leading-4 font-semibold text-sena-danger-text"
                            >
                              {error}
                            </span>
                          ) : aviso ? (
                            <span
                              id={ayudaId}
                              className="mt-1.5 block text-[11px] leading-4 font-semibold text-sena-strong"
                            >
                              {aviso}
                            </span>
                          ) : null}
                      </div>

                      <input
                        value={fila.observacion}
                        onChange={(event) =>
                          actualizar(fila.elemento.id, { observacion: event.target.value })
                        }
                        aria-label={`Observación de ${fila.elemento.nombre}`}
                        placeholder="Observación (opcional)"
                        className={cn(inputClass, 'px-3 py-2.5 [grid-area:obs]')}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>

        <Field label="Observación general" hint="Opcional. Se copia en las filas que no tengan la suya">
          <textarea
            value={observacion}
            onChange={(event) => setObservacion(event.target.value)}
            rows={2}
            placeholder="Indica para qué se necesita..."
            className={`${inputClass} min-h-20 resize-y py-3`}
          />
        </Field>

        <div className="flex flex-col-reverse gap-4 border-t border-sena-hairline pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-sena-text-soft tabular-nums">
            {filas.length === 0
              ? mostrador
                ? 'Nada sale de bodega hasta que registres la solicitud.'
                : 'Nada queda reservado hasta que registres la solicitud.'
              : actual.cuenta(filas.length)}
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving || obras.length === 0}>
              {saving
                ? 'Guardando...'
                : mostrador
                  ? 'Registrar y entregar'
                  : filas.length > 1
                    ? `Registrar ${filas.length} elementos`
                    : 'Registrar solicitud'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 flex flex-wrap items-center gap-x-2 text-sm font-semibold text-sena-text">
        {label}
        {required ? <span className="text-sena">*</span> : null}
        {hint ? <span className="text-xs font-normal text-sena-text-soft">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}
