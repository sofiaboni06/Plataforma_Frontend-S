/**
 * ChatHeader.tsx
 *
 * Cabecera de la ventana: identidad del asistente, indicador honesto
 * de disponibilidad y acciones (historial, nueva conversación, minimizar).
 *
 * El cierre NO tiene botón aquí: lo gestiona el botón flotante (FAB),
 * que alterna abrir/cerrar/restaurar desde un único estado en el store.
 *
 * El indicador NUNCA afirma "Conectado" sin haberlo verificado:
 *   - checking    → "Verificando conexión…" (gris)
 *   - connected   → "Conectado" (verde) tras una respuesta real del backend
 *   - local-docs  → "IA no conectada · modo documentación" (ámbar)
 */

import { FiClock, FiMinus, FiRotateCcw } from 'react-icons/fi'
import { FaRobot } from 'react-icons/fa'
import { useChatBackendState } from '../hooks/useChat'
import type { ChatServiceStatus } from '../types/chat.types'

type Props = {
  isMinimized: boolean
  isHistoryOpen: boolean
  onMinimize: () => void
  onToggleHistory: () => void
  onReset: () => void
  canReset: boolean
}

const STATUS: Record<ChatServiceStatus, { label: string; state: string }> = {
  checking: { label: 'Verificando conexión…', state: 'checking' },
  connected: { label: 'Conectado', state: 'connected' },
  'local-docs': { label: 'IA no conectada · modo documentación', state: 'local' },
}

export function ChatHeader({
  isMinimized,
  isHistoryOpen,
  onMinimize,
  onToggleHistory,
  onReset,
  canReset,
}: Props) {
  const status = STATUS[useChatBackendState()]

  return (
    <header className="sigma-chat-header">
      <span className="sigma-chat-brand" aria-hidden="true">
        <FaRobot />
      </span>

      <div className="sigma-chat-titles">
        <p className="sigma-chat-title">Asistente SIGMA</p>
        <p className="sigma-chat-subtitle">¿En qué puedo ayudarte?</p>
        <p className="sigma-chat-status" data-state={status.state}>
          <span className="sigma-chat-status-dot" aria-hidden="true" />
          <span>{status.label}</span>
        </p>
      </div>

      <div className="sigma-chat-actions">
        <button
          type="button"
          id="sigma-chat-history-toggle"
          className="sigma-chat-iconbtn"
          onClick={onToggleHistory}
          aria-expanded={isHistoryOpen}
          aria-label="Historial de conversaciones"
          title="Historial"
        >
          <FiClock aria-hidden="true" />
        </button>
        {canReset && (
          <button
            type="button"
            className="sigma-chat-iconbtn"
            onClick={onReset}
            aria-label="Iniciar una conversación nueva"
            title="Nueva conversación"
          >
            <FiRotateCcw aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="sigma-chat-iconbtn"
          onClick={onMinimize}
          aria-expanded={!isMinimized}
          aria-label={isMinimized ? 'Restaurar la conversación' : 'Minimizar la conversación'}
          title={isMinimized ? 'Restaurar' : 'Minimizar'}
        >
          <FiMinus
            aria-hidden="true"
            style={isMinimized ? { transform: 'rotate(180deg)' } : undefined}
          />
        </button>
      </div>
    </header>
  )
}
