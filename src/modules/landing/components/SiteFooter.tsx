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

export default function SiteFooter() {
  return (
    <footer id="contacto" className="lp-footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.05fr_repeat(5,1fr)] lg:px-10">
        <div>
          <img src="/img/logo-sigma.png" alt="SIGMA" className="h-14 w-14 object-contain" />
          <p className="mt-4 text-[15px] font-bold text-white">SIGMA</p>
          <p className="mt-2 max-w-55 text-[13px] leading-5">
            Sistema integral de gestión de módulos administrativos. Inventario, formación y los
            procesos del centro, en una sola plataforma.
          </p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="text-[14px] font-bold text-white">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#contacto" className="text-[13px] transition-colors hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="text-[14px] font-bold text-white">Síguenos en</p>
          <div className="mt-3 flex gap-2">
            <a href="#contacto" className="lp-social" aria-label="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.4C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7Z" />
              </svg>
            </a>
            <a href="#contacto" className="lp-social" aria-label="Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
              </svg>
            </a>
            <a href="#contacto" className="lp-social" aria-label="X">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.8 3H20l-6.2 7.1L21 21h-5.5l-4.3-6.3L6.2 21H4l6.7-7.6L3 3h5.6l3.9 5.8L17.8 3Zm-1 16.2h1.5L7.3 4.7H5.7l11.1 14.5Z" />
              </svg>
            </a>
            <a href="#contacto" className="lp-social" aria-label="YouTube">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C18.2 5.4 12 5.4 12 5.4s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM10 15.2V9.2l5.2 3-5.2 3Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 text-[12px] text-white/70 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>© 2026 SIGMA · Servicio Nacional de Aprendizaje — SENA. Todos los derechos reservados.</p>
          <p>El SENA es un establecimiento público del orden nacional, adscrito al Ministerio del Trabajo.</p>
        </div>
      </div>
    </footer>
  )
}
