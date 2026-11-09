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
 * Historial: mientras el backend no publique GET /chat/conversations
 * (docs/chat-contract.md §4), las conversaciones de la sesión viven aquí
 * y quedan adscritas al usuario (`ownerUserId`): si cambia la cuenta, el
 * store se limpia para no mezclar historiales. No se usa localStorage
 * porque no es persistencia real entre dispositivos y sesiones.
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
  ChatConversation,
  ChatKnowledgeReference,
  ChatMessage,
  ChatServiceStatus,
  ChatViewState,
} from '../types/chat.types'

type ChatListener = () => void

const MAX_MESSAGES = 200
/** Techo defensivo del historial en memoria (la persistencia real es del backend). */
const MAX_CONVERSATIONS = 50

/** Estado inicial del store. */
function createInitialState(ownerUserId: number | null = null): ChatViewState {
  return {
    isOpen: false,
    isMinimized: false,
    ownerUserId,
    conversationId: crypto.randomUUID(),
    // Conversación nueva sin mensajes: la pantalla inicial (saludo +
    // carrusel) se renderiza en la UI, nunca un mensaje automático.
    messages: [],
    conversations: [],
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
  if (changed) setState(withConversation(messages))
}

/* ------------------------------ historial ------------------------------ */

/** Título honesto: primer mensaje real del usuario (se trunca, nunca se inventa). */
function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((message) => message.role === 'user')
  const line = (firstUser?.content ?? '')
    .split('\n')[0]
    .replace(/\s+/g, ' ')
    .trim()
  if (!line) return 'Conversación sin mensajes'
  return line.length > 46 ? `${line.slice(0, 46).trimEnd()}…` : line
}

/** Inserta o actualiza la conversación activa con el hilo vigente. */
function upsertConversation(
  conversations: ChatConversation[],
  id: string,
  messages: ChatMessage[],
): ChatConversation[] {
  // Hilo vacío (p. ej. reintento tras un fallo): se retira la entrada
  // para no dejar en el panel una copia obsoleta.
  if (messages.length === 0) return conversations.filter((conversation) => conversation.id !== id)
  const entry: ChatConversation = {
    id,
    title: deriveTitle(messages),
    updatedAt: Date.now(),
    messages,
  }
  const index = conversations.findIndex((conversation) => conversation.id === id)
  if (index === -1) return [entry, ...conversations].slice(0, MAX_CONVERSATIONS)
  return conversations.map((conversation, i) => (i === index ? entry : conversation))
}

/**
 * Patch de mensajes que mantiene el historial de la conversación activa
 * al día (el store es la única fuente de verdad mientras no haya backend).
 */
function withConversation(
  messages: ChatMessage[],
  id: string = state.conversationId,
  conversations: ChatConversation[] = state.conversations,
): Partial<ChatViewState> {
  return { messages, conversations: upsertConversation(conversations, id, messages) }
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
  // Cerrar SOLO oculta la ventana: la conversación, el borrador y el
  // historial se conservan (el FAB vuelve a abrirla donde estaba).
  setState({ isOpen: false, isMinimized: false })
}

/** Restaura la ventana desde el estado minimizado. */
function restore(): void {
  setState({ isOpen: true, isMinimized: false })
}

/**
 * Alterna con el botón flotante (única fuente de estado, sin estados dobles):
 * cerrado → abre · abierto → cierra · minimizado → restaura.
 */
function toggle(): void {
  if (!state.isOpen) {
    open()
    return
  }
  if (state.isMinimized) {
    restore()
    return
  }
  close()
}

/**
 * Adscribe el store al usuario autenticado. Si cambia la cuenta, se limpia
 * TODO para que el historial de un usuario jamás se mezcle con el de otro.
 * Sin usuario (null) no se toca nada: así una recarga de perfil degradada
 * no borra el historial del usuario correcto.
 */
function syncOwner(userId: number | null): void {
  if (userId === null || state.ownerUserId === userId) return
  if (state.ownerUserId !== null) {
    const fresh = createInitialState(userId)
    fresh.isOpen = state.isOpen
    fresh.isMinimized = state.isMinimized
    state = fresh
    emit()
    return
  }
  // Primera carga con sesión válida: solo se etiqueta al dueño.
  setState({ ownerUserId: userId })
}

/** Restaura una conversación previa del historial en el hilo visible. */
function selectConversation(id: string): void {
  if (state.isSending || state.hasPendingRequest) return
  const conversation = state.conversations.find((item) => item.id === id)
  if (!conversation) return
  setState({
    conversationId: conversation.id,
    messages: conversation.messages,
    draft: '',
    isSending: false,
    hasPendingRequest: false,
    error: null,
  })
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
  // El registro en el historial ocurre con el primer mensaje real.
  setState({
    ...withConversation(appendMessages([userMessage])),
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

    // Si el backend devolviera otro id, se reetiqueta la entrada del
    // historial antes de guardar el nuevo estado (sin duplicarla).
    const nextConversationId = response.conversationId || state.conversationId
    const nextMessages = appendMessages([assistantMessage])
    const baseConversations =
      nextConversationId !== state.conversationId
        ? state.conversations.map((item) =>
            item.id === state.conversationId ? { ...item, id: nextConversationId } : item,
          )
        : state.conversations

    setState({
      ...withConversation(nextMessages, nextConversationId, baseConversations),
      isSending: false,
      hasPendingRequest: false,
      error: null,
      notice,
      conversationId: nextConversationId,
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
  setState(withConversation(state.messages.filter((message) => message.id !== lastUser.id)))
  void send(lastUser.content, lastUser.attachments ?? [])
}

/**
 * Reinicia la conversación sin cerrar la ventana (botón "nueva
 * conversación"). El historial de la sesión y el dueño se conservan: la
 * conversación anterior sigue disponible en el panel lateral.
 */
function resetConversation(): void {
  setState({
    conversationId: crypto.randomUUID(),
    messages: [],
    draft: '',
    isSending: false,
    hasPendingRequest: false,
    error: null,
  })
}

/* -------------------------------- hooks ------------------------------- */

export function useChat() {
  const viewState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const handleOpen = useCallback(() => open(), [])
  const handleMinimize = useCallback(() => minimize(), [])
  const handleClose = useCallback(() => close(), [])
  const handleToggle = useCallback(() => toggle(), [])
  const handleRestore = useCallback(() => restore(), [])
  const handleSyncOwner = useCallback((userId: number | null) => syncOwner(userId), [])
  const handleSelectConversation = useCallback((id: string) => selectConversation(id), [])
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
    /** Alterna con el FAB: abrir / cerrar / restaurar desde minimizado. */
    toggle: handleToggle,
    restore: handleRestore,
    /** Adscribe el store al usuario autenticado (separa historiales). */
    syncOwner: handleSyncOwner,
    selectConversation: handleSelectConversation,
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
