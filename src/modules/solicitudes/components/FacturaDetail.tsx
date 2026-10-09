import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import { StatusPill } from '@/shared/components/ResourceBoard'
import PlazoPill from '@/modules/solicitudes/components/PlazoPill'

import {
  CARACTER_LABEL,
  FACTURA_LABEL,
  facturaTone,
  filasPorEntregar,
  formatDate,
  formatDay,
  formatFechaDia,
  personName,
  requestLabel,
  requestTone,
} from '@/modules/solicitudes/lib/presentacion'

import type { DevolucionApi, FacturaApi } from '@/modules/solicitudes/types'

const ESTADO_ELEMENTO_LABEL = {
  bueno: 'volvió bueno',
  danado: 'volvió dañado',
  perdido: 'se perdió',
  en_reparacion: 'en reparación',
} as const

const NOVEDAD_LABEL = {
  bueno: 'Bueno',
  danado: 'Dañado',
  perdido: 'Perdido',
  en_reparacion: 'En reparación',
} as const

/*
 * La factura completa: encabezado y la grilla con el estado de cada fila.
 * Entregar y devolver se siguen haciendo fila por fila en Equipo o Material.
 */
export default function FacturaDetail({
  factura,
  onClose,
}: {
  factura: FacturaApi
  onClose: () => void
}) {
  const { totales } = factura
  const porEntregar = filasPorEntregar(totales)

  return (
    <Modal
      title={`Solicitud ${factura.codigoSolicitud}`}
      description={factura.obra ? `Para ${factura.obra.nombre}` : undefined}
      onClose={onClose}
      wide
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={facturaTone(factura.estado)}>{FACTURA_LABEL[factura.estado]}</StatusPill>
            {factura.plazo ? (
              <PlazoPill plazo={factura.plazo} limite={factura.fechaDevolucionLimite} />
            ) : null}
          </div>
          <p className="text-sm text-sena-text-soft tabular-nums">
            {totales.lineas} {totales.lineas === 1 ? 'elemento' : 'elementos'}
            {porEntregar ? ` · ${porEntregar} por entregar` : ''}
          </p>
        </div>

        <dl className="grid gap-x-6 gap-y-4 rounded-2xl border border-sena-line bg-white/65 px-5 py-4 sm:grid-cols-2">
          <DetailField
            term="Obra"
            value={
              factura.obra
                ? `${factura.obra.nombre}${factura.obra.lugar ? ` — ${factura.obra.lugar}` : ''}`
                : '—'
            }
          />
          <DetailField term="Tipo" value={CARACTER_LABEL[factura.tipo]} />
          <DetailField term="Solicitante" value={personName(factura.usuario)} />
          <DetailField term="Ficha" value={factura.ficha || '—'} />
          <DetailField term="Fecha de solicitud" value={formatDate(factura.fecha)} />
          {factura.tipo === 'devolutivo' ? (
            <>
              <DetailField
                term="Inicio del préstamo"
                value={formatFechaDia(factura.fechaInicio) || '—'}
              />
              <DetailField
                term="Devolución propuesta"
                value={formatFechaDia(factura.fechaDevolucionPropuesta) || '—'}
              />
              <DetailField
                term="Fecha límite de devolución"
                value={formatFechaDia(factura.fechaDevolucionLimite) || 'Se confirma al entregar'}
              />
            </>
          ) : null}
          {factura.registradaEnBodega ? (
            <DetailField
              term="Registrada en el mostrador por"
              value={personName(factura.registradaPor)}
            />
          ) : null}
        </dl>

        <div className="overflow-x-auto rounded-2xl border border-sena-line bg-white/65">
          <table className="w-full min-w-[480px] table-fixed text-sm">
            <thead>
              <tr className="border-b border-sena-hairline bg-sena-muted/45 text-left text-xs font-semibold text-sena-text-soft">
                <th scope="col" className="w-[58%] px-4 py-2.5 font-semibold">
                  Elemento
                </th>
                <th scope="col" className="w-[14%] px-4 py-2.5 text-center font-semibold">
                  Cantidad
                </th>
                <th scope="col" className="w-[28%] px-4 py-2.5 text-center font-semibold">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sena-hairline">
              {factura.detalle.map((fila) => (
                <tr key={`${fila.tipo}-${fila.id}`} className="align-top">
                  <td className="px-4 py-3">
                    <p className="truncate font-semibold text-sena-text">
                      {fila.elemento?.nombre ?? '—'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-sena-text-soft">
                      {fila.elemento?.codigo ?? '—'}
                    </p>
                    {fila.observacion ? (
                      <p className="mt-1 text-xs leading-5 break-words text-sena-text-soft">
                        {fila.observacion}
                      </p>
                    ) : null}
                    {fila.devoluciones?.length ? (
                      <HistorialDevoluciones devoluciones={fila.devoluciones} />
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <p className="font-semibold text-sena-text">{fila.cantidad}</p>
                    {fila.estado === 'parcial' ? (
                      <p className="mt-0.5 text-[11px] text-sena-text-soft">
                        {fila.cantidadEntregada} entregados · {fila.cantidadPendiente} pendientes
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusPill tone={requestTone(fila.estado)}>{requestLabel(fila.estado)}</StatusPill>
                    <p className="mt-1 text-[11px] text-sena-text-soft">
                      {fila.estado === 'devuelto' && fila.estadoElemento
                        ? `${formatDay(fila.fechaDevolucion)} · ${ESTADO_ELEMENTO_LABEL[fila.estadoElemento]}`
                        : formatDay(fila.fechaEntrega)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/*
 * Lo que ha vuelto de una fila, unidad por unidad: "Unidad 1: Dañado — pantalla
 * rota". Un registro viejo con varias unidades sale como "Unidades 1–3".
 */
function HistorialDevoluciones({ devoluciones }: { devoluciones: DevolucionApi[] }) {
  // Dónde empieza cada registro: la suma de las unidades anteriores, más uno.
  const desdes = devoluciones.reduce<number[]>(
    (lista, _devolucion, i) => [...lista, i === 0 ? 1 : lista[i - 1] + devoluciones[i - 1].cantidad],
    [],
  )

  return (
    <div className="mt-2 rounded-xl bg-sena-muted/45 px-3 py-2">
      <p className="text-[11px] font-semibold text-sena-text-soft">Devoluciones</p>
      <ul className="mt-1 space-y-0.5 text-xs leading-5 text-sena-text">
        {devoluciones.map((devolucion, i) => {
          const desde = desdes[i]
          const unidades =
            devolucion.cantidad === 1
              ? `Unidad ${desde}`
              : `Unidades ${desde}–${desde + devolucion.cantidad - 1}`

          return (
            <li key={devolucion.id} className="break-words">
              <span className="font-semibold">{unidades}:</span>{' '}
              <span
                className={
                  devolucion.estadoElemento === 'bueno' ? 'text-sena-ok-text' : 'text-sena-warn-text'
                }
              >
                {NOVEDAD_LABEL[devolucion.estadoElemento]}
              </span>
              {devolucion.observacion ? ` — ${devolucion.observacion}` : ''}
              {devolucion.fecha ? (
                <span className="text-sena-text-soft"> · {formatDay(devolucion.fecha)}</span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DetailField({ term, value }: { term: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-sena-text-soft">{term}</dt>
      <dd className="mt-0.5 text-sm font-semibold break-words text-sena-text">{value}</dd>
    </div>
  )
}
