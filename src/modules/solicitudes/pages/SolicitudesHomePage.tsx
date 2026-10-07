import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { PageHeader } from '@/shared/components/DataTable'
import { InventoryIcon } from '@/shared/components/icons/AppIcons'
import { useAuth } from '@/modules/auth/context/auth'

const OPTIONS = [
  {
    code: 'equipo',
    title: 'Equipo devolutivo',
    description: 'Herramientas, maquinaria y equipos que se prestan y después se devuelven.',
    to: '/inventario/solicitudes/equipo',
    permissions: ['solicitud_equipo.ver', 'solicitud_equipo.crear', 'solicitud_equipo.entregar', 'solicitud_equipo.devolver'],
  },
  {
    code: 'material',
    title: 'Material de consumo',
    description: 'Materiales que se gastan en la obra, como pintura, cemento o lija.',
    to: '/inventario/solicitudes/material',
    permissions: ['solicitud_material.ver', 'solicitud_material.crear', 'solicitud_material.entregar'],
  },
] as const

export default function SolicitudesHomePage() {
  const { user, isAdmin } = useAuth()
  const permissions = user?.permissions ?? []
  const options = OPTIONS.filter((option) =>
    option.permissions.some((code) => permissions.includes(code)),
  )
  const canRequest =
    !isAdmin &&
    (permissions.includes('solicitud_equipo.crear') || permissions.includes('solicitud_material.crear'))

  return (
    <AppLayout title="Solicitudes">
      <PageHeader
        icon={<InventoryIcon />}
        title="Solicitudes"
        description={
          canRequest
            ? 'Elige si vas a pedir equipo devolutivo o material de consumo. Van separados.'
            : 'Revisa las solicitudes de los instructores. El equipo devolutivo y el material de consumo se manejan por separado.'
        }
      />

      {options.length ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {options.map((option) => (
            <article
              key={option.code}
              className="group flex flex-col rounded-[20px] border border-white/70 bg-white/85 p-6 shadow-surface backdrop-blur-glass transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <h2 className="text-base font-bold text-sena-dark">{option.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-sena-text-soft">{option.description}</p>
              <Link
                to={option.to}
                className="mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-[14px] border border-white/70 bg-sena-veil/85 px-5 text-sm font-semibold text-sena-strong backdrop-blur-glass-sm transition duration-150 group-hover:border-transparent group-hover:bg-sena group-hover:text-white group-hover:shadow-brand"
              >
                Abrir
                <span aria-hidden="true" className="grid size-6 place-items-center rounded-lg">
                  →
                </span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-[20px] border border-white/70 bg-white/85 px-5 py-6 text-sm text-sena-text-soft shadow-surface backdrop-blur-glass">
          Tu perfil no tiene solicitudes de equipo ni de material.
        </p>
      )}
    </AppLayout>
  )
}
