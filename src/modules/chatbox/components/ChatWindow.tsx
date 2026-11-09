/**
 * ChatWindow.tsx
 *
 * Ventana flotante de conversación. Se mantiene SIEMPRE montada y se
 * controla con `data-open` / `data-minimized` + `inert`, de modo que:
 *   - el cierre y la apertura sean animaciones cancelables,
 *   - el contenido no sea enfocable ni leído por lectores cuando está
 *     cerrada,
 *   - minimizar conserve la conversación (solo colapsa el cuerpo).
 *
 * Conversación vacía → pantalla inicial centrada con saludo personalizado
 * (nombre del usuario autenticado) + carrusel de sugerencias. Con
 * mensajes → hilo normal. El cierre lo gestiona el FAB, no la cabecera.
 */

import { useEffect, useRef, useState } from 'react'
import { FaRobot } from 'react-icons/fa'
import { ChatHeader } from './ChatHeader'
import { ChatHistory } from './ChatHistory'
import { ChatMessages } from './ChatMessages'
import { ChatSuggestions } from './ChatSuggestions'
import { ChatInput } from './ChatInput'
import { useAuth } from '@/modules/auth/context/auth'
import type { ChatController } from '../hooks/useChat'

type Props = { chat: ChatController }

export function ChatWindow({ chat }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const { isOpen, isMinimized, minimize } = chat
  const { user } = useAuth()

  // Nombre desde el MISMO origen que el encabezado del perfil (useAuth):
  // primera palabra del fullName; sin consulta adicional ni valores fijos.
  const firstName = (user?.fullName || user?.nombres || '').trim().split(/\s+/)[0] || ''

  // Solo se bloquea el conjunto cuando la ventana está cerrada. Al
  // minimizar, la cabecera debe seguir operable (restaurar);
  // el cuerpo ya queda fuera del flujo por `display: none`.
  const hidden = !isOpen

  // Escape: primero cierra el historial; si no, minimiza la ventana
  // (sin interferir con otros diálogos).
  useEffect(() => {
    if (!isOpen) return undefined

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (isHistoryOpen) {
        setIsHistoryOpen(false)
        return
      }
      const panel = panelRef.current
      const focusInside =
        panel !== null && document.activeElement !== null && panel.contains(document.activeElement)
      if (!focusInside) {
        const otherDialog = document.querySelector('[role="dialog"]:not(#sigma-chat-window)')
        if (otherDialog) return
      }
      minimize()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isHistoryOpen, minimize])

  // Minimizar también cierra el panel (vive en el cuerpo, que se oculta).
  function handleMinimize() {
    setIsHistoryOpen(false)
    minimize()
  }

  // Al abrir la ventana, el foco pasa al campo de texto. NO depende de
  // `isHistoryOpen`: al cerrar el panel, ChatHistory devuelve el foco al
  // botón de la cabecera que lo abrió (sin que este efecto lo robe).
  useEffect(() => {
    if (!isOpen || isMinimized) return undefined
    const id = window.setTimeout(() => inputRef.current?.focus(), 140)
    return () => window.clearTimeout(id)
  }, [isOpen, isMinimized])

  const isEmptyConversation = chat.messages.length === 0

  return (
    <div
      id="sigma-chat-window"
      ref={panelRef}
      className="sigma-chat-window"
      role="dialog"
      aria-label="Asistente SIGMA"
      aria-modal="false"
      data-open={chat.isOpen}
      data-minimized={chat.isMinimized}
      inert={hidden}
    >
      <ChatHeader
        isMinimized={chat.isMinimized}
        isHistoryOpen={isHistoryOpen}
        onMinimize={handleMinimize}
        onToggleHistory={() => setIsHistoryOpen((open) => !open)}
        onReset={chat.reset}
        canReset={chat.messages.length > 0}
      />

      <div className="sigma-chat-window__body">
        {isEmptyConversation ? (
          /* Pantalla inicial limpia: sin mensaje automático del asistente. */
          <section className="sigma-chat-hero">
            <span className="sigma-chat-hero__badge" aria-hidden="true">
              <FaRobot />
            </span>
            <h2 className="sigma-chat-hero__title">
              Hola{firstName ? `, ${firstName}` : ''}
            </h2>
            <p className="sigma-chat-hero__subtitle">¿En qué puedo ayudarte?</p>
            <ChatSuggestions onSelect={chat.send} />
          </section>
        ) : (
          <ChatMessages
            messages={chat.messages}
            isSending={chat.isSending}
            notice={chat.notice}
            onDismissNotice={chat.dismissNotice}
            error={chat.error}
            onRetry={chat.retryLastUserMessage}
          />
        )}

        <ChatInput
          ref={inputRef}
          value={chat.draft}
          isSending={chat.isSending}
          onChange={chat.setDraft}
          onSend={chat.send}
        />

        <ChatHistory
          open={isHistoryOpen}
          conversations={chat.conversations}
          activeId={chat.conversationId}
          onSelect={chat.selectConversation}
          onNew={chat.reset}
          onClose={() => setIsHistoryOpen(false)}
        />
      </div>
    </div>
  )
}
