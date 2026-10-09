import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'

import { ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib/cn'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import { ActionButton, ErrorBanner } from '@/shared/components/DataTable'
import { TrashIcon } from '@/shared/components/icons/AppIcons'

import ElementoCombobox from '@/modules/solicitudes/components/ElementoCombobox'
import {
  formatFechaDia,
  hoyDia,
  availableOf,
  caracterOf,
  inputClass,
  inputErrorClass,
  personName,
} from '@/modules/solicitudes/lib/presentacion'
import { getClasificacionesActivas } from '@/modules/inventario/data/elemento'
import { CARACTER_LABEL } from '@/modules/inventario/lib/caracter'

import type {
  ClasificacionElementoApi,
  ElementoApi,
} from '@/modules/inventario/types/elemento'
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

/*
 * Si pide más de lo disponible no se bloquea: lo que falta queda pendiente.
 * En el mostrador sale lo que hay al registrar; el instructor espera a bodega.
 */
function entregaAviso(fila: Fila, mostrador: boolean) {
  const value = Number(fila.cantidad)
  if (fila.disponible === null || cantidadError(fila) || value <= fila.disponible) return ''

  if (mostrador) {
    if (fila.disponible <= 0) return 'Sin existencia: queda pendiente.'
    return `Salen ${fila.disponible} ahora y ${value - fila.disponible} quedan pendientes.`
  }

  if (fila.disponible <= 0) return 'Sin existencia: todo queda pendiente hasta que bodega lo entregue.'
  const restantes = value - fila.disponible
  return `${hayDisponibles(fila.disponible)}; ${restantes === 1 ? 'el restante queda pendiente' : `los ${restantes} restantes quedan pendientes`} hasta que bodega los entregue.`
}

function hayDisponibles(disponible: number) {
  return `Hay ${disponible} ${disponible === 1 ? 'disponible' : 'disponibles'}`
}

/*
 * La solicitud es una factura: un encabezado (tipo, obra, ficha) y una grilla
 * con lo que se necesita. Es toda de consumo o toda devolutiva, nunca mezclada.
 * `tipos` son los que el usuario puede pedir; con uno solo, queda fijo.
 *
 * Con `solicitante` es bodega registrando en el mostrador a nombre de otra
 * persona: entrega lo que haya al registrar. Sin él es el instructor: ve solo
 * cuánto hay disponible y lo que pida de más queda pendiente.
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
  // Solo el devolutivo lleva fechas: inicio del préstamo y hasta cuándo lo pide.
  // El consumo se entrega y ya, sin fechas.
  const [fechaInicio, setFechaInicio] = useState(hoyDia)
  const [fechaFin, setFechaFin] = useState('')
  const [filas, setFilas] = useState<Fila[]>([])
  const [intentado, setIntentado] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState('')
  const [clasificaciones, setClasificaciones] = useState<ClasificacionElementoApi[]>([])

  const cantidadRefs = useRef(new Map<number, HTMLInputElement>())
  const [recienAgregado, setRecienAgregado] = useState<number | null>(null)

  useEffect(() => {
    if (recienAgregado === null) return
    const input = cantidadRefs.current.get(recienAgregado)
    input?.focus()
    input?.select()
  }, [recienAgregado])

  // Todas las clasificaciones activas del catálogo (el instructor ya puede leerlas).
  useEffect(() => {
    let vivo = true
    getClasificacionesActivas()
      .then((rows) => {
        if (vivo) setClasificaciones(rows)
      })
      .catch(() => {
        if (vivo) setClasificaciones([])
      })
    return () => {
      vivo = false
    }
  }, [])

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
        disponible: availableOf(elemento),
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
  const devolutivo = tipo === 'devolutivo'
  const unidades = filas.reduce((total, fila) => {
    const value = Number(fila.cantidad)
    return total + (Number.isInteger(value) && value > 0 ? value : 0)
  }, 0)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIntentado(true)
    setLocalError('')

    if (!Number(idObra)) {
      setLocalError('Selecciona la obra.')
      return
    }

    if (devolutivo && !fechaInicio) {
      setLocalError('Indica la fecha de inicio.')
      return
    }

    if (devolutivo && fechaInicio < hoyDia()) {
      setLocalError('La fecha de inicio no puede ser anterior a hoy.')
      return
    }

    if (devolutivo && !fechaFin) {
      setLocalError('Indica la fecha de devolución que propones.')
      return
    }

    if (devolutivo && fechaFin < fechaInicio) {
      setLocalError('La devolución no puede ser anterior al inicio.')
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
        ...(devolutivo ? { fechaInicio, fechaDevolucionPropuesta: fechaFin } : {}),
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
      <form onSubmit={handleSubmit} className="space-y-7" noValidate>
        {localError ? (
          <ErrorBanner message={localError} onClose={() => setLocalError('')} />
        ) : null}

        <section aria-labelledby="factura-datos" className="space-y-4">
          <h3 id="factura-datos" className="text-sm font-semibold text-sena-text">
            Datos de la solicitud
          </h3>

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

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
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

        {devolutivo ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 md:items-end">
              <Field label="Fecha de inicio" required>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(event) => {
                    const valor = event.target.value
                    setFechaInicio(valor)
                    if (fechaFin && valor && fechaFin < valor) setFechaFin('')
                  }}
                  min={hoyDia()}
                  className={intentado && !fechaInicio ? inputErrorClass : inputClass}
                  required
                />
              </Field>

              <Field
                label={mostrador ? 'Fecha límite de devolución' : 'Devolución propuesta'}
                required
                hint={
                  mostrador
                    ? 'Desde ese día, si algo sigue afuera, se avisa a diario'
                    : 'Bodega la confirma o la ajusta al entregar'
                }
              >
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(event) => setFechaFin(event.target.value)}
                  min={fechaInicio || hoyDia()}
                  className={intentado && !fechaFin ? inputErrorClass : inputClass}
                  required
                />
              </Field>
            </div>

            {fechaInicio && fechaFin ? (
              <p className="text-xs text-sena-text-soft">
                Lo pides del {formatFechaDia(fechaInicio)} al {formatFechaDia(fechaFin)}.
              </p>
            ) : null}
          </>
        ) : null}

        <Field label="Observación general" hint="Opcional. Se copia en las filas que no tengan la suya">
          <textarea
            value={observacion}
            onChange={(event) => setObservacion(event.target.value)}
            rows={2}
            placeholder="Indica para qué se necesita..."
            className={`${inputClass} min-h-20 resize-y py-3`}
          />
        </Field>
        </section>

        <section aria-labelledby="factura-agregar" className="space-y-3">
          <div>
            <h3 id="factura-agregar" className="text-sm font-semibold text-sena-text">
              Agregar elementos <span className="text-sena">*</span>
            </h3>
            <p className="mt-1 text-xs text-sena-text-soft">
              Filtra por clasificación y busca por nombre, código o clasificación. Se suman abajo.
            </p>
          </div>

          <ElementoCombobox
            elementos={elegibles}
            clasificaciones={clasificaciones}
            value={null}
            onChange={agregar}
            availableOf={availableOf}
            label="Agregar elemento"
            placeholder={`Busca por nombre, código o clasificación, ${actual.ejemplo}`}
            inputClassName={inputClass}
          />

        </section>

        <section aria-labelledby="factura-lista" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="factura-lista" className="text-sm font-semibold text-sena-text">
              Elementos de la solicitud
            </h3>
            {filas.length ? (
              <p className="text-xs text-sena-text-soft tabular-nums">
                {filas.length} {filas.length === 1 ? 'elemento' : 'elementos'}
              </p>
            ) : null}
          </div>
          {filas.length === 0 ? (
            <p
              className={cn(
                'rounded-2xl border border-dashed px-5 py-8 text-center text-sm leading-6',
                intentado
                  ? 'border-sena-danger-line text-sena-danger-text'
                  : 'border-sena-line text-sena-text-soft',
              )}
            >
              Todavía no hay elementos.
              <span className="mt-1 block text-xs">
                Búscalos arriba y se van sumando aquí.
              </span>
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
                  const aviso = entregaAviso(fila, mostrador)
                  const unidad = fila.elemento.unidadMedida?.abreviatura ?? ''
                  const ayudaId = `factura-cantidad-${fila.elemento.id}`
                  const tipoFila = caracterOf(fila.elemento)

                  return (
                    <li
                      key={fila.elemento.id}
                      className={cn(
                        'grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-start gap-x-3 gap-y-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,14rem)_2.5rem]',
                        error || aviso
                          ? "[grid-template-areas:'nombre_nombre_quitar'_'cantidad_obs_obs'_'aviso_aviso_aviso'] sm:[grid-template-areas:'nombre_cantidad_obs_quitar'_'aviso_aviso_aviso_aviso']"
                          : "[grid-template-areas:'nombre_nombre_quitar'_'cantidad_obs_obs'] sm:[grid-template-areas:'nombre_cantidad_obs_quitar']",
                      )}
                    >
                      <div className="min-w-0 pt-1.5 [grid-area:nombre]">
                        <p className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-sena-text">
                            {fila.elemento.nombre}
                          </span>
                          {tipoFila ? (
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2 py-px text-[11px] font-semibold',
                                tipoFila === 'devolutivo'
                                  ? 'bg-sena-active-soft text-sena-ok-text'
                                  : 'bg-sena-warn-soft text-sena-warn-text',
                              )}
                            >
                              {CARACTER_LABEL[tipoFila]}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-sena-text-soft">
                          <span className="truncate">{fila.elemento.codigo}</span>
                          {fila.disponible !== null && !aviso ? (
                            <span className="tabular-nums">
                              {mostrador
                                ? `${fila.disponible}${unidad ? ` ${unidad}` : ''} disp.`
                                : hayDisponibles(fila.disponible)}
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

                      {error || aviso ? (
                        <p
                          id={ayudaId}
                          className={cn(
                            'rounded-xl px-3 py-2 text-xs font-semibold leading-5 [grid-area:aviso]',
                            error
                              ? 'bg-sena-danger-soft text-sena-danger-text'
                              : 'bg-sena-warn-soft text-sena-warn-text',
                          )}
                        >
                          {error || aviso}
                        </p>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>

        <div className="sticky -bottom-6 z-10 -mx-6 -mb-6 flex flex-col gap-3 border-t border-sena-hairline bg-glass-strong px-6 py-4 backdrop-blur-glass sm:-bottom-8 sm:-mx-8 sm:-mb-8 sm:flex-row sm:items-center sm:justify-end sm:px-8">
          <p className="text-sm text-sena-text-soft tabular-nums sm:mr-auto">
            {filas.length === 0
              ? mostrador
                ? 'Nada sale de bodega hasta que registres la solicitud.'
                : 'Nada queda reservado hasta que registres la solicitud.'
              : `${actual.cuenta(filas.length)} · ${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`}
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
