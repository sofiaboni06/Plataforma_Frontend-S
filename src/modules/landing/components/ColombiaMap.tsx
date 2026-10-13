/*
 * Mapa de Colombia de la página pública.
 *
 * La silueta anterior (`mapa-colombia.svg`) era un trazo de potrace: un único
 * path relleno de un solo verde, sin límites departamentales ni datos reales.
 * Este componente usa `mapa-colombia-departamentos.svg`, generado a partir de
 * la geometría oficial de los 33 departamentos (geoBoundaries COL ADM1), con
 * el mismo viewBox cuadrado para que los pines conserven su ubicación.
 *
 * Las coordenadas de los pines no se han modificado.
 */

const PINS = [
  { left: '48%', top: '8%' },
  { left: '28%', top: '18%' },
  { left: '38%', top: '32%' },
  { left: '58%', top: '28%' },
  { left: '46%', top: '46%' },
  { left: '32%', top: '58%' },
  { left: '55%', top: '62%' },
]

export default function ColombiaMap({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <img
        src="/img/mapa-colombia-departamentos.svg"
        alt="Mapa de Colombia por departamentos"
        className="h-full w-auto max-w-full object-contain"
      />
      {PINS.map((pin) => (
        <span
          key={`${pin.left}-${pin.top}`}
          aria-hidden="true"
          className="absolute -translate-x-1/2 -translate-y-full drop-shadow-[0_2px_3px_rgba(2,40,24,0.45)]"
          style={{ left: pin.left, top: pin.top, width: 22, height: 27 }}
        >
          <svg viewBox="0 0 24 29" fill="none" width="22" height="27">
            <path
              d="M12 28.4C12 28.4 22.2 17.6 22.2 10.4A10.2 10.2 0 1 0 1.8 10.4C1.8 17.6 12 28.4 12 28.4Z"
              fill="#FACC15"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10.3" r="3.9" fill="#1E7A45" />
          </svg>
        </span>
      ))}
    </div>
  )
}
