import type { AppModule } from '../types/profile'
import type { NavIconName } from '../constants/navigation'

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

export function canOpenPath(path: string, modules: AppModule[], isAdmin: boolean) {
  if (path === '/inicio' || path === '/perfil') return true
  if (isAdmin && (path === '/usuarios' || path === '/perfiles')) return true
  return modules.some((item) => item.to === path)
}
