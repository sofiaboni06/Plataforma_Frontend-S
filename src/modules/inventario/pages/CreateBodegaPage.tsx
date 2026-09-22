import { useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import BodegaForm from '@/modules/inventario/components/BodegaForm'
import {
  createBodega,
  createStand,
} from '@/modules/inventario/data/bodega'

export default function CreateBodegaPage() {
  const navigate = useNavigate()

  async function handleCreate(data: {
    nombre: string
    estado: boolean
    idCformacion?: number
    stands?: Array<{
      nombre: string
      estado: boolean
    }>
  }) {
    const { stands = [], ...bodegaPayload } = data
    const createdBodega = await createBodega(bodegaPayload)

    for (const stand of stands) {
      await createStand(createdBodega.id, stand)
    }

    navigate('/inventario/bodegas', {
      replace: true,
      state: {
        message: 'Bodega creada correctamente.',
      },
    })
  }

  return (
    <AppLayout title="Crear bodega">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-sena/90">
            Inventario / Bodega
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-sena-text sm:text-3xl">
            Crear bodega
          </h1>
          <p className="mt-1 text-sm text-sena-text/55">
            Registra una nueva bodega para el centro de formación.
          </p>
        </div>

        <BodegaForm
          mode="create"
          onSubmit={handleCreate}
        />
      </div>
    </AppLayout>
  )
}