import type { AppModule } from '@/shared/types/profile'

export type InventoryScreenCode = 'categorias' | 'elementos' | 'bodegas' | 'stands'

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
    description: 'Clasificación de los elementos del inventario.',
    to: '/inventario/categorias',
  },
  {
    code: 'elementos',
    label: 'Elementos',
    description: 'Productos registrados en el inventario.',
    to: '/inventario/elementos',
  },
  {
    code: 'bodegas',
    label: 'Bodegas',
    description: 'Espacios donde se guarda el inventario.',
    to: '/inventario/bodegas',
  },
  {
    code: 'stands',
    label: 'Stands',
    description: 'Ubicaciones dentro de cada bodega.',
    to: '/inventario/stands',
  },
]

const SCREEN_WORDS: Array<{ code: InventoryScreenCode; words: string[] }> = [
  { code: 'categorias', words: ['categoria', 'categorias'] },
  { code: 'elementos', words: ['elemento', 'elementos'] },
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

  if (path === '/inventario/elementos') return { screen: 'elementos', action: 'list' }
  if (/^\/inventario\/elementos\/[^/]+$/.test(path)) return { screen: 'elementos', action: 'view' }

  if (/^\/inventario\/bodegas\/[^/]+\/stands\/crear$/.test(path)) return { screen: 'stands', action: 'create' }
  if (/^\/inventario\/bodegas\/[^/]+\/stands\/[^/]+\/editar$/.test(path)) return { screen: 'stands', action: 'edit' }
  if (/^\/inventario\/bodegas\/[^/]+\/stands\/[^/]+$/.test(path)) return { screen: 'stands', action: 'view' }

  if (path === '/inventario/bodegas') return { screen: 'bodegas', action: 'list' }
  if (path === '/inventario/bodegas/crear') return { screen: 'bodegas', action: 'create' }
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

export function visibleInventoryScreens(modules: AppModule[]) {
  const grants = inventoryGrants(modules)
  if (grants.length === 0) {
    return modules.some(isInventoryParent) ? INVENTORY_SCREENS : []
  }

  const allowed = new Set(grants.map((grant) => grant.screen))
  return INVENTORY_SCREENS.filter((screen) => allowed.has(screen.code))
}

export function canSeeInventoryScreen(modules: AppModule[], code: InventoryScreenCode) {
  return visibleInventoryScreens(modules).some((screen) => screen.code === code)
}

export function canInventoryAction(modules: AppModule[], code: InventoryScreenCode, action: InventoryAction) {
  if (!canSeeInventoryScreen(modules, code)) return false

  const grants = inventoryGrants(modules).filter((grant) => grant.screen === code)
  if (grants.length === 0 || grants.some((grant) => grant.kind === 'screen')) return true
  if (action === 'list') return true
  return grants.some((grant) => grant.kind === action)
}

export function canOpenInventoryPath(path: string, modules: AppModule[]) {
  if (path === '/inventario') return hasInventoryAccess(modules)

  const located = locateInventoryPath(path)
  if (!located) return false
  if (located.action === 'list') return canSeeInventoryScreen(modules, located.screen)
  return canInventoryAction(modules, located.screen, located.action)
}

export function isInventoryDescendantPath(path: string) {
  return path.startsWith('/inventario/')
}
