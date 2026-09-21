import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import SenaMark from '../components/icons/SenaMark'

export default function RecoverPasswordPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Recuperar contraseña | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="app-shell relative min-h-svh overflow-hidden bg-sena-forest">
      <img src="/img/imageninicio.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#013318]/72" />

      <div className="relative z-10 grid min-h-svh place-items-center px-4 py-10">
        <div className="w-full max-w-[420px] rounded-3xl bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-9">
          <Link to="/" className="inline-flex items-center gap-2 text-sena-dark" aria-label="SENA">
            <SenaMark className="h-11 w-11 text-sena" />
            <span className="text-xl font-semibold tracking-tight">SENA</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-sena-text">
            Recuperar contraseña
          </h1>
          <p className="mt-2 text-sm leading-6 text-sena-text/65">
            Esta parte se conecta cuando esté el API de recuperar. Por ahora entra con tu clave
            actual desde el inicio de sesión.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-sena px-5 text-sm font-semibold text-white hover:bg-[#009247]"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
