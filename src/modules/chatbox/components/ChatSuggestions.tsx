/**
 * ChatSuggestions.tsx
 *
 * Carrusel horizontal de preguntas sugeridas (pantalla inicial). Usar
 * una tarjeta envía un mensaje real por el mecanismo existente (nunca
 * una respuesta simulada): el asistente responde desde el backend o
 * desde la base de conocimiento local, igual que si se escribiera a mano.
 *
 * Desplazamiento con snap, swipe táctil y botones anterior/siguiente que
 * se deshabilitan en los extremos. Mismas preguntas del proyecto
 * (`knowledgeSources.SUGGESTED_QUESTIONS`), sin inventar nuevas.
 */

import { useEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiMessageCircle } from 'react-icons/fi'
import { SUGGESTED_QUESTIONS } from '../knowledge/knowledgeSources'

type Props = {
  onSelect: (text: string) => void
}

export function ChatSuggestions({ onSelect }: Props) {
  const listRef = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  function updateControls() {
    const node = listRef.current
    if (!node) return
    const max = node.scrollWidth - node.clientWidth
    setAtStart(node.scrollLeft <= 4)
    setAtEnd(max <= 4 || node.scrollLeft >= max - 4)
  }

  useEffect(() => {
    updateControls()
    window.addEventListener('resize', updateControls)
    return () => window.removeEventListener('resize', updateControls)
    // Se recalcula al montar y en cada scroll/resize (ver onScroll).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function scroll(direction: -1 | 1) {
    const node = listRef.current
    if (!node) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const step = Math.min(260, Math.max(160, node.clientWidth * 0.7))
    node.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <div className="sigma-chat-carousel">
      <button
        type="button"
        className="sigma-chat-carousel__nav sigma-chat-carousel__nav--prev"
        onClick={() => scroll(-1)}
        disabled={atStart}
        aria-label="Ver sugerencias anteriores"
        tabIndex={atStart ? -1 : 0}
      >
        <FiChevronLeft aria-hidden="true" />
      </button>

      <ul className="sigma-chat-carousel__list" ref={listRef} onScroll={updateControls}>
        {SUGGESTED_QUESTIONS.map((question) => (
          <li key={question} className="sigma-chat-carousel__item">
            <button
              type="button"
              className="sigma-chat-carousel__card"
              onClick={() => onSelect(question)}
            >
              <FiMessageCircle aria-hidden="true" />
              <span>{question}</span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="sigma-chat-carousel__nav sigma-chat-carousel__nav--next"
        onClick={() => scroll(1)}
        disabled={atEnd}
        aria-label="Ver sugerencias siguientes"
        tabIndex={atEnd ? -1 : 0}
      >
        <FiChevronRight aria-hidden="true" />
      </button>
    </div>
  )
}
