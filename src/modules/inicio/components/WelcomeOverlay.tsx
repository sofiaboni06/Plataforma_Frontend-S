import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { useAuth } from '@/modules/auth/context/auth'
import { BuildingIcon, CameraIcon, CheckIcon, MapPinIcon } from '@/modules/perfil/components/icons'
import { useProfilePhoto } from '@/modules/perfil/hooks/useProfilePhoto'
import { splitFullName } from '@/modules/perfil/lib/nombre'
import {
  greetingFor,
  hasSeenWelcome,
  markWelcomeSeen,
  phraseForRole,
} from '@/modules/inicio/lib/welcome'
import '@/modules/inicio/styles/welcome.css'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 8 * 1024 * 1024

const MOTES = [
  { x: '6%', s: 5, d: '12s', delay: '0s' },
  { x: '16%', s: 8, d: '15s', delay: '-4s' },
  { x: '27%', s: 4, d: '11s', delay: '-8s' },
  { x: '39%', s: 7, d: '14s', delay: '-2s' },
  { x: '52%', s: 5, d: '13s', delay: '-9s' },
  { x: '63%', s: 9, d: '16s', delay: '-5s' },
  { x: '74%', s: 4, d: '12s', delay: '-11s' },
  { x: '85%', s: 7, d: '15s', delay: '-1s' },
  { x: '94%', s: 5, d: '11s', delay: '-7s' },
]

const delay = (ms: number) => ({ ['--wl-delay' as string]: `${ms}ms` }) as CSSProperties

function AnimatedWords({
  text,
  offset,
  className,
}: {
  text: string
  offset: number
  className?: string
}) {
  const words = text.split(/\s+/).filter(Boolean)
  let cursor = offset

  return (
    <span className={className} aria-hidden="true">
      {words.map((word, wordIndex) => {
        const start = cursor
        cursor += word.length + 1
        return (
          <Fragment key={`${word}-${wordIndex}`}>
            <span className="inline-block whitespace-nowrap">
              {[...word].map((char, index) => (
                <span
                  key={index}
                  className="wl-letter"
                  style={{ ['--i' as string]: start + index } as CSSProperties}
                >
                  {char}
                </span>
              ))}
            </span>
            {wordIndex < words.length - 1 ? ' ' : null}
          </Fragment>
        )
      })}
    </span>
  )
}

