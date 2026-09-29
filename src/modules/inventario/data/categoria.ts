import { api } from '@/shared/lib/api'
import type { CategoryApi, SubcategoryApi } from '@/shared/types/category'

export type SubcategoriaPayload = {
  idCategoria: number
  nombre: string
  estado?: boolean
}

export async function getAllCategorias() {
  const [active, inactive] = await Promise.all([
    api<CategoryApi[]>('/categorias'),
    api<CategoryApi[]>('/categorias?estado=false'),
  ])
  const map = new Map<number, CategoryApi>()
  for (const item of [...active, ...inactive]) map.set(item.id, item)
  return [...map.values()].sort((left, right) => right.id - left.id)
}

export function disableCategoria(id: string | number) {
  return api<{ message: string }>(`/categorias/${id}`, { method: 'DELETE' })
}

export function getSubcategorias() {
  return api<SubcategoryApi[]>('/subcategorias')
}

export function createSubcategoria(payload: SubcategoriaPayload) {
  return api<SubcategoryApi>('/subcategorias', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSubcategoria(id: string | number, payload: Partial<SubcategoriaPayload>) {
  return api<SubcategoryApi>(`/subcategorias/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
