import type { AppModule } from '@/shared/types/profile'

export type InventoryScreenCode =
  | 'categorias'
  | 'items'
  | 'elementos'
  | 'prestamos'
  | 'actividades'
  | 'clasificaciones'
  | 'unidades'
  | 'usos'
  | 'codigos'
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
    description:
      'Clasificación del producto. La subcategoría cuelga de la categoría.',
    to: '/inventario/categorias',
  },

  {
    code: 'items',
    label: 'Ítems',
    description:
      'Ficha del producto: nombre, categoría y descripción.',
    to: '/inventario/items',
  },

  {
    code: 'elementos',
    label: 'Elementos',
    description:
      'Stock de un ítem: cantidad, ubicación y valor.',
    to: '/inventario/elementos',
  },

  {
    code: 'clasificaciones',
    label: 'Clasificaciones',
    description:
      'Catálogo del centro. El elemento guarda el id, no el nombre.',
    to: '/inventario/clasificaciones',
  },

  {
    code: 'unidades',
    label: 'Unidades de medida',
    description:
      'Catálogo del centro. Sin una unidad activa no se puede crear el elemento.',
    to: '/inventario/unidades',
  },

  {
    code: 'usos',
    label: 'Usos presupuestales',
    description:
      'Partida del centro. No es el código UNSPSC.',
    to: '/inventario/usos-presupuestales',
  },

  {
    code: 'codigos',
    label: 'Códigos UNSPSC',
    description:
      'Catálogo del centro. El elemento guarda el id, no el código escrito.',
    to: '/inventario/codigos-estandar',
  },

  {
    code: 'bodegas',
    label: 'Bodegas',
    description:
      'Espacios del centro. Cada una agrupa sub-bodegas.',
    to: '/inventario/bodegas',
  },

  {
    code: 'stands',
    label: 'Stands',
    description:
      'Ubicaciones dentro de cada sub-bodega.',
    to: '/inventario/stands',
  },

  {
    code: 'actividades',
    label: 'Actividades',
    description:
      'Gestión de actividades de formación.',
    to: '/inventario/actividades',
  },

  {
    code: 'prestamos',
    label: 'Préstamos',
    description:
      'Control de préstamos y devoluciones de elementos.',
    to: '/inventario/prestamos',
  },
]

