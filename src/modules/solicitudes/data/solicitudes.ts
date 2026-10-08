import { api } from '@/shared/lib/api'
import type { ElementoApi } from '@/modules/inventario/types/elemento'
import type {
  CrearFacturaPayload,
  CrearSolicitudPayload,
  FacturaApi,
  FacturaEstado,
  ObraApi,
  RegistrarEnBodegaPayload,
  SolicitanteApi,
  SolicitudEstado,
  SolicitudDevueltaApi,
  SolicitudItemApi,
  SolicitudKind,
} from '@/modules/solicitudes/types'

export function getObras(): Promise<ObraApi[]> {
  return api<ObraApi[]>('/obras')
}

export function getElementos(): Promise<ElementoApi[]> {
  return api<ElementoApi[]>('/inventario/elementos')
}

function solicitudPath(kind: SolicitudKind) {
  return kind === 'equipo' ? '/solicitudes-equipo' : '/solicitudes-material'
}

/* Varios estados viajan separados por coma: `pendiente,parcial`. */
export function getSolicitudes(
  kind: SolicitudKind,
  estado?: SolicitudEstado | SolicitudEstado[],
): Promise<SolicitudItemApi[]> {
  const estados = Array.isArray(estado) ? estado.join(',') : estado
  const query = estados ? `?estado=${encodeURIComponent(estados)}` : ''
  return api<SolicitudItemApi[]>(`${solicitudPath(kind)}${query}`)
}

export function createSolicitud(
  kind: SolicitudKind,
  payload: CrearSolicitudPayload,
): Promise<SolicitudItemApi> {
  return api<SolicitudItemApi>(solicitudPath(kind), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getFacturas(estado?: FacturaEstado): Promise<FacturaApi[]> {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : ''
  return api<FacturaApi[]>(`/solicitudes${query}`)
}

export function getFactura(codigoSolicitud: string): Promise<FacturaApi> {
  return api<FacturaApi>(`/solicitudes/${encodeURIComponent(codigoSolicitud)}`)
}

export function createFactura(payload: CrearFacturaPayload): Promise<FacturaApi> {
  return api<FacturaApi>('/solicitudes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getSolicitante(numeroDocumento: string): Promise<SolicitanteApi> {
  return api<SolicitanteApi>(`/solicitudes/solicitantes/${encodeURIComponent(numeroDocumento)}`)
}

/* Bodega registra a nombre de quien está en el mostrador y entrega lo que hay. */
export function registrarEnBodega(payload: RegistrarEnBodegaPayload): Promise<FacturaApi> {
  return api<FacturaApi>('/solicitudes/bodega', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/* Equipo: bodega puede confirmar o ajustar el plazo de devolución al entregar. */
export function entregarSolicitud(
  kind: SolicitudKind,
  id: number,
  opciones: { fechaDevolucionLimite?: string } = {},
): Promise<SolicitudItemApi> {
  return api<SolicitudItemApi>(`${solicitudPath(kind)}/${id}/entregar`, {
    method: 'PATCH',
    body: JSON.stringify(opciones),
  })
}

/*
 * "Entregar todo lo disponible" de una solicitud: sale lo que haya en el
 * estante de cada elemento pendiente; lo que no tenga existencia sigue
 * pendiente. Al instructor le llega un solo aviso.
 */
export function entregarFactura(
  codigoSolicitud: string,
  opciones: { fechaDevolucionLimite?: string } = {},
): Promise<FacturaApi> {
  return api<FacturaApi>(`/solicitudes/${encodeURIComponent(codigoSolicitud)}/entregar`, {
    method: 'PATCH',
    body: JSON.stringify(opciones),
  })
}

/*
 * Entregas y devoluciones de bodega: pedidos de equipo que ya salieron.
 * `afuera` (algo sin devolver), `vencidos` (vence hoy o ya venció),
 * `devueltos` o `todos`.
 */
export type VistaPrestamos = 'afuera' | 'vencidos' | 'devueltos' | 'todos'

export function getPrestamos(vista: VistaPrestamos = 'afuera'): Promise<FacturaApi[]> {
  return api<FacturaApi[]>(`/solicitudes/prestamos?vista=${vista}`)
}

/* Bodega corre el plazo de devolución de un pedido con equipo afuera. */
export function ajustarPlazo(
  codigoSolicitud: string,
  fechaDevolucionLimite: string,
): Promise<FacturaApi> {
  return api<FacturaApi>(`/solicitudes/${encodeURIComponent(codigoSolicitud)}/plazo`, {
    method: 'PATCH',
    body: JSON.stringify({ fechaDevolucionLimite }),
  })
}

/* Equipo con unidades afuera, `entregado` o `parcial`: lo que bodega puede recibir. */
export function getEquiposAfuera(): Promise<SolicitudItemApi[]> {
  return api<SolicitudItemApi[]>('/solicitudes-equipo?afuera=true')
}

export type EstadoDevolucion = 'bueno' | 'danado' | 'perdido' | 'en_reparacion'

/* `detalle` reparte lo que vuelve por estado: 2 bueno, 1 dañado. */
export type DevolverSolicitudPayload = {
  detalle: { estadoElemento: EstadoDevolucion; cantidad: number }[]
  observacion?: string
}

export function devolverSolicitud(
  id: number,
  payload: DevolverSolicitudPayload,
): Promise<SolicitudDevueltaApi> {
  return api<SolicitudDevueltaApi>(`/solicitudes-equipo/${id}/devolver`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
