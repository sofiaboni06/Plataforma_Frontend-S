import Button from '@/shared/components/ui/Button'
import type { SolicitudPendienteApi } from '@/modules/inventario/types/elemento'

/*
 * Entraron unidades de un elemento (stock nuevo o equipo devuelto en buen
 * estado) y hay solicitudes esperándolo. La entrega sigue siendo manual: el
 * botón lleva a Solicitudes > Entregar con ese elemento.
 */
export default function StockPendienteBanner({
  titulo,
  filas,
  onEntregar,
  onClose,
}: {
  titulo: string
  filas: SolicitudPendienteApi[]
  onEntregar: () => void
  onClose: () => void
}) {
  const total = filas.length
  const detalle = filas
    .slice(0, 3)
    .map(
      (fila) =>
        `${fila.codigoSolicitud} (${fila.solicitante}, ${fila.pendiente} ${fila.pendiente === 1 ? 'pendiente' : 'pendientes'})`,
    )
    .join(', ')

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sena-warn-line bg-sena-warn-soft px-5 py-4 text-sm text-sena-warn-text"
    >
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{titulo}</p>
        <p>
          Tienes {total === 1 ? '1 solicitud' : `${total} solicitudes`} por actualizar y entregar:{' '}
          {detalle}
          {total > 3 ? ` y ${total - 3} más` : ''}.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" onClick={onEntregar}>
          Ir a entregar
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  )
}
