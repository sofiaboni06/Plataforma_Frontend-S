/**
 * useChat.ts
 *
 * Store externo + hook del asistente.
 *
 * Por qué un store externo: AppLayout se desmonta y remonta en cada
 * cambio de ruta, así que un useState/useReducer dentro del componente
 * perdería la conversación al navegar. Este store vive a nivel de
 * módulo y la conversación se conserva mientras la pestaña esté abierta.
 *
 * Inmutabilidad: cada mutación crea un nuevo objeto/estado para que
 * useSyncExternalStore detecte el cambio.
 */

import { useCallback, useSyncExternalStore } from 'react'
import {
  OFFLINE_NOTICE,
  consumeOfflineNotice,
  getChatServiceStatus,
  sendMessage,
  subscribeChatServiceStatus,
} from '../services/chatService'
import { KNOWLEDGE_UPDATED_AT, KNOWLEDGE_VERSION } from '../knowledge/knowledgeSources'
import type {
  ChatAttachment,
  ChatKnowledgeReference,
  ChatMessage,
  ChatServiceStatus,
  ChatViewState,
} from '../types/chat.types'

type ChatListener = () => void

const MAX_MESSAGES = 200

function createWelcomeMessage(): ChatMessage {
  const now = Date.now()
  return {
    id: 'welcome',
    role: 'assistant',
    content:
      '¡Hola! Soy el Asistente SIGMA. Puedo explicarte cómo funciona la plataforma, ' +
      'guiarte paso a paso en los trámites documentados y decirte qué secciones habilita tu rol.\n\n' +
      '¿En qué puedo ayudarte?',
    timestamp: now,
    status: 'sent',
    origin: 'local',
    offline: false,
    knowledgeVersion: KNOWLEDGE_VERSION,
    knowledgeUpdatedAt: KNOWLEDGE_UPDATED_AT,
    attachments: [],
  }
}

/** Estado inicial del store. */
function createInitialState(): ChatViewState {
  return {
    isOpen: false,
    isMinimized: false,
    conversationId: crypto.randomUUID(),
    messages: [createWelcomeMessage()],
    draft: '',
    isSending: false,
    error: null,
    notice: null,
    hasPendingRequest: false,
  }
}

let state: ChatViewState = createInitialState()
const listeners = new Set<ChatListener>()

function emit(): void {
  listeners.forEach((listener) => listener())
}

function setState(patch: Partial<ChatViewState>): void {
  state = { ...state, ...patch }
  emit()
}

function subscribe(listener: ChatListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): ChatViewState {
  return state
}

/** Append inmutable de mensajes, recortado al máximo permitido. */
function appendMessages(incoming: ChatMessage[]): ChatMessage[] {
  const merged = [...state.messages, ...incoming]
  if (merged.length <= MAX_MESSAGES) return merged
  return merged.slice(merged.length - MAX_MESSAGES)
}

function updateMessage(id: string, patch: Partial<ChatMessage>): void {
  let changed = false
  const messages = state.messages.map((message) => {
    if (message.id !== id) return message
    changed = true
    return { ...message, ...patch }
  })
  if (changed) setState({ messages })
}

/* ------------------------------ acciones ------------------------------ */

function open(): void {
  setState({ isOpen: true, isMinimized: false, error: null })
}

function minimize(): void {
  // Minimizar conserva la conversación; solo cambia la vista.
  setState({ isMinimized: true })
}

function close(): void {
  // Cerrar reinicia la conversación (la ventana flotante arranca siempre
  // en un estado limpio; minimizar, en cambio, la conserva).
  state = createInitialState()
  emit()
}

function setDraft(draft: string): void {
  setState({ draft })
}

function dismissError(): void {
  if (state.error !== null) setState({ error: null })
}

function dismissNotice(): void {
  if (state.notice !== null) setState({ notice: null })
}

/**
 * Envía un texto (o los adjuntos seleccionados) como mensaje del usuario.
 * Devuelve true si el mensaje quedó registrado correctamente.
 */
