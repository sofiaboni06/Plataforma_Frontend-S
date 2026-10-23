export type TipoNotificacion =
  | 'por_agotarse'
  | 'agotado'
  | 'solicitud_material'
  | 'solicitud_equipo'
  | 'entrega_material'
  | 'entrega_equipo'
  | 'devolucion_equipo'
  | 'solicitud_programa'
  | 'decision_solicitud_programa'

export type RecursoNotificacion =
  | 'alerta'
  | 'solicitud_material'
  | 'solicitud_equipo'
  | 'solicitud_programa'

export type LineaDetalleNotificacion = {
  producto: string
  cantidad?: number
  pedida?: number
  autorizada?: number
  queda?: number
  motivo?: string | null
}

export type DetalleNotificacion = {
  ficha?: string | null
  programa?: string | null
  observacion?: string | null
  entregados?: LineaDetalleNotificacion[]
  ajustados?: LineaDetalleNotificacion[]
  rechazados?: LineaDetalleNotificacion[]
  pendientes?: LineaDetalleNotificacion[]
}

export type NotificacionApi = {
  id: number
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  leida: boolean
  recurso: RecursoNotificacion | null
  idReferencia: number | null
  fecha: string | null
  detalle?: DetalleNotificacion | null
}
