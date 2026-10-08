export type CaracterElemento = 'consumo' | 'devolutivo'

export type ClasificacionElementoApi = {
  id: number
  nombre: string
  caracter: CaracterElemento
  estado: boolean
}

export type UsoPresupuestalApi = {
  id: number
  nombre: string
  estado: boolean
}

export type CodigoEstandarApi = {
  id: number
  codigo: string
  nombre: string
}

export type ElementoApi = {
  id: number
  idItem: number | null
  idSubcategoria: number
  idStand: number
  nombre: string
  cantidad: number
  gramaje: number | null
  idClasificacion: number | null
  /* Cómo se pide: devolutivo (equipo) o consumo (material). Null en elementos viejos sin tipo. */
  caracter: CaracterElemento | null
  /* `caracter` de la clasificación: solo la sugerencia al crear el elemento. */
  clasificacion: {
    id: number
    nombre: string
    caracter?: CaracterElemento
  } | null
  valorUnitarioPromedio: number | null
  porcentajeAumento: number | null
  valorConAumento: number | null
  estado: boolean
  idUnidadMedida: number
  codigo: string
  idCodigoEstandar: number | null
  codigoEstandar: CodigoEstandarApi | null
  idUsoPresupuestal?: number | null
  cantidadMinima?: number
  usoPresupuestal?: {
    id: number
    nombre: string
  } | null
  descripcion: string | null
  marca: string | null
  color: string | null
  urlFotografia: string | null
  item: {
    id: number
    nombre: string
    descripcion: string | null
    idSubcategoria: number
  } | null
  subcategoria: {
    id: number
    nombre: string
  } | null
  stand: {
    id: number
    nombre: string
    idSubBodega: number
    subBodega?: {
      id: number
      nombre: string
      idBodega: number
    } | null
  } | null
  unidadMedida: {
    id: number
    nombre: string
    abreviatura: string
  } | null
}

/* Solicitud que espera unidades del elemento al que bodega acaba de subirle stock. */
export type SolicitudPendienteApi = {
  tipo: 'material' | 'equipo'
  id: number
  codigoSolicitud: string
  solicitante: string
  estado: 'pendiente' | 'parcial'
  cantidad: number
  cantidadEntregada: number
  pendiente: number
}

/* Respuesta de editar un elemento: si la cantidad subió, las solicitudes que puede servir. */
export type ElementoGuardadoApi = ElementoApi & {
  solicitudesPendientes?: SolicitudPendienteApi[]
}

export type CreateElementoPayload = {
  /* Propio del elemento: es el que busca el instructor. No sale del ítem. */
  nombre: string
  idItem: number
  idStand: number
  cantidad: number
  estado: boolean
  idUnidadMedida: number
  codigo: string
  gramaje?: number | null
  descripcion?: string | null
  marca?: string | null
  color?: string | null
  idClasificacion: number
  caracter: CaracterElemento
  valorUnitarioPromedio?: number | null
  porcentajeAumento?: number | null
  idCodigoEstandar?: number | null
  idUsoPresupuestal?: number | null
  cantidadMinima?: number
}

export type UpdateElementoPayload = Partial<CreateElementoPayload>

export type UnidadMedidaApi = {
  id: number
  nombre: string
  abreviatura: string
  estado: boolean
}

export type CatalogoElementoKind = 'clasificacion' | 'unidad' | 'uso' | 'codigo'
