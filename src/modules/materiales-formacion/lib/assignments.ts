import { api } from '@/shared/lib/api'
import type { ProgramaFormacion } from '@/modules/materiales-formacion/types/formacion'
import type { ManagedUser } from '@/shared/types/profile'

/**
 * El backend no expone la asignación inversa (usuario → programas), así que se
 * arma consultando los usuarios de cada programa.
 */
export async function buildAssignments(programs: ProgramaFormacion[]) {
  const rows = await Promise.all(
    programs.map(async (programa) => ({
      programa,
      users: await api<ManagedUser[]>(`/programas-formacion/${programa.id}/usuarios`),
    })),
  )

  const assignments: Record<number, ProgramaFormacion[]> = {}
  for (const row of rows) {
    for (const user of row.users) {
      assignments[user.id] = [...(assignments[user.id] ?? []), row.programa]
    }
  }

  return assignments
}
