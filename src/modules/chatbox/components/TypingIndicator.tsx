/**
 * TypingIndicator.tsx
 *
 * Indicador de "escribiendo…". Se muestra mientras el asistente
 * responde. Respeta prefers-reduced-motion (puntos estáticos).
 */

export function TypingIndicator() {
  return (
    <div className="sigma-chat-typing" role="status" aria-label="El Asistente SIGMA está escribiendo">
      <span className="sigma-chat-typing__avatar" aria-hidden="true">
        <img src="/marca-sena.svg" alt="" width={18} height={18} />
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
