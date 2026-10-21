import { useState } from "react";
import { GrGithub } from "react-icons/gr";
import { FaLaptopCode, FaMobileAlt } from "react-icons/fa";
import "./Equipo.css";

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

const equipoActual: Miembro[] = [
  { nombre: "Henry Bastidas", rol: "Product Owner", avatar: "/avatars/henry.png", grupo: "Manejo", etiquetas: ["Product Owner"] },
{ nombre: "Alex Jhoan Chaguendo", rol: "Scrum Master & Teach Lead", github: "ALexjh117", avatar: "/avatars/alex_fotogit.jpeg", grupo: "Desarrolladores", etiquetas: ["Web", "Full Stack", "Móvil", "Teach Lead"] },
  { nombre: "Andres Mauricio Bustamante", rol: "Full Stack Developer", github: "MauricioG-Dev", avatar: "/avatars/mauricio.jpeg", grupo: "Desarrolladores", etiquetas: ["Full Stack", "Web", "Quality Assurance"] },
  { nombre: "Yusti Mebel Campo", rol: "Full Stack Developer", github: "mebelcampo", avatar: "/avatars/mebel-sg.jpeg", grupo: "Desarrolladores", etiquetas: ["Full Stack", "Web", "Api", "UI/UX"] },
  { nombre: "María Paula Santacruz", rol: "Frontend Developer · Web y Móvil · UI/UX", github: "Paulasantacruz", avatar: "/avatars/paula-sg.jpeg", grupo: "Desarrolladores", etiquetas: ["Web", "Móvil", "UI/UX"] },
  { nombre: "Sofia Bonilla Gallego", rol: "Scrum Master & Team Coordinator · UI/UX", github: "sofiaboni06", avatar: "/avatars/sofia-sg.jpeg", grupo: "Desarrolladores", etiquetas: ["Full Stack", "UI/UX", "Team Coordinator"] },
];

function TarjetaMiembro({ m, ampliables = false, onVerFoto }: any) {
  const src = m.avatar || avatarFallback(m.nombre);
  const sePuedeAmpliar = ampliables && Boolean(m.avatar);

  return (
    <article className="eq-card">
      <span className="eq-card-sheen" aria-hidden="true" />
      <div className="eq-card-content">
        <div className="eq-copy">
          <strong>{m.nombre}</strong>
          <p>{m.rol}</p>
          {m.etiquetas && (
            <div className="eq-tags">
              {m.etiquetas.map((etiqueta: string) => (
                <span key={etiqueta} className="eq-tag">
                  {etiqueta.toLowerCase().includes("móvil") || etiqueta.toLowerCase().includes("movil") ? <FaMobileAlt /> : etiqueta.toLowerCase().includes("web") ? <FaLaptopCode /> : null}
                  {etiqueta}
                </span>
              ))}
            </div>
          )}
          {m.github && (
            <a className="eq-github" href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer">
              <GrGithub /> <span>{m.github}</span>
            </a>
          )}
        </div>
      </div>
      {sePuedeAmpliar ? (
        <button type="button" className="eq-person-photo-button" onClick={() => onVerFoto?.(m)}>
          <img src={src} alt={m.nombre} className="eq-person-photo" onError={(e) => { e.currentTarget.src = avatarFallback(m.nombre); }} />
        </button>
      ) : (
        <div className="eq-person-photo-container">
          <img src={src} alt={m.nombre} className="eq-person-photo" onError={(e) => { e.currentTarget.src = avatarFallback(m.nombre); }} />
        </div>
      )}
    </article>
  );
}

export default function EquipoView() {
  const [fotoGrande, setFotoGrande] = useState<any>(null);

  return (
    <div className="eq-page">
      <header className="eq-intro">
        <p className="eq-kicker">Fábrica de Software</p>
        <h1>Nuestro equipo</h1>
        <p>Detrás de cada voto hay un equipo que cree que elegir puede ser más cercano, más claro y más justo. Esto lo hacemos juntos.</p>
      </header>

      <section className="eq-block">
        <h2>Esta versión</h2>
        <p className="eq-label">Manejo del proyecto</p>
        <div className="eq-grid">
          {equipoActual.filter((m) => m.grupo === "Manejo").map((m) => (
            <TarjetaMiembro key={m.nombre} m={m} ampliables onVerFoto={setFotoGrande} />
          ))}
        </div>
        <p className="eq-label">Desarrolladores</p>
        <div className="eq-grid">
          {equipoActual.filter((m) => m.grupo === "Desarrolladores").map((m) => (
            <TarjetaMiembro key={m.nombre} m={m} ampliables onVerFoto={setFotoGrande} />
          ))}
        </div>
      </section>

      <footer/>

      {fotoGrande?.avatar ? (
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
            ×
          </button>
          <img
            src={fotoGrande.avatar}
            alt={fotoGrande.nombre}
            className="foto-equipo-photo"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}