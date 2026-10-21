export type ProgramaFormacion = {
  id: number
  idRedConocimiento: number
  idLineaTematica: number
  idNivelPrograma: number
  codigo: string
  nombre: string
  version: string
  duracionTotalHoras: number | null
  cupoBaseAprendices: number
  estado: boolean
  nivel: { id: number; nombre: string } | null
  redConocimiento: { id: number; nombre: string } | null
  lineaTematica: { id: number; nombre: string } | null
  centros: Array<{ id: number; nombre: string }>
}

export type ProgramaFormacionOptions = {
  niveles: Array<{ id: number; nombre: string }>
  redes: Array<{
    id: number
    nombre: string
    lineas: Array<{ id: number; nombre: string }>
  }>
  centros: Array<{ id: number; nombre: string; regional: string }>
}

export type RedConocimiento = {
  id: number
  nombre: string
  nombreGestor: string | null
  telGestor: string | null
  mailGestor: string | null
  nombreAsesor: string | null
  telAsesor: string | null
  mailAsesor: string | null
  estado: boolean
  lineaIds: number[]
  lineasTematicas: Array<{ id: number; nombre: string; estado: boolean }>
}

export type LineaTematica = {
  id: number
  nombre: string
  descripcion: string | null
  estado: boolean
  redes: Array<{ id: number; nombre: string }>
}
