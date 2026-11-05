import { useEffect, useRef, useState } from 'react'

export const CAPTCHA_ENABLED = import.meta.env.VITE_CAPTCHA_ENABLED !== 'false'
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined

type Grecaptcha = {
  ready: (callback: () => void) => void
  render: (container: HTMLElement, parameters: Record<string, unknown>) => number
  reset: (widgetId?: number) => void
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

let scriptPromise: Promise<Grecaptcha> | null = null

/** Carga el script de Google una sola vez para toda la aplicación. */
function loadRecaptcha(): Promise<Grecaptcha> {
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<Grecaptcha>((resolve, reject) => {
    const whenReady = () => {
      const grecaptcha = window.grecaptcha
      if (!grecaptcha) {
        scriptPromise = null
        reject(new Error('reCAPTCHA no está disponible.'))
        return
      }
      grecaptcha.ready(() => resolve(grecaptcha))
    }

    if (window.grecaptcha) {
      whenReady()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=es'
    script.async = true
    script.defer = true
    script.onload = whenReady
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('No se pudo cargar el captcha. Revisa tu conexión.'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

type CaptchaFieldProps = {
  onToken: (token: string | null) => void
  /** Súbelo en 1 cada vez que el login falle para pedir un token nuevo. */
  resetKey: number
}

export default function CaptchaField({ onToken, resetKey }: CaptchaFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<number | null>(null)
  const onTokenRef = useRef(onToken)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!CAPTCHA_ENABLED || !SITE_KEY) return

    let cancelled = false

    loadRecaptcha()
      .then((grecaptcha) => {
        const container = containerRef.current
        if (cancelled || !container || widgetId.current !== null) return

        widgetId.current = grecaptcha.render(container, {
          sitekey: SITE_KEY,
          theme: 'light',
          // En pantallas muy angostas la versión normal (304 px) no cabe.
          size: window.matchMedia('(max-width: 400px)').matches ? 'compact' : 'normal',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el captcha.')
        }
      })

    return () => {
      cancelled = true
      // Si el widget desaparece, el token anterior deja de ser válido.
      onTokenRef.current(null)
    }
  }, [])

  useEffect(() => {
    if (resetKey === 0 || widgetId.current === null) return
    window.grecaptcha?.reset(widgetId.current)
    onTokenRef.current(null)
  }, [resetKey])

  if (!CAPTCHA_ENABLED) return null

  if (!SITE_KEY) {
    return (
      <p role="alert" className="text-sm font-medium text-red-700">
        Falta configurar VITE_RECAPTCHA_SITE_KEY.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} />
      {loadError ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {loadError}
        </p>
      ) : null}
    </div>
  )
}