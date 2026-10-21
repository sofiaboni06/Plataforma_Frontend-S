import type { ProgramaFormacion } from '@/modules/materiales-formacion/types/formacion'

export default function ProgramCard({ programa }: { programa: ProgramaFormacion }) {
  return (
    <article className="flex h-full flex-col rounded-[22px] bg-white/90 px-6 py-5 shadow-card ring-1 ring-sena-line backdrop-blur-glass-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-sena-soft px-3 py-1 text-[0.6875rem] font-bold tracking-[0.08em] text-sena-dark uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-sena" />
          {programa.codigo}
        </span>

        {programa.nivel ? (
          <span className="rounded-full bg-sena-veil px-3 py-1 text-[0.6875rem] font-semibold text-sena-strong">
            {programa.nivel.nombre}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-lg leading-snug font-bold tracking-tight text-sena-dark">
        {programa.nombre}
      </h3>

      <p className="mt-1.5 text-sm leading-6 text-sena-text/65">
        {[programa.redConocimiento?.nombre, programa.lineaTematica?.nombre]
          .filter(Boolean)
          .join(' · ') || 'Sin red de conocimiento asignada'}
      </p>

      <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-sena-line/70 pt-4 text-sm">
        <div>
          <dt className="text-[0.6875rem] font-bold tracking-[0.08em] text-sena-text/50 uppercase">
            Duración
          </dt>
          <dd className="mt-0.5 font-semibold text-sena-dark">
            {programa.duracionTotalHoras != null
              ? `${programa.duracionTotalHoras} horas`
              : 'Sin definir'}
          </dd>
        </div>

        <div>
          <dt className="text-[0.6875rem] font-bold tracking-[0.08em] text-sena-text/50 uppercase">
            Cupo base
          </dt>
          <dd className="mt-0.5 font-semibold text-sena-dark">
            {programa.cupoBaseAprendices} aprendices
          </dd>
        </div>
      </dl>
    </article>
  )
}
