import { useState, type KeyboardEvent } from 'react'

import { ApiError } from '@/shared/lib/api'
import Button from '@/shared/components/ui/Button'

import { getSolicitante } from '@/modules/solicitudes/data/solicitudes'
import {
  inputClass,
  inputErrorClass,
  personName,
  tiposDe,
} from '@/modules/solicitudes/lib/presentacion'

import type { FacturaTipo, SolicitanteApi } from '@/modules/solicitudes/types'

const TIPO_LABEL: Record<FacturaTipo, string> = {
  consumo: 'consumo',
  devolutivo: 'devolutivos',
}

/*
 * Mostrador: el instructor llega sin la app y bodega lo busca por documento.
 * Solo se elige si la cuenta está activa, no es la propia y puede pedir alguno
 * de los tipos que esta bodega entrega. Va dentro del formulario de la
 * solicitud, así que no es un <form>: Enter en el campo también busca.
 */
export default function BuscarSolicitante({
  tipos,
  idPropio,
  inicial = '',
  disabled = false,
  invalido = false,
  onElegir,
}: {
  tipos: FacturaTipo[]
  idPropio: number | undefined
  inicial?: string
  disabled?: boolean
  invalido?: boolean
  onElegir: (persona: SolicitanteApi) => void
}) {
  const [documento, setDocumento] = useState(inicial)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')
  const [rechazado, setRechazado] = useState<{ persona: SolicitanteApi; motivo: string } | null>(
    null,
  )

  const motivoDe = (persona: SolicitanteApi) => {
    if (persona.id === idPropio) return 'No puedes registrarte una solicitud a tu nombre.'
    if (!persona.activo) return 'La cuenta está inactiva. Pídele que hable con el administrador.'
    if (tiposDe(persona, tipos).length === 0) {
      return `Su perfil no puede pedir ${tipos.map((tipo) => TIPO_LABEL[tipo]).join(' ni ')}.`
    }
    return ''
  }

  const buscar = async () => {
    const valor = documento.trim()
    setError('')
    setRechazado(null)

    if (!valor) {
      setError('Escribe el número de documento.')
      return
    }

    setBuscando(true)

    try {
      const persona = await getSolicitante(valor)
      const motivo = motivoDe(persona)
      if (motivo) setRechazado({ persona, motivo })
      else onElegir(persona)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo buscar a la persona.')
    } finally {
      setBuscando(false)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    // Enter no envía la solicitud: busca a la persona.
    event.preventDefault()
    void buscar()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <label className="block flex-1">
          <span className="mb-2 flex flex-wrap items-center gap-x-2 text-sm font-semibold text-sena-text">
            Número de documento <span className="text-sena">*</span>
            <span className="text-xs font-normal text-sena-text-soft">
              De quien está en la bodega
            </span>
          </span>
          <input
            value={documento}
            onChange={(event) => {
              setDocumento(event.target.value)
              setRechazado(null)
              setError('')
            }}
            onKeyDown={onKeyDown}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={30}
            placeholder="Ej. 1001001005"
            aria-invalid={invalido || error !== ''}
            aria-describedby={error || rechazado ? 'buscar-solicitante-ayuda' : undefined}
            className={invalido || error ? inputErrorClass : inputClass}
            disabled={disabled}
          />
        </label>
        <Button
          type="button"
          size="sm"
          onClick={() => void buscar()}
          disabled={disabled || buscando}
          className="sm:h-[46px]"
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {error ? (
        <p
          id="buscar-solicitante-ayuda"
          role="alert"
          className="rounded-xl bg-sena-danger-soft px-4 py-2.5 text-xs font-semibold text-sena-danger-text"
        >
          {error}
        </p>
      ) : null}

      {rechazado ? (
        <div
          id="buscar-solicitante-ayuda"
          role="alert"
          className="rounded-2xl border border-sena-danger-line bg-white/65 px-4 py-4 sm:px-5"
        >
          <p className="text-sm font-semibold text-sena-text">{personName(rechazado.persona)}</p>
          <p className="mt-1 text-xs text-sena-text-soft">
            {rechazado.persona.tipoDocumento ?? 'Documento'} {rechazado.persona.numeroDocumento}
          </p>
          <p className="mt-2 text-xs font-semibold text-sena-danger-text">{rechazado.motivo}</p>
        </div>
      ) : null}
    </div>
  )
}
