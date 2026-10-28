import { useState, type FormEvent } from 'react'
import Button from '@/shared/components/ui/Button'
import TextField from '@/shared/components/ui/TextField'
import { CheckIcon, LockIcon } from '@/modules/perfil/components/icons'

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

  const requirements = [
    { label: 'Entre 8 y 32 caracteres', met: password.length >= 8 && password.length <= 32 },
    {
      label: 'Las contraseñas coinciden',
      met: password.length > 0 && password === passwordConfirmation,
    },
    {
      label: 'Es distinta a la actual',
      met: password.length > 0 && currentPassword.length > 0 && password !== currentPassword,
    },
  ]

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
    <div>
      <h3 className="text-base font-semibold text-sena-text">Cambiar contraseña</h3>
      <p className="mt-0.5 text-sm text-sena-text/55">
        Usa una contraseña que no hayas utilizado en otros sitios.
      </p>

      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          {message ? (
            <p
              role="status"
              className="perfil-pop rounded-xl bg-sena/10 px-4 py-3 text-sm font-medium text-sena-dark"
            >
              {message}
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="perfil-pop rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
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
            maxLength={32}
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
            maxLength={32}
            required
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
          />

          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Actualizar contraseña'}
          </Button>
        </form>

        <aside className="h-fit rounded-xl border border-sena-dark/10 bg-sena-muted/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-sena-text">
            <span className="grid size-7 place-items-center rounded-lg bg-white text-sena shadow-sm ring-1 ring-sena-dark/10">
              <LockIcon className="size-4" />
            </span>
            Requisitos
          </div>
          <ul className="mt-4 space-y-3">
            {requirements.map((item) => (
              <li
                key={item.label}
                className={`flex items-center gap-2.5 text-sm transition-colors ${
                  item.met ? 'text-sena-dark' : 'text-sena-text/55'
                }`}
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full transition-all duration-300 ${
                    item.met ? 'scale-100 bg-sena text-white' : 'scale-90 bg-sena-dark/10 text-transparent'
                  }`}
                >
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}