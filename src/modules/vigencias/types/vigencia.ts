export type VigenciaApi = {
  anio: number
  activa: boolean
  fechaApertura: string | null
  fechaCierre: string | null
}

export type CreateVigenciaPayload = {
  anio: number
  activa: boolean
  fecha_apertura: string
  fecha_cierre: string
}

export type UpdateVigenciaPayload = CreateVigenciaPayload

export type VigenciaEspecialPrograma = {
  id: number
  nombre: string | null
  codigo: string | null
}

export type VigenciaEspecialApi = {
  id: number
  anio: number
  nombre: string
  monto: number
  activa: boolean
  programas: VigenciaEspecialPrograma[]
}