/**
 * chatService.ts
 *
 * Servicio del asistente. Es el ÚNICO punto de contacto con el backend
 * del chat y el único consumidor de la base de conocimiento local.
 *
 * Estado de la integración (documentado en docs/chat-contract.md):
 *   POST /api/v1/chat/messages  →  PENDIENTE DE BACKEND.
 *
 * Estrategia (siempre honesta con el usuario):
 *   1. Se intenta la petición al backend con el token de sesión.
 *   2. Si el endpoint aún no existe (404/500) o el backend no responde,
 *      se responde con la base de conocimiento local y se marca el
 *      mensaje con origin: 'local'. La primera vez se notifica al
 *      usuario que la IA conectada aún no está disponible.
 *   3. Si la falla impide responder honestamente (401/403 sin sesión, 400
 *      por validación), se lanza ChatServiceError y la UI muestra el
 *      aviso de error.
 *
 * Prohibido: simular respuestas de IA, inventar datos o exponer claves.
 */

import { api, ApiError } from '@/shared/lib/api'
import { answerFromKnowledge } from '../knowledge/knowledgeSources'
import type {
  BackendChatResponse,
  ChatErrorKind,
  ChatRequest,
  ChatResponse,
  ChatServiceStatus,
} from '../types/chat.types'

/** Error tipado que consume la UI del asistente. */
export class ChatServiceError extends Error {
  readonly kind: ChatErrorKind

  constructor(kind: ChatErrorKind, message: string) {
    super(message)
    this.name = 'ChatServiceError'
    this.kind = kind
  }
}

/**
 * Estado del endpoint de chat conocido por el cliente.
 * Se publica con un pequeño patrón pub/sub para que la cabecera
 * pueda mostrar un indicador honesto (useSyncExternalStore).
 */
let serviceStatus: ChatServiceStatus = 'checking'
const statusListeners = new Set<() => void>()

function setStatus(next: ChatServiceStatus): void {
  if (serviceStatus === next) return
  serviceStatus = next
  statusListeners.forEach((listener) => listener())
}

export function getChatServiceStatus(): ChatServiceStatus {
  return serviceStatus
}

export function subscribeChatServiceStatus(listener: () => void): () => void {
  statusListeners.add(listener)
  return () => {
    statusListeners.delete(listener)
  }
}

/** Se llama al cerrar sesión para que el siguiente intento sea limpio. */
export function resetChatServiceStatus(): void {
  setStatus('checking')
}

const ENDPOINT = '/chat/messages'
const OFFLINE_NOTICE =
  'La IA conectada de SIGMA aún no está disponible en este entorno. ' +
  'Estoy respondiendo con la documentación oficial de la plataforma.'

/** Traduce el error crudo de api.ts a un error de negocio del chat. */
function toChatServiceError(error: unknown): ChatServiceError {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return new ChatServiceError(
        'auth',
        'Tu sesión ya no es válida. Vuelve a iniciar sesión para continuar.',
      )
    }
    if (error.status === 400 || error.status === 422) {
      return new ChatServiceError(
        'validation',
        'No se pudo procesar la pregunta. Revisa el texto e inténtalo de nuevo.',
      )
    }
  }
  return new ChatServiceError(
    'network',
    'No se pudo conectar con el asistente. Inténtalo de nuevo en unos segundos.',
  )
}

/** Respuesta local etiquetada, usada cuando el backend aún no existe. */
function localAnswer(request: ChatRequest): ChatResponse {
  const answer = answerFromKnowledge(request.message)
  return {
    conversationId: request.conversationId,
    reply: answer.text,
    references: answer.references,
    origin: 'local',
    offline: true,
    createdAt: new Date().toISOString(),
  }
}

/** Aviso de modo documentación: solo la primera vez por sesión. */
let offlineNoticeShown = false

export function consumeOfflineNotice(): boolean {
  if (offlineNoticeShown) return false
  offlineNoticeShown = true
  return true
}

export function resetOfflineNotice(): void {
  offlineNoticeShown = false
}

export { OFFLINE_NOTICE }

/**
 * Envía un mensaje del usuario y devuelve la respuesta del asistente.
 * Nunca devuelve datos simulados: o es la respuesta real del backend,
 * o es la respuesta documentada localmente etiquetada como tal.
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const message = request.message.trim()

  // Validación en cliente (el backend vuelve a validar).
  if (!message) {
    throw new ChatServiceError('validation', 'Escribe una pregunta antes de enviarla.')
  }
  if (message.length > 1000) {
    throw new ChatServiceError('validation', 'La pregunta supera el máximo de 1000 caracteres.')
  }

  try {
    const data = await api<BackendChatResponse>(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        conversationId: request.conversationId,
        message,
        attachments: request.attachments?.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
        context: { source: 'chatbox' },
      }),
    })

    if (!data || typeof data.reply !== 'string') {
      throw new ChatServiceError('network', 'Respuesta inválida del servidor.')
    }

    setStatus('connected')

    return {
      conversationId: data.conversationId || request.conversationId,
      reply: data.reply,
      references: data.references ?? [],
      origin: 'backend',
      offline: false,
      createdAt: data.createdAt ?? new Date().toISOString(),
    }
  } catch (error) {
    if (error instanceof ChatServiceError) {
      throw error
    }

    // Fallas que impiden responder honestamente → error visible en la UI.
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403 || error.status === 400 || error.status === 422)
    ) {
      throw toChatServiceError(error)
    }

    // Endpoint inexistente o backend caído → conocimiento local.
    setStatus('local-docs')
    return localAnswer(request)
  }
}
