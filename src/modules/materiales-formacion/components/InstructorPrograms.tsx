import { Link } from 'react-router-dom'
import { ProgramIcon } from '@/shared/components/icons/AppIcons'
import ProgramCard from '@/modules/materiales-formacion/components/ProgramCard'
import { useInstructorPrograms } from '@/modules/materiales-formacion/lib/useInstructorPrograms'

export default function InstructorPrograms() {
  const { instructor, programs, loading, error, retry } = useInstructorPrograms()

  if (!instructor) return null

  return (
    <section className="mt-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProgramIcon className="size-7 shrink-0 text-sena-dark" />

          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-sena-dark sm:text-2xl">
              Mis programas de formación
            </h2>
            <p className="mt-0.5 text-sm text-sena-text/60">
              Materiales y programas que un administrador te asignó.
            </p>
          </div>
        </div>

        {programs.length ? (
          <Link
            to="/materiales-formacion"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-sena-line bg-white/90 px-5 py-2.5 text-sm font-semibold text-sena-dark shadow-hairline transition duration-150 hover:border-sena/45 hover:bg-white"
          >
            Ver todos
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-5 rounded-[22px] bg-white/90 px-6 py-6 text-sm text-sena-text/60 shadow-card ring-1 ring-sena-line">
          Cargando tus programas…
        </p>
      ) : error ? (
        <div className="mt-5 flex flex-col gap-3 rounded-[22px] bg-sena-danger-soft px-6 py-5 text-sm text-sena-danger-text ring-1 ring-sena-danger-line sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={retry}
            className="w-fit rounded-full bg-white/70 px-4 py-1.5 font-semibold transition hover:bg-white"
          >
            Reintentar
          </button>
        </div>
      ) : programs.length === 0 ? (
        <p className="mt-5 rounded-[22px] bg-white/90 px-6 py-6 text-sm text-sena-text/60 shadow-card ring-1 ring-sena-line">
          Aún no tienes programas asignados. Un administrador debe asignártelos desde el módulo
          Formación.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {programs.map((programa) => (
            <ProgramCard key={programa.id} programa={programa} />
          ))}
        </div>
      )}
    </section>
  )
}
