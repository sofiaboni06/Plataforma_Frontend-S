import { api } from '@/shared/lib/api'

export type SolicitudPrograma = {
  id: number
  programaId: number
  fichaId: number
  vigencia: number
  estado: 'borrador' | 'enviada' | 'aprobada' | 'parcial' | 'rechazada' | 'anulada'
  observacion: string | null
  observacionDecision: string | null
  instructor: { id: number; nombres: string; apellidos: string } | null
  programa: {
    id: number
    codigo: string
    nombre: string
    redConocimiento?: { id: number; nombre: string } | null
    lineaTematica?: { id: number; nombre: string } | null
  } | null
  ficha: { id: number; numeroFicha: string } | null
  items: Array<{
    id: number
    listaMaestraId: number
    cantidadSolicitada: number
    cantidadAprobada: number | null
    cantidadMaestraReferencia: number | null
    estado: string
    observacionCoordinador: string | null
    material: {
      id: number
      codigoUnspsc: string
      producto: string
      unidadMedida: string | null
      cantidadBase: number
    } | null
  }>
}

export function getSolicitudesPrograma() {
  return api<SolicitudPrograma[]>('/solicitudes-programa')
}

export function createSolicitudPrograma(payload: {
  programaId: number
  fichaId: number
  observacion?: string
  items: Array<{ listaMaestraId: number; cantidadSolicitada: number }>
}) {
  return api<SolicitudPrograma>('/solicitudes-programa', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function enviarSolicitudPrograma(id: number) {
  return api<SolicitudPrograma>(`/solicitudes-programa/${id}/enviar`, { method: 'POST' })
}

export function decidirSolicitudPrograma(
  id: number,
  payload: {
    observacionDecision?: string
    items: Array<{
      id: number
      accion: 'entregar' | 'pendiente' | 'rechazar'
      cantidadAprobada?: number
      observacionCoordinador?: string
    }>
  },
) {
  return api<SolicitudPrograma>(`/solicitudes-programa/${id}/decidir`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type ConsolidadoCompra = {
  codigoUnspsc: string
  producto: string
  unidadMedida: string | null
  caracter: string | null
  codigoPrograma: string
  nombrePrograma: string
  cantidadAprobada: number
}

export function getConsolidadoCompras(vigencia: number) {
  return api<ConsolidadoCompra[]>(`/procesos-compra/consolidado?vigencia=${vigencia}`)
}

export function generarProcesoCompra(payload: {
  vigencia: number
  codigoProceso: string
  descripcion?: string
}) {
  return api<{ id: number; codigoProceso: string; items: ConsolidadoCompra[] }>(
    '/procesos-compra',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}
