/**
 * El rol no es una tabla aparte: sale del perfil del usuario.
 * La base valida `perfil.nombre ~* '^(instructor|coordinador)'` antes de dejar
 * asignar programas, así que el frontend usa exactamente la misma regla.
 */
export function esPerfilProgramas(roleName?: string | null) {
  return Boolean(roleName && /^(instructor|coordinador)/i.test(roleName.trim()))
}
