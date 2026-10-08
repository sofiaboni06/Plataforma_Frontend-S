export type SolicitudKind = 'equipo' | 'material'

export type SolicitudEstado = 'pendiente' | 'entregado' | 'devuelto'

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
}

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
  estado: SolicitudEstado
  estadoElemento: 'bueno' | 'danado' | 'perdido' | 'en_reparacion' | null
  observacion: string | null
  fechaEntrega: string | null
  fechaDevolucion: string | null
  usuarioEntrega: Persona | null
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
    entregadas: number
    devueltas: number
    cantidad: number
    cantidadEntregada: number
    cantidadPendiente: number
  }
  detalle: FacturaFilaApi[]
}

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
  elementos: {
    idElemento: number
    cantidad: number
    observacion?: string
  }[]
}

export type RegistrarEnBodegaPayload = CrearFacturaPayload & { numeroDocumento: string }
