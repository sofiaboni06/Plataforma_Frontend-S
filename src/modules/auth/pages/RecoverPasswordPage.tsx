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
    <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md sm:h-20 sm:w-20">
      <img
        src="/img/logo-sigma.png"
        alt="Logotipo de SIGMA"
        className="relative h-14 w-14 object-contain sm:h-16 sm:w-16"
      />
    </div>
  )
}

function BrandName() {
  return (
    <span className="text-4xl font-black leading-none tracking-tight sm:text-5xl xl:text-6xl">
      <span className="bg-linear-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">SIG</span>
      <span className="bg-linear-to-r from-lime-300 via-green-300 to-emerald-400 bg-clip-text text-transparent">MA</span>
    </span>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BackArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const inputClass =
  'h-12 w-full rounded-xl border border-[#d1e3d8] bg-white/80 px-4 text-sm text-[#123e2d] outline-none transition placeholder:text-[#8aa397] hover:border-[#9fcab0] focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10'
const buttonClass =
  'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#087b3e] to-[#0a9c4d] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,130,60,0.24)] transition hover:-translate-y-0.5 hover:from-[#066a35] hover:to-[#078540] hover:shadow-[0_12px_26px_rgba(0,130,60,0.30)] focus:outline-none focus:ring-4 focus:ring-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0'

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
    document.title = 'Recuperar contraseña | SIGMA'
    return () => { document.title = previousTitle }
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
      setInfo('Si el correo corresponde a una cuenta, se enviará un código de 6 dígitos.')
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
      await resetPassword({ resetToken, password, passwordConfirmation })
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
    step === 'email' ? 'Recuperar contraseña'
      : step === 'otp' ? 'Verificar código'
        : step === 'google' ? 'Verificación adicional'
          : step === 'password' ? 'Nueva contraseña'
            : '¡Todo listo!'

  const description =
    step === 'email' ? 'Ingresa el correo asociado a tu cuenta para iniciar el proceso de recuperación.'
      : step === 'otp' ? `Ingresa el código de 6 dígitos enviado a ${email}.`
        : step === 'google' ? 'Abre Google Authenticator e ingresa el código de seguridad de tu cuenta.'
          : step === 'password' ? 'Crea una contraseña nueva y segura para volver a ingresar a SIGMA.'
            : 'Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.'

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#073d2b]">
      {/* Botón fijo de regreso, igual al estilo del login */}
      <Link
        to="/login"
        className="absolute left-5 top-5 z-30 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/60 sm:left-8 sm:top-8"
      >
        <BackArrow />
        Volver al inicio de sesión
      </Link>

      {/* Fondo igual al login */}
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

      <div className="relative z-10 mx-auto grid min-h-svh w-full max-w-360 grid-cols-1 items-center gap-8 px-5 py-24 sm:px-10 sm:py-28 lg:grid-cols-[1fr_0.9fr] lg:gap-12 lg:px-16 lg:py-8 xl:px-24">
        {/* Marca SIGMA: mismas proporciones que el login */}
        <section className="relative flex flex-col items-center justify-center text-center text-white lg:scale-90 lg:px-6">
          <div className="mb-5 flex justify-center">
            <BrandLogo />
          </div>
          <BrandName />

          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-white/60 sm:w-12" />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/90 sm:text-sm">
              Sistema integral de módulos administrativos
            </p>
            <span className="h-px w-8 bg-white/60 sm:w-12" />
          </div>

          <p className="mt-6 max-w-md text-xl font-medium leading-relaxed text-white sm:text-2xl">
            Una plataforma,
            <span className="block font-bold text-lime-300">múltiples soluciones.</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/80 sm:text-base">
            Conectamos procesos, optimizamos la gestión y transformamos el futuro de la institución.
          </p>

          <div className="mt-5 grid w-full max-w-md grid-cols-3 divide-x divide-white/25">
            <div className="px-2 py-2">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-lime-300">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                  <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="currentColor" strokeWidth="1.7" />
                  <path d="m19 13 2-1-2-1-.5-2 1-2-2-2-2 1-2-.5-1-2-2 2-.5 2-2 1-2-1-2 2 1 2-.5 2-2 1 2 1 .5 2-1 2 2 2 2-1 2 .5 1 2 2-2 .5-2 2-1 2 1 2-2-1-2 .5-2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="mt-3 text-xs font-semibold leading-relaxed text-white/90 sm:text-sm">Procesos<br />más ágiles</p>
            </div>
            <div className="px-2 py-2">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-lime-300">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                  <path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="m8.5 12 2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="mt-3 text-xs font-semibold leading-relaxed text-white/90 sm:text-sm">Gestión<br />segura</p>
            </div>
            <div className="px-2 py-2">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-lime-300">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                  <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="17" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M3 19v-1.5A5.5 5.5 0 0 1 8.5 12h1A5.5 5.5 0 0 1 15 17.5V19H3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M16 13h1a4 4 0 0 1 4 4v1h-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
              <p className="mt-3 text-xs font-semibold leading-relaxed text-white/90 sm:text-sm">Mejores<br />resultados</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <img src="/img/logo-sena.svg" alt="SENA" className="h-14 w-auto brightness-0 invert sm:h-16" />
            <img src="/img/logo-fabrica-software.png" alt="Fábrica de Software" className="h-12 w-auto sm:h-14" />
          </div>
        </section>

        {/* Tarjeta con el mismo ancho, padding y estilo del login */}
        <section className="flex w-full items-center justify-center">
          <div className="w-full max-w-107.5">
            <div className="rounded-[26px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(0,45,25,0.25)] backdrop-blur-2xl sm:p-9">
              <div className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Seguridad de tu cuenta
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#073c2b]">
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[#577568]">{description}</p>
              </div>

              {step !== 'success' && (
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-[#648477]">
                    <span>Paso {stepNumber} de 4</span>
                    <span>{stepNumber === 4 ? 'Último paso' : 'Recuperación segura'}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#e2eee6]" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={stepNumber} aria-label="Progreso de recuperación">
                    <div className="h-full rounded-full bg-linear-to-r from-[#087b3e] to-[#9bcd45] transition-all duration-300" style={{ width: `${stepNumber * 25}%` }} />
                  </div>
                </div>
              )}

              {info && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900">{info}</div>}
              {debugCode && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Modo desarrollo:</strong> código de prueba: <strong>{debugCode}</strong></div>}
              {error && <div role="alert" aria-live="polite" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">{error}</div>}

              {step === 'email' && (
                <form onSubmit={submitEmail} className="space-y-4">
                  <div>
                    <label htmlFor="recover-email" className="mb-2 block text-sm font-semibold text-[#174b37]">Correo electrónico</label>
                    <div className="group relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#648477] group-focus-within:text-emerald-700"><MailIcon /></span>
                      <input id="recover-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={150} placeholder="correo@ejemplo.com" className={`${inputClass} pl-12`} />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className={buttonClass}>
                    {saving ? 'Enviando código…' : 'Enviar código'} {!saving && <span className="text-lg">→</span>}
                  </button>
                </form>
              )}

              {(step === 'otp' || step === 'google') && (
                <form onSubmit={step === 'otp' ? submitOtp : submitGoogle} className="space-y-4">
                  <div>
                    <label htmlFor="recovery-code" className="mb-2 block text-sm font-semibold text-[#174b37]">
                      {step === 'otp' ? 'Código enviado al correo' : 'Código de Google Authenticator'}
                    </label>
                    <input id="recovery-code" name="code" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" autoFocus required placeholder="000000" className={`${inputClass} h-14 text-center font-mono text-2xl font-bold tracking-[0.45em] placeholder:text-[#b4c6bc]`} />
                    <p className="mt-2 text-xs leading-5 text-[#648477]">
                      {step === 'otp' ? 'Introduce los seis dígitos del código recibido.' : 'Introduce el código temporal de tu aplicación autenticadora.'}
                    </p>
                  </div>
                  <button type="submit" disabled={saving || code.length !== 6} className={buttonClass}>
                    {saving ? 'Verificando…' : 'Verificar código'} {!saving && <span className="text-lg">→</span>}
                  </button>
                </form>
              )}

              {step === 'password' && (
                <form onSubmit={submitPassword} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-[#174b37]">Nueva contraseña</label>
                    <div className="group relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#648477] group-focus-within:text-emerald-700"><LockIcon /></span>
                      <input id="new-password" name="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} maxLength={32} required placeholder="Crea una contraseña segura" className={`${inputClass} pl-12 pr-12`} />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#648477] transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30">
                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="new-password-confirmation" className="mb-2 block text-sm font-semibold text-[#174b37]">Confirmar contraseña</label>
                    <div className="group relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#648477] group-focus-within:text-emerald-700"><LockIcon /></span>
                      <input id="new-password-confirmation" name="new-password-confirmation" type={showConfirmation ? 'text' : 'password'} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" minLength={8} maxLength={32} required placeholder="Repite la nueva contraseña" className={`${inputClass} pl-12 pr-12`} />
                      <button type="button" onClick={() => setShowConfirmation((value) => !value)} aria-label={showConfirmation ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#648477] transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30">
                        {showConfirmation ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">Utiliza entre 8 y 32 caracteres. No compartas tu contraseña con otras personas.</div>
                  <button type="submit" disabled={saving} className={buttonClass}>
                    {saving ? 'Actualizando…' : 'Cambiar contraseña'} {!saving && <span className="text-lg">→</span>}
                  </button>
                </form>
              )}

              {step === 'success' && (
                <div className="pt-2">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-3xl font-bold text-emerald-700">✓</div>
                  <p className="mt-4 text-sm leading-6 text-[#577568]">Tu contraseña se guardó correctamente. Inicia sesión con tus nuevas credenciales para continuar.</p>
                  <button type="button" onClick={() => navigate('/login', { replace: true })} className={`${buttonClass} mt-6`}>
                    Ir a iniciar sesión <span className="text-lg">→</span>
                  </button>
                </div>
              )}

              {step !== 'success' && step !== 'email' && (
                <div className="mt-6 border-t border-[#dce9e0] pt-5">
                  <button type="button" onClick={restart} className="text-sm font-semibold text-emerald-800 transition hover:text-emerald-600 hover:underline">
                    Empezar de nuevo
                  </button>
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-white/90">Servicio Nacional de Aprendizaje · SENA</p>
            <p className="mt-1 text-center text-[11px] text-white/70">SIGMA · Gestión de recursos</p>
          </div>
        </section>
      </div>
    </main>
  )
}