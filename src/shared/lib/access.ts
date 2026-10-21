import {
  hasInventoryAccess,
  canOpenInventoryPath,
  canOpenSolicitudes,
  isInventoryDescendantPath,
} from '@/modules/inventario/navigation'
import { esPerfilInstructor } from '@/modules/materiales-formacion/lib/formacion'
import { canOpenFormacionPath, isFormacionPath } from '@/modules/materiales-formacion/navigation'

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
  return NAV_ICONS.includes(name as NavIconName)
    ? (name as NavIconName)
    : 'home'
}

const INVENTORY_ENTRY: AppModule = {
  id: 0,
  code: 'inventario',
  label: 'Inventario',
  description: 'Inventario del centro.',
  to: '/inventario',
  icon: 'inventory',
  parentId: null,
  order: 1,
}

/**
 * La sección de materiales de formación solo se anuncia a quien puede verla:
 * el Administrador de la plataforma recibe `material_formacion.*` del
 * catálogo; el resto necesita el permiso concedido en su perfil.
 */
function puedeVerMaterialesFormacion(isAdmin: boolean, permissions?: string[]) {
  return isAdmin || permissions?.includes('material_formacion.ver') === true
}

export function grantedModuleLinks(
  modules: AppModule[],
  isAdmin = false,
  permissions?: string[],
) {
  const seen = new Set<string>()

  const links = modules
    .filter((item) => item.to && item.parentId == null)
    .filter((item) => !isInventoryDescendantPath(item.to as string))
    .filter((item) => item.to !== '/materiales' || puedeVerMaterialesFormacion(isAdmin, permissions))
    .filter((item) => {
      const path = item.to as string

      if (seen.has(path)) {
        return false
      }

      seen.add(path)
      return true
    })

  if (
    (isAdmin || hasInventoryAccess(modules) || canOpenSolicitudes(isAdmin, permissions)) &&
    !links.some((item) => item.to === '/inventario')
  ) {
    links.push(INVENTORY_ENTRY)
  }

  return links.sort((left, right) => left.order - right.order)
}

export function canOpenPath(
  path: string,
  modules: AppModule[],
  isAdmin: boolean,
  permissions?: string[],
  role?: string,
) {
  if (path === '/inicio' || path === '/perfil') {
    return true
  }

  if (path === '/materiales-formacion') {
    return esPerfilInstructor(role)
  }

  if (isFormacionPath(path)) {
    return canOpenFormacionPath(path, { isAdmin, permissions })
  }

  if (
    isAdmin &&
    (path === '/usuarios' || path === '/perfiles' || path === '/programas-formacion')
  ) {
    return true
  }

  if (
    path === '/inventario' ||
    path.startsWith('/inventario/')
  ) {
    return canOpenInventoryPath(
      path,
      modules,
      {
        isAdmin,
        permissions,
      },
    )
  }

  if (path === '/materiales' || path.startsWith('/materiales/')) {
    return (
      modules.some((item) => item.to === '/materiales') &&
      puedeVerMaterialesFormacion(isAdmin, permissions)
    )
  }

  return modules.some((item) => item.to === path)
}