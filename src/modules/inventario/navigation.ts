import type { AppModule } from '@/shared/types/profile'

export type InventoryScreenCode =
  | 'categorias'
  | 'items'
  | 'elementos'
  | 'clasificaciones'
  | 'unidades'
  | 'usos'
  | 'codigos'
  | 'bodegas'
  | 'stands'
  | 'obras'
  | 'solicitudes'
  | 'alertas'

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
    description: 'Catálogo estándar, el mismo para todos los centros. La subcategoría cuelga de la categoría.',
    to: '/inventario/categorias',
  },
  {
    code: 'items',
    label: 'Ítems',
    description: 'Ficha del producto de tu centro. La subcategoría sale del catálogo global.',
    to: '/inventario/items',
  },
  {
    code: 'elementos',
    label: 'Elementos',
    description: 'Stock de un ítem de tu centro: cantidad, stand y valor.',
    to: '/inventario/elementos',
  },
  {
    code: 'clasificaciones',
    label: 'Clasificaciones',
    description: 'Catálogo estándar. La misma lista para todos los centros.',
    to: '/inventario/clasificaciones',
  },
  {
    code: 'unidades',
    label: 'Unidades de medida',
    description: 'Catálogo estándar. La misma lista para todos los centros.',
    to: '/inventario/unidades',
  },
  {
    code: 'usos',
    label: 'Usos presupuestales',
    description: 'Partida de la ficha. No es el código UNSPSC. La misma lista para todos los centros.',
    to: '/inventario/usos-presupuestales',
  },
  {
    code: 'codigos',
    label: 'Códigos UNSPSC',
    description: 'Catálogo estándar. El elemento guarda el id, no el código escrito.',
    to: '/inventario/codigos-estandar',
  },
  {
    code: 'bodegas',
    label: 'Bodegas',
    description: 'Bodegas de tu centro. El alta elige el centro; la de otro centro se asigna en Usuarios.',
    to: '/inventario/bodegas',
  },
  {
    code: 'stands',
    label: 'Stands',
    description: 'Ubicaciones dentro de una sub-bodega de tu bodega.',
    to: '/inventario/stands',
  },
  {
    code: 'obras',
    label: 'Obras',
    description: 'Obras de tu centro de formación. Las solicitudes de material y equipo se hacen para una obra.',
    to: '/inventario/obras',
  },
  {
    code: 'alertas',
    label: 'Alertas',
    description: 'Vencimientos, stock bajo y movimientos del inventario de tu centro.',
    to: '/inventario/alertas',
  },
]

