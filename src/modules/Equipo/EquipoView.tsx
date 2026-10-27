import { useEffect, useState, type CSSProperties } from "react";
import { GrGithub } from "react-icons/gr";
import { FaLaptopCode, FaMobileAlt } from "react-icons/fa";
import "./Equipo.css";
import { createPortal } from "react-dom";

type Grupo = "Manejo" | "Desarrolladores";

type Miembro = {
  nombre: string;
  rol: string;
  github?: string;
  avatar: string;
  grupo: Grupo;
  etiquetas?: string[];
};

const avatarFallback = (nombre: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=0B3D2E&color=fff&size=176&bold=true&format=png`;

function iconoEtiqueta(etiqueta: string) {
  if (etiqueta === "Móvil") {
    return <FaMobileAlt aria-hidden="true" />;
  }

  if (["Web", "Full Stack", "Api"].includes(etiqueta)) {
    return <FaLaptopCode aria-hidden="true" />;
  }

  return null;
}

const equipoActual: Miembro[] = [
  { nombre: "Henry Bastidas", rol: "Product Owner", avatar: "/avatars/henry.png", grupo: "Manejo", etiquetas: ["Product Owner"] },
  { nombre: "Alex Jhoan Chaguendo", rol: "Scrum Master & Tech Lead", github: "ALexjh117", avatar: "/avatars/alex_fotogit.jpeg", grupo: "Desarrolladores", etiquetas: ["Web", "Full Stack", "Móvil", "Tech Lead"] },
  { nombre: "Andres Mauricio Bustamante", rol: "Full Stack Developer", github: "MauricioG-Dev", avatar: "/avatars/mauricio.jpeg", grupo: "Desarrolladores", etiquetas: ["Full Stack", "Web", "Quality Assurance"] },
  { nombre: "Yusti Mebel Campo", rol: "Full Stack Developer", github: "mebelcampo", avatar: "/avatars/mebel-sg.jpeg", grupo: "Desarrolladores", etiquetas: ["Full Stack", "Web", "Api", "UI/UX"] },
  { nombre: "María Paula Santacruz", rol: "Frontend Developer · Web y Móvil · UI/UX", github: "Paulasantacruz", avatar: "/avatars/paula-sg.jpeg", grupo: "Desarrolladores", etiquetas: ["Web", "Móvil", "UI/UX"] },
  { nombre: "Sofia Bonilla Gallego", rol: "Scrum Master & Team Coordinator · UI/UX", github: "sofiaboni06", avatar: "/avatars/sofia-sg.jpeg", grupo: "Desarrolladores", etiquetas: ["Full Stack", "UI/UX", "Team Coordinator"] },
];

type TarjetaProps = {
  m: Miembro;
  indice: number;
  ampliables?: boolean;
  onVerFoto?: (miembro: Miembro) => void;
};

function TarjetaMiembro({ m, indice, ampliables = false, onVerFoto }: TarjetaProps) {
  const src = m.avatar || avatarFallback(m.nombre);
  const sePuedeAmpliar = ampliables && Boolean(m.avatar);

  const foto = (
    <img
      src={src}
      alt={m.nombre}
      className="eq-person-photo"
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = avatarFallback(m.nombre);
      }}
    />
  );

  return (
    <article className="eq-card" style={{ "--i": indice } as CSSProperties}>
      <span className="eq-card-sheen" aria-hidden="true" />
      <div className="eq-card-content">
        <div className="eq-copy">
          <strong>{m.nombre}</strong>
          <p>{m.rol}</p>
          {m.etiquetas && (
            <div className="eq-tags">
              {m.etiquetas.map((etiqueta) => (
                <span key={etiqueta} className="eq-tag">
                  {iconoEtiqueta(etiqueta)}
                  {etiqueta}
                </span>
              ))}
            </div>
          )}
          {m.github && (
            <a className="eq-github" href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer">
              <GrGithub aria-hidden="true" /> <span>{m.github}</span>
            </a>
          )}
        </div>
      </div>
      {sePuedeAmpliar ? (
        <button type="button" className="eq-person-photo-button" aria-label={`Ampliar foto de ${m.nombre}`} onClick={() => onVerFoto?.(m)}>
          {foto}
        </button>
      ) : (
        <div className="eq-person-photo-container">{foto}</div>
      )}
    </article>
  );
}

export default function EquipoView() {
  const [fotoGrande, setFotoGrande] = useState<Miembro | null>(null);

  useEffect(() => {
    if (!fotoGrande) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFotoGrande(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fotoGrande]);

  const manejo = equipoActual.filter((m) => m.grupo === "Manejo");
  const desarrolladores = equipoActual.filter((m) => m.grupo === "Desarrolladores");

  return (
    <div className="eq-page" data-variant="ficha">
      <header className="eq-intro">
        <p className="eq-kicker">Fábrica de Software</p>
        <h1>Nuestro equipo</h1>
        <p>Detrás de cada voto hay un equipo que cree que elegir puede ser más cercano, más claro y más justo. Esto lo hacemos juntos.</p>
      </header>

      <section className="eq-block">
        <p className="eq-label">Manejo del proyecto</p>
        <div className="eq-grid">
          {manejo.map((m, i) => (
            <TarjetaMiembro key={m.nombre} m={m} indice={i} ampliables onVerFoto={setFotoGrande} />
          ))}
        </div>

        <p className="eq-label">Desarrolladores</p>
        <div className="eq-grid">
          {desarrolladores.map((m, i) => (
            <TarjetaMiembro key={m.nombre} m={m} indice={i + manejo.length} ampliables onVerFoto={setFotoGrande} />
          ))}
        </div>
      </section>

      {/* 👇 AQUI APLICAMOS EL PORTAL PARA EL MODAL */}
      {fotoGrande && createPortal(
        <div
          className="foto-equipo-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${fotoGrande.nombre}`}
          onClick={() => setFotoGrande(null)}
        >
          <button 
            type="button" 
            className="foto-equipo-close" 
            aria-label="Cerrar" 
            onClick={() => setFotoGrande(null)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <img
            src={fotoGrande.avatar}
            alt={fotoGrande.nombre}
            className="foto-equipo-photo"
            onClick={(event) => event.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </div>
  );
}