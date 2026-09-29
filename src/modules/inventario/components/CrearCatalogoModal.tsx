import { useState, type FormEvent } from 'react'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import TextField from '@/shared/components/ui/TextField'
import { ApiError } from '@/shared/lib/api'
import {
  createClasificacion,
  createCodigoEstandar,
  createUnidadMedida,
  createUsoPresupuestal,
} from '@/modules/inventario/data/elemento'
import type {
  CatalogoElementoKind,
  ClasificacionElementoApi,
  CodigoEstandarApi,
  UnidadMedidaApi,
  UsoPresupuestalApi,
} from '@/modules/inventario/types/elemento'

export type CatalogoCreado =
  | ClasificacionElementoApi
  | UnidadMedidaApi
  | CodigoEstandarApi
  | UsoPresupuestalApi

const COPY: Record<CatalogoElementoKind, { title: string; description: string }> = {
  clasificacion: {
    title: 'Nueva clasificación',
    description: 'Queda en el centro de la bodega elegida.',
  },
  unidad: {
    title: 'Nueva unidad de medida',
    description: 'Sin una unidad de este centro no se puede guardar el elemento.',
  },
  uso: {
    title: 'Nuevo uso presupuestal',
    description: 'Es la partida del centro, no el código UNSPSC.',
  },
  codigo: {
    title: 'Nuevo código UNSPSC',
    description: 'El elemento guardará el id de esta fila, no el código escrito a mano.',
  },
}

export default function CrearCatalogoModal({
  kind,
  idCformacion,
  isAdmin,
  onClose,
  onCreated,
}: {
  kind: CatalogoElementoKind
  idCformacion: number | null
  isAdmin: boolean
  onClose: () => void
  onCreated: (kind: CatalogoElementoKind, row: CatalogoCreado) => void
}) {
  const [nombre, setNombre] = useState('')
  const [abreviatura, setAbreviatura] = useState('')
  const [codigo, setCodigo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const copy = COPY[kind]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanNombre = nombre.trim()
    const cleanAbreviatura = abreviatura.trim()
    const cleanCodigo = codigo.trim()
    if (!cleanNombre) {
      setError('Escribe el nombre.')
      return
    }
    if (kind === 'unidad' && !cleanAbreviatura) {
      setError('Escribe la abreviatura.')
      return
    }
    if (kind === 'codigo' && !cleanCodigo) {
      setError('Escribe el código UNSPSC.')
      return
    }

    const center = isAdmin && idCformacion ? { idCformacion } : {}

    try {
      setSaving(true)
      setError(null)
      const created =
        kind === 'clasificacion'
          ? await createClasificacion({ nombre: cleanNombre, ...center })
          : kind === 'unidad'
            ? await createUnidadMedida({
                nombre: cleanNombre,
                abreviatura: cleanAbreviatura,
                ...center,
              })
            : kind === 'uso'
              ? await createUsoPresupuestal({ nombre: cleanNombre, ...center })
              : await createCodigoEstandar({ codigo: cleanCodigo, nombre: cleanNombre, ...center })
      onCreated(kind, created)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo crear el registro.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={copy.title} description={copy.description} onClose={() => !saving && onClose()}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {kind === 'codigo' ? (
          <TextField
            id="alta-codigo"
            label="Código UNSPSC *"
            maxLength={20}
            value={codigo}
            onChange={(event) => setCodigo(event.target.value)}
            required
          />
        ) : null}
        <TextField
          id="alta-nombre"
          label="Nombre *"
          maxLength={kind === 'unidad' ? 80 : kind === 'clasificacion' ? 150 : 200}
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          required
        />
        {kind === 'unidad' ? (
          <TextField
            id="alta-abreviatura"
            label="Abreviatura *"
            maxLength={20}
            value={abreviatura}
            onChange={(event) => setAbreviatura(event.target.value)}
            required
          />
        ) : null}
        <div className="flex justify-end gap-3 border-t border-sena-text/8 pt-5">
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
