import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import BodegaForm from '@/modules/inventario/components/BodegaForm'
import { getBodega, updateBodega } from '@/modules/inventario/data/bodega'
import type { BodegaApi } from '@/modules/inventario/types/bodega'

export default function EditBodegaPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [bodega, setBodega] = useState<BodegaApi | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      navigate('/inventario/bodegas', { replace: true })
      return
    }

    async function load(currentId: string) {
      try {
        const result = await getBodega(currentId)
        if (!result) {
          navigate('/inventario/bodegas', { replace: true })
          return
        }
        setBodega(result)
      } catch {
        navigate('/inventario/bodegas', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    void load(id)
  }, [id, navigate])

  async function handleUpdate(data: {
    nombre: string
    estado: boolean
    idCformacion?: number
  }) {
    if (!id) return
    await updateBodega(id, data)
    navigate(`/inventario/bodegas/${id}`, { replace: true })
  }

  if (loading) {
    return (
      <AppLayout title="Editar bodega">
        <div className="mx-auto max-w-3xl py-12 text-center text-sm text-sena-text/50">
          Cargando bodega...
        </div>
      </AppLayout>
    )
  }

  if (!bodega) return null

  return (
    <AppLayout title="Editar bodega">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-sena/90">Inventario / Bodega</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-sena-text sm:text-3xl">
            Editar bodega
          </h1>
          <p className="mt-1 text-sm text-sena-text/55">
            Actualiza el nombre y el estado. El centro no se cambia.
          </p>
        </div>
        <BodegaForm mode="edit" initialData={bodega} onSubmit={handleUpdate} />
      </div>
    </AppLayout>
  )
}
