import type { AppModule } from '@/shared/types/profile'

export type InventoryScreenCode =
  | 'categorias'
  | 'items'
  | 'elementos'
  | 'clasificaciones'
  | 'bodegas'
  | 'stands'

export type InventoryCaller = {
  isAdmin?: boolean
  permissions?: string[]
}

export type InventoryAction = 'list' | 'create' | 'view' | 'edit'

type GrantKind = 'screen' | InventoryAction

type InventoryGrant = {
  screen: InventoryScreenCode
  kind: GrantKind
}

export type InventoryScreen = {
  code: InventoryScreenCode
  label: string
  description: string
  to: string
}

export const INVENTORY_SCREENS: InventoryScreen[] = [
  {
    code: 'categorias',
    label: 'Categorías',
    description: 'Clasificación del producto. La subcategoría cuelga de la categoría.',
    to: '/inventario/categorias',
  },
  {
    code: 'items',
    label: 'Ítems',
    description: 'Ficha del producto: nombre, categoría y descripción.',
    to: '/inventario/items',
  },
  {
    code: 'elementos',
    label: 'Elementos',
    description: 'Stock de un ítem: cantidad, ubicación y valor.',
    to: '/inventario/elementos',
  },
  {
    code: 'clasificaciones',
    label: 'Clasificaciones',
    description: 'Catálogo del elemento: consumo, devolutivo, EPP.',
    to: '/inventario/clasificaciones',
  },
  {
    code: 'bodegas',
    label: 'Bodegas',
    description: 'Espacios del centro. Cada una agrupa sub-bodegas.',
    to: '/inventario/bodegas',
  },
  {
    code: 'stands',
    label: 'Stands',
    description: 'Ubicaciones dentro de cada sub-bodega.',
    to: '/inventario/stands',
  },
]

