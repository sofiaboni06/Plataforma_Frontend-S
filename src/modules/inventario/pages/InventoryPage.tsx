import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { PageHeader } from '@/shared/components/DataTable'
import { InventoryIcon } from '@/shared/components/icons/AppIcons'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'

export default function InventoryPage() {
  const { screens } = useInventoryAccess()

  return (
    <AppLayout title="Inventario">
      <PageHeader
        icon={<InventoryIcon />}
        title="Inventario"
        description="Entra a la sección que te corresponde. Crear, ver y editar se hacen dentro de cada lista."
      />

      {screens.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {screens.map((screen) => (
            <article
              key={screen.to}
              className="group flex flex-col rounded-[20px] border border-white/70 bg-white/85 p-6 shadow-surface backdrop-blur-glass transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <h2 className="text-base font-bold text-sena-dark">{screen.label}</h2>

              <p className="mt-2 flex-1 text-sm leading-6 text-sena-text-soft">
                {screen.description}
              </p>

              <Link
                to={screen.to}
                className="mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-[14px] border border-white/70 bg-sena-veil/85 px-5 text-sm font-semibold text-sena-strong backdrop-blur-glass-sm transition duration-150 group-hover:border-transparent group-hover:bg-sena group-hover:text-white group-hover:shadow-brand"
              >
                Abrir
                <span
                  aria-hidden="true"
                  className="grid size-6 place-items-center rounded-lg text-sena-strong transition duration-150 group-hover:text-white"
                >
                  →
                </span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-[20px] border border-white/70 bg-white/85 px-5 py-6 text-sm text-sena-text-soft shadow-surface backdrop-blur-glass">
          Tu perfil no tiene secciones de inventario asignadas.
        </p>
      )}
    </AppLayout>
  )
}