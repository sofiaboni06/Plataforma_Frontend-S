/**
 * Tipos del ChatBox / Asistente SIGMA.
 *
 * Este archivo define también el CONTRATO con el backend que aún no existe
 * (ver `docs/chat-contract.md`). No se inventan respuestas de IA: mientras
 * el servicio no esté conectado, las respuestas provienen de la base de
 * conocimiento local (`knowledge/knowledgeSources.ts`) y se etiquetan como
 * tales (`origin: 'local'`).
 */

export type ChatRole = 'user' | 'assistant'

/**
 * sending: mensaje del usuario registrado, respuesta en curso
 * sent: entregado (respuesta real del servicio)
 * error: fallo de envío visible en la conversación
 */
export type ChatMessageStatus = 'sending' | 'sent' | 'error'

export type ChatReferenceKind = 'modulo' | 'procedimiento' | 'permiso' | 'faq'

/** Referencia documental mostrada junto a la respuesta (fuente citable). */
export type ChatReference = {
  id: string
  title: string
  kind: ChatReferenceKind
  route?: string
  /** Etiqueta corta de procedencia (módulo o área funcional). */
  source?: string
  version: string
  /** Fecha ISO (YYYY-MM-DD) de última actualización de la fuente. */
  updatedAt: string
}

/** Alias usado por la capa de conocimiento local. */
export type ChatKnowledgeReference = ChatReference

/** Archivo adjunto seleccionado por el usuario (viaja en la petición). */
export type ChatAttachment = {
  id: string
  name: string
  size: number
  type: string
  /** Object URL local; se revoca al enviar o al quitarlo. */
  url: string
}

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  /** Epoch en milisegundos. */
  timestamp: number
  status: ChatMessageStatus
  /** Procedencia de la respuesta: backend conectado o documentación local. */
  origin: 'backend' | 'local'
  /** true cuando la respuesta salió de la base local (sin IA conectada). */
  offline: boolean
  knowledgeVersion?: string
  knowledgeUpdatedAt?: string
  references?: ChatKnowledgeReference[]
  attachments?: ChatAttachment[]
}

/**
 * Estado honesto del servicio: nunca se afirma "conectado" sin haberlo
 * comprobado con una respuesta real del backend.
 * checking    → aún no se ha intentado (o se limpió la sesión)
 * connected   → el backend respondió correctamente al menos una vez
 * local-docs  → el endpoint de chat no está disponible aún
 */
export type ChatServiceStatus = 'checking' | 'connected' | 'local-docs'

/**
 * Entrada del historial de conversaciones de la SESIÓN actual.
 *
 * Mientras el backend no exponga `GET /api/v1/chat/conversations`
 * (docs/chat-contract.md §4), este historial vive en memoria dentro del
 * store y queda adscrito al usuario autenticado (`ownerUserId`) para que
 * dos cuentas nunca compartan conversaciones. NO se usa localStorage
 * porque no es persistencia real entre dispositivos/sesiones.
 */
export type ChatConversation = {
  id: string
  /** Título derivado del primer mensaje real del usuario (nunca inventado). */
  title: string
  /** Epoch en milisegundos del último cambio de la conversación. */
  updatedAt: number
  /** Copia inmutable del hilo para restaurarlo al seleccionarla. */
  messages: ChatMessage[]
}

export type ChatErrorKind = 'connection' | 'auth' | 'server' | 'validation' | 'network'

/** Estado completo del store (lo consume la UI a través de useChat). */
export type ChatViewState = {
  isOpen: boolean
  isMinimized: boolean
  /** Usuario autenticado dueño del store. Si cambia, el store se limpia
   *  para que el historial de una cuenta nunca se mezcle con otra. */
  ownerUserId: number | null
  conversationId: string
  messages: ChatMessage[]
  /** Historial de conversaciones (solo del `ownerUserId`). */
  conversations: ChatConversation[]
  draft: string
  isSending: boolean
  /** Último error de conexión/validación mostrado en la UI. */
  error: string | null
  /** Aviso único de "modo documentación" (una vez por sesión). */
  notice: string | null
  /** true mientras hay una petición en vuelo (deshabilita el input). */
  hasPendingRequest: boolean
}

/** Petición enviada al servicio del asistente. */
export type ChatRequest = {
  conversationId: string
  message: string
  attachments?: ChatAttachment[]
}

/** Respuesta normalizada del servicio hacia la UI. */
export type ChatResponse = {
  conversationId: string
  reply: string
  references: ChatReference[]
  origin: 'backend' | 'local'
  offline: boolean
  createdAt: string
}

/* ================================================================
   CONTRATO API — PENDIENTE DE IMPLEMENTAR EN EL BACKEND
   Documentación completa: docs/chat-contract.md
   ================================================================ */

export type ChatClientContext = {
  /** Ruta actual del usuario (para filtrar el acceso a módulos en servidor). */
  route?: string
  /** Códigos de módulo que el usuario puede abrir (viene de GET /modules). */
  moduleCodes?: string[]
}

export type ChatSendRequest = {
  /** Identificador de conversación generado en el cliente. */
  conversationId: string
  message: string
  attachments?: Array<{ name: string; size: number; type: string }>
  context?: ChatClientContext
}

export type ChatSendResponse = {
  conversationId: string
  messageId: string
  reply: string
  references?: ChatReference[]
  /** ok | no_knowledge: el asistente no encontró documentación suficiente. */
  status?: 'ok' | 'no_knowledge'
  createdAt?: string
}

/** Respuesta cruda que se espera del endpoint POST /chat/messages. */
export type BackendChatResponse = ChatSendResponse
