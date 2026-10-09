import type { SolicitudPendienteApi } from '@/modules/inventario/types/elemento'

export type SolicitudKind = 'equipo' | 'material'

/* `parcial`: ya salió una parte y lo demás sigue pendiente de entrega. */
export type SolicitudEstado = 'pendiente' | 'parcial' | 'entregado' | 'devuelto'

/* `cantidad` es la existencia en bodega: solo llega a quien entrega. */
type ElementoFilaApi = {
  id: number
  nombre: string
  codigo: string
  cantidad?: number
}

export type ObraApi = {
  id: number
  idCformacion: number
  nombre: string
  lugar: string | null
  estado: boolean
}

export type SolicitudItemApi = {
  id: number
  codigoSolicitud: string
  idObra: number
  idElemento: number
  idUsuario: number
  idUsuarioEntrega: number | null
  cantidad: number
  cantidadEntregada: number
  cantidadPendiente: number
  /* Solo equipo: lo devuelto y lo que sigue afuera. En material llega null. */
  cantidadDevuelta?: number | null
  cantidadAfuera?: number | null
  ficha: string | null
  estado: SolicitudEstado
  estadoElemento?: 'bueno' | 'danado' | 'perdido' | 'en_reparacion' | null
  fecha: string
  fechaEntrega: string | null
  fechaDevolucion?: string | null
  observacion: string | null
  obra: {
    id: number
    nombre: string
    lugar: string | null
  } | null
  elemento: ElementoFilaApi | null
  usuario?: {
    id: number
    nombres: string
    apellidos: string
    email: string
  } | null
  usuarioEntrega?: {
    id: number
    nombres: string
    apellidos: string
    email: string
  } | null
} & FechasSolicitud

export type CrearSolicitudPayload = {
  codigoSolicitud: string
  idObra: number
  idElemento: number
  cantidad: number
  ficha?: string
  observacion?: string
}

type Persona = {
  id: number
  nombres: string
  apellidos: string
  email: string
}

/*
 * Una solicitud con varios elementos. No es otra tabla: son las filas de
 * equipo y material que comparten el código.
 */
export type FacturaEstado = 'pendiente' | 'parcial' | 'entregado' | 'cerrado'

export type FacturaFilaApi = {
  id: number
  tipo: SolicitudKind
  idElemento: number
  elemento: ElementoFilaApi | null
  cantidad: number
  cantidadEntregada: number
  cantidadPendiente: number
  /* Solo equipo: lo devuelto y lo que sigue afuera. En material llega null. */
  cantidadDevuelta?: number | null
  cantidadAfuera?: number | null
  estado: SolicitudEstado
  estadoElemento: 'bueno' | 'danado' | 'perdido' | 'en_reparacion' | null
  observacion: string | null
  fechaEntrega: string | null
  fechaDevolucion: string | null
  usuarioEntrega: Persona | null
  /* Solo equipo: lo que ha vuelto, en orden. Cada unidad trae su novedad. */
  devoluciones?: DevolucionApi[]
} & FechasSolicitud

/*
 * Un registro de devolución. Desde la devolución por unidad, cada fila es una
 * unidad (cantidad 1) con su novedad y su observación; las de antes pueden
 * agrupar varias unidades con el mismo estado.
 */
export type DevolucionApi = {
  id: number
  cantidad: number
  estadoElemento: 'bueno' | 'danado' | 'perdido' | 'en_reparacion'
  fecha: string | null
  observacion: string | null
  recibidoPor: Persona | null
}

/*
 * Cómo va el plazo de devolución de lo que sigue afuera (solo equipo).
 * null: no hay nada afuera.
 */
export type EstadoPlazo = 'sin_fecha' | 'al_dia' | 'vence_hoy' | 'vencido'

/*
 * Días de calendario `YYYY-MM-DD`, solo del equipo devolutivo: inicio del
 * préstamo, devolución que propuso el instructor y fecha límite que confirmó
 * bodega. El consumo se entrega y ya: siempre llegan en null.
 */
export type FechasSolicitud = {
  fechaInicio?: string | null
  fechaDevolucionPropuesta?: string | null
  fechaDevolucionLimite?: string | null
  plazo?: EstadoPlazo | null
}

/* Una solicitud es toda de consumo o toda devolutiva. */
export type FacturaTipo = 'consumo' | 'devolutivo'

export type FacturaApi = {
  codigoSolicitud: string
  tipo: FacturaTipo
  estado: FacturaEstado
  fecha: string | null
  ficha: string | null
  idObra: number
  obra: {
    id: number
    nombre: string
    lugar: string | null
  } | null
  idUsuario: number
  usuario: Persona | null
  registradaEnBodega: boolean
  registradaPor: Persona | null
  totales: {
    lineas: number
    pendientes: number
    parciales: number
    entregadas: number
    devueltas: number
    cantidad: number
    cantidadEntregada: number
    cantidadPendiente: number
    cantidadAfuera: number
  }
  detalle: FacturaFilaApi[]
} & FechasSolicitud

/* La persona que bodega atiende en el mostrador, buscada por documento. */
export type SolicitanteApi = {
  id: number
  nombres: string
  apellidos: string
  tipoDocumento: string | null
  numeroDocumento: string
  email: string
  activo: boolean
  puedeConsumo: boolean
  puedeDevolutivo: boolean
}

export type CrearFacturaPayload = {
  codigoSolicitud: string
  idObra: number
  tipo: FacturaTipo
  ficha?: string
  observacion?: string
  /* Solo devolutivo: el consumo no lleva fechas. */
  fechaInicio?: string
  fechaDevolucionPropuesta?: string
  elementos: {
    idElemento: number
    cantidad: number
    observacion?: string
  }[]
}

export type RegistrarEnBodegaPayload = CrearFacturaPayload & { numeroDocumento: string }

/* Respuesta de devolver: si volvió equipo bueno, las solicitudes que puede servir. */
export type SolicitudDevueltaApi = SolicitudItemApi & {
  solicitudesPendientes?: SolicitudPendienteApi[]
}