async function send(text: string, attachments: ChatAttachment[] = []): Promise<boolean> {
  const content = text.trim()
  if (state.isSending || state.hasPendingRequest) return false
  if (!content && attachments.length === 0) return false

  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    timestamp: Date.now(),
    status: 'sending',
    origin: 'local',
    offline: false,
    knowledgeVersion: KNOWLEDGE_VERSION,
    knowledgeUpdatedAt: KNOWLEDGE_UPDATED_AT,
    attachments,
  }

  // Se registra el mensaje del usuario y se limpia el borrador SOLO
  // cuando el envío realmente arrancó (nunca si la validación falla).
  setState({
    messages: appendMessages([userMessage]),
    draft: '',
    isSending: true,
    hasPendingRequest: true,
    error: null,
  })

  try {
    const response = await sendMessage({
      conversationId: state.conversationId,
      message: content,
      attachments,
    })

    updateMessage(userMessage.id, { status: 'sent' })

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.reply,
      timestamp: Date.now(),
      status: 'sent',
      origin: response.origin,
      offline: response.offline,
      knowledgeVersion: KNOWLEDGE_VERSION,
      knowledgeUpdatedAt: KNOWLEDGE_UPDATED_AT,
      references: response.references as ChatKnowledgeReference[],
      attachments: [],
    }

    // Aviso único de "modo documentación" la primera vez que el backend
    // no está disponible (el indicador de cabecera ya lo refleja siempre).
    const notice =
      response.offline && consumeOfflineNotice() ? OFFLINE_NOTICE : state.notice

    setState({
      messages: appendMessages([assistantMessage]),
      isSending: false,
      hasPendingRequest: false,
      error: null,
      notice,
      conversationId: response.conversationId || state.conversationId,
    })
    return true
  } catch (error) {
    updateMessage(userMessage.id, { status: 'error' })
    const message =
      error instanceof Error ? error.message : 'No se pudo enviar el mensaje.'
    setState({
      isSending: false,
      hasPendingRequest: false,
      error: message,
    })
    return false
  }
}

/** Reintenta el último mensaje del usuario tras un fallo de conexión. */
function retryLastUserMessage(): void {
  if (state.isSending || state.hasPendingRequest) return
  const lastUser = [...state.messages].reverse().find((message) => message.role === 'user')
  if (!lastUser || lastUser.status !== 'error') return
  // Se retira el mensaje fallido para no duplicarlo en el hilo.
  setState({ messages: state.messages.filter((message) => message.id !== lastUser.id) })
  void send(lastUser.content, lastUser.attachments ?? [])
}

/** Reinicia la conversación sin cerrar la ventana (botón "nueva conversación"). */
function resetConversation(): void {
  const { isOpen, isMinimized } = state
  state = createInitialState()
  state.isOpen = isOpen
  state.isMinimized = isMinimized
  emit()
}

/* -------------------------------- hooks ------------------------------- */

export function useChat() {
  const viewState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const handleOpen = useCallback(() => open(), [])
  const handleMinimize = useCallback(() => minimize(), [])
  const handleClose = useCallback(() => close(), [])
  const handleSetDraft = useCallback((draft: string) => setDraft(draft), [])
  const handleDismissError = useCallback(() => dismissError(), [])
  const handleDismissNotice = useCallback(() => dismissNotice(), [])
  const handleReset = useCallback(() => resetConversation(), [])
  const handleRetry = useCallback(() => retryLastUserMessage(), [])
  const handleSend = useCallback(
    (text: string, attachments: ChatAttachment[] = []) => send(text, attachments),
    [],
  )

  return {
    ...viewState,
    open: handleOpen,
    minimize: handleMinimize,
    close: handleClose,
    setDraft: handleSetDraft,
    dismissError: handleDismissError,
    dismissNotice: handleDismissNotice,
    reset: handleReset,
    retryLastUserMessage: handleRetry,
    send: handleSend,
  }
}

export type ChatController = ReturnType<typeof useChat>

/**
 * Estado honesto del servicio de chat para la cabecera.
 * Se mantiene sincronizado con el pub/sub de chatService, de modo que
 * el indicador nunca muestre "Conectado" sin una respuesta real.
 */
export function useChatBackendState(): ChatServiceStatus {
  return useSyncExternalStore(
    subscribeChatServiceStatus,
    getChatServiceStatus,
    getChatServiceStatus,
  )
}
