import '@/modules/landing/styles/landing.css'

const footerColumns = [
  {
    title: 'Institucional',
    links: ['Quiénes somos', 'Misión y visión', 'Transparencia'],
  },
  {
    title: 'Atención al ciudadano',
    links: ['PQRS', 'Trámites y servicios', 'Canales de atención'],
  },
  {
    title: 'Transparencia',
    links: ['Datos abiertos', 'Contratación', 'Rendición de cuentas'],
  },
  {
    title: 'Operación',
    links: ['Sede principal', 'Línea de atención', 'Correo institucional'],
  },
]

export default function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer id="contacto" className={`lp-footer ${className}`.trim()}>
      <div className="lp-footer-rule" aria-hidden="true" />
      <div className="lp-footer-main">
        <div className="lp-footer-brand">
          <div className="lp-footer-marks">
            <img src="/img/logo-sigma.png" alt="SIGMA" className="lp-footer-logo" />
            <img
              src="/img/logo-fabrica-software.png"
              alt="Fábrica de Software"
              className="lp-footer-fabrica"
            />
          </div>
          <p className="lp-footer-name">SIGMA</p>
          <p className="lp-footer-lead">
            Sistema integral de gestión de módulos administrativos. Inventario, formación y los
            procesos del centro, en una sola plataforma.
          </p>
          <div className="lp-footer-social">
            <p>Síguenos</p>
            <div>
              <a href="#contacto" className="lp-social" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.4C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7Z" />
                </svg>
              </a>
              <a href="#contacto" className="lp-social" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
                </svg>
              </a>
              <a href="#contacto" className="lp-social" aria-label="X">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.8 3H20l-6.2 7.1L21 21h-5.5l-4.3-6.3L6.2 21H4l6.7-7.6L3 3h5.6l3.9 5.8L17.8 3Zm-1 16.2h1.5L7.3 4.7H5.7l11.1 14.5Z" />
                </svg>
              </a>
              <a href="#contacto" className="lp-social" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C18.2 5.4 12 5.4 12 5.4s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM10 15.2V9.2l5.2 3-5.2 3Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <nav className="lp-footer-nav" aria-label="Enlaces del sitio">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="lp-footer-heading">{column.title}</p>
              <ul>
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#contacto">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="lp-footer-bar">
        <p>© 2026 SIGMA · Servicio Nacional de Aprendizaje — SENA. Todos los derechos reservados.</p>
        <p>El SENA es un establecimiento público del orden nacional, adscrito al Ministerio del Trabajo.</p>
      </div>
    </footer>
  )
}
