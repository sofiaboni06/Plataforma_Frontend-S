import { useEffect, useMemo, type CSSProperties } from 'react'

const WORLD = '/img/world-map.jpg'
const GLOBE = '/img/globe-earth.jpg'
const CAMPUS = '/img/ctpi-sena-popayan.jpg'
const LOGO = '/img/logo-fabrica-software.svg'
const SIGMA_MARK = '/img/logo-sigma.png'

const TERRITORIOS = [
  { name: 'Popayán', note: 'CTPI · Cauca', home: true },
  { name: 'Cali', note: 'Valle' },
  { name: 'Bogotá', note: 'Distrito' },
  { name: 'Medellín', note: 'Antioquia' },
  { name: 'Pasto', note: 'Nariño' },
]

const MODULOS = ['Inventario', 'Materiales', 'Huella de carbono']

const COLS = 6
const ROWS = 4

export type OriginMode = 'globe' | 'breaking' | 'campus' | 'hidden'

type Props = {
  mode: OriginMode
  reduceMotion: boolean
  onCity: () => void
  onCampus: () => void
  onGoHome: () => void
  onSeeCity: () => void
}

function buildShards() {
  return Array.from({ length: COLS * ROWS }, (_, index) => {
    const col = index % COLS
    const row = Math.floor(index / COLS)
    const x0 = (col / COLS) * 100
    const y0 = (row / ROWS) * 100
    const x1 = ((col + 1) / COLS) * 100
    const y1 = ((row + 1) / ROWS) * 100
    return {
      clip: `polygon(${x0}% ${y0}%, ${x1}% ${y0}%, ${x1}% ${y1}%, ${x0}% ${y1}%)`,
      x: (col - (COLS - 1) / 2) * 16,
      y: (row - (ROWS - 1) / 2) * 14,
      rot: (index % 2 === 0 ? 1 : -1) * (8 + (index % 5) * 7),
    }
  })
}

export default function HomeOriginJourney({
  mode,
  reduceMotion,
  onCity,
  onCampus,
  onGoHome,
  onSeeCity,
}: Props) {
  const shards = useMemo(() => buildShards(), [])

  useEffect(() => {
    if (mode !== 'breaking') return
    if (reduceMotion) {
      onCity()
      onCampus()
      return
    }
    const cityTimer = window.setTimeout(onCity, 1600)
    const campusTimer = window.setTimeout(onCampus, 2480)
    return () => {
      window.clearTimeout(cityTimer)
      window.clearTimeout(campusTimer)
    }
  }, [mode, reduceMotion, onCity, onCampus])

  if (mode === 'hidden') return null

  const showGlobe = mode === 'globe' || mode === 'breaking'
  const showCampus = mode === 'campus' || mode === 'breaking'

  return (
    <div
      className={`lp-origin${mode === 'breaking' ? ' is-breaking' : ''}${mode === 'campus' ? ' is-landed' : ''}`}
    >
      {showGlobe ? (
        <div className="lp-origin-space">
          <header className="lp-origin-head">
            <p className="lp-origin-brand">
              <img src={SIGMA_MARK} alt="" />
              <span>
                <b>SIGMA</b>
                <small>Cobertura territorial</small>
              </span>
            </p>
            <p className="lp-origin-stat">32 regionales · 3 módulos</p>
          </header>
          <div className="lp-origin-body">
            <div className="lp-origin-rail">
              <div className="lp-origin-orb">
                <img src={GLOBE} alt="Planeta Tierra" draggable={false} />
              </div>
              <aside className="lp-origin-mods" aria-label="Módulos">
                <p>Módulos</p>
                <ul>
                  {MODULOS.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </aside>
            </div>
            <div className="lp-origin-world">
              <div className="lp-origin-planet">
                <img src={WORLD} alt="Mapa mundial con nuestra ubicación en Colombia" className="lp-origin-earth" draggable={false} />
                <span className="lp-origin-pin">
                  <i />
                  <b>Nosotros</b>
                </span>
                <div className="lp-origin-shards">
                  {shards.map((shard, index) => (
                    <span
                      key={index}
                      className="lp-origin-shard"
                      style={
                        {
                          clipPath: shard.clip,
                          backgroundImage: `url(${WORLD})`,
                          animationDelay: `${760 + index * 18}ms`,
                          '--sx': `${shard.x}vw`,
                          '--sy': `${shard.y}vh`,
                          '--sr': `${shard.rot}deg`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
            <aside className="lp-origin-board" aria-label="Territorios">
              <p>Territorios</p>
              <ol>
                {TERRITORIOS.map((item) => (
                  <li key={item.name} className={item.home ? 'is-home' : undefined}>
                    <b>{item.name}</b>
                    <span>{item.note}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
          {mode === 'globe' ? (
            <button
              type="button"
              className="lp-origin-cta"
              onClick={onGoHome}
              aria-label="Viajar a Popayán, sede del CTPI y la Fábrica de Software"
            >
              A nosotros
            </button>
          ) : null}
        </div>
      ) : null}

      {showCampus ? (
        <figure className={`lp-campus${mode === 'campus' ? ' is-on' : ''}`}>
          <img src={CAMPUS} alt="Centro de Teleinformática y Producción Industrial, Popayán" />
          <img src={LOGO} alt="" className="lp-campus-logo" />
          <figcaption className="lp-campus-caption">
            <div>
              <strong>Popayán, Cauca</strong>
              <span>CTPI SENA · Fábrica de Software</span>
            </div>
            <button type="button" className="lp-campus-map" onClick={onSeeCity}>
              Ver la ciudad
            </button>
          </figcaption>
        </figure>
      ) : null}
    </div>
  )
}
