import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/context/auth'
import AppLayout from '@/shared/components/layout/AppLayout'
import BodegaForm from '@/modules/inventario/components/BodegaForm'
import { createBodega } from '@/modules/inventario/data/bodega'

export default function CreateBodegaPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  async function handleCreate(data: {
    nombre: string
    estado: boolean
    idCformacion?: number
  }) {
    const created = await createBodega(data)
    const otherCenter =
      data.idCformacion != null && data.idCformacion !== user?.trainingCenterId
    if (otherCenter) {
      navigate('/usuarios', { replace: true })
      return
    }
    navigate(`/inventario/bodegas/${created.id}`, { replace: true })
  }

  return (
    <AppLayout title="Crear bodega">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-sena/90">Inventario / Bodega</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-sena-text sm:text-3xl">
            Crear bodega
          </h1>
          <p className="mt-1 text-sm text-sena-text/55">
            Elige el centro. La bodega de otro centro no se abre aquí: se asigna después en Usuarios.
          </p>
        </div>
        <BodegaForm mode="create" onSubmit={handleCreate} />
      </div>
    </AppLayout>
  )
}