export default function WelcomeOverlay({ onClosing }: { onClosing?: () => void }) {
  const { user, loadPhoto, uploadPhoto } = useAuth()
  const [closing, setClosing] = useState(false)
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [greeting] = useState(() => greetingFor(new Date()))

  const inputRef = useRef<HTMLInputElement>(null)
  const startRef = useRef<HTMLButtonElement>(null)
  const timers = useRef<number[]>([])
  const onClosingRef = useRef(onClosing)

  const userId = user?.id
  // Se muestra solo si este usuario aún no la ha visto; mientras se cierra, sigue visible.
  const visible = userId !== undefined && (closing || !hasSeenWelcome(userId))
  const isOpen = visible && !closing

  const photoSrc = useProfilePhoto(user?.avatarUrl ?? '', loadPhoto, version)

  useEffect(() => {
    onClosingRef.current = onClosing
  }, [onClosing])

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id))
    },
    [],
  )

  useEffect(() => {
    if (!visible) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [visible])

  useEffect(() => {
    if (isOpen) startRef.current?.focus()
  }, [isOpen])

  const close = useCallback(() => {
    if (!isOpen || userId === undefined) return
    // Se marca como vista al instante: ni recargar ni volver a entrar la repite.
    markWelcomeSeen(userId)
    setClosing(true)
    onClosingRef.current?.()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(() => setClosing(false), reduceMotion ? 0 : 750)
    timers.current.push(id)
  }, [isOpen, userId])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, close])

  if (!visible || !user) return null

  const hasPhoto = Boolean(user.avatarUrl)
  const fallback = splitFullName(user.fullName)
  const nombres = user.nombres || fallback.nombres
  const apellidos = user.apellidos || fallback.apellidos
  const initials = user.initials || user.fullName.slice(0, 2).toUpperCase()
  const [centerFromLocation, regional] = (user.location ?? '').split(/\s+[—–]\s+/)
  const center = user.trainingCenter || centerFromLocation
  const phrase = phraseForRole(user.role)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Usa una imagen JPG, PNG o WebP.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('La imagen no puede pesar más de 8 MB.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await uploadPhoto(file)
      setVersion((current) => current + 1)
      setSaved(true)
      timers.current.push(window.setTimeout(() => setSaved(false), 3200))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo subir la foto.')
    } finally {
      setBusy(false)
    }
  }

  const openPicker = () => inputRef.current?.click()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-phrase"
      className={`wl-overlay fixed inset-0 z-[90] overflow-y-auto bg-[#052e20]${closing ? ' is-closing' : ''}`}
    >
      {/* Fondo: misma fotografía y capas verdes del inicio de sesión */}
      <img
        src="/img/imageninicio.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center blur-[3px]"
      />
      <div className="absolute inset-0 bg-linear-to-br from-[#002b1c]/93 via-[#05563a]/84 to-[#0a7a44]/72" />

      {/* Luces flotantes */}
      <div className="wl-orb pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-lime-300/20 blur-3xl" />
      <div
        className="wl-orb pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-green-300/20 blur-3xl"
        style={{ animationDelay: '-5s' }}
      />
      <div
        className="wl-orb pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl"
        style={{ animationDelay: '-9s' }}
      />

      {/* Luciérnagas que ascienden */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {MOTES.map((mote) => (
          <span
            key={mote.x}
            className="wl-mote"
            style={
              {
                '--x': mote.x,
                '--s': `${mote.s}px`,
                '--d': mote.d,
                '--delay': mote.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center px-6 py-12 text-white sm:px-10">
        <div className={`wl-stage${closing ? ' is-closing' : ''}`}>
          <div
            className="wl-rise mb-9 flex items-center justify-center gap-3 sm:justify-start"
            style={delay(100)}
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md">
              <img src="/img/logo-sigma.png" alt="" className="h-9 w-9 object-contain" />
            </span>
            <span className="text-sm font-bold tracking-[0.3em] text-white/80">SIGMA</span>
          </div>

          <div className="flex flex-col items-center gap-10 sm:flex-row sm:gap-9">
            {/* Círculo de la foto de perfil */}
            <div className="wl-pop relative mb-2 shrink-0 sm:mb-0" style={delay(250)}>
              {!hasPhoto ? <span aria-hidden="true" className="wl-ring" /> : null}

              <button
                type="button"
                onClick={openPicker}
                disabled={busy}
                aria-label={hasPhoto ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
                className={`group relative block size-32 overflow-hidden rounded-full border-4 border-white/85 shadow-2xl transition hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300 disabled:cursor-wait sm:size-36${hasPhoto ? '' : ' wl-pulse'}`}
              >
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={`Foto de ${user.fullName}`}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-linear-to-br from-[#0a7a44] to-[#06503a] text-4xl font-black text-white">
                    {initials}
                  </span>
                )}

                {busy ? (
                  <span className="absolute inset-0 grid place-items-center bg-[#052e20]/60">
                    <svg className="size-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </span>
                ) : (
                  <span className="absolute inset-0 grid place-items-center bg-[#052e20]/55 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    <CameraIcon className="size-9" />
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={openPicker}
                disabled={busy}
                tabIndex={-1}
                aria-hidden="true"
                className={`wl-photo-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap shadow-lg ${
                  saved
                    ? 'bg-white text-emerald-800'
                    : hasPhoto
                      ? 'bg-white/90 text-[#073c2b]'
                      : 'bg-lime-300 text-[#073c2b]'
                }`}
              >
                {saved ? (
                  <>
                    <CheckIcon className="size-3.5" strokeWidth={3} />
                    ¡Foto guardada!
                  </>
                ) : hasPhoto ? (
                  'Cambiar foto'
                ) : (
                  <>
                    <CameraIcon className="size-3.5" />
                    Agrega tu foto
                  </>
                )}
              </button>

              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => void handleFile(event)}
              />
              <span role="status" className="sr-only">
                {saved ? 'Foto guardada' : ''}
              </span>
            </div>

            {/* Saludo, nombre y rol */}
            <div className="min-w-0 text-center sm:text-left">
              <p
                className="wl-rise text-xs font-bold tracking-[0.28em] text-lime-300 uppercase sm:text-sm"
                style={delay(300)}
              >
                {greeting}
              </p>

              <h1
                id="welcome-title"
                aria-label={user.fullName}
                className="wl-glow mt-2 text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                <AnimatedWords text={nombres} offset={0} />{' '}
                <AnimatedWords
                  text={apellidos}
                  offset={nombres.length + 1}
                  className="text-lime-300"
                />
              </h1>

              <span
                className="wl-rise mt-4 inline-flex items-center gap-2 rounded-full border border-lime-300/40 bg-lime-300/15 px-4 py-1.5 text-sm font-bold text-lime-200"
                style={delay(1000)}
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-lime-300" />
                {user.roleLabel}
              </span>
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="wl-pop mt-6 rounded-xl border border-red-300/40 bg-red-500/20 px-4 py-3 text-sm font-medium text-red-100"
            >
              {error}
            </p>
          ) : null}

          {/* Centro de formación y regional */}
          <ul
            className="wl-rise mt-10 flex flex-wrap justify-center gap-3 sm:justify-start"
            style={delay(1100)}
          >
            {center ? (
              <li className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md">
                <BuildingIcon className="size-5 shrink-0 text-lime-300" />
                {center}
              </li>
            ) : null}
            {regional ? (
              <li className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md">
                <MapPinIcon className="size-5 shrink-0 text-lime-300" />
                {regional}
              </li>
            ) : null}
          </ul>

          {/* Frase según el rol */}
          <blockquote
            id="welcome-phrase"
            className="wl-rise mt-7 border-l-4 border-lime-300/80 pl-5 text-left text-lg leading-relaxed text-white/90 sm:text-xl"
            style={delay(1300)}
          >
            {phrase}
          </blockquote>

          <div
            className="wl-rise mt-10 flex flex-col items-center gap-3 sm:items-start"
            style={delay(1500)}
          >
            <button
              ref={startRef}
              type="button"
              onClick={close}
              className="group inline-flex h-13 items-center gap-3 rounded-full bg-white px-8 text-base font-bold text-[#073c2b] shadow-[0_14px_34px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:bg-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/50 focus-visible:outline-none"
            >
              Comenzar
              <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
            </button>
            <p className="text-xs text-white/70">
              Puedes cambiar tu foto cuando quieras desde Mi perfil.
            </p>
          </div>

          <div
            className="wl-rise mt-12 flex items-center justify-center gap-5 opacity-90 sm:justify-start"
            style={delay(1700)}
          >
            <img src="/img/logo-sena.svg" alt="SENA" className="h-10 w-auto brightness-0 invert" />
            <img src="/img/logo-fabrica-software.png" alt="Fábrica de Software" className="h-10 w-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}