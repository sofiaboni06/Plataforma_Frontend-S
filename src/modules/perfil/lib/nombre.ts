/**
 * Divide un nombre completo en nombres y apellidos.
 * Es una aproximación (mitad y mitad); el usuario puede corregirla al editar.
 * Se vuelve innecesaria cuando el backend envíe `nombres` y `apellidos`.
 */
export function splitFullName(fullName: string): { nombres: string; apellidos: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { nombres: '', apellidos: '' }
  if (parts.length === 1) return { nombres: parts[0], apellidos: '' }

  const cut = Math.ceil(parts.length / 2)
  return {
    nombres: parts.slice(0, cut).join(' '),
    apellidos: parts.slice(cut).join(' '),
  }
}