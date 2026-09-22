import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AppLayout from '@/shared/components/layout/AppLayout'
import StandForm from '@/modules/inventario/components/StandForm'
import { createStand } from '@/modules/inventario/data/bodega'
import type { CreateStandPayload, UpdateStandPayload } from '@/modules/inventario/types/bodega'

export default function CreateStandPage() {
  const navigate = useNavigate()
  const { id_bodega } = useParams<{ id_bodega: string }>()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (values: CreateStandPayload | UpdateStandPayload) => {
    if (!id_bodega) {
      setError('No se encontró la bodega.')
      return
    }

    const createPayload: CreateStandPayload = values as CreateStandPayload

    try {
      setLoading(true)
      setError('')

      await createStand(id_bodega, createPayload)

      navigate(`/inventario/bodegas/${id_bodega}`)
    } catch (err) {
      console.error(err)
      setError('No se pudo crear el stand.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (id_bodega) {
      navigate(`/inventario/bodegas/${id_bodega}`)
    } else {
      navigate('/inventario/bodegas')
    }
  }

  return (
    <AppLayout title="">
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-semibold">
          Crear stand
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <StandForm
          mode="create"
          loading={loading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AppLayout>
  )
}
  