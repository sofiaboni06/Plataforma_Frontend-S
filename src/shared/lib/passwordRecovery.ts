import { api } from '@/shared/lib/api'

export type RecoveryResponse = {
  message: string
  debugCode?: string
}

export type VerifyRecoveryResponse = {
  message: string
  requiresGoogleAuthenticator?: boolean
  resetToken?: string
}

export async function requestPasswordRecovery(email: string) {
  return api<RecoveryResponse>('/auth/recover', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyRecoveryCode(email: string, code: string) {
  return api<VerifyRecoveryResponse>('/auth/recover/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

export async function verifyGoogleAuthenticator(email: string, code: string) {
  return api<VerifyRecoveryResponse>('/auth/recover/google', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

export async function resetPassword(payload: {
  resetToken: string
  password: string
  passwordConfirmation: string
}) {
  return api<{ message: string }>('/auth/recover/reset', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
