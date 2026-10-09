import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeOffIcon } from '@/shared/components/icons/AppIcons'
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
  if (error instanceof Error) return error.message
  return 'No se pudo conectar con el servidor. Revisa que el API esté encendido.'
}

function BrandLogo() {
  return (
    <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md sm:h-16 sm:w-16">
      <svg
        viewBox="0 0 100 100"
        className="h-12 w-12 sm:h-14 sm:w-14"
        fill="none"
        role="img"
        aria-label="Logotipo de GESNOVA"
      >
        <defs>
          <linearGradient
            id="gesnova-blue"
            x1="15"
            y1="10"
            x2="55"
            y2="65"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#0759D6" />
          </linearGradient>
          <linearGradient
            id="gesnova-green"
            x1="45"
            y1="25"
            x2="90"
            y2="90"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#BEF264" />
            <stop offset="1" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        <path
          d="M75 21A36 36 0 1 0 80 64"
          stroke="url(#gesnova-blue)"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          d="M79 39A26 26 0 0 0 42 36"
          stroke="url(#gesnova-green)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M78 42L52 62L38 50"
          stroke="url(#gesnova-green)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function BrandName() {
  return (
    <span className="text-3xl font-black leading-none tracking-tight sm:text-4xl">
      <span className="bg-linear-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
        GES
      </span>
      <span className="bg-linear-to-r from-lime-300 via-green-300 to-emerald-400 bg-clip-text text-transparent">
        NOVA
      </span>
    </span>
  )
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m4 7 8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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
    document.title = 'Recuperar contraseña | GESNOVA'

    return () => {
      document.title = previousTitle
    }
  }, [])

  const stepNumber = useMemo(() => {
    if (step === 'email') return 1
    if (step === 'otp') return 2
    if (step === 'google') return 3
    return 4
  }, [step])

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setInfo(null)
    setDebugCode('')

    try {
      const result = await requestPasswordRecovery(email.trim())

      setDebugCode(result.debugCode ?? '')
      setStep('otp')
      setCode('')
      setInfo(
        'Si el correo corresponde a una cuenta, se enviará un código de 6 dígitos.',
      )
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
      } else {
        setError('No se recibió la autorización para cambiar la contraseña.')
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

      if (!result.resetToken) {
        throw new Error('No se recibió el permiso de recuperación.')
      }

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
    setError(null)
    setInfo(null)

    if (password.length < 8 || password.length > 32) {
      setError('La contraseña debe tener entre 8 y 32 caracteres.')
      return
    }

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)

    try {
      await resetPassword({
        resetToken,
        password,
        passwordConfirmation,
      })

      setStep('success')
      setPassword('')
      setPasswordConfirmation('')
      setResetToken('')
      setInfo(null)
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const restart = () => {
    setStep('email')
    setCode('')
    setResetToken('')
    setPassword('')
    setPasswordConfirmation('')
    setShowPassword(false)
    setShowConfirmation(false)
    setError(null)
    setInfo(null)
    setDebugCode('')
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
            : '¡Todo listo!'

  const description =
    step === 'email'
      ? 'Ingresa el correo asociado a tu cuenta para iniciar el proceso de recuperación.'
      : step === 'otp'
        ? `Ingresa el código de 6 dígitos enviado a ${email}.`
        : step === 'google'
          ? 'Abre Google Authenticator e ingresa el código de seguridad de tu cuenta.'
          : step === 'password'
            ? 'Crea una contraseña nueva y segura para volver a ingresar a GESNOVA.'
            : 'Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.'

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#073d2b]">
      {/* Fondo compartido con el login */}
      <img
        src="/img/imageninicio.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center blur-[3px]"
      />

      <div className="absolute inset-0 bg-linear-to-br from-[#003b27]/85 via-[#087b45]/55 to-[#9cde9c]/40" />
      <div className="absolute inset-0 bg-emerald-950/10 backdrop-blur-[2px]" />

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-lime-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-green-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-svh w-full max-w-360 grid-cols-1 items-center gap-6 px-5 py-6 sm:px-10 sm:py-8 lg:grid-cols-[0.9fr_1fr] lg:gap-12 lg:px-16 xl:px-24">
        {/* Identidad de GESNOVA */}
        <section className="flex flex-col items-center justify-center text-center text-white lg:px-4">
          <Link
            to="/login"
            className="flex flex-col items-center gap-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
            aria-label="Volver al inicio de sesión de GESNOVA"
          >
            <BrandLogo />
            <BrandName />
          </Link>

          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-7 bg-white/60 sm:w-10" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 sm:text-xs sm:tracking-[0.25em]">
              Plataforma de gestión
            </p>
            <span className="h-px w-7 bg-white/60 sm:w-10" />
          </div>

          <p className="mt-4 max-w-sm text-lg font-medium leading-relaxed sm:text-xl">
            Una plataforma,
            <span className="block font-bold text-lime-300">
              múltiples soluciones.
            </span>
          </p>

          <p className="mt-2 hidden max-w-sm text-sm leading-6 text-white/80 sm:block">
            Conectamos procesos, optimizamos la gestión y transformamos el
            futuro de la institución.
          </p>

          <div className="mt-5 flex flex-col items-center">
            <img
              src="/img/logo-sena.svg"
              alt="SENA"
              className="h-11 w-auto brightness-0 invert sm:h-14"
            />
            <div className="mt-2 flex items-center gap-3">
              <span className="h-px w-6 bg-white/50" />
              <p className="text-xs font-medium tracking-wide text-white/90 sm:text-sm">
                SENA que transforma
              </p>
              <span className="h-px w-6 bg-white/50" />
            </div>
          </div>
        </section>

        {/* Tarjeta de recuperación */}
        <section className="flex w-full items-center justify-center">
          <div className="w-full max-w-md">
            <div className="rounded-[26px] border border-white/60 bg-white/90 p-5 shadow-[0_24px_80px_rgba(0,45,25,0.25)] backdrop-blur-2xl sm:p-7 md:p-8">
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 sm:text-xs sm:tracking-[0.2em]">
                  Seguridad de tu cuenta
                </p>

                <h1 className="text-2xl font-extrabold tracking-tight text-[#073c2b] sm:text-3xl">
                  {title}
                </h1>

                <p className="mt-2 text-sm leading-6 text-[#577568]">
                  {description}
                </p>
              </div>

              {/* Progreso */}
              {step !== 'success' && (
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-[#648477]">
                    <span>Paso {stepNumber} de 4</span>
                    <span>
                      {stepNumber === 4
                        ? 'Último paso'
                        : 'Recuperación segura'}
                    </span>
                  </div>

                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-[#e2eee6]"
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={4}
                    aria-valuenow={stepNumber}
                    aria-label="Progreso de recuperación"
                  >
                    <div
                      className="h-full rounded-full bg-linear-to-r from-[#087b3e] to-[#9bcd45] transition-all duration-300"
                      style={{ width: `${stepNumber * 25}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Mensajes */}
              {info && (
                <div
                  role="status"
                  className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm leading-relaxed text-emerald-900"
                >
                  {info}
                </div>
              )}

              {debugCode && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                  <strong>Modo desarrollo:</strong> código de prueba:{' '}
                  <strong>{debugCode}</strong>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm leading-relaxed text-red-800"
                >
                  {error}
                </div>
              )}

              {/* Paso 1: correo */}
              {step === 'email' && (
                <form onSubmit={submitEmail} className="space-y-4">
                  <div>
                    <label
                      htmlFor="recover-email"
                      className="mb-2 block text-sm font-semibold text-[#174b37]"
                    >
                      Correo electrónico
                    </label>

                    <div className="group relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#648477] group-focus-within:text-emerald-700">
                        <MailIcon />
                      </span>

                      <input
                        id="recover-email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        maxLength={150}
                        placeholder="correo@ejemplo.com"
                        className="h-12 w-full rounded-xl border border-[#d1e3d8] bg-white/80 pl-12 pr-4 text-sm text-[#123e2d] outline-none transition placeholder:text-[#8aa397] hover:border-[#9fcab0] focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#087b3e] to-[#0a9c4d] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,130,60,0.24)] transition hover:from-[#066a35] hover:to-[#078540] focus:outline-none focus:ring-4 focus:ring-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Enviando código…' : 'Enviar código'}
                    {!saving && <span className="text-lg">→</span>}
                  </button>
                </form>
              )}

              {/* Paso 2 y 3: códigos */}
              {(step === 'otp' || step === 'google') && (
                <form
                  onSubmit={step === 'otp' ? submitOtp : submitGoogle}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="recovery-code"
                      className="mb-2 block text-sm font-semibold text-[#174b37]"
                    >
                      {step === 'otp'
                        ? 'Código enviado al correo'
                        : 'Código de Google Authenticator'}
                    </label>

                    <input
                      id="recovery-code"
                      name="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={code}
                      onChange={(event) =>
                        setCode(
                          event.target.value.replace(/\D/g, '').slice(0, 6),
                        )
                      }
                      autoComplete="one-time-code"
                      autoFocus
                      required
                      placeholder="000000"
                      className="h-14 w-full rounded-xl border border-[#d1e3d8] bg-white/80 px-4 text-center font-mono text-2xl font-bold tracking-[0.45em] text-[#123e2d] outline-none transition placeholder:text-[#b4c6bc] focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    />

                    <p className="mt-2 text-xs leading-5 text-[#648477]">
                      {step === 'otp'
                        ? 'Introduce los seis dígitos del código recibido.'
                        : 'Introduce el código temporal de tu aplicación autenticadora.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || code.length !== 6}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#087b3e] to-[#0a9c4d] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,130,60,0.24)] transition hover:from-[#066a35] hover:to-[#078540] focus:outline-none focus:ring-4 focus:ring-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Verificando…' : 'Verificar código'}
                    {!saving && <span className="text-lg">→</span>}
                  </button>
                </form>
              )}

              {/* Paso 4: nueva contraseña */}
              {step === 'password' && (
                <form onSubmit={submitPassword} className="space-y-4">
                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-sm font-semibold text-[#174b37]"
                    >
                      Nueva contraseña
                    </label>

                    <div className="group relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#648477] group-focus-within:text-emerald-700">
                        <LockIcon />
                      </span>

                      <input
                        id="new-password"
                        name="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={32}
                        required
                        placeholder="Crea una contraseña segura"
                        className="h-12 w-full rounded-xl border border-[#d1e3d8] bg-white/80 pl-12 pr-12 text-sm text-[#123e2d] outline-none transition placeholder:text-[#8aa397] focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={
                          showPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#648477] transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="new-password-confirmation"
                      className="mb-2 block text-sm font-semibold text-[#174b37]"
                    >
                      Confirmar contraseña
                    </label>

                    <div className="group relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#648477] group-focus-within:text-emerald-700">
                        <LockIcon />
                      </span>

                      <input
                        id="new-password-confirmation"
                        name="new-password-confirmation"
                        type={showConfirmation ? 'text' : 'password'}
                        value={passwordConfirmation}
                        onChange={(event) =>
                          setPasswordConfirmation(event.target.value)
                        }
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={32}
                        required
                        placeholder="Repite la nueva contraseña"
                        className="h-12 w-full rounded-xl border border-[#d1e3d8] bg-white/80 pl-12 pr-12 text-sm text-[#123e2d] outline-none transition placeholder:text-[#8aa397] focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmation((value) => !value)
                        }
                        aria-label={
                          showConfirmation
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#648477] transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                      >
                        {showConfirmation ? (
                          <EyeOffIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50 px-3 py-3 text-xs leading-5 text-emerald-900">
                    Utiliza entre 8 y 32 caracteres. No compartas tu contraseña
                    con otras personas.
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#087b3e] to-[#0a9c4d] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,130,60,0.24)] transition hover:from-[#066a35] hover:to-[#078540] focus:outline-none focus:ring-4 focus:ring-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Actualizando…' : 'Cambiar contraseña'}
                    {!saving && <span className="text-lg">→</span>}
                  </button>
                </form>
              )}

              {/* Confirmación */}
              {step === 'success' && (
                <div className="pt-2">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-3xl font-bold text-emerald-700">
                    ✓
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#577568]">
                    Tu contraseña se guardó correctamente. Inicia sesión con
                    tus nuevas credenciales para continuar.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/login', { replace: true })
                    }
                    className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#087b3e] to-[#0a9c4d] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,130,60,0.24)] transition hover:from-[#066a35] hover:to-[#078540] focus:outline-none focus:ring-4 focus:ring-emerald-600/25"
                  >
                    Ir a iniciar sesión <span className="text-lg">→</span>
                  </button>
                </div>
              )}

              {/* Navegación secundaria */}
              {step !== 'success' && (
                <div className="mt-5 flex flex-col gap-3 border-t border-[#dce9e0] pt-4 text-sm">
                  {step !== 'email' && (
                    <button
                      type="button"
                      onClick={restart}
                      className="text-left font-semibold text-emerald-800 transition hover:text-emerald-600 hover:underline"
                    >
                      Empezar de nuevo
                    </button>
                  )}

                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-[#648477] transition hover:text-emerald-800"
                  >
                    <span aria-hidden="true">←</span>
                    Volver a iniciar sesión
                  </Link>
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-white/90">
              Servicio Nacional de Aprendizaje · SENA
            </p>
            <p className="mt-1 text-center text-[11px] text-white/70">
              GESNOVA · Gestión de recursos
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

