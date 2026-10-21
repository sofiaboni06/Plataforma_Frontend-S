import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  ClearFiltersButton,
  FilterCard,
  PageHeader,
  SearchInput,
} from '@/shared/components/DataTable'
import { ProgramIcon } from '@/shared/components/icons/AppIcons'
import ProgramCard from '@/modules/materiales-formacion/components/ProgramCard'
import { useInstructorPrograms } from '@/modules/materiales-formacion/lib/useInstructorPrograms'

export default function MaterialesFormacionPage() {
  const { instructor, programs, loading, error, retry } = useInstructorPrograms()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Materiales de formación | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return programs

    return programs.filter((programa) =>
      `${programa.codigo} ${programa.nombre} ${programa.nivel?.nombre ?? ''} ${
        programa.redConocimiento?.nombre ?? ''
      } ${programa.lineaTematica?.nombre ?? ''}`
        .toLowerCase()
        .includes(query),
    )
  }, [programs, search])

  const totalHoras = programs.reduce(
    (total, programa) => total + (programa.duracionTotalHoras ?? 0),
    0,
  )
  const totalCupo = programs.reduce(
    (total, programa) => total + programa.cupoBaseAprendices,
    0,
  )

  if (!instructor) return null

  return (
    <AppLayout title="Materiales de formación">
      <PageHeader
        icon={<ProgramIcon />}
        title="Materiales de formación"
        description="Consulta los programas que tienes asignados. Desde aquí puedes revisar su código, nivel, red, línea, duración y cupo base."
      />

      {error ? (
        <div className="mb-4 flex flex-col gap-3 rounded-[18px] bg-sena-danger-soft px-5 py-3.5 text-sm text-sena-danger-text ring-1 ring-sena-danger-line sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={retry}
            className="w-fit shrink-0 rounded-full bg-white/70 px-4 py-1.5 font-semibold transition hover:bg-white"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!error && !loading ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Programas asignados" value={String(programs.length)} />
          <Stat label="Horas de formación" value={`${totalHoras} h`} />
          <Stat label="Cupo base total" value={`${totalCupo} aprendices`} />
        </div>
      ) : null}

      <FilterCard>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, programa, red o línea..."
        />

        <ClearFiltersButton onClick={() => setSearch('')} disabled={!search} />
      </FilterCard>

      {loading ? (
        <p className="rounded-[26px] bg-white/90 px-6 py-16 text-center text-sm text-sena-text-soft shadow-surface ring-1 ring-sena-line">
          Cargando tus programas de formación…
        </p>
      ) : programs.length === 0 ? (
        <div className="rounded-[26px] bg-white/90 px-6 py-14 text-center shadow-surface ring-1 ring-sena-line">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-sena-soft text-sena-dark">
            <ProgramIcon className="size-8" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-sena-dark">Aún no tienes programas asignados</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-sena-text/60">
            Un administrador debe asignarte los programas desde el módulo Formación. Cuando lo haga,
            aparecerán aquí y en tu inicio.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-[26px] bg-white/90 px-6 py-16 text-center text-sm text-sena-text-soft shadow-surface ring-1 ring-sena-line">
          No hay programas que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((programa) => (
            <ProgramCard key={programa.id} programa={programa} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-white/90 px-5 py-4 shadow-card ring-1 ring-sena-line">
      <p className="text-[0.6875rem] font-bold tracking-[0.1em] text-sena-text/50 uppercase">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tracking-tight text-sena-dark">{value}</p>
    </div>
  )
}
