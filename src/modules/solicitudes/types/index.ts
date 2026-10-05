export type SolicitudKind = 'equipo' | 'material'

export type SolicitudEstado = 'pendiente' | 'entregado' | 'devuelto'

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
  elemento: {
    id: number
    nombre: string
    codigo: string
    cantidad: number
  } | null
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
