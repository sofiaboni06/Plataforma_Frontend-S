/**
 * ChatMessages.tsx
 *
 * Hilo de conversación: mensajes del usuario (derecha) y del asistente
 * (izquierda), indicador de escritura, aviso de modo documentación y
 * manejo de errores de conexión. Auto-scroll suave al final del hilo.
 */

import { useEffect, useRef } from 'react'
import { FiAlertTriangle, FiRotateCcw } from 'react-icons/fi'
import { ChatMessage as ChatMessageItem } from './ChatMessage'
import { TypingIndicator } from './TypingIndicator'
import type { ChatMessage } from '../types/chat.types'

type Props = {
  messages: ChatMessage[]
  isSending: boolean
  notice: string | null
  onDismissNotice: () => void
  error: string | null
  onRetry: () => void
}

export function ChatMessages({ messages, isSending, notice, onDismissNotice, error, onRetry }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)

  // Auto-scroll solo si el usuario está (o estaba) al final del hilo,
  // para no arrastrar el scroll cuando lee mensajes anteriores.
  useEffect(() => {
    const node = scrollRef.current
    if (!node || !pinnedRef.current) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollTo({ top: node.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [messages, isSending, error])

  function onScroll() {
    const node = scrollRef.current
    if (!node) return
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight
    pinnedRef.current = distance < 80
  }

  return (
    <div
      className="sigma-chat-messages"
      ref={scrollRef}
      onScroll={onScroll}
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Conversación con el Asistente SIGMA"
    >
      {notice && (
        <div className="sigma-chat-notice" role="status">
          <span className="sigma-chat-notice__text">{notice}</span>
          <button type="button" className="sigma-chat-notice__close" onClick={onDismissNotice} aria-label="Descartar aviso">
            ×
          </button>
        </div>
      )}

      <ol className="sigma-chat-messages__list">
        {messages.map((message) => (
          <li key={message.id}>
            <ChatMessageItem message={message} />
          </li>
        ))}
      </ol>

      {isSending && (
        <div className="sigma-chat-typingrow">
          <TypingIndicator />
        </div>
      )}

      {error && (
        <div className="sigma-chat-error" role="alert">
          <FiAlertTriangle aria-hidden="true" />
          <span className="sigma-chat-error__text">{error}</span>
          <button type="button" className="sigma-chat-error__retry" onClick={onRetry}>
            <FiRotateCcw aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

    </div>
  )
}
