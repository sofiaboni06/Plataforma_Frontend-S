import { Link } from 'react-router-dom'
import { ExcelIcon, ProgramIcon } from '@/shared/components/icons/AppIcons'
import { useAssignedPrograms } from '@/modules/materiales-formacion/lib/useAssignedPrograms'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import { TableCard, TableEmpty, TableHeader, TableRow, tableClass } from '@/shared/components/DataTable'

export default function AssignedPrograms() {
  const { can } = useFormacionAccess()
  const { canSeePrograms, programs, loading, error, retry } = useAssignedPrograms()
  const puedeLista = can('listas', 'view')

  if (!canSeePrograms) return null

  return (
    <section className="mt-9">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProgramIcon className="size-7 shrink-0 text-sena-dark" />
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-sena-dark sm:text-2xl">
              Mis programas de formación
            </h2>
            <p className="mt-0.5 text-sm text-sena-strong">
              Desde Acciones abres la lista de materiales de cada programa.
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
        <p className="rounded-[22px] bg-white/90 px-6 py-6 text-sm text-sena-strong shadow-card ring-1 ring-sena-line">
          Cargando tus programas…
        </p>
      ) : error ? (
        <div className="flex flex-col gap-3 rounded-[22px] bg-sena-danger-soft px-6 py-5 text-sm text-sena-danger-text ring-1 ring-sena-danger-line sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={retry}
            className="w-fit rounded-full bg-white/70 px-4 py-1.5 font-semibold transition hover:bg-white"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <TableCard>
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr className="border-b border-sena-hairline bg-sena-soft/85">
                  <TableHeader>Programa</TableHeader>
                  <TableHeader>Red / Línea</TableHeader>
                  <TableHeader>Acciones</TableHeader>
                </tr>
              </thead>
              <tbody>
                {programs.length === 0 ? (
                  <TableEmpty colSpan={3}>
                    Aún no tienes programas asignados. Un administrador debe asignártelos desde Formación.
                  </TableEmpty>
                ) : (
                  programs.slice(0, 6).map((programa) => (
                    <TableRow key={programa.id}>
                      <td>
                        <p className="font-semibold text-sena-text">{programa.nombre}</p>
                        <p className="text-xs text-sena-strong">{programa.codigo}</p>
                      </td>
                      <td>
                        <p>{programa.redConocimiento?.nombre ?? '—'}</p>
                        <p className="text-xs text-sena-strong">{programa.lineaTematica?.nombre ?? '—'}</p>
                      </td>
                      <td>
                        {puedeLista ? (
                          <Link
                            to={`/formacion/listas-maestras-material?programaId=${programa.id}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sena-line bg-white px-3 text-xs font-semibold text-sena-dark shadow-hairline transition hover:border-sena/45 hover:text-sena"
                          >
                            <ExcelIcon className="size-[14px]" />
                            Lista de materiales
                          </Link>
                        ) : null}
                      </td>
                    </TableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}
    </section>
  )
}
