import { useState, type FormEvent } from 'react'

import { ApiError } from '@/shared/lib/api'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import { ErrorBanner } from '@/shared/components/DataTable'

import { getSolicitante } from '@/modules/solicitudes/data/solicitudes'
import { inputClass, personName } from '@/modules/solicitudes/lib/presentacion'

import type { FacturaTipo, SolicitanteApi } from '@/modules/solicitudes/types'

const TIPO_LABEL: Record<FacturaTipo, string> = {
  consumo: 'consumo',
  devolutivo: 'devolutivos',
}

/*
 * Primer paso del mostrador: el instructor llega sin la app y bodega lo busca
 * por documento. Solo sigue si la cuenta está activa y puede pedir alguno de
 * los tipos que esta bodega entrega.
 */
export default function SolicitanteModal({
  tipos,
  idPropio,
  inicial = '',
  onClose,
  onConfirm,
}: {
  tipos: FacturaTipo[]
  idPropio: number | undefined
  inicial?: string
  onClose: () => void
  onConfirm: (solicitante: SolicitanteApi, tipos: FacturaTipo[]) => void
}) {
  const [documento, setDocumento] = useState(inicial)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')
  const [encontrado, setEncontrado] = useState<SolicitanteApi | null>(null)

  const permitidos = encontrado
    ? tipos.filter((tipo) => (tipo === 'consumo' ? encontrado.puedeConsumo : encontrado.puedeDevolutivo))
    : []

  const motivo = !encontrado
    ? ''
    : encontrado.id === idPropio
      ? 'No puedes registrarte una solicitud a tu nombre.'
      : !encontrado.activo
        ? 'La cuenta está inactiva. Pídele que hable con el administrador.'
        : permitidos.length === 0
          ? `Su perfil no puede pedir ${tipos.map((tipo) => TIPO_LABEL[tipo]).join(' ni ')}.`
          : ''

  const buscar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const valor = documento.trim()
    setError('')
    setEncontrado(null)

    if (!valor) {
      setError('Escribe el número de documento.')
      return
    }

    setBuscando(true)

    try {
      setEncontrado(await getSolicitante(valor))
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo buscar a la persona.')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <Modal
      title="Registrar en el mostrador"
      description="Para quien llega a la bodega sin entrar a la aplicación. Búscalo por su documento."
      onClose={onClose}
    >
      <div className="space-y-5">
        {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}

        <form onSubmit={buscar} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
          <label className="block flex-1">
            <span className="mb-2 block text-sm font-semibold text-sena-text">
              Número de documento <span className="text-sena">*</span>
            </span>
            <input
              value={documento}
              onChange={(event) => {
                setDocumento(event.target.value)
                setEncontrado(null)
              }}
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={30}
              placeholder="Ej. 1001001005"
              className={inputClass}
            />
          </label>
          <Button type="submit" size="sm" disabled={buscando} className="sm:h-[46px]">
            {buscando ? 'Buscando...' : 'Buscar'}
          </Button>
        </form>

        {encontrado ? (
          <div className="rounded-2xl border border-sena-line bg-white/65 px-4 py-3">
            <p className="text-sm font-semibold text-sena-text">{personName(encontrado)}</p>
            <p className="mt-0.5 text-xs text-sena-text-soft">
              {encontrado.tipoDocumento ?? 'Documento'} {encontrado.numeroDocumento} ·{' '}
              {encontrado.email}
            </p>
            {motivo ? (
              <p className="mt-2 text-xs font-semibold text-sena-danger-text">{motivo}</p>
            ) : (
              <p className="mt-2 text-xs text-sena-strong">
                Puede pedir {permitidos.map((tipo) => TIPO_LABEL[tipo]).join(' y ')}.
              </p>
            )}
          </div>
        ) : null}

        <div className="flex justify-end gap-3 border-t border-sena-hairline pt-5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={!encontrado || motivo !== ''}
            onClick={() => encontrado && onConfirm(encontrado, permitidos)}
          >
            Continuar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
