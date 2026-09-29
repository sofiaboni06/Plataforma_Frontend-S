import type { BodegaApi } from '@/modules/inventario/types/bodega'

export function centerIdFromBodega(
  bodega: { idCformacion?: number; centroFormacion?: { id: number } | null } | null | undefined,
  fallback?: { isAdmin: boolean; trainingCenterId?: number | null },
) {
  if (!bodega) return null
  const fromBodega = bodega.idCformacion ?? bodega.centroFormacion?.id ?? null
  if (fromBodega) return fromBodega
  if (fallback && !fallback.isAdmin && fallback.trainingCenterId) return fallback.trainingCenterId
  return null
}
import type { ElementoApi } from '@/modules/inventario/types/elemento'
import type { ItemApi } from '@/modules/inventario/types/item'
import type { CategoryApi, SubcategoryApi } from '@/shared/types/category'

export function categoriesOfCenter(rows: CategoryApi[], centerId: number | null) {
  if (!centerId) return rows
  return rows.filter((row) => row.idCformacion === centerId)
}

export function subcategoriesOfCenter(
  rows: SubcategoryApi[],
  categories: CategoryApi[],
  centerId: number | null,
) {
  if (!centerId) return rows
  const ids = new Set(categoriesOfCenter(categories, centerId).map((row) => row.id))
  return rows.filter((row) => ids.has(row.idCategoria))
}

export function itemsOfCenter(rows: ItemApi[], categories: CategoryApi[], centerId: number | null) {
  if (!centerId) return rows
  const ids = new Set(categoriesOfCenter(categories, centerId).map((row) => row.id))
  return rows.filter((row) => ids.has(row.subcategoria?.idCategoria ?? -1))
}

export function elementosOfBodegas(rows: ElementoApi[], bodegas: BodegaApi[], centerId: number | null) {
  if (!centerId) return rows

  const standIds = new Set<number>()
  const bodegaIds = new Set(bodegas.map((bodega) => bodega.id))

  for (const bodega of bodegas) {
    for (const sub of bodega.subBodegas ?? []) {
      for (const stand of sub.stands ?? []) standIds.add(stand.id)
    }
  }

  return rows.filter(
    (row) =>
      standIds.has(row.idStand) ||
      (row.stand?.subBodega?.idBodega != null && bodegaIds.has(row.stand.subBodega.idBodega)),
  )
}