const SCREEN_WORDS: Array<{
  code: InventoryScreenCode
  words: string[]
}> = [
  {
    code: 'categorias',
    words: ['categoria', 'categorias'],
  },

  {
    code: 'items',
    words: ['item', 'items'],
  },

  {
    code: 'elementos',
    words: ['elemento', 'elementos'],
  },

  {
    code: 'actividades',
    words: ['actividad', 'actividades'],
  },

  {
    code: 'clasificaciones',
    words: ['clasificacion', 'clasificaciones'],
  },

  {
    code: 'unidades',
    words: ['unidad', 'unidades'],
  },

  {
    code: 'usos',
    words: ['presupuestal', 'presupuestales'],
  },

  {
    code: 'codigos',
    words: ['unspsc', 'estandar'],
  },

  {
    code: 'bodegas',
    words: ['bodega', 'bodegas'],
  },

  {
    code: 'stands',
    words: ['stand', 'stands'],
  },

  {
    code: 'prestamos',
    words: ['prestamo', 'prestamos'],
  },
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function screenFromText(
  text: string,
): InventoryScreenCode | null {
  const padded = ` ${text} `

  const matches = SCREEN_WORDS.filter((item) =>
    item.words.some((word) =>
      padded.includes(` ${word} `),
    ),
  )

  if (matches.length === 0) return null

  return matches[matches.length - 1].code
}

function explicitKind(text: string): GrantKind | null {
  if (/\b(crear|nueva|nuevo)\b/.test(text)) {
    return 'create'
  }

  if (/\b(editar|actualizar)\b/.test(text)) {
    return 'edit'
  }

  if (/\b(ver|detalle)\b/.test(text)) {
    return 'view'
  }

  if (/\blistar\b/.test(text)) {
    return 'list'
  }

  return null
}

export function locateInventoryPath(
  path: string,
): {
  screen: InventoryScreenCode
  action: InventoryAction
} | null {
  if (path === '/inventario/categorias') {
    return {
      screen: 'categorias',
      action: 'list',
    }
  }

  if (path === '/inventario/categorias/crear') {
    return {
      screen: 'categorias',
      action: 'create',
    }
  }

  if (
    /^\/inventario\/categorias\/[^/]+\/editar$/.test(path)
  ) {
    return {
      screen: 'categorias',
      action: 'edit',
    }
  }

  if (/^\/inventario\/categorias\/[^/]+$/.test(path)) {
    return {
      screen: 'categorias',
      action: 'view',
    }
  }

  if (path === '/inventario/items') {
    return {
      screen: 'items',
      action: 'list',
    }
  }

  if (/^\/inventario\/items\/[^/]+$/.test(path)) {
    return {
      screen: 'items',
      action: 'view',
    }
  }

  if (path === '/inventario/elementos') {
    return {
      screen: 'elementos',
      action: 'list',
    }
  }

  if (/^\/inventario\/elementos\/[^/]+$/.test(path)) {
    return {
      screen: 'elementos',
      action: 'view',
    }
  }

  // ACTIVIDADES
  if (path === '/inventario/actividades') {
    return {
      screen: 'actividades',
      action: 'list',
    }
  }

  if (path === '/inventario/clasificaciones') {
    return {
      screen: 'clasificaciones',
      action: 'list',
    }
  }

  if (path === '/inventario/unidades') {
    return {
      screen: 'unidades',
      action: 'list',
    }
  }

  if (path === '/inventario/usos-presupuestales') {
    return {
      screen: 'usos',
      action: 'list',
    }
  }

  if (path === '/inventario/codigos-estandar') {
    return {
      screen: 'codigos',
      action: 'list',
    }
  }

  if (
    /^\/inventario\/bodegas\/[^/]+\/stands\/crear$/.test(path)
  ) {
    return {
      screen: 'stands',
      action: 'create',
    }
  }

  if (
    /^\/inventario\/bodegas\/[^/]+\/stands\/[^/]+\/editar$/.test(
      path,
    )
  ) {
    return {
      screen: 'stands',
      action: 'edit',
    }
  }

  if (
    /^\/inventario\/bodegas\/[^/]+\/stands\/[^/]+$/.test(
      path,
    )
  ) {
    return {
      screen: 'stands',
      action: 'view',
    }
  }

  if (
    /^\/inventario\/stands\/[^/]+\/editar$/.test(path)
  ) {
    return {
      screen: 'stands',
      action: 'edit',
    }
  }

  if (/^\/inventario\/stands\/[^/]+$/.test(path)) {
    return {
      screen: 'stands',
      action: 'view',
    }
  }

  if (path === '/inventario/bodegas') {
    return {
      screen: 'bodegas',
      action: 'list',
    }
  }

  if (path === '/inventario/bodegas/crear') {
    return {
      screen: 'bodegas',
      action: 'create',
    }
  }

  if (
    /^\/inventario\/bodegas\/[^/]+\/sub-bodegas\/[^/]+$/.test(
      path,
    )
  ) {
    return {
      screen: 'bodegas',
      action: 'view',
    }
  }

  if (
    /^\/inventario\/bodegas\/[^/]+\/editar$/.test(path)
  ) {
    return {
      screen: 'bodegas',
      action: 'edit',
    }
  }

  if (/^\/inventario\/bodegas\/[^/]+$/.test(path)) {
    return {
      screen: 'bodegas',
      action: 'view',
    }
  }

  if (path === '/inventario/stands') {
    return {
      screen: 'stands',
      action: 'list',
    }
  }

  if (path === '/inventario/prestamos') {
    return {
      screen: 'prestamos',
      action: 'list',
    }
  }

  return null
}

function isInventoryParent(mod: AppModule) {
  return (
    mod.to === '/inventario' ||
    normalize(mod.label) === 'inventario' ||
    normalize(mod.code) === 'inventario'
  )
}

export function classifyInventoryModule(
  mod: AppModule,
): InventoryGrant | null {
  if (isInventoryParent(mod)) return null

  const text = normalize(
    `${mod.label} ${mod.code}`,
  )

  const located = mod.to
    ? locateInventoryPath(mod.to)
    : null

  const screen =
    screenFromText(text) ??
    located?.screen ??
    null

  if (!screen) return null

  const kind =
    explicitKind(text) ??
    (
      located && located.action !== 'list'
        ? located.action
        : 'screen'
    )

  return {
    screen,
    kind,
  }
}

function inventoryGrants(
  modules: AppModule[],
) {
  return modules.flatMap((mod) => {
    const grant = classifyInventoryModule(mod)

    return grant ? [grant] : []
  })
}

export function hasInventoryAccess(
  modules: AppModule[],
) {
  return modules.some(
    (mod) =>
      isInventoryParent(mod) ||
      classifyInventoryModule(mod) !== null,
  )
}

const CATALOG_SCREENS =
  new Set<InventoryScreenCode>([
    'clasificaciones',
    'unidades',
    'usos',
    'codigos',
  ])

export function canSeeClasificaciones(
  access: InventoryCaller = {},
) {
  return canSeeCatalog(
    'clasificaciones',
    access,
  )
}

export function canSeeCatalog(
  code: InventoryScreenCode,
  access: InventoryCaller = {},
) {
  if (!CATALOG_SCREENS.has(code)) {
    return true
  }

  if (access.isAdmin) {
    return true
  }

  const permission =
    code === 'clasificaciones'
      ? 'clasificacion_elemento.ver'
      : code === 'unidades'
        ? 'unidad_medida.ver'
        : code === 'usos'
          ? 'uso_presupuestal.ver'
          : 'elemento.ver'

  return (
    access.permissions?.includes(permission) ??
    false
  )
}

export function visibleInventoryScreens(
  modules: AppModule[],
  access: InventoryCaller = {},
) {
  const grants = inventoryGrants(modules)

  const base =
    grants.length === 0
      ? modules.some(isInventoryParent)
        ? INVENTORY_SCREENS
        : []
      : INVENTORY_SCREENS.filter(
          (screen) =>
            grants.some(
              (grant) =>
                grant.screen === screen.code,
            ),
        )

  const allowed = withItemsBesideElementos(
    base,
  ).filter(
    (screen) =>
      !CATALOG_SCREENS.has(screen.code) ||
      canSeeCatalog(screen.code, access),
  )

  // El administrador puede ver Actividades
  // dentro de Inventario.
  if (
    access.isAdmin &&
    hasInventoryAccess(modules) &&
    !allowed.some(
      (screen) =>
        screen.code === 'actividades',
    )
  ) {
    const actividades =
      INVENTORY_SCREENS.find(
        (screen) =>
          screen.code === 'actividades',
      )

    if (actividades) {
      const prestamosIndex =
        allowed.findIndex(
          (screen) =>
            screen.code === 'prestamos',
        )

      if (prestamosIndex !== -1) {
        allowed.splice(
          prestamosIndex,
          0,
          actividades,
        )
      } else {
        allowed.push(actividades)
      }
    }
  }

  return placeCatalogs(
    injectCatalogs(
      allowed,
      modules,
      access,
    ),
  )
}

function injectCatalogs(
  screens: InventoryScreen[],
  modules: AppModule[],
  access: InventoryCaller,
) {
  if (!hasInventoryAccess(modules)) {
    return screens
  }

  const missing =
    INVENTORY_SCREENS.filter(
      (screen) =>
        CATALOG_SCREENS.has(screen.code) &&
        canSeeCatalog(
          screen.code,
          access,
        ) &&
        !screens.some(
          (item) =>
            item.code === screen.code,
        ),
    )

  if (!missing.length) {
    return screens
  }

  const index =
    screens.findIndex(
      (screen) =>
        screen.code === 'elementos',
    )

  if (index === -1) {
    return [
      ...screens,
      ...missing,
    ]
  }

  return [
    ...screens.slice(0, index + 1),
    ...missing,
    ...screens.slice(index + 1),
  ]
}

function placeCatalogs(
  screens: InventoryScreen[],
) {
  const catalogs =
    INVENTORY_SCREENS.filter(
      (screen) =>
        CATALOG_SCREENS.has(
          screen.code,
        ) &&
        screens.some(
          (item) =>
            item.code === screen.code,
        ),
    )

  const rest =
    screens.filter(
      (screen) =>
        !CATALOG_SCREENS.has(
          screen.code,
        ),
    )

  const index =
    rest.findIndex(
      (screen) =>
        screen.code === 'elementos',
    )

  if (index === -1) {
    return [
      ...rest,
      ...catalogs,
    ]
  }

  return [
    ...rest.slice(0, index + 1),
    ...catalogs,
    ...rest.slice(index + 1),
  ]
}

function withItemsBesideElementos(
  screens: InventoryScreen[],
) {
  if (
    !screens.some(
      (screen) =>
        screen.code === 'elementos',
    ) ||
    screens.some(
      (screen) =>
        screen.code === 'items',
    )
  ) {
    return screens
  }

  const items =
    INVENTORY_SCREENS.find(
      (screen) =>
        screen.code === 'items',
    )

  if (!items) {
    return screens
  }

  const index =
    screens.findIndex(
      (screen) =>
        screen.code === 'elementos',
    )

  return [
    ...screens.slice(0, index),
    items,
    ...screens.slice(index),
  ]
}

export function canSeeInventoryScreen(
  modules: AppModule[],
  code: InventoryScreenCode,
  access: InventoryCaller = {},
) {
  return visibleInventoryScreens(
    modules,
    access,
  ).some(
    (screen) =>
      screen.code === code,
  )
}

export function canInventoryAction(
  modules: AppModule[],
  code: InventoryScreenCode,
  action: InventoryAction,
) {
  if (
    !canSeeInventoryScreen(
      modules,
      code,
    )
  ) {
    return false
  }

  const grants =
    inventoryGrants(modules).filter(
      (grant) =>
        grant.screen === code,
    )

  if (
    code === 'items' &&
    grants.length === 0
  ) {
    return canInventoryAction(
      modules,
      'elementos',
      action,
    )
  }

  if (
    grants.length === 0 ||
    grants.some(
      (grant) =>
        grant.kind === 'screen',
    )
  ) {
    return true
  }

  if (action === 'list') {
    return true
  }

  return grants.some(
    (grant) =>
      grant.kind === action,
  )
}

export function canOpenInventoryPath(
  path: string,
  modules: AppModule[],
  access: InventoryCaller = {},
) {
  if (path === '/inventario') {
    return hasInventoryAccess(modules)
  }

  const located =
    locateInventoryPath(path)

  if (!located) {
    return false
  }

  if (
    CATALOG_SCREENS.has(
      located.screen,
    )
  ) {
    return (
      canSeeCatalog(
        located.screen,
        access,
      ) &&
      hasInventoryAccess(modules)
    )
  }

  if (located.action === 'list') {
    return canSeeInventoryScreen(
      modules,
      located.screen,
      access,
    )
  }

  return canInventoryAction(
    modules,
    located.screen,
    located.action,
  )
}

export function isInventoryDescendantPath(
  path: string,
) {
  return path.startsWith(
    '/inventario/',
  )
}