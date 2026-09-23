import type { AppModule } from '@/shared/types/profile'
import type { NavIconName } from '@/shared/constants/navigation'

const NAV_ICONS: NavIconName[] = [
  'home',
  'inventory',
  'leaf',
  'calendar',
  'report',
  'user',
  'settings',
]

export function toNavIcon(name: string): NavIconName {
  return NAV_ICONS.includes(name as NavIconName) ? (name as NavIconName) : 'home'
}

export function grantedModuleLinks(modules: AppModule[]) {
  const seen = new Set<string>()

  return modules
    .filter((item) => item.to)
    .filter((item) => {
      const path = item.to as string

      if (seen.has(path)) return false

      seen.add(path)
      return true
    })
    .sort((left, right) => left.order - right.order)
}

const INVENTORY_CHILD_PATH_PREFIXES = [
  '/inventario/categorias',
  '/inventario/bodegas',
  '/inventario/elementos',
]

export function canOpenPath(
  path: string,
  modules: AppModule[],
  isAdmin: boolean,
) {
  if (path === '/inicio' || path === '/perfil') {
    return true
  }

  if (
    isAdmin &&
    (path === '/usuarios' || path === '/perfiles')
  ) {
    return true
  }

  if (modules.some((item) => item.to === path)) {
    return true
  }

  const isInventoryChildPath =
    INVENTORY_CHILD_PATH_PREFIXES.some(
      (prefix) =>
        path === prefix ||
        path.startsWith(`${prefix}/`),
    )

  if (isInventoryChildPath) {
    return modules.some((item) => item.to === '/inventario')
  }

  return false
}