export type TipoNotificacion =
  | 'por_agotarse'
  | 'agotado'
  | 'solicitud_material'
  | 'solicitud_equipo'
  | 'entrega_material'
  | 'entrega_equipo'
  | 'devolucion_equipo'

export type RecursoNotificacion = 'alerta' | 'solicitud_material' | 'solicitud_equipo'

export type NotificacionApi = {
  id: number
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  leida: boolean
  recurso: RecursoNotificacion | null
  idReferencia: number | null
  fecha: string | null
}
