// src/modules/vigencias/pages/VigenciaFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import { ErrorBanner, PageHeader } from '@/shared/components/DataTable'
import { createVigencia, getVigencias, updateVigencia } from '@/modules/vigencias/data/vigencia'
import VigenciasPage from '@/modules/vigencias/pages/VigenciasPage'


export default function VigenciaFormPage() {
  const navigate = useNavigate()
  const { anio } = useParams<{ anio: string }>() // Si hay año en la URL, es edición
  const isEditing = Boolean(anio)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Estado del formulario
  const [formData, setFormData] = useState({
    anio: new Date().getFullYear(),
    activa: true,
    fecha_apertura: '',
    fecha_cierre: '',
  })

  useEffect(() => {
    document.title = isEditing ? `Editar Vigencia ${anio} | SENA` : 'Nueva Vigencia | SENA'
  }, [isEditing, anio])

  // Si es edición, cargamos los datos
  useEffect(() => {
    if (!isEditing) return

    async function load() {
      try {
        setLoading(true)
        const vigencias = await getVigencias()
        const vigencia = vigencias.find((v) => v.anio === Number(anio))
        
        if (!vigencia) {
          setError('Vigencia no encontrada')
          return
        }

        setFormData({
          anio: vigencia.anio,
          activa: vigencia.activa,
          fecha_apertura: vigencia.fechaApertura || '',
          fecha_cierre: vigencia.fechaCierre || '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la vigencia')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [anio, isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (isEditing) {
        await updateVigencia(Number(anio), formData)
      } else {
        await createVigencia(formData)
      }
      navigate('/vigencias') // Volver a la lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la vigencia')
    } finally {
      setSaving(false)
    }
  }

if (loading) {
  return (
    <AppLayout title="Cargando...">
      <div className="flex items-center justify-center p-12 text-sm text-sena-text/60">
        Cargando vigencia…
      </div>
    </AppLayout>
  )
}

  const formulario = (
    <form onSubmit={handleSubmit} className="form-fields flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="form-label">Año</label>
        <input
          type="number"
          name="anio"
          value={formData.anio}
          onChange={handleChange}
          disabled={isEditing}
          className="form-field"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="form-label">Fecha Apertura</label>
        <input
          type="date"
          name="fecha_apertura"
          value={formData.fecha_apertura}
          onChange={handleChange}
          className="form-field"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="form-label">Fecha Cierre</label>
        <input
          type="date"
          name="fecha_cierre"
          value={formData.fecha_cierre}
          onChange={handleChange}
          className="form-field"
          required
        />
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          name="activa"
          id="activa"
          checked={formData.activa}
          onChange={handleChange}
          className="size-4 rounded border-sena-line text-sena-dark focus:ring-sena-dark"
        />
        <label htmlFor="activa" className="text-sm font-medium text-sena-text">
          ¿Vigencia activa?
        </label>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <Button type="button" onClick={() => navigate('/vigencias')}>
        Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Vigencia'}
        </Button>
      </div>
    </form>
  )

  // Edición: se conserva la vista de página tal como existía.
  if (isEditing) {
    return (
      <AppLayout title="Editar Vigencia">
        <PageHeader
          title={`Editar Vigencia ${anio}`}
          description="Ingresa los datos de la vigencia fiscal."
        />

        {error && <ErrorBanner message={error} onClose={() => setError('')} />}

        <div className="form-panel mx-auto max-w-2xl p-6">{formulario}</div>
      </AppLayout>
    )
  }

  // Nueva vigencia: mismo patrón de modal que «Crear nueva ficha».
  return (
    <>
      <VigenciasPage />
      <Modal
        title="Nueva Vigencia"
        description="Ingresa los datos de la vigencia fiscal."
        onClose={() => navigate('/vigencias')}
        wide
        spacious
      >
        {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}
        {formulario}
      </Modal>
    </>
  )
}