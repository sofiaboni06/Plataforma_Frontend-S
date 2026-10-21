/**
 * El rol no es una tabla aparte: sale del perfil del usuario.
 * La base valida `perfil.nombre ~* '^instructor'` antes de dejar asignar
 * programas, así que el frontend usa exactamente la misma regla.
 */
export function esPerfilInstructor(roleName?: string | null) {
  return Boolean(roleName && /^instructor/i.test(roleName.trim()))
}
