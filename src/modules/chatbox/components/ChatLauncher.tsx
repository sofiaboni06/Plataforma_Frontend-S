/**
 * ChatLauncher.tsx
 *
 * Punto de entrada del asistente. Renderiza el botón flotante (FAB)
 * y mantiene montada la ventana de conversación para que la transición
 * de apertura/cierre sea interrumpible (animación cancelable).
 *
 * El FAB es el ÚNICO control de abrir/cerrar (los estados salen del
 * store, nunca de estado local): cerrado abre, abierto cierra y
 * minimizado restaura. Además adscribe el store al usuario autenticado
 * para que dos cuentas nunca compartan historial.
 *
 * Es el único componente que consume `useChat`, de modo que el estado
 * vive en el store del módulo y sobrevive a los cambios de ruta.
 */

import { useEffect } from 'react'
import { FiMessageSquare } from 'react-icons/fi'
import { ChatWindow } from './ChatWindow'
import { useChat } from '../hooks/useChat'
import { useAuth } from '@/modules/auth/context/auth'
import '@/modules/chatbox/styles/chatbox.css'

export default function ChatLauncher() {
  const chat = useChat()
  const { syncOwner } = chat
  const { user } = useAuth()
  const userId = user?.id ?? null

  // El store queda adscrito al usuario autenticado: si cambia la cuenta,
  // se limpia para no mezclar historiales (nada de localStorage).
  useEffect(() => {
    syncOwner(userId)
  }, [syncOwner, userId])

  const expanded = chat.isOpen && !chat.isMinimized
  const label = !chat.isOpen
    ? 'Abrir Asistente SIGMA'
    : chat.isMinimized
      ? 'Restaurar Asistente SIGMA'
      : 'Cerrar Asistente SIGMA'

  return (
    <>
      <button
        type="button"
        className="sigma-chat-fab"
        onClick={chat.toggle}
        aria-label={label}
        aria-expanded={expanded}
        aria-controls="sigma-chat-window"
        data-open={chat.isOpen}
        data-minimized={chat.isMinimized}
      >
        <span className="sigma-chat-fab__icon" aria-hidden="true">
          <FiMessageSquare />
        </span>
        <span className="sigma-chat-fab__label" aria-hidden="true">
          Asistente SIGMA
        </span>
      </button>

      <ChatWindow chat={chat} />
    </>
  )
}
