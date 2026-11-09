/**
 * TypingIndicator.tsx
 *
 * Indicador de "escribiendo…" con tres puntos que aparecen EN SECUENCIA
 * (1 → 2 → 3 y vuelve a empezar), al estilo ChatGPT. Se muestra mientras
 * el asistente responde. Respeta prefers-reduced-motion (sin animación).
 */

import { FaRobot } from 'react-icons/fa'

export function TypingIndicator() {
  return (
    <div className="sigma-chat-typing" role="status" aria-label="El Asistente SIGMA está escribiendo">
      <span className="sigma-chat-typing__avatar" aria-hidden="true">
        <FaRobot />
      </span>
      <span className="sigma-chat-typing__bubble" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="sigma-chat-typing__label">Escribiendo…</span>
    </div>
  )
}
