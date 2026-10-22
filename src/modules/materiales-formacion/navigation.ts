export type FormacionScreenCode =
  | 'programas'
  | 'fichas'
  | 'redes'
  | 'lineas'
  | 'niveles'
  | 'instructores'
  | 'listas'

export type FormacionAction = 'list' | 'view' | 'create' | 'edit' | 'delete'

export type FormacionScreen = {
  code: FormacionScreenCode
  to: string
  label: string
  /* Asignar programas usa /users, que por ahora es solo del administrador. */
  adminOnly?: boolean
}

export type FormacionCaller = {
  isAdmin?: boolean
  permissions?: string[]
}

/**
 * Subpantallas del módulo Formación. El administrador las ve desplegadas en el
 * menú lateral y como tarjetas en la página de inicio del módulo.
 */
export const FORMACION_SCREENS: FormacionScreen[] = [
  { code: 'programas', to: '/formacion/programas', label: 'Programas de formación' },
  { code: 'fichas', to: '/formacion/fichas', label: 'Fichas' },
  { code: 'redes', to: '/formacion/redes', label: 'Redes de conocimiento' },
  { code: 'lineas', to: '/formacion/lineas', label: 'Líneas temáticas' },
  { code: 'niveles', to: '/formacion/niveles', label: 'Niveles de formación' },
  {
    code: 'instructores',
    to: '/formacion/instructores',
    label: 'Asignar programas',
    adminOnly: true,
  },
  {
    code: 'listas',
    to: '/formacion/listas-maestras-material',
    label: 'Lista de materiales',
  },
]

type PermissionScreen = Exclude<FormacionScreenCode, 'instructores' | 'listas'>

const VIEW_CODE: Record<PermissionScreen, string> = {
  programas: 'programa_formacion.ver',
  fichas: 'ficha.ver',
  redes: 'red_conocimiento.ver',
  lineas: 'linea_tematica.ver',
  niveles: 'nivel_formacion.ver',
}

const WRITE_CODE: Record<PermissionScreen, Partial<Record<FormacionAction, string>>> = {
  programas: {
    create: 'programa_formacion.crear',
    edit: 'programa_formacion.editar',
    delete: 'programa_formacion.eliminar',
  },
  fichas: {
    create: 'ficha.crear',
    edit: 'ficha.editar',
    delete: 'ficha.eliminar',
  },
  redes: {
    create: 'red_conocimiento.crear',
    edit: 'red_conocimiento.editar',
    delete: 'red_conocimiento.eliminar',
  },
  lineas: {
    create: 'linea_tematica.crear',
    edit: 'linea_tematica.editar',
    delete: 'linea_tematica.eliminar',
  },
  niveles: {
    create: 'nivel_formacion.crear',
    edit: 'nivel_formacion.editar',
    delete: 'nivel_formacion.eliminar',
  },
}

function isPermissionScreen(code: FormacionScreenCode): code is PermissionScreen {
  return code !== 'instructores'
}

export function allowsFormacionPermission(access: FormacionCaller, code: string) {
  if (access.isAdmin) return true
  return access.permissions?.includes(code) === true
}

export function canSeeFormacionScreen(
  code: FormacionScreenCode,
  access: FormacionCaller = {},
) {
  return visibleFormacionScreens(access).some((screen) => screen.code === code)
}

export function canFormacionAction(
  code: FormacionScreenCode,
  action: FormacionAction,
  access: FormacionCaller = {},
) {
  if (code === 'instructores') return access.isAdmin === true
  if (code === 'listas') return hasFormacionAccess(access)
  if (!isPermissionScreen(code)) return access.isAdmin === true
  if (!canSeeFormacionScreen(code, access)) return false

  if (action === 'list' || action === 'view') {
    return allowsFormacionPermission(access, VIEW_CODE[code])
  }

  const write = WRITE_CODE[code][action] ?? VIEW_CODE[code]
  return allowsFormacionPermission(access, write)
}

export function visibleFormacionScreens(access: FormacionCaller = {}) {
  if (access.isAdmin) return FORMACION_SCREENS

  const base = FORMACION_SCREENS.filter(
    (screen) =>
      !screen.adminOnly &&
      isPermissionScreen(screen.code) &&
      allowsFormacionPermission(access, VIEW_CODE[screen.code]),
  )
  if (base.length > 0) {
    const listas = FORMACION_SCREENS.find((screen) => screen.code === 'listas')
    if (listas) base.push(listas)
  }
  return base
}

export function hasFormacionAccess(access: FormacionCaller = {}) {
  return visibleFormacionScreens(access).length > 0
}

export function locateFormacionPath(path: string): FormacionScreenCode | null {
  return FORMACION_SCREENS.find((screen) => screen.to === path)?.code ?? null
}

export function canOpenFormacionPath(path: string, access: FormacionCaller = {}) {
  if (path === '/formacion') return hasFormacionAccess(access)

  const code = locateFormacionPath(path)
  if (!code) return false

  return canFormacionAction(code, 'list', access)
}

export function isFormacionPath(pathname: string) {
  return pathname === '/formacion' || pathname.startsWith('/formacion/')
}
