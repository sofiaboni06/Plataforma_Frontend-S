
import '@/modules/landing/styles/landing.css'


const footerColumns = [
  {
    title: 'SIGMA',
    links: [
      { label: 'Inicio', href: '/inicio' },
      { label: 'Acerca de SIGMA', href: '#oferta' },
      { label: 'Equipo de desarrollo', href: '#equipo' },
    ],
  },
  {
    title: 'Servicios SENA',
    links: [
      {
        label: 'Portal institucional',
        href: 'https://www.sena.edu.co/',
        external: true,
      },
      {
        label: 'Atención al ciudadano',
        href: 'https://www.sena.edu.co/es-co/ciudadano/Paginas/default.aspx',
        external: true,
      },
      {
        label: 'PQRSD',
        href: 'https://sciudadanos.sena.edu.co/SolicitudIndex.aspx',
        external: true,
      },
    ],
  },
  {
    title: 'Transparencia',
    links: [
      {
        label: 'Transparencia y acceso a la información',
        href: 'https://www.sena.edu.co/transparencia',
        external: true,
      },
      {
        label: 'Misión y visión del SENA',
        href: 'https://www.sena.edu.co/transparencia',
        external: true,
      },
      {
        label: 'Información institucional',
        href: 'https://www.sena.edu.co/',
        external: true,
      },
    ],
  },
  {
    title: 'Contacto y soporte',
    links: [
      {
        label: 'Fábrica de Software',
        href: 'https://fabricasw.cloudsenactpi.net/',
        external: true,
      },
      {
        label: 'Correo de contacto',
        href: 'mailto:fabricaswctpicauca@gmail.com',
      },
      {
        label: 'Más información',
        href: 'https://fabricasw.cloudsenactpi.net/',
        external: true,
      },
    ],
  },
]

export default function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer id="contacto" className={`lp-footer ${className}`.trim()}>
      <div className="lp-footer-rule" aria-hidden="true" />

      <div className="lp-footer-main">
        {/* Identidad institucional */}
        <div className="lp-footer-brand">
          <div className="lp-footer-marks">
            <img
              src="/img/logo-sigma.png"
              alt="SIGMA"
              className="lp-footer-logo"
            />

            <img
              src="/img/logo-fabrica-software.png"
              alt="Fábrica de Software"
              className="lp-footer-fabrica"
            />
          </div>

          <p className="lp-footer-name">SIGMA</p>

          <p className="lp-footer-lead">
            Sistema integral de gestión de módulos administrativos.
            Inventario, formación y los procesos del centro, en una sola
            plataforma.
          </p>

          {/* Contacto de la Fábrica de Software */}
          <div className="lp-footer-contact">
            <p className="lp-footer-contact-title">
              ¿Necesitas más información?
            </p>

            <a
              href="https://fabricasw.cloudsenactpi.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-footer-contact-link"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
              </svg>
              Página de la Fábrica de Software
            </a>

            <a
              href="mailto:fabricaswctpicauca@gmail.com"
              className="lp-footer-contact-link"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              fabricaswctpicauca@gmail.com
            </a>
          </div>

          {/* Redes sociales */}
          <div className="lp-footer-social">
            <p>Síguenos</p>

            <div>
              <a href="https://www.facebook.com/share/1ENZACwKEa/?mibextid=wwXIfr" className="lp-social" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.4C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7Z" />
                </svg>
              </a>

              <a href="https://www.instagram.com/sena.regionalcauca?obrf=YWdqMzM4cWVxaXAx" className="lp-social" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
                </svg>
              </a>

              <a href="https://youtube.com/@senacaucacomunica?si=tYZCpSUjL2YZXoNP" className="lp-social" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C18.2 5.4 12 5.4 12 5.4s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM10 15.2V9.2l5.2 3-5.2 3Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Enlaces institucionales */}
        <nav className="lp-footer-nav" aria-label="Enlaces del sitio">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="lp-footer-heading">{column.title}</p>

              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Información legal */}
      <div className="lp-footer-bar">
        <p>
          © 2026 SIGMA · Servicio Nacional de Aprendizaje — SENA.
          Todos los derechos reservados.
        </p>

        <p>
          El SENA es un establecimiento público del orden nacional,
          adscrito al Ministerio del Trabajo.
        </p>
      </div>
    </footer>
  )
}
