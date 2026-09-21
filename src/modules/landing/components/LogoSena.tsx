type LogoSenaProps = {
  className?: string
}

export default function LogoSena({ className = '' }: LogoSenaProps) {
  return (
    <img
      src="/img/logosenaenblanco.jpg"
      alt="SENA"
      className={`object-contain ${className}`}
    />
  )
}