import { useEffect, useState } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import { ErrorBanner, PageHeader, TableCard, TableLoading } from '@/shared/components/DataTable'
import { CalendarIcon } from '@/shared/components/icons/AppIcons'
import { useAuth } from '@/modules/auth/context/auth'
import { getVigencias } from '@/modules/vigencias/data/vigencia'
import type { VigenciaApi } from '@/modules/vigencias/types/vigencia'
import {
  puedeAbrirVigenciaEspecial,
  puedeEditarVigenciaEspecial,
} from '@/shared/lib/access'
import VigenciaEspecialCoordinadorSection from '@/modules/vigencias/pages/VigenciaEspecialCoordinadorSection'
import VigenciaEspecialSection from '@/modules/vigencias/pages/VigenciaEspecialSection'
import VigenciasTabs from '@/modules/vigencias/pages/VigenciasTabs'

export default function VigenciaEspecialPage() {
  const { isAdmin, user } = useAuth()
  const puedeEditar = puedeEditarVigenciaEspecial(user?.permissions)
  const puedeEspecial = puedeAbrirVigenciaEspecial(user?.permissions, user?.role)
  const puedeAnios = isAdmin || user?.permissions?.includes('vigencia.ver') === true
  const [vigencias, setVigencias] = useState<VigenciaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Vigencia especial | SENA'
    setLoading(true)
    getVigencias()
      .then((lista) => setVigencias([...lista].sort((a, b) => b.anio - a.anio)))
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las vigencias.'),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout title="Vigencia especial" showCenterBanner={false}>
      <PageHeader
        icon={<CalendarIcon />}
        title="Vigencia especial"
        description={
          puedeEditar
            ? 'Programas que llegan cuando el monto del año ya se repartió. Tú pones el monto y lo asignas a los coordinadores.'
            : 'La subdirectora te asigna un monto aparte. Reparte ese valor en tus redes de conocimiento.'
        }
      />
      <VigenciasTabs puedeVerAnios={puedeAnios} puedeVerEspecial={puedeEspecial} />
      {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}
      {loading ? (
        <TableCard>
          <TableLoading label="Cargando vigencias especiales…" />
        </TableCard>
      ) : puedeEditar ? (
        <VigenciaEspecialSection vigencias={vigencias} puedeEditar />
      ) : (
        <VigenciaEspecialCoordinadorSection vigencias={vigencias} />
      )}
    </AppLayout>
  )
}
