/**
 * ChatLauncher.tsx
 *
 * Punto de entrada del asistente. Renderiza el botón flotante (FAB)
 * y mantiene montada la ventana de conversación para que la transición
 * de apertura/cierre sea interrumpible (animación cancelable).
 *
 * Es el único componente que consume `useChat`, de modo que el estado
 * vive en el store del módulo y sobrevive a los cambios de ruta.
 */

import { FiMessageSquare } from 'react-icons/fi'
import { ChatWindow } from './ChatWindow'
import { useChat } from '../hooks/useChat'
import '@/modules/chatbox/styles/chatbox.css'

export default function ChatLauncher() {
  const chat = useChat()

  return (
    <>
      <button
        type="button"
        className="sigma-chat-fab"
        onClick={chat.open}
        aria-label="Abrir Asistente SIGMA"
        aria-expanded={chat.isOpen}
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
