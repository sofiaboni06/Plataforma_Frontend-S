import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AppLayout from '@/shared/components/layout/AppLayout'
import StandForm from '@/modules/inventario/components/StandForm'
import {
  getStand,
  updateStand,
} from '@/modules/inventario/data/bodega'
import type {
  StandApi,
  UpdateStandPayload,
} from '@/modules/inventario/types/bodega'

export default function EditStandPage() {
  const navigate = useNavigate()

  const { id_bodega, id_stand } = useParams<{
    id_bodega: string
    id_stand: string
  }>()

  const standId = Number(id_stand)

  const [stand, setStand] = useState<StandApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id_stand) {
      setError('No se encontró el stand.')
      setLoading(false)
      return
    }

    async function loadStand() {
      try {
        setLoading(true)
        setError('')

        const result = await getStand(standId)

        if (!result) {
          setError('No se encontró el stand.')
          return
        }

        setStand(result)
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar el stand.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadStand()
  }, [id_stand])

  async function handleSubmit(values: UpdateStandPayload) {
    if (!id_stand) {
      setError('No se encontró el stand.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await updateStand(id_stand, values)

      navigate(
        `/inventario/bodegas/${id_bodega ?? ''}/stands/${id_stand}`,
      )
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'No se pudo actualizar el stand.',
      )
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    navigate(
      `/inventario/bodegas/${id_bodega ?? ''}/stands/${id_stand ?? ''}`,
    )
  }

  if (loading) {
    return (
      <AppLayout title="Editar stand">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-sena-text/50 shadow-sm ring-1 ring-sena-dark/8">
            Cargando stand...
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!stand) {
    return (
      <AppLayout title="Editar stand">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-sena-dark/8">
            <p className="text-sm text-red-600">
              {error || 'No se encontró el stand.'}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/inventario/bodegas/${id_bodega ?? ''}`,
                )
              }
              className="mt-5 rounded-lg bg-sena px-4 py-2 text-sm font-semibold text-white hover:bg-sena-dark"
            >
              Volver a la bodega
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Editar stand">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-sena/90">
            Inventario
          </p>

          <h1 className="mt-1 text-2xl font-bold text-sena-text">
            Editar stand
          </h1>

          <p className="mt-1 text-sm text-sena-text/55">
            Actualiza la información del stand.
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sena-dark/8 sm:p-7">
          <StandForm
            mode="edit"
            initialValues={{
              nombre: stand.nombre,
              estado: stand.estado,
            }}
            loading={saving}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </section>
      </div>
    </AppLayout>
  )
}