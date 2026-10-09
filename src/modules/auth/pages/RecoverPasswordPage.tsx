import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/shared/components/ui/Button'
import TextField from '@/shared/components/ui/TextField'
import { EyeIcon, EyeOffIcon } from '@/shared/components/icons/AppIcons'
import SenaMark from '@/shared/components/icons/SenaMark'
import { ApiError } from '@/shared/lib/api'
import {
  requestPasswordRecovery,
  resetPassword,
  verifyGoogleAuthenticator,
  verifyRecoveryCode,
} from '@/shared/lib/passwordRecovery'

type Step = 'email' | 'otp' | 'google' | 'password' | 'success'

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  return 'No se pudo conectar con el servidor. Revisa que el API esté encendido.'
}

export default function RecoverPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [debugCode, setDebugCode] = useState('')

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Recuperar contraseña | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  const stepNumber = useMemo(() => {
    if (step === 'email') return 1
    if (step === 'otp') return 2
    if (step === 'google') return 3
    if (step === 'password') return 4
    return 4
  }, [step])

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setInfo(null)
    try {
      const result = await requestPasswordRecovery(email.trim())
      setDebugCode(result.debugCode ?? '')
      setStep('otp')
      setInfo('Si el correo corresponde a una cuenta, se envió un código de 6 dígitos.')
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const submitOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setInfo(null)
    try {
      const result = await verifyRecoveryCode(email.trim(), code.trim())
      if (result.requiresGoogleAuthenticator) {
        setStep('google')
        setCode('')
        setInfo(result.message)
      } else if (result.resetToken) {
        setResetToken(result.resetToken)
        setStep('password')
        setCode('')
      }
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const submitGoogle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setInfo(null)
    try {
      const result = await verifyGoogleAuthenticator(email.trim(), code.trim())
      if (!result.resetToken) throw new Error('No se recibió el permiso de recuperación.')
      setResetToken(result.resetToken)
      setCode('')
      setStep('password')
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setSaving(true)
    setError(null)
    setInfo(null)
    try {
      await resetPassword({ resetToken, password, passwordConfirmation })
      setStep('success')
      setPassword('')
      setPasswordConfirmation('')
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const title =
    step === 'email'
      ? 'Recuperar contraseña'
      : step === 'otp'
        ? 'Verificar código'
        : step === 'google'
          ? 'Verificación adicional'
          : step === 'password'
            ? 'Nueva contraseña'
            : 'Contraseña actualizada'

  const description =
    step === 'email'
      ? 'Escribe el correo asociado a tu cuenta y te enviaremos un código de recuperación.'
      : step === 'otp'
        ? `Ingresa el código de 6 dígitos enviado a ${email}.`
        : step === 'google'
          ? 'Abre Google Authenticator e ingresa el código de 6 dígitos de tu cuenta.'
          : step === 'password'
            ? 'Crea una contraseña nueva para volver a entrar a la plataforma.'
            : 'Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión.'

  return (
    <div className="app-shell relative min-h-svh overflow-hidden bg-sena-forest">
      <img src="/img/imageninicio.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#013318]/72" />

      <div className="relative z-10 grid min-h-svh place-items-center px-4 py-10">
        <div className="w-full max-w-115 rounded-3xl bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-9">
          <Link to="/" className="inline-flex items-center gap-2 text-sena-dark" aria-label="SENA">
            <SenaMark className="h-11 w-11 text-sena" />
            <span className="text-xl font-semibold tracking-tight">SENA</span>
          </Link>

          {step !== 'success' ? (
            <div className="mt-7">
              <div className="mb-5 flex items-center justify-between text-xs font-semibold text-sena-text/55">
                <span>Paso {stepNumber} de 4</span>
                <span>{stepNumber === 4 ? 'Último paso' : 'Recuperación segura'}</span>
              </div>
              <div className="mb-6 h-2 overflow-hidden rounded-full bg-sena-muted">
                <div
                  className="h-full rounded-full bg-sena transition-all duration-300"
                  style={{ width: `${stepNumber * 25}%` }}
                />
              </div>
            </div>
          ) : null}

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-sena-text">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-sena-text/65">{description}</p>

          {info ? (
            <div className="mt-5 rounded-2xl border border-sena-ok-line bg-sena-active-soft px-4 py-3 text-sm text-sena-ok-text">
              {info}
            </div>
          ) : null}

          {debugCode ? (
            <div className="mt-4 rounded-2xl border border-sena-warn-line bg-sena-warn-soft px-4 py-3 text-sm text-sena-warn-text">
              <strong>Modo desarrollo:</strong> código de prueba: <strong>{debugCode}</strong>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-sena-danger-line bg-sena-danger-soft px-4 py-3 text-sm text-sena-danger-text">
              {error}
            </div>
          ) : null}

          {step === 'email' ? (
            <form className="mt-6 flex flex-col gap-4" onSubmit={submitEmail}>
              <TextField
                id="recover-email"
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                placeholder="correo@ejemplo.com"
              />
              <Button type="submit" disabled={saving} className="mt-1 h-11 w-full rounded-xl">
                {saving ? 'Enviando…' : 'Enviar código'}
              </Button>
            </form>
          ) : null}

          {step === 'otp' || step === 'google' ? (
            <form className="mt-6 flex flex-col gap-4" onSubmit={step === 'otp' ? submitOtp : submitGoogle}>
              <TextField
                id="recovery-code"
                label={step === 'otp' ? 'Código enviado al correo' : 'Código de Google Authenticator'}
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                autoComplete="one-time-code"
                required
                placeholder="000000"
              />
              <Button type="submit" disabled={saving || code.length !== 6} className="mt-1 h-11 w-full rounded-xl">
                {saving ? 'Verificando…' : 'Verificar código'}
              </Button>
            </form>
          ) : null}

          {step === 'password' ? (
            <form className="mt-6 flex flex-col gap-4" onSubmit={submitPassword}>
              <div className="relative">
                <TextField
                  id="new-password"
                  label="Nueva contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={32}
                  className="pr-11"
                />
                <button
                  type="button"
                  className="absolute right-3 top-8.5 text-sena-text/45 hover:text-sena-text"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>

              <div className="relative">
                <TextField
                  id="new-password-confirmation"
                  label="Confirmar contraseña"
                  type={showConfirmation ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={32}
                  className="pr-11"
                />
                <button
                  type="button"
                  className="absolute right-3 top-8.5 text-sena-text/45 hover:text-sena-text"
                  onClick={() => setShowConfirmation((value) => !value)}
                  aria-label={showConfirmation ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmation ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>

              <p className="text-xs leading-5 text-sena-text/55">Usa mínimo 8 caracteres y evita compartir tu contraseña.</p>

              <Button type="submit" disabled={saving} className="mt-1 h-11 w-full rounded-xl">
                {saving ? 'Actualizando…' : 'Cambiar contraseña'}
              </Button>
            </form>
          ) : null}

          {step === 'success' ? (
            <div className="mt-7">
              <div className="grid size-16 place-items-center rounded-full bg-sena-active-soft text-2xl text-sena">✓</div>
              <p className="mt-5 text-sm leading-6 text-sena-text/70">Ya puedes entrar con tu nueva contraseña.</p>
              <Button type="button" className="mt-6 h-11 w-full rounded-xl" onClick={() => navigate('/login', { replace: true })}>
                Ir a iniciar sesión
              </Button>
            </div>
          ) : null}

          {step !== 'success' ? (
            <div className="mt-6 flex flex-col gap-2 text-sm">
              <button
                type="button"
                className="text-left font-medium text-sena hover:underline"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setResetToken('')
                  setError(null)
                  setInfo(null)
                  setDebugCode('')
                }}
              >
                Empezar de nuevo
              </button>
              <Link to="/login" className="text-sena-text/55 hover:text-sena-text">
                Volver a iniciar sesión
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
