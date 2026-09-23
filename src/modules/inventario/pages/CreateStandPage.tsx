import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function CreateStandPage() {
  const navigate = useNavigate()
  const { id_bodega } = useParams<{ id_bodega: string }>()

  useEffect(() => {
    if (!id_bodega) {
      navigate('/inventario/bodegas', { replace: true })
      return
    }

    navigate(`/inventario/bodegas/${id_bodega}`, {
      replace: true,
      state: { openCreateStand: true },
    })
  }, [id_bodega, navigate])

  return null
}
