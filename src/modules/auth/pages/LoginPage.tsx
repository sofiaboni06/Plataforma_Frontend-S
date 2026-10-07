import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import {
  EyeIcon,
  EyeOffIcon,
} from '@/shared/components/icons/AppIcons'

import {
  ApiError,
  shouldRememberSession,
} from '@/shared/lib/api'

import { useAuth } from '@/modules/auth/context/auth'

/* ============================================================
   ERRORES DE LOGIN
============================================================ */

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

/* ============================================================
   ICONO USUARIO
============================================================ */

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5.5 19c.8-3.4 3-5.2 6.5-5.2s5.7 1.8 6.5 5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ============================================================
   ICONO CANDADO
============================================================ */

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
        strokeWidth="1.8"
      />

      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ============================================================
   ICONO CHECK
============================================================ */

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="currentColor"
      />

      <path
        d="m8 12 2.5 2.5L16 9"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ============================================================
   ICONO UBICACIÓN
============================================================ */

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M20 10.5c0 5.2-8 10-8 10s-8-4.8-8-10a8 8 0 1 1 16 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="12"
        cy="10.5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

/* ============================================================
   ICONO GRADUACIÓN
============================================================ */

function GraduationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M6.5 11.5V16c2.5 2.2 8.5 2.2 11 0v-4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M21 10v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ============================================================
   PATRÓN DE PUNTOS
============================================================ */

