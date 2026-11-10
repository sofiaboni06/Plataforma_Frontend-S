/**
 * ChatInput.tsx
 *
 * Campo de entrada del asistente.
 *   - Enter envía, Shift+Enter agrega salto de línea.
 *   - Se deshabilita mientras el asistente responde.
 *   - Adjuntos opcionales (máx. 3 archivos, 5 MB c/u) que viajan en la
 *     petición al backend; nunca se suben a un endpoint que no exista.
 *   - Contador de caracteres al acercarse al límite de 1000.
 */

import { useId, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, Ref } from 'react'
import { FiPaperclip, FiSend, FiX } from 'react-icons/fi'
import type { ChatAttachment } from '../types/chat.types'

const MAX_LENGTH = 1000
const MAX_FILES = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024

type Props = {
  ref?: Ref<HTMLTextAreaElement>
  value: string
  isSending: boolean
  onChange: (value: string) => void
  onSend: (text: string, attachments?: ChatAttachment[]) => void | Promise<boolean>
}

export function ChatInput({ ref, value, isSending, onChange, onSend }: Props) {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const counterId = useId()

  const tooLong = value.length > MAX_LENGTH
  const canSend = !isSending && !tooLong && value.trim().length > 0

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    if (!canSend) return
    void submit()
  }

  async function submit() {
    const text = value
    const files = attachments
    const sent = await onSend(text, files)
    if (sent !== false) {
      files.forEach((file) => URL.revokeObjectURL(file.url))
      setAttachments([])
      setFileError(null)
    }
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    setFileError(null)

    const accepted: ChatAttachment[] = []
    for (const file of files) {
      if (attachments.length + accepted.length >= MAX_FILES) {
        setFileError(`Puedes adjuntar máximo ${MAX_FILES} archivos.`)
        break
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" supera los 5 MB.`)
        continue
      }
      accepted.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: URL.createObjectURL(file),
      })
    }
    if (accepted.length) setAttachments((current) => [...current, ...accepted])
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const target = current.find((file) => file.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return current.filter((file) => file.id !== id)
    })
  }

  return (
    <div className="sigma-chat-input">
      {attachments.length > 0 && (
        <ul className="sigma-chat-files" aria-label="Archivos seleccionados">
          {attachments.map((file) => (
            <li key={file.id} className="sigma-chat-file">
              <FiPaperclip aria-hidden="true" />
              <span className="sigma-chat-file__name">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(file.id)}
                aria-label={`Quitar ${file.name}`}
              >
                <FiX aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="sigma-chat-input__row">
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          multiple
          onChange={handleFiles}
          aria-label="Adjuntar archivos"
          tabIndex={-1}
        />
        <button
          type="button"
          className="sigma-chat-iconbtn sigma-chat-input__attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          aria-label="Adjuntar archivos"
          title="Adjuntar archivos (máx. 3, 5 MB c/u)"
        >
          <FiPaperclip aria-hidden="true" />
        </button>

        <label htmlFor={inputId} className="sr-only">
          Escribe tu pregunta para el Asistente SIGMA
        </label>
        <textarea
          id={inputId}
          ref={ref}
          className="sigma-chat-field"
          value={value}
          rows={1}
          maxLength={MAX_LENGTH + 100}
          placeholder="Escribe tu pregunta…"
          disabled={isSending}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-describedby={value.length > 800 ? counterId : undefined}
        />

        <button
          type="button"
          className="sigma-chat-send"
          onClick={() => void submit()}
          disabled={!canSend}
          aria-label="Enviar mensaje"
          title="Enviar (Enter)"
        >
          <FiSend aria-hidden="true" />
        </button>
      </div>

      <div className="sigma-chat-input__footer">
        <p className="sigma-chat-input__hint">
          Enter para enviar · Shift + Enter para salto de línea
        </p>
        {value.length > 800 && (
          <p
            id={counterId}
            className={`sigma-chat-input__counter ${tooLong ? 'is-over' : ''}`}
            role={tooLong ? 'alert' : undefined}
          >
            {value.length}/{MAX_LENGTH}
          </p>
        )}
      </div>

      {fileError && (
        <p className="sigma-chat-input__error" role="alert">
          {fileError}
        </p>
      )}
    </div>
  )
}
