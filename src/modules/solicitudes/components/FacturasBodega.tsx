import { Fragment, useState } from 'react'

import Button from '@/shared/components/ui/Button'
import {
  ActionButton,
  RowActions,
  TableEmpty,
  TableHeader,
  TableRow,
  tableClass,
} from '@/shared/components/DataTable'
import { StatusPill } from '@/shared/components/ResourceBoard'
import PlazoPill from '@/modules/solicitudes/components/PlazoPill'
import { DeliverIcon, EyeIcon } from '@/shared/components/icons/AppIcons'
import { cn } from '@/shared/lib/cn'

import {
  existenciaDe,
  FACTURA_LABEL,
  facturaTone,
  formatDay,
  formatFechaDia,
  personName,
  porEntregar,
  requestLabel,
  requestTone,
  saldria,
  tieneAfuera,
} from '@/modules/solicitudes/lib/presentacion'

import type { FacturaApi, FacturaFilaApi } from '@/modules/solicitudes/types'

function filasPorEntregar(factura: FacturaApi) {
  return factura.detalle.filter((fila) => porEntregar(fila.estado))
}

function plural(cantidad: number, singular: string, varios: string) {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`
}

function Chevron({ abierta }: { abierta: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={cn('size-4 transition-transform duration-150', abierta && 'rotate-90')}
    >
      <path d="m7.5 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/*
 * Bodega ve cada pedido una sola vez: código, quién lo pidió, cuántos
 * elementos y el estado del pedido completo. Al abrirlo aparecen sus
 * elementos con lo pedido, lo entregado y lo pendiente, y la acción de cada
 * uno. "deliver" entrega (fila por fila o todo lo disponible); "return"
 * recibe el equipo que está afuera, fila por fila.
 */
export default function FacturasBodega({
  mode,
  facturas,
  emptyLabel,
  saving = false,
  abrirTodas = false,
  onView,
  onDeliverLine,
  onDeliverAll,
  onReturnLine,
}: {
  mode: 'deliver' | 'return'
  facturas: FacturaApi[]
  emptyLabel: string
  saving?: boolean
  /* Con una búsqueda activa se abren todas para ver qué elemento coincidió. */
  abrirTodas?: boolean
  onView: (factura: FacturaApi) => void
  onDeliverLine?: (factura: FacturaApi, fila: FacturaFilaApi) => void
  onDeliverAll?: (factura: FacturaApi) => void
  onReturnLine?: (factura: FacturaApi, fila: FacturaFilaApi) => void
}) {
  const [abiertas, setAbiertas] = useState<Set<string>>(() => new Set())

  const alternar = (codigo: string) =>
    setAbiertas((actual) => {
      const siguiente = new Set(actual)
      if (siguiente.has(codigo)) siguiente.delete(codigo)
      else siguiente.add(codigo)
      return siguiente
    })

  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead>
          <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
            <TableHeader width="w-[24%]">Solicitud</TableHeader>
            <TableHeader width="w-[24%]">Solicitante</TableHeader>
            <TableHeader align="center" width="w-[14%]">
              Elementos
            </TableHeader>
            <TableHeader align="center" width="w-[22%]">
              {mode === 'return' ? 'Devolución' : 'Estado'}
            </TableHeader>
            <TableHeader align="center" width="w-[16%]">
              Acciones
            </TableHeader>
          </tr>
        </thead>

        <tbody>
          {facturas.length === 0 ? (
            <TableEmpty colSpan={5}>{emptyLabel}</TableEmpty>
          ) : (
            facturas.map((factura) => {
              const abierta = abrirTodas || abiertas.has(factura.codigoSolicitud)
              const pendientes = filasPorEntregar(factura)
              const unidadesQueSalen = pendientes.reduce((total, fila) => total + saldria(fila), 0)
              const panelId = `factura-${factura.codigoSolicitud}`
              const fechas = fechasDe(factura, mode)

              return (
                <Fragment key={factura.codigoSolicitud}>
                  <TableRow className={cn(abierta && 'border-b-0 bg-sena-veil/70')}>
                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => alternar(factura.codigoSolicitud)}
                        aria-expanded={abierta}
                        aria-controls={panelId}
                        className="flex w-full min-w-0 items-start gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena"
                      >
                        <span
                          className={cn(
                            'grid size-7 shrink-0 place-items-center rounded-lg border transition duration-150',
                            abierta
                              ? 'border-sena/30 bg-sena text-white'
                              : 'border-sena-line bg-white/80 text-sena-strong',
                          )}
                        >
                          <Chevron abierta={abierta} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-sena-text">
                            {factura.codigoSolicitud}
                          </span>
                          <span className="mt-1 block truncate text-xs text-sena-text-soft">
                            {formatDay(factura.fecha)}
                          </span>
                          {factura.ficha ? (
                            <span className="mt-0.5 block truncate text-xs text-sena-text-soft">
                              Ficha {factura.ficha}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </td>

                    <td className="px-6 py-5">
                      <p className="truncate font-medium text-sena-text">{personName(factura.usuario)}</p>
                      <p className="mt-1 truncate text-xs text-sena-text-soft">
                        {factura.obra ? `para ${factura.obra.nombre}` : '—'}
                        {factura.registradaEnBodega ? ' · en mostrador' : ''}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <p className="font-semibold tabular-nums text-sena-text">
                        {plural(factura.totales.lineas, 'elemento', 'elementos')}
                      </p>
                      <p className="mt-1 text-xs text-sena-text-soft tabular-nums">
                        {mode === 'return'
                          ? `${factura.totales.cantidadAfuera} afuera`
                          : pendientes.length
                            ? `${pendientes.length} por entregar`
                            : 'todo entregado'}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      {mode === 'return' && factura.plazo ? (
                        <PlazoPill plazo={factura.plazo} limite={factura.fechaDevolucionLimite} />
                      ) : (
                        <StatusPill tone={facturaTone(factura.estado)}>
                          {FACTURA_LABEL[factura.estado]}
                        </StatusPill>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <RowActions>
                        <ActionButton title="Ver solicitud" onClick={() => onView(factura)}>
                          <EyeIcon className="size-[18px]" />
                        </ActionButton>
                        {mode === 'deliver' && onDeliverAll && pendientes.length ? (
                          <ActionButton
                            title={
                              unidadesQueSalen > 0
                                ? 'Entregar todo lo disponible'
                                : 'Sin existencia para entregar'
                            }
                            disabled={saving || unidadesQueSalen <= 0}
                            onClick={() => onDeliverAll(factura)}
                          >
                            <DeliverIcon className="size-[18px]" />
                          </ActionButton>
                        ) : null}
                      </RowActions>
                    </td>
                  </TableRow>

                  {abierta ? (
                    <tr className="border-b border-sena-hairline/90 bg-sena-veil/70 last:border-b-0">
                      <td colSpan={5} className="px-6 pt-1 pb-7">
                        <div
                          id={panelId}
                          className="overflow-hidden rounded-[20px] border border-sena-line bg-white/85 shadow-hairline"
                        >
                          <div className="flex flex-col gap-2 border-b border-sena-hairline bg-sena-soft/45 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-[0.6875rem] font-bold tracking-[0.13em] text-sena-dark uppercase">
                              {mode === 'return' ? 'Lo que está afuera' : 'Elementos de la solicitud'}
                            </p>
                            {fechas.length ? (
                              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                                {fechas.map(([termino, valor]) => (
                                  <div key={termino} className="flex gap-1.5">
                                    <dt className="text-sena-text-soft">{termino}</dt>
                                    <dd className="font-semibold text-sena-text">{valor}</dd>
                                  </div>
                                ))}
                              </dl>
                            ) : null}
                          </div>

                          <ul className="divide-y divide-sena-hairline">
                            {factura.detalle.map((fila) => (
                              <FilaFactura
                                key={`${fila.tipo}-${fila.id}`}
                                fila={fila}
                                mode={mode}
                                saving={saving}
                                onDeliver={
                                  onDeliverLine ? () => onDeliverLine(factura, fila) : undefined
                                }
                                onReturn={
                                  onReturnLine ? () => onReturnLine(factura, fila) : undefined
                                }
                              />
                            ))}
                          </ul>

                          {mode === 'deliver' && onDeliverAll && pendientes.length ? (
                            <div className="flex flex-col gap-4 border-t border-sena-hairline bg-sena-soft/45 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm leading-6 text-sena-text-soft tabular-nums">
                                {unidadesQueSalen > 0
                                  ? `Con la existencia de ahora salen ${plural(unidadesQueSalen, 'unidad', 'unidades')}; lo que no alcance queda pendiente.`
                                  : 'No hay existencia de ninguno de los elementos pendientes.'}
                              </p>
                              <Button
                                size="sm"
                                icon={<DeliverIcon className="size-4" />}
                                disabled={saving || unidadesQueSalen <= 0}
                                onClick={() => onDeliverAll(factura)}
                                className="shrink-0"
                              >
                                Entregar todo lo disponible
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

/* Fechas del préstamo que bodega necesita ver al abrir el pedido. El consumo no lleva. */
function fechasDe(factura: FacturaApi, mode: 'deliver' | 'return'): [string, string][] {
  if (factura.tipo !== 'devolutivo') return []

  const filas: [string, string | null | undefined][] = [
    ['Inicio', factura.fechaInicio],
    mode === 'return' || factura.fechaDevolucionLimite
      ? ['Debe volver', factura.fechaDevolucionLimite ?? factura.fechaDevolucionPropuesta]
      : ['Propone devolver', factura.fechaDevolucionPropuesta],
  ]

  return filas
    .filter((fila): fila is [string, string] => Boolean(fila[1]))
    .map(([termino, valor]) => [termino, formatFechaDia(valor)])
}

function Cifra({ label, value, fuerte = false }: { label: string; value: number; fuerte?: boolean }) {
  return (
    <div
      className={cn(
        'min-w-[4.75rem] rounded-xl border px-3 py-1.5 text-center',
        fuerte ? 'border-sena-warn-line bg-sena-warn-soft/70' : 'border-sena-hairline bg-sena-muted/50',
      )}
    >
      <p className="text-[11px] text-sena-text-soft">{label}</p>
      <p
        className={cn(
          'text-sm font-semibold tabular-nums',
          fuerte ? 'text-sena-warn-text' : 'text-sena-text',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function FilaFactura({
  fila,
  mode,
  saving,
  onDeliver,
  onReturn,
}: {
  fila: FacturaFilaApi
  mode: 'deliver' | 'return'
  saving: boolean
  onDeliver?: () => void
  onReturn?: () => void
}) {
  const existencia = existenciaDe(fila)
  const sinExistencia = existencia !== null && existencia <= 0
  const equipo = fila.tipo === 'equipo'
  const entregar = mode === 'deliver' && onDeliver && porEntregar(fila.estado)
  const devolver = onReturn && tieneAfuera(fila)

  return (
    <li className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto_10.5rem_13rem] lg:items-center lg:gap-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-sena-text">{fila.elemento?.nombre ?? '—'}</p>
        <p className="mt-1 truncate text-xs text-sena-text-soft">
          {fila.elemento?.codigo ?? '—'}
          {existencia !== null && porEntregar(fila.estado) ? (
            <span className={cn('ml-2 tabular-nums', sinExistencia && 'font-semibold text-sena-warn-text')}>
              · {sinExistencia ? 'Sin existencia' : `En bodega: ${existencia}`}
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Cifra label="Pedido" value={fila.cantidad} />
        <Cifra label="Entregado" value={fila.cantidadEntregada} />
        <Cifra label="Pendiente" value={fila.cantidadPendiente} fuerte={fila.cantidadPendiente > 0} />
        {equipo ? <Cifra label="Afuera" value={fila.cantidadAfuera ?? 0} /> : null}
      </div>

      <div className="whitespace-nowrap lg:text-center">
        <StatusPill tone={requestTone(fila.estado)}>{requestLabel(fila.estado)}</StatusPill>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {entregar ? (
          <Button
            size="sm"
            variant="secondary"
            className="whitespace-nowrap"
            disabled={saving || sinExistencia}
            title={sinExistencia ? 'No hay existencia de este elemento' : undefined}
            onClick={onDeliver}
          >
            {fila.estado === 'parcial' ? 'Entregar lo pendiente' : 'Entregar'}
          </Button>
        ) : null}
        {devolver ? (
          <Button size="sm" variant="secondary" disabled={saving} onClick={onReturn}>
            Devolver
          </Button>
        ) : null}
      </div>
    </li>
  )
}