function DotPattern({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      className={`grid grid-cols-5 gap-2 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: 25 }).map((_, index) => (
        <span
          key={index}
          className="h-1 w-1 rounded-full bg-[#19C66B]"
        />
      ))}
    </div>
  )
}

/* ============================================================
   ONDAS DECORATIVAS
============================================================ */

function WaveLines() {
  return (
    <svg
      viewBox="0 0 520 220"
      className="pointer-events-none absolute bottom-0 right-0 h-42.5 w-97.5 opacity-40 xl:h-52.5 xl:w-125"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M120 220C120 150 180 100 250 100s130 50 130 120"
        stroke="#00A651"
        strokeWidth="1.5"
      />

      <path
        d="M95 220C95 135 170 78 250 78s155 57 155 142"
        stroke="#00A651"
        strokeWidth="1.5"
      />

      <path
        d="M70 220C70 120 155 55 250 55s180 65 180 165"
        stroke="#00A651"
        strokeWidth="1.5"
      />

      <path
        d="M45 220C45 105 140 32 250 32s205 73 205 188"
        stroke="#00A651"
        strokeWidth="1.5"
      />

      <path
        d="M20 220C20 90 125 10 250 10s230 80 230 210"
        stroke="#00A651"
        strokeWidth="1.5"
      />

      <path
        d="M-5 220C-5 75 110-15 250-15s255 90 255 235"
        stroke="#00A651"
        strokeWidth="1.5"
      />

      <path
        d="M-30 220C-30 60 95-40 250-40s280 100 280 260"
        stroke="#00A651"
        strokeWidth="1.5"
      />
    </svg>
  )
}

/* ============================================================
   LOGIN
============================================================ */

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

  /* ==========================================================
     TÍTULO
  =========================================================== */

  useEffect(() => {
    const previousTitle = document.title

    document.title = 'Iniciar sesión | SENA'

    return () => {
      document.title = previousTitle
    }
  }, [])

  /* ==========================================================
     CARGANDO SESIÓN
  =========================================================== */

  if (!isReady) {
    return (
      <div className="grid min-h-svh place-items-center bg-[#F3F8F5] text-sm text-[#56766A]">
        Cargando sesión…
      </div>
    )
  }

  /* ==========================================================
     USUARIO YA AUTENTICADO
  =========================================================== */

  if (token) {
    return <Navigate to={nextPath} replace />
  }

  /* ==========================================================
     ENVIAR FORMULARIO
  =========================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
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
    <main className="min-h-svh bg-[#F1F8F4] lg:h-svh lg:overflow-hidden">

      <div className="grid min-h-svh lg:h-full lg:grid-cols-2">

        {/* ====================================================
            PANEL IZQUIERDO
        ===================================================== */}

        <section className="relative hidden min-h-svh overflow-hidden bg-[#003D29] lg:block">

          {/* FOTO */}

          <img
            src="/img/imageninicio.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* OVERLAY */}

          <div className="absolute inset-0 bg-[#003D29]/76" />

          <div className="absolute inset-0 bg-linear-to-br from-[#003B28]/95 via-[#005C3D]/72 to-[#00A651]/25" />

          {/* ==================================================
              DECORACIONES SUPERIORES
          =================================================== */}

          <div className="absolute -left-28 -top-28 h-64 w-64 rounded-full bg-sena/25" />

          <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full border border-[#5FE36A]/15" />

          <div className="absolute -right-32 top-[26%] h-72 w-72 rounded-full bg-sena/10 blur-3xl" />

          {/* ==================================================
              CONTENIDO
          =================================================== */}

          <div className="relative z-10 flex h-full min-h-svh flex-col px-9 py-7 xl:px-14 xl:py-9">

            {/* ==================================================
                LOGO
            =================================================== */}

            <Link
              to="/"
              className="inline-flex w-fit items-center gap-4 text-white"
            >
              <img
                src="/img/logo-sena.svg"
                alt="SENA"
                className="h-14 w-auto brightness-0 invert xl:h-16"
              />

              <span className="h-10 w-px bg-white/45 xl:h-12" />

              <span className="max-w-47.5 text-[14px] font-semibold leading-snug tracking-wide xl:text-[16px]">
                Servicio Nacional
                <br />
                de Aprendizaje
              </span>
            </Link>

            {/* ==================================================
                HERO
            =================================================== */}

            <div className="mt-auto pb-5 pt-8 xl:pb-12 xl:pt-12">

              <h1 className="text-[48px] font-extrabold leading-[0.98] tracking-tight text-white xl:text-[64px]">
                Bienvenido
                <br />
                al{' '}
                <span className="text-[#5FE36A]">
                  SENA
                </span>
              </h1>

              <p className="mt-5 max-w-127.5 text-[18px] leading-snug text-white/95 xl:mt-6 xl:text-[23px]">
                Formación que{' '}
                <span className="font-bold text-[#5FE36A]">
                  transforma vidas
                </span>{' '}
                y abre nuevas oportunidades.
              </p>

              {/* Línea naranja */}

              <div className="mt-6 h-1 w-16 rounded-full bg-[#FF8C00]" />

              {/* ==================================================
                  TARJETAS
              =================================================== */}

              <div className="relative mt-8 h-33.75 max-w-125 xl:mt-11 xl:h-43.75">

                {/* TARJETA 1 */}

                <div className="absolute left-0 top-0 flex items-center gap-3 rounded-2xl border border-white/40 bg-white/95 px-3 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md xl:px-4 xl:py-3.5">

                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sena text-white xl:h-11 xl:w-11">
                    <CheckIcon />
                  </span>

                  <span className="text-[13px] font-semibold leading-tight text-[#073C31] xl:text-[15px]">
                    Formación
                    <br />
                    de calidad
                  </span>
                </div>

                {/* TARJETA 2 */}

                <div className="absolute left-51.25 top-10 flex items-center gap-3 rounded-2xl border border-white/40 bg-white/95 px-3 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md xl:left-61.25 xl:top-11.25 xl:px-4 xl:py-3.5">

                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sena text-white xl:h-11 xl:w-11">
                    <GraduationIcon />
                  </span>

                  <span className="text-[13px] font-semibold leading-tight text-[#073C31] xl:text-[15px]">
                    Miles de
                    <br />
                    oportunidades
                  </span>
                </div>

                {/* TARJETA 3 */}

                <div className="absolute left-11.25 top-22.5 flex items-center gap-3 rounded-2xl border border-white/40 bg-white/95 px-3 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md xl:left-14.5 xl:top-31.25 xl:px-4 xl:py-3.5">

                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sena text-white xl:h-11 xl:w-11">
                    <LocationIcon />
                  </span>

                  <span className="text-[13px] font-semibold leading-tight text-[#073C31] xl:text-[15px]">
                    Presencia
                    <br />
                    en Colombia
                  </span>
                </div>

              </div>
            </div>

            {/* ==================================================
                PUNTOS
            =================================================== */}

            <DotPattern className="absolute bottom-16 left-7 opacity-60 xl:bottom-20 xl:left-8" />

            {/* ==================================================
                ONDAS
            =================================================== */}

            <WaveLines />

            {/* ==================================================
                ARCOS
            =================================================== */}

            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full border-[3px] border-[#FF8C00]" />

            <div className="absolute -bottom-28 -left-24 h-52 w-52 rounded-full border-2 border-sena/70" />

          </div>
        </section>

        {/* ====================================================
            PANEL DERECHO
        ===================================================== */}

        <section className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-4 sm:px-6 lg:h-full lg:min-h-0 lg:px-8 lg:py-3">

          {/* ==================================================
              FONDO
          =================================================== */}

          <div className="pointer-events-none absolute inset-0 bg-[#F2F8F5]" />

          {/* Círculo derecho */}

          <div className="pointer-events-none absolute -right-28 top-[18%] h-72 w-72 rounded-full bg-[#DDEFE6]" />

          <div className="pointer-events-none absolute -right-16 top-[25%] h-56 w-56 rounded-full bg-[#E8F5EE]" />

          {/* Círculo inferior */}

          <div className="pointer-events-none absolute -bottom-40 -left-28 h-80 w-80 rounded-full bg-[#E3F1E9]" />

          {/* ==================================================
              ARCOS NARANJAS
          =================================================== */}

          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full border-2 border-[#FF8C00]" />

          <div className="pointer-events-none absolute -bottom-20 -right-12 h-40 w-40 rounded-full border-2 border-[#FF8C00]" />

          {/* ==================================================
              PUNTOS
          =================================================== */}

          <DotPattern className="pointer-events-none absolute right-8 top-7 opacity-60" />

          <DotPattern className="pointer-events-none absolute bottom-7 right-8 opacity-60" />

          {/* ==================================================
              CONTENEDOR
          =================================================== */}

          <div className="relative z-10 w-full max-w-137.5">

            {/* ==================================================
                TARJETA LOGIN
            =================================================== */}

            <div className="rounded-[28px] border border-[#CDE5D9] bg-white/95 px-6 py-5 shadow-[0_20px_60px_rgba(0,90,60,0.12)] backdrop-blur-sm sm:px-8 sm:py-6">

              {/* ==================================================
                  LOGO
              =================================================== */}

              <div className="flex justify-center">

                <img
                  src="/img/logo-sena.svg"
                  alt="SENA"
                  className="h-13.5 w-auto sm:h-15"
                />

              </div>

              {/* ==================================================
                  TÍTULO
              =================================================== */}

              <div className="mt-2 text-center">

                <h2 className="text-[28px] font-extrabold tracking-tight text-[#073C31] sm:text-[30px]">
                  Iniciar sesión
                </h2>

                <p className="mt-1 text-[14px] leading-relaxed text-[#607D72] sm:text-[15px]">
                  Accede a tu cuenta para continuar en la plataforma.
                </p>

              </div>

              {/* ==================================================
                  FORMULARIO
              =================================================== */}

              <form
                className="mt-5 space-y-3.5"
                onSubmit={handleSubmit}
              >

                {/* USUARIO */}

                <div>

                  <label
                    htmlFor="usuario"
                    className="mb-1.5 block text-[14px] font-medium text-[#073C31]"
                  >
                    Correo electrónico o número de documento
                  </label>

                  <div className="group relative">

                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#66877B] transition group-focus-within:text-sena">
                      <UserIcon />
                    </span>

                    <input
                      id="usuario"
                      value={usuario}
                      onChange={(event) =>
                        setUsuario(event.target.value)
                      }
                      autoComplete="username"
                      required
                      placeholder="Ingresa tu correo o documento"
                      className="h-12.5 w-full rounded-xl border border-[#D4E0DC] bg-white pl-11 pr-4 text-[14px] text-[#073C31] outline-none transition placeholder:text-[#9AAFA8] hover:border-[#B9D5C9] focus:border-sena focus:ring-4 focus:ring-[#00A651]/10"
                    />

                  </div>
                </div>

                {/* CONTRASEÑA */}

                <div>

                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-[14px] font-medium text-[#073C31]"
                  >
                    Contraseña
                  </label>

                  <div className="group relative">

                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#66877B] transition group-focus-within:text-sena">
                      <LockIcon />
                    </span>

                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      autoComplete="current-password"
                      required
                      placeholder="Ingresa tu contraseña"
                      className="h-12.5 w-full rounded-xl border border-[#D4E0DC] bg-white pl-11 pr-11 text-[14px] text-[#073C31] outline-none transition placeholder:text-[#9AAFA8] hover:border-[#B9D5C9] focus:border-sena focus:ring-4 focus:ring-[#00A651]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#66877B] transition hover:text-sena"
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>

                  </div>
                </div>

                {/* ==================================================
                    RECORDAR / RECUPERAR
                =================================================== */}

                <div className="flex items-center justify-between gap-3 pt-0.5">

                  <label className="flex cursor-pointer items-center gap-2 text-[14px] text-[#073C31]">

                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) =>
                        setRemember(event.target.checked)
                      }
                      className="h-4.75 w-4.75 cursor-pointer rounded border-[#C6D8D1] accent-sena"
                    />

                    <span>
                      Recordar sesión
                    </span>

                  </label>

                  <Link
                    to="/recuperar"
                    className="text-[14px] font-semibold text-[#007E4C] transition hover:text-sena hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>

                </div>

                {/* ERROR */}

                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-[#F0CACA] bg-[#FFF4F4] px-3 py-2 text-xs leading-relaxed text-[#A33A3A]"
                  >
                    {error}
                  </div>
                ) : null}

                {/* ==================================================
                    BOTÓN
                =================================================== */}

                <button
                  type="submit"
                  disabled={saving}
                  className="group flex h-12.75 w-full items-center justify-center gap-3 rounded-xl bg-sena text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(0,166,81,0.23)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#009447] hover:shadow-[0_12px_25px_rgba(0,166,81,0.28)] focus:outline-none focus:ring-4 focus:ring-[#00A651]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >

                  <span>
                    {saving
                      ? 'Iniciando sesión...'
                      : 'INICIAR SESIÓN'}
                  </span>

                  {!saving && (
                    <span className="text-xl leading-none transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  )}

                </button>

              </form>

              {/* ==================================================
                  AYUDA
              =================================================== */}

              <div className="mt-4 flex items-center gap-3">

                <div className="h-px flex-1 bg-[#DCE7E2]" />

                <span className="whitespace-nowrap text-[11px] font-medium text-[#71877E] sm:text-xs">
                  ¿Necesitas ayuda para acceder?
                </span>

                <div className="h-px flex-1 bg-[#DCE7E2]" />

              </div>

              <div className="mt-2 text-center">

                <a
                  href="#"
                  className="text-[13px] font-semibold text-[#007E4C] transition hover:text-sena hover:underline"
                >
                  Centro de ayuda
                </a>

              </div>

              {/* ==================================================
                  VOLVER
              =================================================== */}

              <div className="mt-3 border-t border-[#E1EAE6] pt-3 text-center">

                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#007E4C] transition hover:text-sena"
                >

                  <span className="text-lg leading-none">
                    ←
                  </span>

                  Volver al inicio

                </Link>

              </div>

            </div>

            {/* ==================================================
                TEXTO INFERIOR
            =================================================== */}

            <p className="mt-2 text-center text-[10px] text-[#71877E]">
              Servicio Nacional de Aprendizaje · SENA
            </p>

          </div>
        </section>
      </div>
    </main>
  )
}