import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  CalendarIcon,
  InventoryIcon,
  PencilIcon,
  ProgramIcon,
  ReportIcon,
  UserIcon,
} from '@/shared/components/icons/AppIcons'
import { api } from '@/shared/lib/api'
import { esPerfilProgramas } from '@/modules/materiales-formacion/lib/formacion'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import type {
  Ficha,
  LineaTematica,
  NivelPrograma,
  ProgramaFormacion,
  RedConocimiento,
} from '@/modules/materiales-formacion/types/formacion'
import type { ManagedUser } from '@/shared/types/profile'
import type { ComponentType, SVGProps } from 'react'

type Section = {
  to: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  noun: { one: string; many: string }
  accent: string
}

const SECTIONS: Section[] = [
  {
    to: '/formacion/programas',
    description:
      'Cree y edite los programas: código, versión, nivel, red, línea, duración y cupo base.',
    icon: ProgramIcon,
    noun: { one: 'programa activo', many: 'programas activos' },
    accent: 'bg-sena-soft text-sena-dark',
  },
  {
    to: '/formacion/fichas',
    description:
      'Las fichas son las que ofrecen un programa en un centro. Sin ficha, el programa no aparece para ese centro.',
    icon: CalendarIcon,
    noun: { one: 'ficha activa', many: 'fichas activas' },
    accent: 'bg-sena-active-soft text-sena-ok-text',
  },
  {
    to: '/formacion/redes',
    description: 'Agrupe las líneas temáticas y registre los datos del gestor y del asesor.',
    icon: ReportIcon,
    noun: { one: 'red activa', many: 'redes activas' },
    accent: 'bg-sena-veil text-sena-strong',
  },
  {
    to: '/formacion/lineas',
    description: 'Son la segunda parte de un programa. Después de crearlas, asígnelas a una red.',
    icon: PencilIcon,
    noun: { one: 'línea activa', many: 'líneas activas' },
    accent: 'bg-sena-veil text-sena-strong',
  },
  {
    to: '/formacion/niveles',
    description: 'Catálogo corto con los niveles de formación: técnico, tecnólogo, entre otros.',
    icon: InventoryIcon,
    noun: { one: 'nivel', many: 'niveles' },
    accent: 'bg-sena-veil text-sena-strong',
  },
  {
    to: '/formacion/instructores',
    description:
      'Elija un instructor o coordinador y marque los programas de su centro. Así verá «Materiales de formación».',
    icon: UserIcon,
    noun: { one: 'instructor o coordinador', many: 'instructores y coordinadores' },
    accent: 'bg-sena-veil text-sena-strong',
  },
]

const number = new Intl.NumberFormat('es-CO')

