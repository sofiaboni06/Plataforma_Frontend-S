import type { ElementoApi } from '@/modules/inventario/types/elemento'
import type { FacturaApi, FacturaEstado } from '@/modules/solicitudes/types'

/* Un punto de una gráfica del tablero. `color` es opcional: si falta se usa la paleta --chart-1..5. */
export type Punto = {
  nombre: string
  valor: number
  color?: string
}

const ESTADO_DEVOLUCION: Array<{ key: string; nombre: string; color: string }> = [
  { key: 'bueno', nombre: 'Bueno', color: 'var(--chart-1)' },
  { key: 'danado', nombre: 'Dañado', color: 'var(--chart-2)' },
  { key: 'perdido', nombre: 'Perdido', color: 'var(--chart-4)' },
  { key: 'en_reparacion', nombre: 'En reparación', color: 'var(--chart-3)' },
  { key: 'afuera', nombre: 'Sigue afuera', color: 'var(--chart-5)' },
]

/*
 * Cada devolución es una unidad (las viejas pueden agrupar varias: se suma
 * `cantidad`). "Sigue afuera" es lo entregado que no ha vuelto.
 */
export function devueltosPorEstado(facturas: FacturaApi[]): Punto[] {
  const totales: Record<string, number> = {}

  for (const factura of facturas) {
    for (const fila of factura.detalle) {
      if (fila.tipo !== 'equipo') continue
      for (const devolucion of fila.devoluciones ?? []) {
        totales[devolucion.estadoElemento] = (totales[devolucion.estadoElemento] ?? 0) + (devolucion.cantidad || 1)
      }
      const afuera = fila.cantidadAfuera ?? Math.max(0, fila.cantidadEntregada - (fila.cantidadDevuelta ?? 0))
      if (afuera > 0) totales.afuera = (totales.afuera ?? 0) + afuera
    }
  }

  return ESTADO_DEVOLUCION.map((estado) => ({
    nombre: estado.nombre,
    valor: totales[estado.key] ?? 0,
    color: estado.color,
  }))
}

function nombreFila(fila: FacturaApi['detalle'][number]) {
  return fila.elemento?.nombre ?? `Elemento ${fila.idElemento}`
}

/* Unidades pedidas por elemento, sumando equipo y material. */
export function masPedidos(facturas: FacturaApi[], top: number): Punto[] {
  const totales = new Map<string, number>()
  for (const factura of facturas) {
    for (const fila of factura.detalle) {
      const nombre = nombreFila(fila)
      totales.set(nombre, (totales.get(nombre) ?? 0) + fila.cantidad)
    }
  }
  return ordenar(totales, top)
}

export const VENTANA_ROTACION_DIAS = 30

function fechaDe(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? null : date
}

/*
 * "Los que más rápido se van": unidades entregadas por día en los últimos
 * 30 días (rotación). Se toma la fecha de entrega de cada línea.
 */
export function masRapidos(facturas: FacturaApi[], top: number): Punto[] {
  const desde = Date.now() - VENTANA_ROTACION_DIAS * 24 * 60 * 60 * 1000
  const totales = new Map<string, number>()
  for (const factura of facturas) {
    for (const fila of factura.detalle) {
      const fecha = fechaDe(fila.fechaEntrega)
      if (!fecha || fecha.getTime() < desde || fila.cantidadEntregada <= 0) continue
      const nombre = nombreFila(fila)
      totales.set(nombre, (totales.get(nombre) ?? 0) + fila.cantidadEntregada)
    }
  }
  return ordenar(totales, top).map((punto) => ({
    ...punto,
    valor: Math.round((punto.valor / VENTANA_ROTACION_DIAS) * 100) / 100,
  }))
}

function ordenar(totales: Map<string, number>, top: number): Punto[] {
  return [...totales.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([nombre, valor]) => ({ nombre, valor }))
}

const ESTADO_SOLICITUD: Array<{ key: FacturaEstado; nombre: string; color: string }> = [
  { key: 'pendiente', nombre: 'Pendiente', color: 'var(--chart-2)' },
  { key: 'parcial', nombre: 'Parcial', color: 'var(--chart-3)' },
  { key: 'entregado', nombre: 'Entregado', color: 'var(--chart-1)' },
  { key: 'cerrado', nombre: 'Cerrado', color: 'var(--chart-5)' },
]

export function solicitudesPorEstado(facturas: FacturaApi[]): Punto[] {
  return ESTADO_SOLICITUD.map((estado) => ({
    nombre: estado.nombre,
    valor: facturas.filter((factura) => factura.estado === estado.key).length,
    color: estado.color,
  }))
}

const mesLabel = new Intl.DateTimeFormat('es-CO', { month: 'short', year: '2-digit' })

