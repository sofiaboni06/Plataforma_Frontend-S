import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'

export default function InventoryPage() {
  const { screens } = useInventoryAccess()

  return (
    <AppLayout title="Inventario">
      <p className="text-sm font-medium text-sena">Inventario</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-sena-text">Inventario</h1>
      <p className="mt-2 max-w-2xl text-sm text-sena-text/60">
        Entra a la sección que te corresponde. Crear, ver y editar se hacen dentro de cada lista.
      </p>

      {screens.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {screens.map((screen) => (
            <article key={screen.to} className="rounded-2xl bg-white p-5">
              <h2 className="text-base font-semibold text-sena-text">{screen.label}</h2>
              <p className="mt-1 text-sm leading-5 text-sena-text/60">{screen.description}</p>
              <Link to={screen.to} className="mt-4 inline-flex items-center text-sm font-semibold text-sena">
                Abrir →
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl bg-white px-5 py-6 text-sm text-sena-text/60">
          Tu perfil no tiene secciones de inventario asignadas.
        </p>
      )}
    </AppLayout>
  )
}
