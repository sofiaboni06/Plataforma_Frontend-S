import { useEffect, useRef, useState } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import {
  ClearFiltersButton,
  FilterCard,
  PageHeader,
  SearchInput,
} from '@/shared/components/DataTable'
import { PlusIcon, ReportIcon } from '@/shared/components/icons/AppIcons'
import CatalogoEstructuraNav from '@/modules/materiales-formacion/components/CatalogoEstructuraNav'
import RedesTab from '@/modules/materiales-formacion/components/RedesTab'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import type { FormacionTabHandle } from '@/modules/materiales-formacion/components/types'

export default function RedesConocimientoPage() {
  const { can } = useFormacionAccess()
  const [search, setSearch] = useState('')
  const tabRef = useRef<FormacionTabHandle>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Redes de conocimiento | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <AppLayout title="Redes de conocimiento">
      <PageHeader
        icon={<ReportIcon />}
        title="Redes de conocimiento"
        description="Agrupe las líneas temáticas y registre los datos del gestor y del asesor de cada red."
        action={
          can('redes', 'create') ? (
            <Button
              type="button"
              icon={<PlusIcon className="size-4" />}
              onClick={() => tabRef.current?.openCreate()}
            >
              Nueva red
            </Button>
          ) : undefined
        }
      />

      <CatalogoEstructuraNav />

      <FilterCard>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar red por nombre, gestor, asesor o línea..."
        />

        <ClearFiltersButton onClick={() => setSearch('')} disabled={!search} />
      </FilterCard>

      <RedesTab ref={tabRef} search={search} onCatalogChanged={() => undefined} />
    </AppLayout>
  )
}