/* Unidades entregadas por mes, últimos 12 meses (por la fecha de entrega de cada línea). */
export function entregasPorMes(facturas: FacturaApi[]): Punto[] {
  const hoy = new Date()
  const meses: Array<{ key: string; nombre: string }> = []
  for (let i = 11; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    meses.push({ key: `${fecha.getFullYear()}-${fecha.getMonth()}`, nombre: mesLabel.format(fecha) })
  }
  const totales = new Map<string, number>()
  for (const factura of facturas) {
    for (const fila of factura.detalle) {
      const fecha = fechaDe(fila.fechaEntrega)
      if (!fecha || fila.cantidadEntregada <= 0) continue
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}`
      totales.set(key, (totales.get(key) ?? 0) + fila.cantidadEntregada)
    }
  }
  return meses.map((mes) => ({ nombre: mes.nombre, valor: totales.get(mes.key) ?? 0 }))
}

/* Elementos por tipo: el `caracter` del elemento; si falta, el de su clasificación. */
export function consumoVsDevolutivo(elementos: ElementoApi[]): Punto[] {
  let consumo = 0
  let devolutivo = 0
  let sinTipo = 0
  for (const elemento of elementos) {
    const caracter = elemento.caracter ?? elemento.clasificacion?.caracter ?? null
    if (caracter === 'consumo') consumo++
    else if (caracter === 'devolutivo') devolutivo++
    else sinTipo++
  }
  const puntos: Punto[] = [
    { nombre: 'Consumo', valor: consumo, color: 'var(--chart-2)' },
    { nombre: 'Devolutivo', valor: devolutivo, color: 'var(--chart-1)' },
  ]
  if (sinTipo > 0) puntos.push({ nombre: 'Sin tipo', valor: sinTipo, color: 'var(--chart-5)' })
  return puntos
}

function hoyIso() {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${mm}-${dd}`
}

/*
 * Unidades de equipo que siguen afuera según su plazo. Usa `plazo` del API y,
 * si no llega, lo calcula con la fecha límite de devolución.
 */
export function prestamosPorPlazo(facturas: FacturaApi[]): Punto[] {
  const dia = hoyIso()
  const totales = { vencido: 0, vence_hoy: 0, al_dia: 0, sin_fecha: 0 }
  for (const factura of facturas) {
    for (const fila of factura.detalle) {
      if (fila.tipo !== 'equipo') continue
      const afuera = fila.cantidadAfuera ?? Math.max(0, fila.cantidadEntregada - (fila.cantidadDevuelta ?? 0))
      if (afuera <= 0) continue
      const limite = (fila.fechaDevolucionLimite ?? factura.fechaDevolucionLimite ?? '').slice(0, 10)
      const plazo =
        fila.plazo ??
        (!limite ? 'sin_fecha' : limite < dia ? 'vencido' : limite === dia ? 'vence_hoy' : 'al_dia')
      totales[plazo] += afuera
    }
  }
  return [
    { nombre: 'Vencido', valor: totales.vencido, color: 'var(--chart-4)' },
    { nombre: 'Vence hoy', valor: totales.vence_hoy, color: 'var(--chart-2)' },
    { nombre: 'Al día', valor: totales.al_dia, color: 'var(--chart-1)' },
    { nombre: 'Sin fecha límite', valor: totales.sin_fecha, color: 'var(--chart-5)' },
  ]
}

/* Elementos activos con cantidad mínima: agotados, por agotarse (≤ mínima) y con stock. */
export function stockBajo(elementos: ElementoApi[]): { resumen: Punto[]; criticos: ElementoApi[] } {
  const conMinimo = elementos.filter((elemento) => elemento.estado !== false && (elemento.cantidadMinima ?? 0) > 0)
  const agotados = conMinimo.filter((elemento) => elemento.cantidad <= 0)
  const porAgotarse = conMinimo.filter(
    (elemento) => elemento.cantidad > 0 && elemento.cantidad <= (elemento.cantidadMinima ?? 0),
  )
  const criticos = [...agotados, ...porAgotarse]
    .sort((a, b) => a.cantidad / (a.cantidadMinima || 1) - b.cantidad / (b.cantidadMinima || 1))
  return {
    resumen: [
      { nombre: 'Agotado', valor: agotados.length, color: 'var(--chart-4)' },
      { nombre: 'Por agotarse', valor: porAgotarse.length, color: 'var(--chart-2)' },
      { nombre: 'Con stock', valor: conMinimo.length - agotados.length - porAgotarse.length, color: 'var(--chart-1)' },
    ],
    criticos,
  }
}

/*
 * Admin bodega y Almacenista son perfiles distintos. Se reconoce Admin bodega
 * por su nombre de perfil o, si no llega, por sus permisos: gestiona la
 * bodega (bodega.editar) y recibe devoluciones, sin ser administrador.
 */
export function esAdminBodega(access: { isAdmin?: boolean; permissions?: string[]; role?: string }) {
  if (access.isAdmin) return false
  if (access.role) {
    const role = access.role.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
    if (role === 'admin bodega') return true
    if (role.includes('almacenista')) return false
  }
  const permissions = access.permissions ?? []
  return permissions.includes('bodega.editar') && permissions.includes('solicitud_equipo.devolver')
}

export const VENTANA_SOLICITUDES_DIAS = 30

const diaLabel = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' })

function claveDia(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export type PuntoDiario = { label: string; solicitudes: number; entregas: number }

/*
 * Últimos 30 días: solicitudes creadas (fecha de la solicitud) y unidades
 * entregadas (fecha de entrega de cada línea). Días sin datos en 0.
 */
export function solicitudesVsEntregasPorDia(facturas: FacturaApi[]): PuntoDiario[] {
  const hoy = new Date()
  const dias: PuntoDiario[] = []
  const indice = new Map<string, PuntoDiario>()
  for (let i = VENTANA_SOLICITUDES_DIAS - 1; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i)
    const punto = { label: diaLabel.format(fecha), solicitudes: 0, entregas: 0 }
    dias.push(punto)
    indice.set(claveDia(fecha), punto)
  }
  for (const factura of facturas) {
    const creada = fechaDe(factura.fecha)
    const dia = creada ? indice.get(claveDia(creada)) : undefined
    if (dia) dia.solicitudes += 1
    for (const fila of factura.detalle) {
      const entrega = fechaDe(fila.fechaEntrega)
      const diaEntrega = entrega ? indice.get(claveDia(entrega)) : undefined
      if (diaEntrega && fila.cantidadEntregada > 0) diaEntrega.entregas += fila.cantidadEntregada
    }
  }
  return dias
}
