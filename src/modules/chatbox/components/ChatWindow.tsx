/**
 * ChatWindow.tsx
 *
 * Ventana flotante de conversación. Se mantiene SIEMPRE montada y se
 * controla con `data-open` / `data-minimized` + `inert`, de modo que:
 *   - el cierre y la apertura sean animaciones cancelables,
 *   - el contenido no sea enfocable ni leído por lectores cuando está
 *     cerrada,
 *   - minimizar conserve la conversación (solo colapsa el cuerpo).
 */

import { useEffect, useRef } from 'react'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatSuggestions } from './ChatSuggestions'
import { ChatInput } from './ChatInput'
import type { ChatController } from '../hooks/useChat'

type Props = { chat: ChatController }

export function ChatWindow({ chat }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { isOpen, isMinimized, minimize } = chat
  // Solo se bloquea el conjunto cuando la ventana está cerrada. Al
  // minimizar, la cabecera debe seguir operable (restaurar / cerrar);
  // el cuerpo ya queda fuera del flujo por `display: none`.
  const hidden = !isOpen

  // Escape minimiza la ventana (sin interferir con otros diálogos).
  useEffect(() => {
    if (!isOpen) return undefined

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
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
  }, [isOpen, minimize])

  // Al abrir, el foco pasa al campo de texto para escribir de inmediato.
  useEffect(() => {
    if (!isOpen || isMinimized) return undefined
    const id = window.setTimeout(() => inputRef.current?.focus(), 140)
    return () => window.clearTimeout(id)
  }, [isOpen, isMinimized])

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
        onMinimize={chat.minimize}
        onClose={chat.close}
        onReset={chat.reset}
        canReset={chat.messages.length > 1}
      />

      <div className="sigma-chat-window__body">
        <ChatMessages
          messages={chat.messages}
          isSending={chat.isSending}
          notice={chat.notice}
          onDismissNotice={chat.dismissNotice}
          error={chat.error}
          onRetry={chat.retryLastUserMessage}
        />

        <ChatSuggestions visible={chat.messages.length <= 1 && !chat.isSending} onSelect={chat.send} />

        <ChatInput
          ref={inputRef}
          value={chat.draft}
          isSending={chat.isSending}
          onChange={chat.setDraft}
          onSend={chat.send}
        />
      </div>
    </div>
  )
}