const SCREEN_WORDS: Array<{ code: InventoryScreenCode; words: string[] }> = [
  { code: 'categorias', words: ['categoria', 'categorias'] },
  { code: 'items', words: ['item', 'items'] },
  { code: 'elementos', words: ['elemento', 'elementos'] },
  { code: 'clasificaciones', words: ['clasificacion', 'clasificaciones'] },
  { code: 'unidades', words: ['unidad', 'unidades'] },
  { code: 'usos', words: ['presupuestal', 'presupuestales'] },
  { code: 'codigos', words: ['unspsc', 'estandar'] },
  { code: 'bodegas', words: ['bodega', 'bodegas'] },
  { code: 'stands', words: ['stand', 'stands'] },
  { code: 'obras', words: ['obra', 'obras'] },
  { code: 'alertas', words: ['alerta', 'alertas'] },
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
  if (path === '/inventario/unidades') return { screen: 'unidades', action: 'list' }
  if (path === '/inventario/usos-presupuestales') return { screen: 'usos', action: 'list' }
  if (path === '/inventario/codigos-estandar') return { screen: 'codigos', action: 'list' }

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
  if (path === '/inventario/obras') return { screen: 'obras', action: 'list' }
  if (path === '/inventario/alertas') return { screen: 'alertas', action: 'list' }

  if (path === '/inventario/solicitudes' || path.startsWith('/inventario/solicitudes/')) {
    return { screen: 'solicitudes', action: 'list' }
  }

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

export function hasInventoryAccess(modules: AppModule[]) {
  return modules.some((mod) => isInventoryParent(mod) || classifyInventoryModule(mod) !== null)
}

const CENTER_OPERATION = new Set<InventoryScreenCode>(['items', 'elementos', 'stands', 'obras'])

const ADMIN_MENU = new Set<InventoryScreenCode>([
  'categorias',
  'clasificaciones',
  'unidades',
  'usos',
  'codigos',
  'bodegas',
])

const REQUESTER_HIDDEN = new Set<InventoryScreenCode>(['elementos', 'clasificaciones', 'codigos'])

/*
 * Quien pide pero no entrega (instructor) conserva elemento.ver porque el
 * formulario de solicitud lo necesita, pero no ve las pantallas de bodega.
 */
function onlyRequests(access: InventoryCaller) {
  const permissions = access.permissions ?? []
  return (
    !access.isAdmin &&
    (permissions.includes('solicitud_material.crear') ||
      permissions.includes('solicitud_equipo.crear')) &&
    !permissions.includes('solicitud_material.entregar') &&
    !permissions.includes('solicitud_equipo.entregar')
  )
}

const VIEW_CODE: Record<Exclude<InventoryScreenCode, 'solicitudes' | 'alertas'>, string> = {
  categorias: 'categoria.ver',
  items: 'item.ver',
  elementos: 'elemento.ver',
  clasificaciones: 'clasificacion_elemento.ver',
  unidades: 'unidad_medida.ver',
  usos: 'uso_presupuestal.ver',
  codigos: 'elemento.ver',
  bodegas: 'bodega.ver',
  stands: 'stand.ver',
  obras: 'obra.ver',
}

const SOLICITUD_CODES = [
  'solicitud_equipo.ver',
  'solicitud_equipo.crear',
  'solicitud_equipo.entregar',
  'solicitud_equipo.devolver',
  'solicitud_material.ver',
  'solicitud_material.crear',
  'solicitud_material.entregar',
]

export const SOLICITUDES_SCREEN: InventoryScreen = {
  code: 'solicitudes',
  label: 'Solicitudes',
  description: 'Equipo devolutivo y material de consumo, cada uno por separado.',
  to: '/inventario/solicitudes',
}

export function canOpenSolicitudes(isAdmin: boolean, permissions?: string[]) {
  if (isAdmin) return true

  return SOLICITUD_CODES.some(
    (code) => permissions?.includes(code) === true,
  )
}

const WRITE_CODE: Partial<Record<InventoryScreenCode, Partial<Record<InventoryAction, string>>>> = {
  categorias: { create: 'categoria.crear', edit: 'categoria.editar' },
  items: { create: 'item.crear', edit: 'item.editar' },
  elementos: { create: 'elemento.crear', edit: 'elemento.editar' },
  clasificaciones: { create: 'clasificacion_elemento.crear', edit: 'clasificacion_elemento.editar' },
  unidades: { create: 'unidad_medida.crear', edit: 'unidad_medida.editar' },
  usos: { create: 'uso_presupuestal.crear', edit: 'uso_presupuestal.editar' },
  codigos: { create: 'codigo_estandar.crear', edit: 'codigo_estandar.editar' },
  bodegas: { create: 'bodega.crear', edit: 'bodega.editar' },
  stands: { create: 'stand.crear', edit: 'stand.editar' },
  obras: { create: 'obra.crear', edit: 'obra.editar' },
}

const CATALOG_WRITE = new Set([
  'categoria.crear',
  'categoria.editar',
  'categoria.eliminar',
  'subcategoria.crear',
  'subcategoria.editar',
  'clasificacion_elemento.crear',
  'clasificacion_elemento.editar',
  'clasificacion_elemento.eliminar',
  'unidad_medida.crear',
  'unidad_medida.editar',
  'unidad_medida.eliminar',
  'uso_presupuestal.crear',
  'uso_presupuestal.editar',
  'uso_presupuestal.eliminar',
  'codigo_estandar.crear',
  'codigo_estandar.editar',
  'codigo_estandar.eliminar',
])

export function allowsPermission(
  isAdmin: boolean,
  permissions: string[] | undefined,
  code: string,
) {
  if (isAdmin && /^(item|elemento|stand|obra)\./.test(code)) return false
  if (!isAdmin && CATALOG_WRITE.has(code)) return false
  return permissions?.includes(code) === true
}

function actionCode(screen: Exclude<InventoryScreenCode, 'solicitudes' | 'alertas'>, action: InventoryAction) {
  if (action === 'list' || action === 'view') return VIEW_CODE[screen]
  return WRITE_CODE[screen]?.[action] ?? VIEW_CODE[screen]
}

function canUseAction(screen: InventoryScreenCode, action: InventoryAction, access: InventoryCaller) {
  if (screen === 'solicitudes') {
    return canOpenSolicitudes(access.isAdmin === true, access.permissions)
  }
  if (screen === 'alertas') {
    return !access.isAdmin && access.permissions?.includes('alerta.ver') === true
  }
  if (REQUESTER_HIDDEN.has(screen) && onlyRequests(access)) {
    return false
  }
  if (access.isAdmin && screen === 'codigos' && (action === 'list' || action === 'view')) {
    return true
  }
  return allowsPermission(access.isAdmin === true, access.permissions, actionCode(screen, action))
}

export function visibleInventoryScreens(access: InventoryCaller = {}) {
  const screens = access.isAdmin
    ? INVENTORY_SCREENS.filter((screen) => ADMIN_MENU.has(screen.code))
    : INVENTORY_SCREENS.filter(
        (screen) =>
          screen.code !== 'solicitudes' &&
          screen.code !== 'alertas' &&
          !(REQUESTER_HIDDEN.has(screen.code) && onlyRequests(access)) &&
          (access.permissions ?? []).includes(VIEW_CODE[screen.code]),
      )

  const extra: InventoryScreen[] = []

  if (canOpenSolicitudes(access.isAdmin === true, access.permissions)) {
    extra.push(SOLICITUDES_SCREEN)
  }

  if (!access.isAdmin && access.permissions?.includes('alerta.ver')) {
    const alertas = INVENTORY_SCREENS.find((screen) => screen.code === 'alertas')
    if (alertas) extra.push(alertas)
  }

  return extra.length ? [...screens, ...extra] : screens
}

export function canSeeInventoryScreen(
  code: InventoryScreenCode,
  access: InventoryCaller = {},
) {
  return visibleInventoryScreens(access).some((screen) => screen.code === code)
}

export function canInventoryAction(
  code: InventoryScreenCode,
  action: InventoryAction,
  access: InventoryCaller = {},
) {
  if (!canSeeInventoryScreen(code, access)) return false
  if (access.isAdmin && CENTER_OPERATION.has(code)) return false
  return canUseAction(code, action, access)
}

export function canOpenInventoryPath(
  path: string,
  modules: AppModule[],
  access: InventoryCaller = {},
) {
  if (path === '/inventario') {
    return access.isAdmin === true || visibleInventoryScreens(access).length > 0 || hasInventoryAccess(modules)
  }

  const located = locateInventoryPath(path)
  if (!located) return false
  if (access.isAdmin && CENTER_OPERATION.has(located.screen)) return false
  return canUseAction(located.screen, located.action, access)
}

export function isInventoryDescendantPath(path: string) {
  return path.startsWith('/inventario/')
}
