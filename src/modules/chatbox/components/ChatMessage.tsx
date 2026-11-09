/**
 * ChatMessage.tsx
 *
 * Burbuja individual. Distingue con texto (no solo color):
 *   - quién habla (Asistente SIGMA / Tú),
 *   - si es una respuesta documentada local o del backend conectado,
 *   - si el envío falló.
 * Las referencias se muestran como fuentes citables.
 */

import { FiAlertCircle, FiFileText, FiUser } from 'react-icons/fi'
import { FaRobot } from 'react-icons/fa'
import type { ChatKnowledgeReference, ChatMessage as ChatMessageType } from '../types/chat.types'

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ReferenceList({ references }: { references: ChatKnowledgeReference[] }) {
  return (
    <ul className="sigma-chat-refs" aria-label="Fuentes consultadas">
      {references.slice(0, 3).map((reference) => (
        <li key={`${reference.id}-${reference.title}`} className="sigma-chat-ref">
          <span className="sigma-chat-ref-title">{reference.title}</span>
          <span className="sigma-chat-ref-meta">
            {reference.source ?? reference.route ?? reference.kind} · v{reference.version} ·{' '}
            {reference.updatedAt}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === 'user'
  const failed = message.status === 'error'

  return (
    <article className="sigma-chat-msg" data-role={message.role} data-status={message.status}>
      <span className="sigma-chat-avatar" aria-hidden="true">
        {isUser ? <FiUser /> : <FaRobot />}
      </span>

      <div className="sigma-chat-msg-body">
        <p className="sigma-chat-meta">
          <span className="sigma-chat-author">{isUser ? 'Tú' : 'Asistente SIGMA'}</span>
          <time className="sigma-chat-time" dateTime={new Date(message.timestamp).toISOString()}>
            {formatTime(message.timestamp)}
          </time>
        </p>

        <div className="sigma-chat-bubble">
          {message.content.split('\n').map((line, index) =>
            line.trim() === '' ? (
              <br key={`br-${index}`} />
            ) : (
              <p className="sigma-chat-text" key={`line-${index}`}>
                {line}
              </p>
            ),
          )}
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <ul className="sigma-chat-files" aria-label="Archivos adjuntos">
            {message.attachments.map((file) => (
              <li key={file.id} className="sigma-chat-file">
                <FiFileText aria-hidden="true" />
                <span>{file.name}</span>
              </li>
            ))}
          </ul>
        )}

        {!isUser && message.references && message.references.length > 0 && (
          <ReferenceList references={message.references} />
        )}

        <p className="sigma-chat-flags">
          {!isUser && message.origin === 'local' && (
            <span className="sigma-chat-flag">Documentación local</span>
          )}
          {failed && (
            <span className="sigma-chat-flag sigma-chat-flag--error">
              <FiAlertCircle aria-hidden="true" /> No se pudo enviar
            </span>
          )}
        </p>
      </div>
    </article>
  )
}
