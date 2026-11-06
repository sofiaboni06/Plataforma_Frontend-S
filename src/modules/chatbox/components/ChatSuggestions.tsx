/**
 * ChatSuggestions.tsx
 *
 * Preguntas sugeridas de acceso rápido. Enviar una de ellas envía un
 * mensaje real (nunca una respuesta simulada): el asistente responde
 * desde el backend o desde la base de conocimiento local, igual que
 * si el usuario la escribiera a mano.
 */

import { FiMessageCircle } from 'react-icons/fi'
import { SUGGESTED_QUESTIONS } from '../knowledge/knowledgeSources'

type Props = {
  visible: boolean
  onSelect: (text: string) => void
}

export function ChatSuggestions({ visible, onSelect }: Props) {
  if (!visible) return null

  return (
    <div className="sigma-chat-suggestions">
      <p className="sigma-chat-suggestions-label">Preguntas frecuentes</p>
      <ul>
        {SUGGESTED_QUESTIONS.map((question) => (
          <li key={question}>
            <button type="button" className="sigma-chat-suggestion" onClick={() => onSelect(question)}>
              <FiMessageCircle aria-hidden="true" />
              <span>{question}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
