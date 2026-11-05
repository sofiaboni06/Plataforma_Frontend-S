
import '@/modules/landing/styles/landing.css'

type FooterLink = {
  label: string
  href: string
  external?: boolean
}

type FooterColumn = {
  title: string
  links: FooterLink[]
}

const footerColumns: FooterColumn[] = [
  {
    title: 'SIGMA',
    links: [
      { label: 'Inicio', href: '/inicio' },
      { label: 'Acerca de SIGMA', href: '#oferta' },
      { label: 'Equipo de desarrollo', href: '/equipo' },
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
]

export default function SiteFooter({
  className = '',
}: {
  className?: string
}) {
  return (
    <footer
      id="contacto"
      className={`lp-footer ${className}`.trim()}
    >
      <div className="lp-footer-main">

        {/* IDENTIDAD SIGMA */}
        <div className="lp-footer-brand">

          <p className="lp-footer-name">SIGMA</p>

          <p className="lp-footer-lead">
            Sistema integral de gestión de módulos administrativos.
            Inventario, formación y los procesos del centro, en una sola
            plataforma.
          </p>

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

        </div>

        {/* ENLACES INSTITUCIONALES */}
        <nav
          className="lp-footer-nav"
          aria-label="Enlaces del sitio"
        >
          {footerColumns.map((column) => (
            <div
              className="lp-footer-column"
              key={column.title}
            >
              <p className="lp-footer-heading">
                {column.title}
              </p>

              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={
                        link.external
                          ? 'noopener noreferrer'
                          : undefined
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

      
{/* CONTACTO Y SOPORTE */}

{/* CONTACTO Y SOPORTE */}
<div className="lp-footer-column lp-footer-support">

  <p className="lp-footer-heading">
    Contacto y soporte
  </p>

  {/* ICONOS SUPERIORES */}
  <div className="lp-footer-contact-icons">

    {/* ICONO M - SE CONSERVA */}
    <a
      href="mailto:fabricaswctpicauca@gmail.com"
      className="lp-social"
      aria-label="Correo de contacto"
      title="Correo de contacto"
    >
      <span className="lp-footer-m-icon">M</span>
    </a>

    {/* ICONO FÁBRICA DE SOFTWARE */}
    <a
      href="https://fabricasw.cloudsenactpi.net/"
      target="_blank"
      rel="noopener noreferrer"
      className="lp-social"
      aria-label="Fábrica de Software"
      title="Fábrica de Software"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21V5l7-3v19" />
        <path d="M10 21V9l7-3v15" />
        <path d="M17 21V12l4-2v11" />
        <path d="M2 21h20" />
      </svg>
    </a>

  </div>

  {/* MÁS INFORMACIÓN */}
  <a
    href="https://fabricasw.cloudsenactpi.net/"
    target="_blank"
    rel="noopener noreferrer"
    className="lp-footer-more"
  >
    Más información
  </a>

  {/* REDES SOCIALES TRASLADADAS */}
  <div className="lp-footer-social">

    <p>Síguenos</p>

    <div className="lp-footer-social-links">

      <a
        href="https://www.facebook.com/share/1ENZACwKEa/?mibextid=wwXIfr"
        target="_blank"
        rel="noopener noreferrer"
        className="lp-social"
        aria-label="Facebook"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.4C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7Z" />
        </svg>
      </a>

      <a
        href="https://www.instagram.com/sena.regionalcauca?obrf=YWdqMzM4cWVxaXAx"
        target="_blank"
        rel="noopener noreferrer"
        className="lp-social"
        aria-label="Instagram"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
        </svg>
      </a>

      <a
        href="https://youtube.com/@senacaucacomunica?si=tYZCpSUjL2YZXoNP"
        target="_blank"
        rel="noopener noreferrer"
        className="lp-social"
        aria-label="YouTube"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C18.2 5.4 12 5.4 12 5.4s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM10 15.2V9.2l5.2 3-5.2 3Z" />
        </svg>
      </a>

    </div>
  </div>

</div>
        </nav>
      </div>

      {/* INFORMACIÓN LEGAL */}
      <div className="lp-footer-bar">
        <p>
         © 2026 Servicio Nacional de Aprendizaje Sena | Centro de Teleinformática y produccion industrial
        </p>

        <p>
          CTPI- Regional Cauca fabricasoftwarectpi@misena.edu.co
        </p>
        <p>
          Copyrigth©2026
        </p>
      </div>

    </footer>
  )
}
