/**
 * ChatHistory.tsx
 *
 * Panel lateral de conversaciones estilo ChatGPT, DENTRO de la ventana
 * del asistente (nunca por encima de la app ni con scrolls propios que
 * desborden). Se desliza sobre el cuerpo de la conversación y se cierra
 * al seleccionar, al pulsar su botón, con Escape o con el fondo.
 *
 * Persistencia honesta: mientras el backend no publique
 * GET /api/v1/chat/conversations (docs/chat-contract.md §4), la lista
 * procede del store en memoria, ya adscrito al usuario autenticado en
 * ChatLauncher — dos cuentas nunca comparten historial.
 */

import { useEffect, useRef } from 'react'
import { FiMessageSquare, FiPlus, FiX } from 'react-icons/fi'
import type { ChatConversation } from '../types/chat.types'

type Props = {
  open: boolean
  conversations: ChatConversation[]
  /** Conversación activa en el hilo visible (resaltada en la lista). */
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
  onClose: () => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatHistory({ open, conversations, activeId, onSelect, onNew, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  // Gestión de foco: al abrir, foco al panel; al cerrar, devolverlo al
  // botón de la cabecera que lo abrió.
  useEffect(() => {
    if (open) {
      closeRef.current?.focus()
    } else if (wasOpen.current) {
      document.getElementById('sigma-chat-history-toggle')?.focus()
    }
    wasOpen.current = open
  }, [open])

  function handleSelect(id: string) {
    onSelect(id)
    onClose()
  }

  return (
    <>
      <aside
        className={`sigma-chat-history${open ? ' is-open' : ''}`}
        aria-label="Historial de conversaciones"
        inert={!open}
      >
        <div className="sigma-chat-history__head">
          <p className="sigma-chat-history__title">Conversaciones</p>
          <button
            type="button"
            ref={closeRef}
            className="sigma-chat-iconbtn"
            onClick={onClose}
            aria-label="Cerrar el historial"
            title="Cerrar"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className="sigma-chat-history__new"
          onClick={() => {
            onNew()
            onClose()
          }}
        >
          <FiPlus aria-hidden="true" />
          <span>Nueva conversación</span>
        </button>

        <div className="sigma-chat-history__scroll">
          {conversations.length === 0 ? (
            <p className="sigma-chat-history__empty">
              Todavía no hay conversaciones guardadas. Los mensajes que envíes en esta sesión
              aparecerán aquí.
            </p>
          ) : (
            <ul className="sigma-chat-history__list">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeId
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      className={`sigma-chat-history__item${isActive ? ' is-active' : ''}`}
                      aria-current={isActive ? 'true' : undefined}
                      onClick={() => handleSelect(conversation.id)}
                      title={conversation.title}
                    >
                      <FiMessageSquare aria-hidden="true" />
                      <span className="sigma-chat-history__item-body">
                        <span className="sigma-chat-history__item-title">{conversation.title}</span>
                        <time
                          className="sigma-chat-history__item-time"
                          dateTime={new Date(conversation.updatedAt).toISOString()}
                        >
                          {formatTime(conversation.updatedAt)}
                        </time>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      <button
        type="button"
        className={`sigma-chat-history__scrim${open ? ' is-open' : ''}`}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        aria-label="Cerrar el historial"
      />
    </>
  )
}
