import type { BodegaApi } from '@/modules/inventario/types/bodega'
import type { ElementoApi } from '@/modules/inventario/types/elemento'

export function lugarDelElemento(elemento: ElementoApi, bodegas: BodegaApi[]) {
  const anidada = elemento.stand?.subBodega
  if (anidada) {
    const bodega = bodegas.find((item) => item.id === anidada.idBodega)
    return {
      bodegaId: anidada.idBodega,
      bodega: bodega?.nombre ?? '—',
      subBodegaId: anidada.id,
      subBodega: anidada.nombre,
      stand: elemento.stand?.nombre ?? '—',
    }
  }

  for (const bodega of bodegas) {
    for (const subBodega of bodega.subBodegas ?? []) {
      const stand = subBodega.stands?.find((item) => item.id === elemento.idStand)
      if (stand) {
        return {
          bodegaId: bodega.id,
          bodega: bodega.nombre,
          subBodegaId: subBodega.id,
          subBodega: subBodega.nombre,
          stand: stand.nombre,
        }
      }
    }
  }

  return {
    bodegaId: 0,
    bodega: '—',
    subBodegaId: 0,
    subBodega: '—',
    stand: elemento.stand?.nombre ?? '—',
  }
}

export function formatCantidad(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value)
}
