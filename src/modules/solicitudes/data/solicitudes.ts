import { api } from '@/shared/lib/api'
import type { ElementoApi } from '@/modules/inventario/types/elemento'
import type {
  CrearSolicitudPayload,
  ObraApi,
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

export function entregarSolicitud(
  kind: SolicitudKind,
  id: number,
): Promise<SolicitudItemApi> {
  return api<SolicitudItemApi>(`${solicitudPath(kind)}/${id}/entregar`, {
    method: 'PATCH',
  })
}
