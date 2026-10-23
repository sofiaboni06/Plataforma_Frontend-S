import { useEffect, useRef, useState } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import {
  ClearFiltersButton,
  FilterCard,
  PageHeader,
  SearchInput,
} from '@/shared/components/DataTable'
import { PencilIcon, PlusIcon } from '@/shared/components/icons/AppIcons'
import CatalogoEstructuraNav from '@/modules/materiales-formacion/components/CatalogoEstructuraNav'
import LineasTab from '@/modules/materiales-formacion/components/LineasTab'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import type { FormacionTabHandle } from '@/modules/materiales-formacion/components/types'

export default function LineasTematicasPage() {
  const { can } = useFormacionAccess()
  const [search, setSearch] = useState('')
  const tabRef = useRef<FormacionTabHandle>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Líneas temáticas | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <AppLayout title="Líneas temáticas">
      <PageHeader
        icon={<PencilIcon />}
        title="Líneas temáticas"
        description="Las líneas de red son la segunda parte de un programa. Después de crearlas, asígnelas a una red de conocimiento."
        action={
          can('lineas', 'create') ? (
            <Button
              type="button"
              icon={<PlusIcon className="size-4" />}
              onClick={() => tabRef.current?.openCreate()}
            >
              Nueva línea
            </Button>
          ) : undefined
        }
      />

      <CatalogoEstructuraNav />

      <FilterCard>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar línea por nombre, descripción o red..."
        />

        <ClearFiltersButton onClick={() => setSearch('')} disabled={!search} />
      </FilterCard>

      <LineasTab ref={tabRef} search={search} onCatalogChanged={() => undefined} />
    </AppLayout>
  )
}