const SCREEN_WORDS: Array<{ code: InventoryScreenCode; words: string[] }> = [
  { code: 'categorias', words: ['categoria', 'categorias'] },
  { code: 'items', words: ['item', 'items'] },
  { code: 'elementos', words: ['elemento', 'elementos'] },
  { code: 'clasificaciones', words: ['clasificacion', 'clasificaciones'] },
  { code: 'bodegas', words: ['bodega', 'bodegas'] },
  { code: 'stands', words: ['stand', 'stands'] },
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function screenFromText(text: string): InventoryScreenCode | null {
  const padded = ` ${text} `
  const matches = SCREEN_WORDS.filter((item) =>
    item.words.some((word) => padded.includes(` ${word} `)),
  )
  if (matches.length === 0) return null
  return matches[matches.length - 1].code
}

function explicitKind(text: string): GrantKind | null {
  if (/\b(crear|nueva|nuevo)\b/.test(text)) return 'create'
  if (/\b(editar|actualizar)\b/.test(text)) return 'edit'
  if (/\b(ver|detalle)\b/.test(text)) return 'view'
  if (/\blistar\b/.test(text)) return 'list'
  return null
}

export function locateInventoryPath(path: string): { screen: InventoryScreenCode; action: InventoryAction } | null {
  if (path === '/inventario/categorias') return { screen: 'categorias', action: 'list' }
  if (path === '/inventario/categorias/crear') return { screen: 'categorias', action: 'create' }
  if (/^\/inventario\/categorias\/[^/]+\/editar$/.test(path)) return { screen: 'categorias', action: 'edit' }
  if (/^\/inventario\/categorias\/[^/]+$/.test(path)) return { screen: 'categorias', action: 'view' }

  if (path === '/inventario/items') return { screen: 'items', action: 'list' }
  if (/^\/inventario\/items\/[^/]+$/.test(path)) return { screen: 'items', action: 'view' }

  if (path === '/inventario/elementos') return { screen: 'elementos', action: 'list' }
  if (/^\/inventario\/elementos\/[^/]+$/.test(path)) return { screen: 'elementos', action: 'view' }

  if (path === '/inventario/clasificaciones') return { screen: 'clasificaciones', action: 'list' }

  if (/^\/inventario\/bodegas\/[^/]+\/stands\/crear$/.test(path)) return { screen: 'stands', action: 'create' }
  if (/^\/inventario\/bodegas\/[^/]+\/stands\/[^/]+\/editar$/.test(path)) return { screen: 'stands', action: 'edit' }
  if (/^\/inventario\/bodegas\/[^/]+\/stands\/[^/]+$/.test(path)) return { screen: 'stands', action: 'view' }

  if (/^\/inventario\/stands\/[^/]+\/editar$/.test(path)) return { screen: 'stands', action: 'edit' }
  if (/^\/inventario\/stands\/[^/]+$/.test(path)) return { screen: 'stands', action: 'view' }

  if (path === '/inventario/bodegas') return { screen: 'bodegas', action: 'list' }
  if (path === '/inventario/bodegas/crear') return { screen: 'bodegas', action: 'create' }
  if (/^\/inventario\/bodegas\/[^/]+\/sub-bodegas\/[^/]+$/.test(path)) {
    return { screen: 'bodegas', action: 'view' }
  }
  if (/^\/inventario\/bodegas\/[^/]+\/editar$/.test(path)) return { screen: 'bodegas', action: 'edit' }
  if (/^\/inventario\/bodegas\/[^/]+$/.test(path)) return { screen: 'bodegas', action: 'view' }

  if (path === '/inventario/stands') return { screen: 'stands', action: 'list' }

  return null
}

function isInventoryParent(mod: AppModule) {
  return mod.to === '/inventario' || normalize(mod.label) === 'inventario' || normalize(mod.code) === 'inventario'
}

export function classifyInventoryModule(mod: AppModule): InventoryGrant | null {
  if (isInventoryParent(mod)) return null

  const text = normalize(`${mod.label} ${mod.code}`)
  const located = mod.to ? locateInventoryPath(mod.to) : null
  const screen = screenFromText(text) ?? located?.screen ?? null
  if (!screen) return null

  const kind = explicitKind(text) ?? (located && located.action !== 'list' ? located.action : 'screen')
  return { screen, kind }
}

function inventoryGrants(modules: AppModule[]) {
  return modules.flatMap((mod) => {
    const grant = classifyInventoryModule(mod)
    return grant ? [grant] : []
  })
}

export function hasInventoryAccess(modules: AppModule[]) {
  return modules.some((mod) => isInventoryParent(mod) || classifyInventoryModule(mod) !== null)
}

export function canSeeClasificaciones(access: InventoryCaller = {}) {
  if (access.isAdmin) return true
  return access.permissions?.includes('clasificacion_elemento.ver') ?? false
}

export function visibleInventoryScreens(modules: AppModule[], access: InventoryCaller = {}) {
  const grants = inventoryGrants(modules)
  const base =
    grants.length === 0
      ? modules.some(isInventoryParent)
        ? INVENTORY_SCREENS
        : []
      : INVENTORY_SCREENS.filter((screen) =>
          grants.some((grant) => grant.screen === screen.code),
        )

  const screens = withItemsBesideElementos(base).filter(
    (screen) => screen.code !== 'clasificaciones' || canSeeClasificaciones(access),
  )

  if (
    !canSeeClasificaciones(access) ||
    screens.some((screen) => screen.code === 'clasificaciones') ||
    !hasInventoryAccess(modules)
  ) {
    return screens
  }

  const clasificaciones = INVENTORY_SCREENS.find((screen) => screen.code === 'clasificaciones')
  if (!clasificaciones) return screens

  const index = screens.findIndex((screen) => screen.code === 'elementos')
  if (index === -1) return [...screens, clasificaciones]
  return [...screens.slice(0, index + 1), clasificaciones, ...screens.slice(index + 1)]
}

function withItemsBesideElementos(screens: InventoryScreen[]) {
  if (
    !screens.some((screen) => screen.code === 'elementos') ||
    screens.some((screen) => screen.code === 'items')
  ) {
    return screens
  }

  const items = INVENTORY_SCREENS.find((screen) => screen.code === 'items')
  if (!items) return screens

  const index = screens.findIndex((screen) => screen.code === 'elementos')
  return [...screens.slice(0, index), items, ...screens.slice(index)]
}

export function canSeeInventoryScreen(
  modules: AppModule[],
  code: InventoryScreenCode,
  access: InventoryCaller = {},
) {
  return visibleInventoryScreens(modules, access).some((screen) => screen.code === code)
}

export function canInventoryAction(modules: AppModule[], code: InventoryScreenCode, action: InventoryAction) {
  if (!canSeeInventoryScreen(modules, code)) return false

  const grants = inventoryGrants(modules).filter((grant) => grant.screen === code)
  if (code === 'items' && grants.length === 0) {
    return canInventoryAction(modules, 'elementos', action)
  }
  if (grants.length === 0 || grants.some((grant) => grant.kind === 'screen')) return true
  if (action === 'list') return true
  return grants.some((grant) => grant.kind === action)
}

export function canOpenInventoryPath(
  path: string,
  modules: AppModule[],
  access: InventoryCaller = {},
) {
  if (path === '/inventario') return hasInventoryAccess(modules)

  const located = locateInventoryPath(path)
  if (!located) return false
  if (located.screen === 'clasificaciones') {
    return canSeeClasificaciones(access) && hasInventoryAccess(modules)
  }
  if (located.action === 'list') return canSeeInventoryScreen(modules, located.screen, access)
  return canInventoryAction(modules, located.screen, located.action)
}

export function isInventoryDescendantPath(path: string) {
  return path.startsWith('/inventario/')
}
