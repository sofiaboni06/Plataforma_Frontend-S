import { useAuth } from '@/modules/auth/context/auth'

export type MaterialFormacionCode =
  | 'material_formacion.ver'
  | 'material_formacion.crear'
  | 'material_formacion.editar'
  | 'material_formacion.eliminar'

/**
 * El Administrador de la plataforma recibe todo el catálogo de permisos que no
 * es de centro (material_formacion.* no lo es), así que con isAdmin basta; el
 * resto depende de los códigos que su perfil tenga concedidos.
 */
export function useMaterialFormacionAccess() {
  const { isAdmin, user } = useAuth()
  const permissions = user?.permissions

  const can = (code: MaterialFormacionCode) =>
    isAdmin === true || (permissions?.includes(code) ?? false)

  return {
    can,
    canView: can('material_formacion.ver'),
    canCreate: can('material_formacion.crear'),
    canEdit: can('material_formacion.editar'),
    canDelete: can('material_formacion.eliminar'),
  }
}
