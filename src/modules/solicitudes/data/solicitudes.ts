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

export function getSolicitudes(
  kind: SolicitudKind,
  estado?: 'pendiente' | 'entregado' | 'devuelto',
): Promise<SolicitudItemApi[]> {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : ''
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

export function entregarSolicitud(
  kind: SolicitudKind,
  id: number,
): Promise<SolicitudItemApi> {
  return api<SolicitudItemApi>(`${solicitudPath(kind)}/${id}/entregar`, {
    method: 'PATCH',
  })
}

export type DevolverSolicitudPayload = {
  estadoElemento: 'bueno' | 'danado' | 'perdido' | 'en_reparacion'
  observacion?: string
}

export function devolverSolicitud(
  id: number,
  payload: DevolverSolicitudPayload,
): Promise<SolicitudItemApi> {
  return api<SolicitudItemApi>(`/solicitudes-equipo/${id}/devolver`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
