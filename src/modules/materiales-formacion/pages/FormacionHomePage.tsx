import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { PageHeader } from '@/shared/components/DataTable'
import {
  CalendarIcon,
  InventoryIcon,
  PencilIcon,
  ProgramIcon,
  ReportIcon,
  UserIcon,
} from '@/shared/components/icons/AppIcons'
import { api } from '@/shared/lib/api'
import { esPerfilInstructor } from '@/modules/materiales-formacion/lib/formacion'
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
    description:
      'Son la segunda parte de un programa. Después de crearlas, asígnelas a una red.',
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
      'Elija un instructor y marque los programas de su centro que dicta. Así verá «Materiales de formación».',
    icon: UserIcon,
    noun: { one: 'instructor', many: 'instructores' },
    accent: 'bg-sena-veil text-sena-strong',
  },
]

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
            ? users.value.filter((user) => esPerfilInstructor(user.role)).length
            : null,
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  return (
    <AppLayout title="Formación">
      <PageHeader
        icon={<ProgramIcon />}
        title="Formación"
        description="Administre la estructura de formación y asigne a cada instructor los programas que dicta en su centro."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {screens.map((screen) => {
          const section = SECTIONS.find((item) => item.to === screen.to)
          const Icon = section?.icon ?? ProgramIcon
          const total = counts[screen.to]
          const noun = section?.noun.many ?? ''
          const value =
            total == null ? '—' : `${total} ${total === 1 ? section?.noun.one ?? '' : noun}`.trim()

          return (
            <Link
              key={screen.to}
              to={screen.to}
              className="group flex h-full flex-col rounded-[22px] bg-white/90 px-6 py-5 shadow-card ring-1 ring-sena-line backdrop-blur-glass-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-surface focus-visible:ring-2 focus-visible:ring-sena focus-visible:outline-none"
            >
              <span
                className={`grid size-11 place-items-center rounded-2xl ${
                  section?.accent ?? 'bg-sena-soft text-sena-dark'
                }`}
              >
                <Icon className="size-5" />
              </span>

              <h2 className="mt-4 text-lg leading-snug font-bold tracking-tight text-sena-dark">
                {screen.label}
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-sena-text/65">
                {section?.description}
              </p>

              <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                <span className="rounded-full bg-sena-soft px-3 py-1 text-[0.6875rem] font-bold tracking-[0.06em] text-sena-dark uppercase">
                  {value}
                </span>

                <span className="text-sm font-semibold text-sena transition duration-150 group-hover:translate-x-0.5">
                  Abrir →
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </AppLayout>
  )
}
