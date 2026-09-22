import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import BodegaForm from '@/modules/inventario/components/BodegaForm'
import {
  createStand,
  deleteStand,
  getBodega,
  updateStand,
  updateBodega,
} from '@/modules/inventario/data/bodega'
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
    stands?: Array<{
      id?: number
      nombre: string
      estado: boolean
    }>
  }) {
    if (!id) return

    await updateBodega(id, {
      nombre: data.nombre,
      estado: data.estado,
      ...(data.idCformacion
        ? { idCformacion: data.idCformacion }
        : {}),
    })

    if (data.stands) {
      const originalStandIds = new Set(
        bodega?.stands.map((stand) => stand.id) ?? [],
      )
      const currentStandIds = new Set(
        data.stands
          .map((stand) => stand.id)
          .filter((standId): standId is number => Boolean(standId)),
      )

      for (const stand of data.stands) {
        if (stand.id) {
          await updateStand(stand.id, {
            nombre: stand.nombre,
            estado: stand.estado,
          })
        } else {
          await createStand(id, {
            nombre: stand.nombre,
            estado: stand.estado,
          })
        }
      }

      for (const originalStandId of originalStandIds) {
        if (!currentStandIds.has(originalStandId)) {
          await deleteStand(originalStandId)
        }
      }
    }

    navigate(`/inventario/bodegas/${id}`, {
      replace: true,
    })
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

  if (!bodega) {
    return null
  }

  return (
    <AppLayout title="Editar bodega">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-sena/90">
            Inventario / Bodega
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-sena-text sm:text-3xl">
            Editar bodega
          </h1>
          <p className="mt-1 text-sm text-sena-text/55">
            Actualiza la información y el estado de la bodega.
          </p>
        </div>

        <BodegaForm
          mode="edit"
          initialData={bodega}
          onSubmit={handleUpdate}
        />
      </div>
    </AppLayout>
  )
}