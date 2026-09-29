const TOKEN_KEY = 'plataforma.token'
const REMEMBER_KEY = 'plataforma.remember'

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null, remember = true) {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  if (!token) {
    localStorage.removeItem(REMEMBER_KEY)
    return
  }
  const store = remember ? localStorage : sessionStorage
  store.setItem(TOKEN_KEY, token)
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
}

export function shouldRememberSession() {
  return localStorage.getItem(REMEMBER_KEY) !== '0'
}

function errorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback
  const payload = body as {
    message?: string
    errors?: Array<{ message?: string }>
  }
  if (payload.message) return payload.message
  if (payload.errors?.[0]?.message) return payload.errors[0].message
  return fallback
}

export type PageMeta = {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

async function requestJson(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`/api/v1${path}`, { ...options, headers })
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(body, 'No se pudo completar la solicitud'), body)
  }

  return body
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const body = await requestJson(path, options)

  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data
  }

  return body as T
}

export async function listAll<T>(path: string, query: Record<string, string> = {}): Promise<T[]> {
  const rows: T[] = []
  let page = 1
  let lastPage = 1

  do {
    const params = new URLSearchParams({
      ...query,
      page: String(page),
      perPage: '100',
    })
    const body = await requestJson(`${path}?${params}`)
    const envelope =
      body && typeof body === 'object' && 'data' in body
        ? (body as { data?: T[]; meta?: PageMeta; metadata?: PageMeta })
        : { data: Array.isArray(body) ? (body as T[]) : [], meta: undefined, metadata: undefined }
    const meta = envelope.meta ?? envelope.metadata
    const batch = envelope.data ?? []
    rows.push(...batch)
    lastPage = meta?.lastPage ?? 1
    if (!meta && batch.length < 100) break
    page += 1
  } while (page <= lastPage && page <= 50)

  return rows
}
