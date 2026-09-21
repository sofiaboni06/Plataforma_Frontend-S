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
        src="/img/mapa-colombia.svg"
        alt="Mapa de Colombia"
        className="h-full w-auto max-w-full object-contain"
      />
      {PINS.map((pin) => (
        <span
          key={`${pin.left}-${pin.top}`}
          className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4f07a] ring-2 ring-white"
          style={{ left: pin.left, top: pin.top }}
        />
      ))}
    </div>
  )
}