export default function FormacionHomePage() {
  const [counts, setCounts] = useState<Record<string, number | null>>({})
  const { isAdmin, screens } = useFormacionAccess()

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Formación | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const usersRequest = isAdmin
        ? api<ManagedUser[]>('/users')
        : Promise.resolve<ManagedUser[]>([])

      const [programas, fichas, redes, lineas, niveles, users] = await Promise.allSettled([
        api<ProgramaFormacion[]>('/programas-formacion'),
        api<Ficha[]>('/fichas'),
        api<RedConocimiento[]>('/redes-conocimiento'),
        api<LineaTematica[]>('/lineas-tematicas'),
        api<NivelPrograma[]>('/niveles-programa'),
        usersRequest,
      ])

      if (cancelled) return

      const size = (result: PromiseSettledResult<unknown[]>) =>
        result.status === 'fulfilled' ? result.value.length : null

      setCounts({
        '/formacion/programas': size(programas),
        '/formacion/fichas': size(fichas),
        '/formacion/redes': size(redes),
        '/formacion/lineas': size(lineas),
        '/formacion/niveles': size(niveles),
        '/formacion/instructores':
          users.status === 'fulfilled'
            ? users.value.filter((user) => esPerfilProgramas(user.role)).length
            : null,
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const sections = screens.map((screen) => ({
    screen,
    section: SECTIONS.find((item) => item.to === screen.to),
    total: counts[screen.to],
  }))

  const countValue = (total: number | null | undefined) =>
    total === undefined ? '…' : total === null ? '—' : number.format(total)

  return (
    <AppLayout title="Formación">
      {/* ============ BANNER ============ */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#002e1f] via-[#005c3b] to-[#008a4c] text-white shadow-surface">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute inset-y-0 right-0 w-[46%] bg-gradient-to-l from-black/35 via-black/10 to-transparent" />
          <span className="absolute top-6 right-[30%] hidden h-40 w-10 rotate-12 rounded-lg bg-white/[0.07] sm:block" />
          <span className="absolute top-2 right-[24%] hidden h-48 w-10 rotate-12 rounded-lg bg-white/[0.05] sm:block" />
          <span className="absolute top-10 right-[18%] hidden h-36 w-10 rotate-12 rounded-lg bg-white/[0.08] sm:block" />
          <span className="absolute -top-16 -left-10 size-64 rounded-full bg-[#00a651]/25 blur-3xl" />
          <span className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-black/25 blur-3xl" />
        </span>

        <div className="relative flex flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-white/80">Bienvenido al módulo de</p>
            <h1 className="mt-0.5 text-3xl font-bold tracking-tight">Formación</h1>
            <p className="mt-2 max-w-md text-[0.8125rem] leading-5 text-white/80">
              Administre la estructura de formación y asigne a cada instructor o coordinador los
              programas que tiene a cargo en su centro.
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {sections.map(({ screen, section, total }) => {
                const Icon = section?.icon ?? ProgramIcon
                return (
                  <div
                    key={screen.to}
                    className="rounded-2xl bg-white/10 px-3.5 py-3 ring-1 ring-white/20 backdrop-blur-sm"
                  >
                    <dt className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-white/80">
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{screen.label}</span>
                    </dt>
                    <dd className="mt-1 text-lg font-bold">{countValue(total)}</dd>
                  </div>
                )
              })}
            </dl>
          </div>

          <p className="shrink-0 text-right font-serif text-lg leading-snug text-white/90 italic lg:max-w-[13rem]">
            Programas, fichas, redes, líneas y niveles, en un solo lugar
          </p>
        </div>
      </section>

      {/* ============ ESTRUCTURA ============ */}
      <section className="mt-4 rounded-[24px] border border-glass-line bg-glass/75 px-5 py-5 shadow-hairline backdrop-blur-glass sm:px-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-sena-dark">
          <span className="grid size-7 place-items-center rounded-full bg-sena-soft text-sena-dark">
            <ProgramIcon className="size-4" />
          </span>
          Estructura de formación
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map(({ screen, section, total }) => {
            const Icon = section?.icon ?? ProgramIcon
            const noun = section?.noun.many ?? ''
            const label =
              total == null
                ? countValue(total)
                : `${countValue(total)} ${total === 1 ? section?.noun.one ?? '' : noun}`.trim()

            return (
              <Link
                key={screen.to}
                to={screen.to}
                className="group flex min-h-[10rem] flex-col rounded-2xl border border-white/70 bg-white/85 px-4 py-4 shadow-hairline transition duration-150 hover:-translate-y-0.5 hover:shadow-surface focus-visible:ring-2 focus-visible:ring-sena focus-visible:outline-none"
              >
                <span
                  className={`grid size-9 place-items-center rounded-xl ${
                    section?.accent ?? 'bg-sena-soft text-sena-dark'
                  }`}
                >
                  <Icon className="size-5" />
                </span>

                <h3 className="mt-2.5 text-sm font-bold text-sena-dark">{screen.label}</h3>

                <p className="mt-1 text-xs leading-5 text-sena-text/65">{section?.description}</p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <span className="rounded-full bg-sena-soft px-2.5 py-1 text-[0.6875rem] font-bold text-sena-dark">
                    {label}
                  </span>

                  <span className="text-xs font-semibold text-sena-strong transition duration-150 group-hover:translate-x-0.5">
                    Abrir →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </AppLayout>
  )
}
