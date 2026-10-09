
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeOffIcon } from '@/shared/components/icons/AppIcons'
import { ApiError, shouldRememberSession } from '@/shared/lib/api'
import { useAuth } from '@/modules/auth/context/auth'

function loginError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 400) {
      return 'Correo, documento o contraseña incorrectos.'
    }

    if (error.status === 403) {
      return 'Esta cuenta está inactiva. Pídele a un administrador que la active.'
    }

    return error.message
  }

  return 'No se pudo conectar con el servidor. Revisa que el API esté encendido.'
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.5 19c.8-3.4 3-5.2 6.5-5.2s5.7 1.8 6.5 5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}


export default function LoginPage() {
  const { login, token, isReady } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string } | null)?.from
  const nextPath = from && from !== '/login' ? from : '/inicio'

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(shouldRememberSession)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Iniciar sesión | GlasmoFimos'

    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    if (!showHelp) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowHelp(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showHelp])

  if (!isReady) {
    return (
      <div className="grid min-h-svh place-items-center bg-emerald-950 text-sm text-white">
        Cargando sesión…
      </div>
    )
  }

  if (token) {
    return <Navigate to={nextPath} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await login({
        usuario: usuario.trim(),
        password,
        remember,
      })

      navigate(nextPath, { replace: true })
    } catch (caught) {
      setError(loginError(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#073d2b]">
      {/* Fondo fotográfico con desenfoque */}
      <img
        src="/img/imageninicio.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center blur-[3px]"
      />

      {/* Capas verdes para mejorar la lectura */}
      <div className="absolute inset-0 bg-linear-to-br from-[#003b27]/85 via-[#087b45]/55 to-[#9cde9c]/40" />
      <div className="absolute inset-0 bg-emerald-950/10 backdrop-blur-[2px]" />

      {/* Luces decorativas */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-lime-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-green-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-svh w-full max-w-360 grid-cols-1 items-center gap-8 px-5 py-8 sm:px-10 lg:grid-cols-[1fr_0.9fr] lg:gap-12 lg:px-16 xl:px-24">
       
{/* Marca y presentación GESNOVA */}
<section className="relative flex flex-col items-center justify-center text-center text-white lg:px-6 lg:scale-90">

  {/* Logotipo original */}
  <div className="mb-5 flex justify-center">
   <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md sm:h-20 sm:w-20">
      <div className="absolute inset-2 rounded-3xl bg-linear-to-br from-sky-400/20 to-lime-400/20 blur-xl" />

      <svg
        viewBox="0 0 100 100"
        className="relative h-14 w-14 sm:h-16 sm:w-16"
        fill="none"
        role="img"
        aria-label="Logotipo de GESNOVA"
      >
        <defs>
          <linearGradient id="gesnova-blue" x1="15" y1="10" x2="55" y2="65" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#0759D6" />
          </linearGradient>
          <linearGradient id="gesnova-green" x1="45" y1="25" x2="90" y2="90" gradientUnits="userSpaceOnUse">
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
  </div>

  {/* Nombre con degradados independientes */}
  <h1 className="text-4xl font-black leading-none tracking-tight sm:text-5xl xl:text-6xl">
    <span className="bg-linear-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
      GES
    </span>
    <span className="bg-linear-to-r from-lime-300 via-green-300 to-emerald-400 bg-clip-text text-transparent">
      NOVA
    </span>
  </h1>

  {/* Descriptor */}
  <div className="mt-4 flex items-center justify-center gap-3">
    <span className="h-px w-8 bg-white/60 sm:w-12" />
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/90 sm:text-sm">
      Plataforma de gestión
    </p>
    <span className="h-px w-8 bg-white/60 sm:w-12" />
  </div>

  {/* Eslogan */}
  <p className="mt-6 max-w-md text-xl font-medium leading-relaxed text-white sm:text-2xl">
    Una plataforma,
    <span className="block font-bold text-lime-300">
      múltiples soluciones.
    </span>
  </p>

  <p className="mt-3 max-w-sm text-sm leading-6 text-white/80 sm:text-base">
    Conectamos procesos, optimizamos la gestión y transformamos el futuro de la institución.
  </p>

  {/* Beneficios */}
  <div className="mt-5 grid w-full max-w-md grid-cols-3 divide-x divide-white/25">
    <div className="px-2 py-2">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-lime-300">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="m19 13 2-1-2-1-.5-2 1-2-2-2-2 1-2-.5-1-2-2 2-.5 2-2 1-2-1-2 2 1 2-.5 2-2 1 2 1 .5 2-1 2 2 2 2-1 2 .5 1 2 2-2 .5-2 2-1 2 1 2-2-1-2 .5-2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="mt-3 text-xs font-semibold leading-relaxed text-white/90 sm:text-sm">
        Procesos
        <br />
        más ágiles
      </p>
    </div>

    <div className="px-2 py-2">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-lime-300">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
          <path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="m8.5 12 2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="mt-3 text-xs font-semibold leading-relaxed text-white/90 sm:text-sm">
        Gestión
        <br />
        segura
      </p>
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
      <p className="mt-3 text-xs font-semibold leading-relaxed text-white/90 sm:text-sm">
        Mejores
        <br />
        resultados
      </p>
    </div>
  </div>

  {/* Identidad institucional */}
  <div className="mt-6 flex flex-col items-center">
    <img
      src="/img/logo-sena.svg"
      alt="SENA"
      className="h-14 w-auto brightness-0 invert sm:h-16"
    />
    <div className="mt-3 flex items-center gap-3">
      <span className="h-px w-7 bg-white/50" />
      <p className="text-sm font-medium tracking-wide text-white/90 sm:text-base">
        SENA que transforma
      </p>
      <span className="h-px w-7 bg-white/50" />
    </div>
  </div>
</section>
        {/* Formulario de acceso */}
        <section className="flex w-full items-center justify-center">
          <div className="w-full max-w-107.5">
            <div className="rounded-[26px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(0,45,25,0.25)] backdrop-blur-2xl sm:p-9">
              <div className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Acceso a la plataforma
                </p>

                <h2 className="text-3xl font-extrabold tracking-tight text-[#073c2b]">
                  Iniciar sesión
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-[#577568]">
                  Ingresa tus credenciales para continuar.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Usuario */}
                <div>
                  <label
                    htmlFor="usuario"
                    className="mb-2 block text-sm font-semibold text-[#174b37]"
                  >
                    Usuario
                  </label>

                  <div className="group relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#648477] transition-colors group-focus-within:text-emerald-700">
                      <UserIcon />
                    </span>

                    <input
                      id="usuario"
                      name="usuario"
                      type="text"
                      value={usuario}
                      onChange={(event) => setUsuario(event.target.value)}
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      placeholder="Correo o número de documento"
                      className="h-12 w-full rounded-xl border border-[#d1e3d8] bg-white/75 pl-12 pr-4 text-sm text-[#123e2d] outline-none transition placeholder:text-[#8aa397] hover:border-[#9fcab0] focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[#174b37]"
                  >
                    Contraseña
                  </label>

                  <div className="group relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#648477] transition-colors group-focus-within:text-emerald-700">
                      <LockIcon />
                    </span>

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                      placeholder="Ingresa tu contraseña"
                      className="h-12 w-full rounded-xl border border-[#d1e3d8] bg-white/75 pl-12 pr-12 text-sm text-[#123e2d] outline-none transition placeholder:text-[#8aa397] hover:border-[#9fcab0] focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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

                {/* Recordar sesión y recuperación */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[#426756] sm:text-sm">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded accent-emerald-700"
                    />
                    Recordar sesión
                  </label>

                  <Link
                    to="/recuperar"
                    className="text-xs font-semibold text-emerald-800 transition hover:text-emerald-600 hover:underline sm:text-sm"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Mensaje de error */}
                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800"
                  >
                    {error}
                  </div>
                )}

                {/* Botón de acceso */}
                <button
                  type="submit"
                  disabled={saving}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#087b3e] to-[#0a9c4d] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,130,60,0.24)] transition duration-200 hover:-translate-y-0.5 hover:from-[#066a35] hover:to-[#078540] hover:shadow-[0_12px_26px_rgba(0,130,60,0.30)] focus:outline-none focus:ring-4 focus:ring-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {saving ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeOpacity=".3"
                          strokeWidth="3"
                        />
                        <path
                          d="M21 12a9 9 0 0 0-9-9"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Iniciando sesión…
                    </>
                  ) : (
                    <>
                      Ingresar
                      <span className="text-lg transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Centro de ayuda */}
              <div className="mt-6 border-t border-[#dce9e0] pt-5 text-center">
                <p className="text-xs text-[#6a8577]">
                  ¿Tienes problemas para acceder?
                </p>

                <button
                  type="button"
                  onClick={() => setShowHelp(true)}
                  className="mt-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-600 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                >
                  Centro de ayuda
                </button>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-white/90">
              Servicio Nacional de Aprendizaje · SENA
            </p>

            <p className="mt-1 text-center text-[11px] text-white/70">
              Gesnova · Gestión de recursos
            </p>
          </div>
        </section>
      </div>

      {/* Ventana funcional de ayuda */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowHelp(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                  Asistencia
                </p>
                <h2 id="help-title" className="mt-2 text-2xl font-extrabold text-[#073c2b]">
                  Centro de ayuda
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Cerrar ayuda"
                className="rounded-lg px-3 py-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Si tienes problemas para ingresar a Gesnova, comprueba tus
              credenciales y verifica que tu cuenta esté activa.
            </p>

            <div className="mt-5 rounded-xl bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-900">
                ¿No recuerdas tu contraseña?
              </p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                Puedes solicitar un código de recuperación para restablecerla.
              </p>
              <Link
                to="/recuperar"
                onClick={() => setShowHelp(false)}
                className="mt-3 inline-flex text-sm font-bold text-emerald-800 underline underline-offset-4 hover:text-emerald-600"
              >
                Recuperar mi contraseña
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-6 h-11 w-full rounded-xl bg-emerald-700 text-sm font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-600/25"
            >
              Entendido
            </button>
          </section>
        </div>
      )}
    </main>
  )
}