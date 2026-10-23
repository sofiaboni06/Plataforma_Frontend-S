import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { useAuth } from '@/modules/auth/context/auth'

function SigmaWordmark({ className = 'h-14 w-14' }: { className?: string }) {
  return (
    <img src="/img/logo-sigma.png" alt="" className={`${className} object-contain`} />
  )
}

function NotFoundBody({
  homeTo,
  homeLabel,
  tone,
}: {
  homeTo: string
  homeLabel: string
  tone: 'app' | 'public'
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const light = tone === 'public'

  return (
    <div className={light ? 'relative z-10 mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-16 sm:px-10' : ''}>
      <p
        className={`nf-num font-black tracking-[-0.04em] ${
          light
            ? 'text-[6.5rem] leading-none text-white/90 sm:text-[8.5rem]'
            : 'text-[6.5rem] leading-none text-sena-dark/15 sm:text-[8.5rem]'
        }`}
        aria-hidden="true"
      >
        404
      </p>

      <div className={`mt-2 flex items-center gap-3 ${light ? 'text-white' : 'text-sena-dark'}`}>
        <SigmaWordmark className="h-12 w-12" />
        <span className="text-2xl font-bold tracking-tight">SIGMA</span>
      </div>

      <h1
        className={`mt-8 max-w-[18ch] text-3xl font-bold tracking-tight sm:text-4xl ${
          light ? 'text-white' : 'text-sena-dark'
        }`}
      >
        Página no encontrada
      </h1>

      <p
        className={`mt-3 max-w-[42ch] text-[0.9375rem] leading-7 ${
          light ? 'text-white/80' : 'text-sena-text/70'
        }`}
      >
        Esta dirección no existe en SIGMA. Revisa el enlace o vuelve al inicio para
        seguir desde el menú.
      </p>

      <p
        className={`mt-5 max-w-full truncate rounded-xl px-4 py-2.5 font-mono text-sm ${
          light
            ? 'bg-black/30 text-white ring-1 ring-white/25'
            : 'bg-sena-muted text-sena-strong ring-1 ring-sena-line'
        }`}
        title={location.pathname}
      >
        {location.pathname}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to={homeTo}
          className={
            light
              ? 'inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-sena-dark shadow-brand-sm transition hover:bg-sena-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
              : 'inline-flex h-11 items-center rounded-xl bg-sena px-5 text-sm font-semibold text-white shadow-brand transition hover:bg-sena-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena'
          }
        >
          {homeLabel}
        </Link>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={
            light
              ? 'inline-flex h-11 items-center rounded-xl border border-white/35 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
              : 'inline-flex h-11 items-center rounded-xl border border-sena-line bg-white px-5 text-sm font-semibold text-sena-dark shadow-hairline transition hover:border-sena/45 hover:text-sena focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena'
          }
        >
          Volver
        </button>
      </div>
    </div>
  )
}

export default function NotFoundPage() {
  const { token, isReady } = useAuth()

  useEffect(() => {
    const previous = document.title
    document.title = 'Página no encontrada | SIGMA'
    return () => {
      document.title = previous
    }
  }, [])

  if (!isReady) {
    return (
      <div className="app-shell grid min-h-svh place-items-center bg-sena-muted text-sm text-sena-text/70">
        Cargando sesión…
      </div>
    )
  }

  if (token) {
    return (
      <AppLayout title="Página no encontrada">
        <section className="overflow-hidden rounded-[28px] bg-white px-7 py-10 shadow-card ring-1 ring-sena-line sm:px-10 lg:py-12">
          <NotFoundBody homeTo="/inicio" homeLabel="Ir al inicio" tone="app" />
        </section>
      </AppLayout>
    )
  }

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#073d2b]">
      <img
        src="/img/imageninicio.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center blur-[3px]"
      />
      <div className="absolute inset-0 bg-linear-to-br from-[#003b27]/88 via-[#087b45]/62 to-[#004d32]/70" />
      <NotFoundBody homeTo="/" homeLabel="Ir al inicio" tone="public" />
    </main>
  )
}
