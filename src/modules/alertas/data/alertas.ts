import { listAll } from '@/shared/lib/api'
import type { AlertaApi } from '@/modules/alertas/types'

export async function getAllAlertas() {
  const [activas, cerradas] = await Promise.all([
    listAll<AlertaApi>('/inventario/alertas', { estado: 'true' }),
    listAll<AlertaApi>('/inventario/alertas', { estado: 'false' }),
  ])
  return [...activas, ...cerradas].sort(
    (left, right) => new Date(right.fecha ?? 0).getTime() - new Date(left.fecha ?? 0).getTime(),
  )
}
