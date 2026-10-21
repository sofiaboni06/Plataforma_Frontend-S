import { useEffect, useState } from 'react'
import { ApiError, api } from '@/shared/lib/api'
import { useAuth } from '@/modules/auth/context/auth'
import { esPerfilProgramas } from '@/modules/materiales-formacion/lib/formacion'
import type { ProgramaFormacion } from '@/modules/materiales-formacion/types/formacion'

export function useAssignedPrograms() {
  const { user } = useAuth()
  const canSeePrograms = esPerfilProgramas(user?.role)
  const [programs, setPrograms] = useState<ProgramaFormacion[]>([])
  const [loading, setLoading] = useState(canSeePrograms)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!canSeePrograms) return

    let cancelled = false
    setLoading(true)
    setError(null)

    api<ProgramaFormacion[]>('/account/programas')
      .then((list) => {
        if (!cancelled) setPrograms(list.filter((programa) => programa.estado))
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudieron cargar tus programas de formación.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [canSeePrograms, attempt])

  return {
    canSeePrograms,
    programs,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  }
}
