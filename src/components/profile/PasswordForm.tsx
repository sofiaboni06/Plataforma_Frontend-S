import { useState, type FormEvent } from 'react'
import Button from '../ui/Button'
import TextField from '../ui/TextField'

type PasswordFormProps = {
  onSubmit: (payload: {
    currentPassword: string
    password: string
    passwordConfirmation: string
  }) => Promise<void>
}

export default function PasswordForm({ onSubmit }: PasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsSaving(true)
    try {
      await onSubmit({ currentPassword, password, passwordConfirmation })
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      setMessage('Contraseña actualizada.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar la contraseña.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
      <h3 className="text-base font-semibold text-sena-text">Cambiar contraseña</h3>

      {message ? (
        <p role="status" className="rounded-lg bg-sena/10 px-3 py-2 text-sm font-medium text-sena-dark">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <TextField
        id="currentPassword"
        label="Contraseña actual"
        type="password"
        autoComplete="current-password"
        required
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
      />
      <TextField
        id="password"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <TextField
        id="passwordConfirmation"
        label="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={passwordConfirmation}
        onChange={(event) => setPasswordConfirmation(event.target.value)}
      />

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Guardando…' : 'Actualizar contraseña'}
      </Button>
    </form>
  )
}
