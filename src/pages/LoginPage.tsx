import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import { EyeIcon, EyeOffIcon } from '../components/icons/AppIcons'
import SenaMark from '../components/icons/SenaMark'
import { ApiError, shouldRememberSession } from '../lib/api'
import { useAuth } from '../lib/auth'

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

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Iniciar sesión | SENA'
    return () => {
      document.title = previousTitle
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
    return <Navigate to={nextPath} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await login({ usuario: usuario.trim(), password, remember })
      navigate(nextPath, { replace: true })
    } catch (caught) {
      setError(loginError(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell relative min-h-svh overflow-hidden bg-sena-forest">
      <img
        src="/img/imageninicio.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[#013318]/72" />

      <div className="relative z-10 grid min-h-svh place-items-center px-4 py-10">
        <div className="w-full max-w-[420px] rounded-3xl bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-9">
          <Link to="/" className="inline-flex items-center gap-2 text-sena-dark" aria-label="SENA">
            <SenaMark className="h-11 w-11 text-sena" />
            <span className="text-xl font-semibold tracking-tight">SENA</span>
          </Link>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-sena-text">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-sena-text/60">
            Entra con tu correo o número de documento.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <TextField
              id="usuario"
              label="Correo o documento"
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              autoComplete="username"
              required
              placeholder="carlos@correo.com"
            />

            <div className="relative">
              <TextField
                id="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="pr-11"
              />
              <button
                type="button"
                className="absolute right-3 top-[34px] text-sena-text/45 hover:text-sena-text"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-sena-text/80">
              <input
                type="checkbox"
                className="size-4 accent-[#00a651]"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Recordar sesión
            </label>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <Button type="submit" disabled={saving} className="mt-1 h-11 w-full rounded-xl">
              {saving ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-sm">
            <Link to="/recuperar" className="font-medium text-sena hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
            <Link to="/" className="text-sena-text/55 hover:text-sena-text">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
